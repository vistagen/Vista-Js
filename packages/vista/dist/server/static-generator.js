"use strict";
/**
 * Vista Static Generator
 *
 * Pre-renders pages at build time for SSG and ISR routes.
 * Works with both the RSC pipeline (Flight payloads) and
 * legacy SSR (renderToString).
 *
 * Called after webpack compilation completes in `buildRSC()`.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateStaticPages = generateStaticPages;
exports.revalidatePath = revalidatePath;
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const static_cache_1 = require("./static-cache");
const CjsModule = require('module');
let staticRuntimeReady = false;
let reactResolutionInstalled = false;
let originalResolveFilename = null;
function installSingleReactResolution(cwd) {
    if (reactResolutionInstalled)
        return;
    let reactPath;
    let reactDomPath;
    try {
        reactPath = require.resolve('react', { paths: [cwd] });
        reactDomPath = require.resolve('react-dom', { paths: [cwd] });
    }
    catch {
        try {
            reactPath = require.resolve('react');
            reactDomPath = require.resolve('react-dom');
        }
        catch {
            return;
        }
    }
    originalResolveFilename = CjsModule._resolveFilename;
    CjsModule._resolveFilename = function (request, parent, isMain, options) {
        if (request === 'react')
            return reactPath;
        if (request === 'react-dom')
            return reactDomPath;
        if (request.startsWith('react/')) {
            const subPath = request.slice('react/'.length);
            try {
                return require.resolve(`react/${subPath}`, { paths: [path_1.default.dirname(reactPath)] });
            }
            catch {
                // fall through
            }
        }
        if (request.startsWith('react-dom/')) {
            const subPath = request.slice('react-dom/'.length);
            try {
                return require.resolve(`react-dom/${subPath}`, { paths: [path_1.default.dirname(reactDomPath)] });
            }
            catch {
                // fall through
            }
        }
        return originalResolveFilename.call(this, request, parent, isMain, options);
    };
    reactResolutionInstalled = true;
}
function setupTypeScriptRuntime(cwd) {
    try {
        const swcPath = require.resolve('@swc-node/register', { paths: [cwd] });
        require(swcPath);
        return;
    }
    catch {
        // fallback
    }
    try {
        const tsNodePath = require.resolve('ts-node', { paths: [cwd] });
        require(tsNodePath).register({
            transpileOnly: true,
            compilerOptions: {
                module: 'commonjs',
                jsx: 'react-jsx',
                moduleResolution: 'node16',
                esModuleInterop: true,
            },
        });
        return;
    }
    catch {
        // fallback
    }
    try {
        require.resolve('tsx', { paths: [cwd] });
        require('tsx/cjs');
    }
    catch {
        // no transpiler available
    }
}
function setupStaticGenerationRuntime(cwd) {
    if (staticRuntimeReady)
        return;
    // Ignore CSS imports while requiring app modules for prerender.
    require.extensions['.css'] = (m, filename) => {
        if (filename.endsWith('.module.css')) {
            m.exports = {};
        }
    };
    installSingleReactResolution(cwd);
    setupTypeScriptRuntime(cwd);
    staticRuntimeReady = true;
}
// ---------------------------------------------------------------------------
// Static param expansion
// ---------------------------------------------------------------------------
/**
 * For dynamic routes with `generateStaticParams`, call the function
 * and return the list of param sets.
 */
async function resolveStaticParams(route, cwd) {
    setupStaticGenerationRuntime(cwd);
    if (!route.hasGenerateStaticParams) {
        return [];
    }
    try {
        // Bust require cache to get fresh module
        try {
            delete require.cache[require.resolve(route.pagePath)];
        }
        catch {
            // ignore
        }
        const pageModule = require(route.pagePath);
        const generateStaticParams = pageModule.generateStaticParams || pageModule.default?.generateStaticParams;
        if (typeof generateStaticParams !== 'function') {
            return [];
        }
        const params = await generateStaticParams();
        if (!Array.isArray(params)) {
            console.warn(`[vista:ssg] generateStaticParams for ${route.pattern} did not return an array`);
            return [];
        }
        return params;
    }
    catch (err) {
        console.error(`[vista:ssg] Error calling generateStaticParams for ${route.pattern}:`, err.message);
        return [];
    }
}
/**
 * Expand a route pattern with params to get a concrete URL.
 * e.g., '/blog/:slug' + { slug: 'hello' } → '/blog/hello'
 */
function expandPattern(pattern, params) {
    let url = pattern;
    for (const [key, value] of Object.entries(params)) {
        const param = Array.isArray(value) ? value.join('/') : value;
        // Handle catch-all :param* and optional catch-all :param*?
        url = url.replace(new RegExp(`:${key}\\*\\??`), param);
        // Handle regular :param
        url = url.replace(`:${key}`, param);
    }
    return url;
}
// ---------------------------------------------------------------------------
// Page pre-rendering
// ---------------------------------------------------------------------------
/**
 * Pre-render a single page.
 * Loads the page component and renders it to HTML.
 *
 * This is a simplified renderer that works with the compiled webpack
 * server bundle. For RSC mode, the actual Flight prerendering is
 * handled by the upstream process.
 */
async function prerenderPage(urlPath, route, params, cwd) {
    setupStaticGenerationRuntime(cwd);
    try {
        const React = require('react');
        const { renderToString } = require('react-dom/server');
        // Load page component from webpack-built server bundle
        const pageModule = require(route.pagePath);
        const PageComponent = pageModule.default;
        if (!PageComponent) {
            console.warn(`[vista:ssg] No default export in ${route.pagePath}`);
            return null;
        }
        // Build the element, passing params as props
        let element = React.createElement(PageComponent, { params: params || {} });
        // Wrap in layouts (outside-in)
        for (let i = route.layoutPaths.length - 1; i >= 0; i--) {
            try {
                const layoutModule = require(route.layoutPaths[i]);
                const LayoutComponent = layoutModule.default;
                if (LayoutComponent) {
                    element = React.createElement(LayoutComponent, { params: params || {}, searchParams: {} }, element);
                }
            }
            catch {
                // Skip layout if it fails to load
            }
        }
        // Render to HTML string
        const html = renderToString(element);
        return {
            html: wrapInDocument(html, urlPath),
            generatedAt: Date.now(),
            revalidate: route.revalidate || 0,
            routePattern: route.pattern,
            params,
        };
    }
    catch (err) {
        console.error(`[vista:ssg] Error pre-rendering ${urlPath}:`, err?.message || String(err));
        return null;
    }
}
/**
 * Wrap rendered HTML in a basic document shell.
 */
function wrapInDocument(bodyHtml, _urlPath) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <link rel="stylesheet" href="/styles.css" />
</head>
<body>
  <div id="root">${bodyHtml}</div>
</body>
</html>`;
}
// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------
/**
 * Run static generation for all eligible routes.
 */
async function generateStaticPages(options) {
    const { cwd, vistaDirRoot, manifest, isDev, buildId } = options;
    const result = {
        pagesGenerated: 0,
        generatedPaths: [],
        failedPaths: [],
        manifest: { routes: {}, dynamicRoutes: {}, notFoundRoutes: [] },
    };
    // In dev mode, skip prerendering (pages are rendered on demand)
    if (isDev) {
        result.manifest = (0, static_cache_1.generatePrerenderManifest)(manifest.routes);
        return result;
    }
    const staticRoutes = manifest.routes.filter((r) => r.renderMode === 'static' || r.renderMode === 'isr');
    console.log(`[vista:ssg] Found ${staticRoutes.length} routes eligible for static generation`);
    for (const route of staticRoutes) {
        if (route.type === 'static') {
            // Simple static route — single URL
            const urlPath = route.pattern;
            const page = await prerenderPage(urlPath, route, undefined, cwd);
            if (page) {
                (0, static_cache_1.setCachedPage)(urlPath, page);
                (0, static_cache_1.writeStaticPageToDisk)(vistaDirRoot, urlPath, page);
                result.generatedPaths.push(urlPath);
                result.pagesGenerated++;
            }
            else {
                result.failedPaths.push({ path: urlPath, error: 'Prerender returned null' });
            }
        }
        else if (route.hasGenerateStaticParams) {
            // Dynamic route with generateStaticParams — expand to concrete URLs
            const paramSets = await resolveStaticParams(route, cwd);
            if (paramSets.length === 0) {
                console.log(`[vista:ssg] No static params for ${route.pattern} — will render on demand`);
                continue;
            }
            for (const params of paramSets) {
                const urlPath = expandPattern(route.pattern, params);
                const page = await prerenderPage(urlPath, route, params, cwd);
                if (page) {
                    (0, static_cache_1.setCachedPage)(urlPath, page);
                    (0, static_cache_1.writeStaticPageToDisk)(vistaDirRoot, urlPath, page);
                    result.generatedPaths.push(urlPath);
                    result.pagesGenerated++;
                }
                else {
                    result.failedPaths.push({ path: urlPath, error: 'Prerender returned null' });
                }
            }
        }
    }
    // Generate prerender manifest
    result.manifest = (0, static_cache_1.generatePrerenderManifest)(manifest.routes);
    // Write manifest to disk
    const manifestPath = path_1.default.join(vistaDirRoot, 'prerender-manifest.json');
    fs_1.default.writeFileSync(manifestPath, JSON.stringify(result.manifest, null, 2));
    console.log(`[vista:ssg] Generated ${result.pagesGenerated} static pages` +
        (result.failedPaths.length > 0 ? ` (${result.failedPaths.length} failed)` : ''));
    return result;
}
/**
 * Trigger ISR revalidation for a specific path.
 * Called at runtime when a stale page is requested.
 */
async function revalidatePath(urlPath, route, params, cwd, vistaDirRoot) {
    if ((0, static_cache_1.isRevalidating)(urlPath)) {
        return false; // Already being revalidated
    }
    (0, static_cache_1.markRevalidating)(urlPath);
    try {
        const page = await prerenderPage(urlPath, route, params, cwd);
        if (page) {
            (0, static_cache_1.setCachedPage)(urlPath, page);
            (0, static_cache_1.writeStaticPageToDisk)(vistaDirRoot, urlPath, page);
            return true;
        }
        return false;
    }
    catch (err) {
        console.error(`[vista:isr] Revalidation failed for ${urlPath}:`, err?.message || String(err));
        return false;
    }
    finally {
        (0, static_cache_1.clearRevalidating)(urlPath);
    }
}
