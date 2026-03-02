/**
 * Vista Static Page Cache & ISR (Incremental Static Regeneration)
 *
 * Manages pre-rendered HTML and Flight payload caching with support for:
 * - Build-time static generation (SSG)
 * - Runtime revalidation with stale-while-revalidate (ISR)
 * - On-demand revalidation API
 * - Cache invalidation for updated pages
 */

import path from 'path';
import fs from 'fs';
import type { RouteEntry } from '../build/rsc/server-manifest';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CachedPage {
  /** Pre-rendered HTML string */
  html: string;
  /** Flight payload (RSC serialized stream data) */
  flightData?: string;
  /** When this page was generated (epoch ms) */
  generatedAt: number;
  /** Revalidate interval in seconds, or 0 for permanent static */
  revalidate: number;
  /** Route pattern that generated this page */
  routePattern: string;
  /** Route params used to generate this page */
  params?: Record<string, string | string[]>;
}

export interface PrerenderManifest {
  /** Map of URL path to prerender info */
  routes: Record<string, PrerenderRoute>;
  /** Dynamic routes with generateStaticParams */
  dynamicRoutes: Record<string, DynamicPrerenderRoute>;
  /** Routes that returned 404 during prerender */
  notFoundRoutes: string[];
}

export interface PrerenderRoute {
  /** When this page was generated (epoch ms) */
  initialRevalidateSeconds: number | false;
  /** Source file path */
  srcRoute: string;
  /** Data route for Flight payload */
  dataRoute: string;
}

export interface DynamicPrerenderRoute {
  /** Route pattern with :param placeholders */
  routePattern: string;
  /** Data route pattern */
  dataRoutePattern: string;
  /** Fallback: 'blocking' | false | string (HTML) */
  fallback: 'blocking' | false | string;
}

// ---------------------------------------------------------------------------
// In-memory page cache
// ---------------------------------------------------------------------------

const pageCache = new Map<string, CachedPage>();
const revalidatingPaths = new Set<string>();

/**
 * Get a cached page for the given URL path.
 * Returns the page if found and not expired.
 * For ISR pages, returns stale page and triggers background revalidation.
 */
export function getCachedPage(urlPath: string): {
  page: CachedPage | null;
  stale: boolean;
} {
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
export function setCachedPage(urlPath: string, page: CachedPage): void {
  pageCache.set(urlPath, page);
}

/**
 * Remove a cached page (for on-demand revalidation).
 */
export function invalidateCachedPage(urlPath: string): boolean {
  return pageCache.delete(urlPath);
}

/**
 * Check if a path is currently being revalidated.
 */
export function isRevalidating(urlPath: string): boolean {
  return revalidatingPaths.has(urlPath);
}

/**
 * Mark a path as currently being revalidated.
 */
export function markRevalidating(urlPath: string): void {
  revalidatingPaths.add(urlPath);
}

/**
 * Clear the revalidating flag for a path.
 */
export function clearRevalidating(urlPath: string): void {
  revalidatingPaths.delete(urlPath);
}

// ---------------------------------------------------------------------------
// Disk-based cache (for persistence across restarts)
// ---------------------------------------------------------------------------

/**
 * Load pre-rendered pages from disk into memory cache.
 */
export function loadStaticPagesFromDisk(vistaDirRoot: string): number {
  const staticDir = path.join(vistaDirRoot, 'static', 'pages');
  if (!fs.existsSync(staticDir)) return 0;

  let loaded = 0;

  function scanDir(dir: string, urlPrefix: string): void {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isDirectory()) {
        scanDir(path.join(dir, entry.name), `${urlPrefix}/${entry.name}`);
      } else if (entry.isFile() && entry.name.endsWith('.html')) {
        const urlPath =
          entry.name === 'index.html'
            ? urlPrefix || '/'
            : `${urlPrefix}/${entry.name.replace('.html', '')}`;

        try {
          const html = fs.readFileSync(path.join(dir, entry.name), 'utf-8');
          const metaPath = path.join(dir, entry.name.replace('.html', '.meta.json'));
          let meta: any = {};

          if (fs.existsSync(metaPath)) {
            meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
          }

          // Load Flight data if available
          const flightPath = path.join(dir, entry.name.replace('.html', '.rsc'));
          const flightData = fs.existsSync(flightPath)
            ? fs.readFileSync(flightPath, 'utf-8')
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
        } catch (err) {
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
export function writeStaticPageToDisk(
  vistaDirRoot: string,
  urlPath: string,
  page: CachedPage
): void {
  const staticDir = path.join(vistaDirRoot, 'static', 'pages');

  // Determine file path
  const safePath = urlPath === '/' ? '/index' : urlPath;
  const htmlPath = path.join(staticDir, `${safePath}.html`);
  const metaPath = path.join(staticDir, `${safePath}.meta.json`);
  const flightPath = path.join(staticDir, `${safePath}.rsc`);

  // Ensure directory exists
  const dir = path.dirname(htmlPath);
  fs.mkdirSync(dir, { recursive: true });

  // Write HTML
  fs.writeFileSync(htmlPath, page.html, 'utf-8');

  // Write metadata
  fs.writeFileSync(
    metaPath,
    JSON.stringify({
      generatedAt: page.generatedAt,
      revalidate: page.revalidate,
      routePattern: page.routePattern,
      params: page.params,
    }),
    'utf-8'
  );

  // Write Flight data
  if (page.flightData) {
    fs.writeFileSync(flightPath, page.flightData, 'utf-8');
  }
}

/**
 * Generate the prerender manifest from route entries.
 */
export function generatePrerenderManifest(
  routes: RouteEntry[],
  cachedPages: Map<string, CachedPage> = pageCache
): PrerenderManifest {
  const manifest: PrerenderManifest = {
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
      } else if (route.hasGenerateStaticParams) {
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
export function getCacheStats(): {
  totalPages: number;
  stalePages: number;
  freshPages: number;
  revalidating: number;
} {
  let stale = 0;
  let fresh = 0;

  for (const [, page] of pageCache) {
    if (page.revalidate === 0) {
      fresh++;
    } else {
      const age = (Date.now() - page.generatedAt) / 1000;
      if (age > page.revalidate) {
        stale++;
      } else {
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
