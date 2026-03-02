"use strict";
/**
 * Vista Static Page Cache & ISR (Incremental Static Regeneration)
 *
 * Manages pre-rendered HTML and Flight payload caching with support for:
 * - Build-time static generation (SSG)
 * - Runtime revalidation with stale-while-revalidate (ISR)
 * - On-demand revalidation API
 * - Cache invalidation for updated pages
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCachedPage = getCachedPage;
exports.setCachedPage = setCachedPage;
exports.invalidateCachedPage = invalidateCachedPage;
exports.isRevalidating = isRevalidating;
exports.markRevalidating = markRevalidating;
exports.clearRevalidating = clearRevalidating;
exports.loadStaticPagesFromDisk = loadStaticPagesFromDisk;
exports.writeStaticPageToDisk = writeStaticPageToDisk;
exports.generatePrerenderManifest = generatePrerenderManifest;
exports.getCacheStats = getCacheStats;
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
// ---------------------------------------------------------------------------
// In-memory page cache
// ---------------------------------------------------------------------------
const pageCache = new Map();
const revalidatingPaths = new Set();
/**
 * Get a cached page for the given URL path.
 * Returns the page if found and not expired.
 * For ISR pages, returns stale page and triggers background revalidation.
 */
function getCachedPage(urlPath) {
    const cached = pageCache.get(urlPath);
    if (!cached) {
        return { page: null, stale: false };
    }
    // Check if still fresh
    if (cached.revalidate === 0) {
        // Permanent static, never stale
        return { page: cached, stale: false };
    }
    const age = (Date.now() - cached.generatedAt) / 1000;
    const isStale = age > cached.revalidate;
    return { page: cached, stale: isStale };
}
/**
 * Store a pre-rendered page in the cache.
 */
function setCachedPage(urlPath, page) {
    pageCache.set(urlPath, page);
}
/**
 * Remove a cached page (for on-demand revalidation).
 */
function invalidateCachedPage(urlPath) {
    return pageCache.delete(urlPath);
}
/**
 * Check if a path is currently being revalidated.
 */
function isRevalidating(urlPath) {
    return revalidatingPaths.has(urlPath);
}
/**
 * Mark a path as currently being revalidated.
 */
function markRevalidating(urlPath) {
    revalidatingPaths.add(urlPath);
}
/**
 * Clear the revalidating flag for a path.
 */
function clearRevalidating(urlPath) {
    revalidatingPaths.delete(urlPath);
}
// ---------------------------------------------------------------------------
// Disk-based cache (for persistence across restarts)
// ---------------------------------------------------------------------------
/**
 * Load pre-rendered pages from disk into memory cache.
 */
function loadStaticPagesFromDisk(vistaDirRoot) {
    const staticDir = path_1.default.join(vistaDirRoot, 'static', 'pages');
    if (!fs_1.default.existsSync(staticDir))
        return 0;
    let loaded = 0;
    function scanDir(dir, urlPrefix) {
        const entries = fs_1.default.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
            if (entry.isDirectory()) {
                scanDir(path_1.default.join(dir, entry.name), `${urlPrefix}/${entry.name}`);
            }
            else if (entry.isFile() && entry.name.endsWith('.html')) {
                const urlPath = entry.name === 'index.html'
                    ? urlPrefix || '/'
                    : `${urlPrefix}/${entry.name.replace('.html', '')}`;
                try {
                    const html = fs_1.default.readFileSync(path_1.default.join(dir, entry.name), 'utf-8');
                    const metaPath = path_1.default.join(dir, entry.name.replace('.html', '.meta.json'));
                    let meta = {};
                    if (fs_1.default.existsSync(metaPath)) {
                        meta = JSON.parse(fs_1.default.readFileSync(metaPath, 'utf-8'));
                    }
                    // Load Flight data if available
                    const flightPath = path_1.default.join(dir, entry.name.replace('.html', '.rsc'));
                    const flightData = fs_1.default.existsSync(flightPath)
                        ? fs_1.default.readFileSync(flightPath, 'utf-8')
                        : undefined;
                    pageCache.set(urlPath, {
                        html,
                        flightData,
                        generatedAt: meta.generatedAt || Date.now(),
                        revalidate: meta.revalidate ?? 0,
                        routePattern: meta.routePattern || urlPath,
                        params: meta.params,
                    });
                    loaded++;
                }
                catch (err) {
                    console.warn(`[vista:ssg] Failed to load static page ${urlPath}:`, err);
                }
            }
        }
    }
    scanDir(staticDir, '');
    return loaded;
}
/**
 * Write a pre-rendered page to disk.
 */
function writeStaticPageToDisk(vistaDirRoot, urlPath, page) {
    const staticDir = path_1.default.join(vistaDirRoot, 'static', 'pages');
    // Determine file path
    const safePath = urlPath === '/' ? '/index' : urlPath;
    const htmlPath = path_1.default.join(staticDir, `${safePath}.html`);
    const metaPath = path_1.default.join(staticDir, `${safePath}.meta.json`);
    const flightPath = path_1.default.join(staticDir, `${safePath}.rsc`);
    // Ensure directory exists
    const dir = path_1.default.dirname(htmlPath);
    fs_1.default.mkdirSync(dir, { recursive: true });
    // Write HTML
    fs_1.default.writeFileSync(htmlPath, page.html, 'utf-8');
    // Write metadata
    fs_1.default.writeFileSync(metaPath, JSON.stringify({
        generatedAt: page.generatedAt,
        revalidate: page.revalidate,
        routePattern: page.routePattern,
        params: page.params,
    }), 'utf-8');
    // Write Flight data
    if (page.flightData) {
        fs_1.default.writeFileSync(flightPath, page.flightData, 'utf-8');
    }
}
/**
 * Generate the prerender manifest from route entries.
 */
function generatePrerenderManifest(routes, cachedPages = pageCache) {
    const manifest = {
        routes: {},
        dynamicRoutes: {},
        notFoundRoutes: [],
    };
    for (const route of routes) {
        if (route.renderMode === 'static' || route.renderMode === 'isr') {
            if (route.type === 'static') {
                // Static URL pattern — single page
                manifest.routes[route.pattern] = {
                    initialRevalidateSeconds: route.revalidate || false,
                    srcRoute: route.pagePath,
                    dataRoute: `/_rsc${route.pattern === '/' ? '/index' : route.pattern}.rsc`,
                };
            }
            else if (route.hasGenerateStaticParams) {
                // Dynamic URL pattern with generateStaticParams
                manifest.dynamicRoutes[route.pattern] = {
                    routePattern: route.pattern,
                    dataRoutePattern: `/_rsc${route.pattern}.rsc`,
                    fallback: 'blocking',
                };
            }
        }
    }
    return manifest;
}
/**
 * Get cache statistics.
 */
function getCacheStats() {
    let stale = 0;
    let fresh = 0;
    for (const [, page] of pageCache) {
        if (page.revalidate === 0) {
            fresh++;
        }
        else {
            const age = (Date.now() - page.generatedAt) / 1000;
            if (age > page.revalidate) {
                stale++;
            }
            else {
                fresh++;
            }
        }
    }
    return {
        totalPages: pageCache.size,
        stalePages: stale,
        freshPages: fresh,
        revalidating: revalidatingPaths.size,
    };
}
