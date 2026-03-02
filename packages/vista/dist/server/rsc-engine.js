"use strict";
/**
 * Vista RSC Web Engine
 *
 * Serves SSR HTML and proxies Flight requests to a dedicated upstream process
 * that runs with `--conditions react-server`.
 *
 * SSR renders Flight streams into HTML using renderToPipeableStream,
 * with a shim __webpack_require__ to resolve client modules during SSR.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startRSCServer = startRSCServer;
exports.default = startRSCServer;
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const express_1 = __importDefault(require("express"));
const react_1 = __importDefault(require("react"));
const server_1 = require("react-dom/server");
const webpack_dev_middleware_1 = __importDefault(require("webpack-dev-middleware"));
const webpack_hot_middleware_1 = __importDefault(require("webpack-hot-middleware"));
const stream_1 = require("stream");
const child_process_1 = require("child_process");
const url_1 = require("url");
const middleware_runner_1 = require("./middleware-runner");
const image_optimizer_1 = require("./image-optimizer");
const registry_1 = require("../font/registry");
const logger_1 = require("./logger");
const static_cache_1 = require("./static-cache");
const static_generator_1 = require("./static-generator");
const CjsModule = require('module');
// ---------------------------------------------------------------------------
// SSR Webpack Shim
// ---------------------------------------------------------------------------
// The Flight SSR decoder (react-server-dom-webpack/client.node) calls
// __webpack_require__(specifier) to load client components during SSR.
// In Vista the SSR process runs in plain Node.js (not through webpack),
// so we provide a shim that converts file:// URLs to absolute paths and
// delegates to Node's require().
// ---------------------------------------------------------------------------
function installSSRWebpackShim() {
    if (typeof globalThis.__webpack_require__ === 'function')
        return;
    globalThis.__webpack_require__ = function ssrWebpackRequire(specifier) {
        let modulePath = specifier;
        // Convert file:// URLs to absolute paths
        if (specifier.startsWith('file://')) {
            try {
                modulePath = (0, url_1.fileURLToPath)(specifier);
            }
            catch {
                modulePath = specifier;
            }
        }
        return require(modulePath);
    };
    // Chunk loading is a no-op on the server — all code is already local.
    globalThis.__webpack_chunk_load__ = function ssrChunkLoad(_chunkId) {
        return Promise.resolve();
    };
}
const config_1 = require("../config");
const dev_error_1 = require("../dev-error");
const artifact_validator_1 = require("./artifact-validator");
const root_resolver_1 = require("./root-resolver");
const structure_watch_1 = require("./structure-watch");
const structure_log_1 = require("./structure-log");
const error_boundary_1 = require("../components/error-boundary");
const route_suspense_1 = require("../components/route-suspense");
// Support CSS imports on server runtime
// - Regular .css: ignored (handled by PostCSS)
// - .module.css: return empty class mapping (webpack build handles real mappings)
require.extensions['.css'] = (m, filename) => {
    if (filename.endsWith('.module.css')) {
        m.exports = {};
    }
};
/**
 * Generate CSS link tags for the document head.
 * Includes the PostCSS globals and CSS Modules extracted stylesheet.
 */
function getCSSLinks(projectRoot) {
    const root = projectRoot || process.cwd();
    const links = ['<link rel="stylesheet" href="/styles.css" />'];
    // Check for extracted CSS modules (from MiniCssExtractPlugin)
    const chunksDir = path_1.default.join(root, '.vista', 'static', 'chunks');
    try {
        if (fs_1.default.existsSync(chunksDir)) {
            const files = fs_1.default.readdirSync(chunksDir).filter((f) => f.endsWith('.css'));
            for (const f of files) {
                links.push(`<link rel="stylesheet" href="/_vista/static/chunks/${f}" />`);
            }
        }
    }
    catch {
        // Ignore errors during directory scan
    }
    return links.join('\n  ');
}
function parseCliArg(flag) {
    const index = process.argv.indexOf(flag);
    if (index === -1)
        return undefined;
    return process.argv[index + 1];
}
function resolvePort(raw, fallback) {
    const value = Number(raw || String(fallback));
    if (!Number.isInteger(value) || value < 1 || value > 65535) {
        throw new Error(`Invalid port: ${raw}`);
    }
    return value;
}
function resolveFromWorkspace(specifier, cwd) {
    const searchRoots = [
        cwd,
        path_1.default.resolve(cwd, '..'),
        path_1.default.resolve(cwd, '..', '..'),
        path_1.default.resolve(cwd, '..', '..', 'rsc'),
        path_1.default.resolve(cwd, '..', '..', '..'),
        path_1.default.resolve(cwd, '..', '..', '..', 'rsc'),
    ];
    for (const root of searchRoots) {
        try {
            return require.resolve(specifier, { paths: [root] });
        }
        catch {
            // continue
        }
    }
    return require.resolve(specifier);
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
    }
    catch (e) {
        console.log('Failed to setup TypeScript runtime:', e);
        // No TypeScript compiler found
    }
}
let reactResolutionInstalled = false;
let originalResolveFilename = null;
function installSingleReactResolution(cwd) {
    if (reactResolutionInstalled)
        return;
    let reactPath;
    let reactDomPath;
    try {
        reactPath = require.resolve('react');
        reactDomPath = require.resolve('react-dom');
    }
    catch {
        try {
            reactPath = require.resolve('react', { paths: [cwd] });
            reactDomPath = require.resolve('react-dom', { paths: [cwd] });
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
function withTimeout(url, options = {}, timeoutMs = 3000) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    return fetch(url, { ...options, signal: controller.signal })
        .finally(() => clearTimeout(timeout))
        .catch((error) => {
        if (error.name === 'AbortError') {
            throw new Error(`Timed out after ${timeoutMs}ms: ${url}`);
        }
        throw error;
    });
}
function findChunkFiles(cwd) {
    const chunksDir = path_1.default.join(cwd, '.vista', 'static', 'chunks');
    if (!fs_1.default.existsSync(chunksDir))
        return [];
    const files = fs_1.default
        .readdirSync(chunksDir)
        .filter((name) => name.endsWith('.js') && !name.endsWith('.map'));
    // Load webpack runtime first, then framework, then the rest alphabetically.
    // This ensures the chunk registry (__webpack_require__) is available before
    // any deferred chunk tries to self-register.
    const priority = ['webpack.js', 'framework.js', 'vendor.js'];
    return files.sort((a, b) => {
        const ai = priority.indexOf(a);
        const bi = priority.indexOf(b);
        if (ai !== -1 && bi !== -1)
            return ai - bi;
        if (ai !== -1)
            return -1;
        if (bi !== -1)
            return 1;
        return a.localeCompare(b);
    });
}
function matchPattern(pathname, pattern) {
    const patternParts = pattern.split('/').filter(Boolean);
    const pathParts = pathname.split('/').filter(Boolean);
    if (patternParts.length === 0 && pathParts.length === 0)
        return true;
    for (let i = 0; i < patternParts.length; i++) {
        const patternPart = patternParts[i];
        const pathPart = pathParts[i];
        // Optional catch-all: matches zero or more segments
        if (patternPart.endsWith('*?')) {
            return true; // matches even with zero remaining segments
        }
        // Required catch-all: matches one or more remaining segments
        if (patternPart.endsWith('*')) {
            return pathParts.length >= i + 1;
        }
        if (patternPart.startsWith(':')) {
            if (!pathPart)
                return false;
            continue;
        }
        if (patternPart !== pathPart)
            return false;
    }
    return patternParts.length === pathParts.length;
}
function matchRoute(pathname, routes) {
    // Sort routes: more specific patterns first, optional catch-all last
    const sorted = [...routes].sort((a, b) => {
        const aOptional = a.pattern.includes('*?');
        const bOptional = b.pattern.includes('*?');
        if (aOptional && !bOptional)
            return 1;
        if (!aOptional && bOptional)
            return -1;
        // More segments = more specific
        return b.pattern.split('/').length - a.pattern.split('/').length;
    });
    for (const route of sorted) {
        if (matchPattern(pathname, route.pattern))
            return route;
    }
    return null;
}
function extractParams(pathname, route) {
    const params = {};
    const patternParts = route.pattern.split('/').filter(Boolean);
    const pathParts = pathname.split('/').filter(Boolean);
    for (let i = 0; i < patternParts.length; i++) {
        const patternPart = patternParts[i];
        if (!patternPart.startsWith(':'))
            continue;
        const name = patternPart.slice(1).replace(/\*\??/, '');
        if (patternPart.endsWith('*?') || patternPart.endsWith('*')) {
            params[name] = pathParts.slice(i).join('/');
        }
        else {
            params[name] = pathParts[i] || '';
        }
    }
    return params;
}
async function createRouteElement(route, context, isDev, rootLayout) {
    const { params, searchParams, req } = context;
    if (isDev) {
        for (const key of Object.keys(require.cache)) {
            if (key.includes(`${path_1.default.sep}app${path_1.default.sep}`)) {
                delete require.cache[key];
            }
        }
    }
    const PageModule = require(route.pagePath);
    const PageComponent = PageModule.default;
    if (!PageComponent) {
        throw new Error(`Page module does not export default component: ${route.pagePath}`);
    }
    const pageProps = typeof PageModule.getServerProps === 'function'
        ? await PageModule.getServerProps({ query: req.query, params, req })
        : {};
    let metadata = { ...(rootLayout.metadata || {}) };
    if (PageModule.metadata) {
        metadata = { ...metadata, ...PageModule.metadata };
    }
    if (typeof PageModule.generateMetadata === 'function') {
        try {
            const dynamicMeta = await PageModule.generateMetadata({ params, searchParams }, metadata);
            metadata = { ...metadata, ...dynamicMeta };
        }
        catch (error) {
            console.error('[vista:rsc] Error in generateMetadata:', error);
        }
    }
    let element = react_1.default.createElement(PageComponent, {
        ...pageProps,
        params,
        searchParams,
    });
    // Wrap page in loading/error boundaries if discovered
    if (route.loadingPath || route.errorPath) {
        const loadingComponent = route.loadingPath
            ? (() => {
                try {
                    return require(route.loadingPath).default;
                }
                catch {
                    return undefined;
                }
            })()
            : undefined;
        const errorComponent = route.errorPath
            ? (() => {
                try {
                    return require(route.errorPath).default;
                }
                catch {
                    return undefined;
                }
            })()
            : undefined;
        if (loadingComponent) {
            element = react_1.default.createElement(route_suspense_1.RouteSuspense, {
                loadingComponent,
                children: element,
            });
        }
        if (errorComponent) {
            element = react_1.default.createElement(error_boundary_1.RouteErrorBoundary, {
                fallbackComponent: errorComponent,
                children: element,
            });
        }
    }
    for (let i = route.layoutPaths.length - 1; i >= 0; i--) {
        const layoutPath = route.layoutPaths[i];
        const LayoutModule = require(layoutPath);
        const LayoutComponent = LayoutModule.default;
        if (!LayoutComponent)
            continue;
        element = react_1.default.createElement(LayoutComponent, { params, searchParams }, element);
    }
    return { element, metadata, rootMode: rootLayout.mode };
}
function injectBeforeClosingTag(html, tagName, injection) {
    const closeTag = `</${tagName}>`;
    if (html.includes(closeTag)) {
        return html.replace(closeTag, `${injection}\n${closeTag}`);
    }
    return html;
}
function createHtmlDocument(appHtml, metadataHtml, chunkFiles, rootMode = 'legacy') {
    const scripts = chunkFiles
        .map((chunk) => `<script defer src="/_vista/static/chunks/${chunk}"></script>`)
        .join('\n  ');
    if (rootMode === 'document' ||
        /^\s*<!doctype html>\s*<html/i.test(appHtml) ||
        /^\s*<html/i.test(appHtml)) {
        const fontHtml = (0, registry_1.getAllFontHTML)();
        const headInjection = `\n  <meta charset="utf-8" />\n  <meta name="viewport" content="width=device-width, initial-scale=1" />\n  ${metadataHtml}\n  ${fontHtml}\n  ${getCSSLinks()}`;
        const bodyInjection = `\n  <script>window.__VISTA_HYDRATE_DOCUMENT__ = true;</script>\n  ${scripts}`;
        let html = appHtml;
        if (!/^\s*<!doctype html>/i.test(html)) {
            html = `<!DOCTYPE html>\n${html}`;
        }
        html = injectBeforeClosingTag(html, 'head', headInjection);
        html = injectBeforeClosingTag(html, 'body', bodyInjection);
        return html;
    }
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  ${metadataHtml}
  ${(0, registry_1.getAllFontHTML)()}
  ${getCSSLinks()}
</head>
<body>
  <script>window.__VISTA_HYDRATE_DOCUMENT__ = false;</script>
  <div id="root">${appHtml}</div>
  ${scripts}
</body>
</html>`;
}
async function handleApiRoute(req, res, cwd, isDev) {
    const apiRoute = req.path.substring(5);
    const routeTsPath = path_1.default.resolve(cwd, 'app', 'api', apiRoute, 'route.ts');
    const routeTsxPath = path_1.default.resolve(cwd, 'app', 'api', apiRoute, 'route.tsx');
    const legacyPath = path_1.default.resolve(cwd, 'app', 'api', `${apiRoute}.ts`);
    let apiPath = null;
    if (fs_1.default.existsSync(routeTsPath))
        apiPath = routeTsPath;
    else if (fs_1.default.existsSync(routeTsxPath))
        apiPath = routeTsxPath;
    else if (fs_1.default.existsSync(legacyPath))
        apiPath = legacyPath;
    if (!apiPath) {
        res.status(404).json({ error: 'API Route Not Found' });
        return;
    }
    try {
        if (isDev)
            delete require.cache[require.resolve(apiPath)];
        const apiModule = require(apiPath);
        const method = req.method?.toUpperCase() || 'GET';
        const methodHandler = apiModule[method];
        if (typeof methodHandler === 'function') {
            const request = {
                url: req.protocol + '://' + req.get('host') + req.originalUrl,
                method: req.method,
                headers: new Map(Object.entries(req.headers)),
                json: async () => req.body,
                text: async () => JSON.stringify(req.body),
                nextUrl: {
                    pathname: req.path,
                    searchParams: new URLSearchParams(req.query),
                },
            };
            const result = await methodHandler(request, { params: {} });
            if (result && typeof result.json === 'function') {
                const json = await result.json();
                res.status(result.status || 200).json(json);
            }
            else if (result) {
                res.status(200).json(result);
            }
            else {
                res.status(204).end();
            }
            return;
        }
        if (typeof apiModule.default === 'function') {
            apiModule.default(req, res);
            return;
        }
        res.status(405).json({ error: `Method ${method} not allowed` });
    }
    catch (error) {
        console.error('[vista:rsc] API route error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}
function spawnUpstream(cwd, upstreamPort) {
    const upstreamScript = path_1.default.join(__dirname, 'rsc-upstream.js');
    return (0, child_process_1.spawn)(process.execPath, ['--conditions', 'react-server', upstreamScript, '--port', String(upstreamPort)], {
        cwd,
        env: {
            ...process.env,
            NODE_ENV: process.env.NODE_ENV || 'development',
            RSC_UPSTREAM_PORT: String(upstreamPort),
        },
        stdio: 'pipe',
    });
}
// ---------------------------------------------------------------------------
// Flight-Based SSR Rendering Helpers
// ---------------------------------------------------------------------------
/**
 * Fetch the Flight stream from the upstream RSC process, decode it with
 * createFromNodeStream, and render the resulting React tree to an HTML stream
 * via renderToPipeableStream.
 */
async function renderFlightToHTMLStream(upstreamOrigin, pathname, search, metadataHtml, chunkFiles, rootMode, flightSSRClient, ssrManifest, res, isDev) {
    const flightUrl = `${upstreamOrigin}/rsc${pathname}${search ? `?${search}` : ''}`;
    // 1. Fetch Flight stream from upstream
    const upstream = await withTimeout(flightUrl, {
        headers: { Accept: 'text/x-component' },
    }, 5000);
    if (!upstream.ok) {
        throw new Error(`Upstream returned ${upstream.status}: ${await upstream.text()}`);
    }
    if (!upstream.body) {
        throw new Error('Upstream returned empty body');
    }
    // 2. Convert Web ReadableStream to Node.js Readable
    const nodeStream = stream_1.Readable.fromWeb(upstream.body);
    // 3. Decode Flight stream into a React tree
    const flightResponse = flightSSRClient.createFromNodeStream(nodeStream, ssrManifest);
    // 4. Wrap in a component that consumes the Flight response
    function FlightRoot() {
        return react_1.default.use(flightResponse);
    }
    const element = react_1.default.createElement(FlightRoot);
    // 5. Build script tags for client chunks
    const scripts = chunkFiles
        .map((chunk) => `<script defer src="/_vista/static/chunks/${chunk}"></script>`)
        .join('\n  ');
    // 6. Render to a pipeable HTML stream
    return new Promise((resolve, reject) => {
        let shellSent = false;
        const { pipe } = (0, server_1.renderToPipeableStream)(element, {
            onShellReady() {
                shellSent = true;
                res.status(upstream.status === 404 ? 404 : 200);
                res.setHeader('Content-Type', 'text/html; charset=utf-8');
                res.setHeader('Transfer-Encoding', 'chunked');
                // Create a transform stream to inject head/body content
                const transform = new stream_1.Transform({
                    transform(chunk, _encoding, callback) {
                        let html = chunk.toString();
                        // Inject into <head> if present
                        if (html.includes('</head>')) {
                            const fontHtml = (0, registry_1.getAllFontHTML)();
                            const headInjection = `
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  ${metadataHtml}
  ${fontHtml}
  ${getCSSLinks()}`;
                            html = html.replace('</head>', `${headInjection}\n</head>`);
                        }
                        // Inject scripts before </body>
                        if (html.includes('</body>')) {
                            const bodyInjection = `
  <script>window.__VISTA_HYDRATE_DOCUMENT__ = ${rootMode === 'document'};</script>
  ${scripts}`;
                            html = html.replace('</body>', `${bodyInjection}\n</body>`);
                        }
                        callback(null, html);
                    },
                });
                pipe(transform);
                transform.pipe(res);
            },
            onShellError(error) {
                if (!shellSent) {
                    reject(error);
                }
            },
            onError(error) {
                if (isDev) {
                    console.error('[vista:rsc] Flight SSR stream error:', error);
                }
            },
            onAllReady() {
                resolve();
            },
        });
    });
}
/**
 * Wraps content in a document shell when the root layout doesn't provide one.
 * Used as fallback when the Flight stream doesn't include <html>/<head>/<body>.
 */
function wrapInDocumentShell(bodyContent, metadataHtml, chunkFiles, rootMode) {
    const scripts = chunkFiles
        .map((chunk) => `<script defer src="/_vista/static/chunks/${chunk}"></script>`)
        .join('\n  ');
    if (rootMode === 'document' ||
        /^\s*<!doctype html>\s*<html/i.test(bodyContent) ||
        /^\s*<html/i.test(bodyContent)) {
        const fontHtml = (0, registry_1.getAllFontHTML)();
        const headInjection = `\n  <meta charset="utf-8" />\n  <meta name="viewport" content="width=device-width, initial-scale=1" />\n  ${metadataHtml}\n  ${fontHtml}\n  ${getCSSLinks()}`;
        const bodyInjection = `\n  <script>window.__VISTA_HYDRATE_DOCUMENT__ = true;</script>\n  ${scripts}`;
        let html = bodyContent;
        if (!/^\s*<!doctype html>/i.test(html)) {
            html = `<!DOCTYPE html>\n${html}`;
        }
        html = injectBeforeClosingTag(html, 'head', headInjection);
        html = injectBeforeClosingTag(html, 'body', bodyInjection);
        return html;
    }
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  ${metadataHtml}
  ${(0, registry_1.getAllFontHTML)()}
  ${getCSSLinks()}
</head>
<body>
  <script>window.__VISTA_HYDRATE_DOCUMENT__ = false;</script>
  <div id="root">${bodyContent}</div>
  ${scripts}
</body>
</html>`;
}
function startRSCServer(options = {}) {
    const app = (0, express_1.default)();
    const cwd = process.cwd();
    const isDev = process.env.NODE_ENV !== 'production';
    const vistaConfig = (0, config_1.loadConfig)(cwd);
    // Request logger — logs GET/POST with timing
    app.use((0, logger_1.requestLogger)());
    const port = resolvePort(String(options.port || vistaConfig.server?.port || 3003), 3003);
    const upstreamPort = resolvePort(String(process.env.RSC_UPSTREAM_PORT || port + 1), port + 1);
    const upstreamOrigin = `http://127.0.0.1:${upstreamPort}`;
    installSingleReactResolution(cwd);
    setupTypeScriptRuntime(cwd);
    installSSRWebpackShim();
    const serverManifestPath = path_1.default.join(cwd, '.vista', 'server', 'server-manifest.json');
    if (!fs_1.default.existsSync(serverManifestPath)) {
        console.error(`[vista:rsc] Missing server manifest at ${serverManifestPath}. Run "vista build --rsc" first.`);
        process.exit(1);
    }
    try {
        (0, artifact_validator_1.assertVistaArtifacts)(cwd, 'rsc');
    }
    catch (error) {
        console.error(error.message);
        process.exit(1);
    }
    // ========================================================================
    // Flight SSR Client + SSR Manifest
    // ========================================================================
    let flightSSRClient = null;
    let ssrManifest = null;
    try {
        const flightClientPath = resolveFromWorkspace('react-server-dom-webpack/client.node', cwd);
        flightSSRClient = require(flightClientPath);
    }
    catch (err) {
        // Flight SSR not available — fallback to renderToString
    }
    const ssrManifestPath = path_1.default.join(cwd, '.vista', 'react-server-manifest.json');
    const ssrManifestLegacyPath = path_1.default.join(cwd, '.vista', 'react-ssr-manifest.json');
    const resolvedSSRManifestPath = fs_1.default.existsSync(ssrManifestPath)
        ? ssrManifestPath
        : fs_1.default.existsSync(ssrManifestLegacyPath)
            ? ssrManifestLegacyPath
            : null;
    if (resolvedSSRManifestPath) {
        ssrManifest = JSON.parse(fs_1.default.readFileSync(resolvedSSRManifestPath, 'utf-8'));
        // Normalise SSR manifest entries: ReactFlightWebpackPlugin generates
        // {specifier, name} but react-server-dom-webpack/client.node expects
        // {id, chunks, name}.  Our VistaSSRManifestPatch webpack plugin handles
        // this at build time, but in dev mode the manifest may be re-read from
        // disk before the patch runs.  Belt-and-suspenders fix:
        if (ssrManifest && ssrManifest.moduleMap) {
            const moduleMap = ssrManifest.moduleMap;
            for (const exports of Object.values(moduleMap)) {
                for (const [exportName, entry] of Object.entries(exports)) {
                    if (entry.specifier && !entry.id) {
                        exports[exportName] = {
                            id: entry.specifier,
                            chunks: [],
                            name: entry.name || exportName,
                        };
                    }
                }
            }
        }
    }
    else if (flightSSRClient) {
        // Can't use Flight SSR without the manifest
        flightSSRClient = null;
    }
    const useFlightSSR = !!flightSSRClient && !!ssrManifest;
    // ========================================================================
    // Structure Validation (dev + strict-block)
    // ========================================================================
    const structureConfig = (0, config_1.resolveStructureValidationConfig)(vistaConfig);
    let currentStructureState = null;
    let structureWatcher = null;
    if (structureConfig.enabled) {
        const { validateAppStructure } = require('./structure-validator');
        const initialResult = validateAppStructure({ cwd });
        currentStructureState = initialResult;
        (0, structure_log_1.logValidationResult)(initialResult, structureConfig.logLevel);
        if (initialResult.state === 'error' && structureConfig.mode === 'strict') {
            (0, structure_log_1.logDevBlocked)();
        }
    }
    let serverManifest = JSON.parse(fs_1.default.readFileSync(serverManifestPath, 'utf-8'));
    // ========================================================================
    // Load pre-rendered static pages from disk into in-memory cache
    // ========================================================================
    const vistaDirRoot = path_1.default.join(cwd, '.vista');
    const loadedStaticPages = (0, static_cache_1.loadStaticPagesFromDisk)(vistaDirRoot);
    if (loadedStaticPages > 0) {
        (0, logger_1.logInfo)(`Loaded ${loadedStaticPages} pre-rendered page(s) from cache`);
    }
    const upstreamChild = spawnUpstream(cwd, upstreamPort);
    upstreamChild.stdout.setEncoding('utf8');
    upstreamChild.stderr.setEncoding('utf8');
    // Always capture stderr so we can log crash reasons
    let upstreamStderr = '';
    if (process.env.VISTA_DEBUG) {
        upstreamChild.stdout.on('data', (chunk) => process.stdout.write(chunk));
        upstreamChild.stderr.on('data', (chunk) => {
            upstreamStderr += chunk;
            process.stderr.write(chunk);
        });
    }
    else {
        upstreamChild.stdout.on('data', () => { }); // drain
        upstreamChild.stderr.on('data', (chunk) => {
            upstreamStderr += chunk;
        });
    }
    upstreamChild.on('exit', (code, signal) => {
        if (code !== 0 && code !== null) {
            (0, logger_1.logError)(`Upstream exited unexpectedly (code=${code}, signal=${signal ?? 'null'})`);
            if (upstreamStderr.trim()) {
                (0, logger_1.logError)(`Upstream stderr:\n${upstreamStderr.trim()}`);
            }
        }
    });
    // Graceful shutdown — populated after all resources are created
    let shutdownCalled = false;
    let httpServer = null;
    let fsWatcher = null;
    const shutdown = () => {
        if (shutdownCalled)
            return;
        shutdownCalled = true;
        // 1. Kill upstream RSC child
        if (!upstreamChild.killed) {
            upstreamChild.kill('SIGTERM');
            setTimeout(() => {
                if (!upstreamChild.killed)
                    upstreamChild.kill('SIGKILL');
            }, 800);
        }
        // 2. Close fs watcher
        if (fsWatcher) {
            try {
                fsWatcher.close();
            }
            catch { }
        }
        // 3. End all SSE connections
        sseReloadClients.forEach((c) => {
            try {
                c.end();
            }
            catch { }
        });
        sseReloadClients.clear();
        // 4. Stop structure watcher
        if (structureWatcher) {
            try {
                structureWatcher.stop();
            }
            catch { }
        }
        // 5. Close HTTP server
        if (httpServer) {
            httpServer.close();
        }
        // 6. Force exit after brief grace period (Windows Ctrl+C fix)
        setTimeout(() => process.exit(0), 500);
    };
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
    process.on('exit', shutdown);
    // ========================================================================
    // Live-Reload SSE for RSC dev mode
    // - Pushes reload events when server components change (fs.watch)
    // - Pushes compile errors/success from webpack client build
    // ========================================================================
    const sseReloadClients = new Set();
    if (isDev) {
        app.get('/__vista_reload', (req, res) => {
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');
            res.flushHeaders();
            sseReloadClients.add(res);
            res.write('data: connected\n\n');
            req.on('close', () => {
                sseReloadClients.delete(res);
            });
        });
        const pushSSE = (payload) => {
            sseReloadClients.forEach((c) => c.write(`data: ${payload}\n\n`));
        };
        // Watch app/ directory — server component changes need a full page reload
        // because they run on the upstream RSC process (which invalidates
        // require.cache per-request, so a fresh fetch returns new content).
        const appDir = path_1.default.join(cwd, 'app');
        let reloadTimer = null;
        fsWatcher = fs_1.default.watch(appDir, { recursive: true }, (_event, filename) => {
            if (filename && /\.[jt]sx?$/.test(filename)) {
                if (reloadTimer)
                    clearTimeout(reloadTimer);
                reloadTimer = setTimeout(() => {
                    (0, logger_1.logEvent)('File changed, reloading...');
                    pushSSE('reload');
                }, 120);
            }
        });
    }
    if (isDev && options.compiler) {
        app.use((0, webpack_dev_middleware_1.default)(options.compiler, {
            publicPath: '/_vista/static/chunks/',
            stats: 'none',
            writeToDisk: true,
        }));
        app.use((0, webpack_hot_middleware_1.default)(options.compiler, {
            log: false,
            path: '/__webpack_hmr',
            heartbeat: 2000,
        }));
        // Push compile errors/success to SSE clients
        options.compiler.hooks.done.tap('VistaRSCLiveReload', (stats) => {
            if (stats.hasErrors()) {
                const errors = stats.toJson().errors || [];
                const msg = errors.map((e) => (typeof e === 'string' ? e : e.message)).join('\n');
                const payload = JSON.stringify({ type: 'error', message: msg });
                sseReloadClients.forEach((c) => c.write(`data: ${payload}\n\n`));
            }
            else {
                const payload = JSON.stringify({ type: 'ok' });
                sseReloadClients.forEach((c) => c.write(`data: ${payload}\n\n`));
            }
        });
        options.compiler.hooks.afterEmit.tap('VistaRSCServerManifestReload', () => {
            if (fs_1.default.existsSync(serverManifestPath)) {
                serverManifest = JSON.parse(fs_1.default.readFileSync(serverManifestPath, 'utf-8'));
            }
            // Reload SSR manifest on rebuild too
            if (resolvedSSRManifestPath && fs_1.default.existsSync(resolvedSSRManifestPath)) {
                ssrManifest = JSON.parse(fs_1.default.readFileSync(resolvedSSRManifestPath, 'utf-8'));
                // Normalise {specifier,name} → {id,chunks,name} (same as initial load)
                if (ssrManifest && ssrManifest.moduleMap) {
                    const mm = ssrManifest.moduleMap;
                    for (const exports of Object.values(mm)) {
                        for (const [expName, entry] of Object.entries(exports)) {
                            if (entry.specifier && !entry.id) {
                                exports[expName] = {
                                    id: entry.specifier,
                                    chunks: [],
                                    name: entry.name || expName,
                                };
                            }
                        }
                    }
                }
            }
        });
    }
    // ========================================================================
    // Structure Watcher SSE (RSC dev mode)
    // ========================================================================
    const sseStructureClients = new Set();
    app.get('/__vista_structure', (req, res) => {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.flushHeaders();
        sseStructureClients.add(res);
        res.write('data: connected\n\n');
        req.on('close', () => {
            sseStructureClients.delete(res);
        });
    });
    if (isDev && structureConfig.enabled) {
        structureWatcher = new structure_watch_1.StructureWatcher({
            cwd,
            debounceMs: structureConfig.watchDebounceMs,
        });
        structureWatcher.on('validation', (event) => {
            (0, structure_log_1.logValidationResult)({ state: event.state, issues: event.issues, routeGraph: [], timestamp: event.timestamp }, structureConfig.logLevel);
        });
        structureWatcher.on('structure-error', (event) => {
            if (structureConfig.mode === 'strict') {
                (0, structure_log_1.logDevBlocked)();
                currentStructureState = {
                    state: 'error',
                    issues: event.issues,
                    routeGraph: [],
                    timestamp: event.timestamp,
                };
                const overlayMsg = (0, structure_log_1.formatIssuesForOverlay)(currentStructureState, structureConfig.includeWarningsInOverlay);
                const data = JSON.stringify({ type: 'structure-error', message: overlayMsg });
                sseStructureClients.forEach((c) => c.write(`data: ${data}\n\n`));
            }
        });
        structureWatcher.on('structure-ok', (event) => {
            const wasBlocked = currentStructureState?.state === 'error' && structureConfig.mode === 'strict';
            currentStructureState = {
                state: 'ok',
                issues: event.issues,
                routeGraph: [],
                timestamp: event.timestamp,
            };
            if (wasBlocked) {
                (0, structure_log_1.logDevUnblocked)();
                const data = JSON.stringify({ type: 'structure-ok' });
                sseStructureClients.forEach((c) => c.write(`data: ${data}\n\n`));
            }
        });
        (0, structure_log_1.logWatcherStart)();
        structureWatcher.start().catch((err) => {
            console.error('[vista:validate] Failed to start structure watcher:', err);
        });
    }
    app.get('/styles.css', (req, res) => {
        const cssPath = path_1.default.join(cwd, '.vista', 'client.css');
        if (fs_1.default.existsSync(cssPath)) {
            res.setHeader('Content-Type', 'text/css');
            res.sendFile(cssPath);
            return;
        }
        res.status(404).type('text/css').send('/* CSS not found */');
    });
    // Image optimization endpoint
    const imageHandler = (0, image_optimizer_1.createImageHandler)(cwd, isDev);
    app.get('/_vista/image', imageHandler);
    app.use(express_1.default.static(path_1.default.join(cwd, 'public')));
    app.use('/_vista/static', express_1.default.static(path_1.default.join(cwd, '.vista', 'static')));
    app.use('/_vista', express_1.default.static(path_1.default.join(cwd, '.vista')));
    app.use(express_1.default.static(path_1.default.join(cwd, '.vista')));
    const proxyRSCRequest = async (req, res) => {
        try {
            const fetchOptions = {
                method: req.method,
                headers: { Accept: req.get('Accept') ?? 'text/x-component' },
            };
            // Forward Server Action headers and body for POST requests
            if (req.method === 'POST') {
                const rscAction = req.headers['rsc-action'];
                if (rscAction) {
                    fetchOptions.headers['rsc-action'] = rscAction;
                }
                const contentType = req.get('content-type');
                if (contentType) {
                    fetchOptions.headers['content-type'] = contentType;
                }
                // Collect the raw body
                const chunks = [];
                for await (const chunk of req) {
                    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
                }
                fetchOptions.body = Buffer.concat(chunks);
            }
            const upstream = await withTimeout(`${upstreamOrigin}${req.originalUrl}`, fetchOptions);
            res.status(upstream.status);
            const contentType = upstream.headers.get('content-type');
            if (contentType)
                res.setHeader('Content-Type', contentType);
            res.setHeader('Vary', 'Accept');
            if (!upstream.body) {
                res.end(await upstream.text());
                return;
            }
            stream_1.Readable.fromWeb(upstream.body).pipe(res);
        }
        catch (error) {
            res
                .status(503)
                .type('text/plain')
                .send(`RSC upstream unavailable (${upstreamOrigin}/rsc): ${error.message}`);
        }
    };
    app.get('/rsc*', proxyRSCRequest);
    app.get('/_rsc*', proxyRSCRequest);
    app.post('/rsc*', proxyRSCRequest);
    app.post('/_rsc*', proxyRSCRequest);
    // -------------------------------------------------------------------
    // User middleware (middleware.ts at project root)
    // -------------------------------------------------------------------
    app.use(async (req, res, next) => {
        // Skip internal paths — middleware should only run on page/API requests
        if (req.path === '/styles.css' ||
            req.path.startsWith('/_vista') ||
            req.path.startsWith('/__webpack_hmr') ||
            req.path.startsWith('/__vista_structure') ||
            req.path.startsWith('/rsc') ||
            req.path.startsWith('/_rsc')) {
            return next();
        }
        const result = await (0, middleware_runner_1.runMiddleware)(req, cwd, isDev);
        const finalized = (0, middleware_runner_1.applyMiddlewareResult)(result, req, res);
        if (finalized)
            return; // response already sent (redirect / short-circuit)
        next();
    });
    app.use(async (req, res, next) => {
        if (req.path === '/styles.css' ||
            req.path.startsWith('/_vista') ||
            req.path.startsWith('/__webpack_hmr') ||
            req.path.startsWith('/__vista_structure') ||
            req.path.startsWith('/rsc') ||
            req.path.startsWith('/_rsc')) {
            return next();
        }
        // ======================================================================
        // Structure validation gate (strict-block in dev)
        // ======================================================================
        if (isDev &&
            structureConfig.enabled &&
            structureConfig.mode === 'strict' &&
            currentStructureState?.state === 'error') {
            const overlayMessage = (0, structure_log_1.formatIssuesForOverlay)(currentStructureState, structureConfig.includeWarningsInOverlay);
            const errorInfo = {
                type: 'build',
                message: `Structure Validation Failed\n\n${overlayMessage}`,
            };
            res
                .status(500)
                .type('text/html')
                .send((0, dev_error_1.renderErrorHTML)([errorInfo]));
            return;
        }
        if (req.path.startsWith('/api/')) {
            await handleApiRoute(req, res, cwd, isDev);
            return;
        }
        // ==================================================================
        // Static / ISR Cache Check
        // ==================================================================
        // Before dynamic rendering, check if we have a pre-rendered page.
        // For ISR pages whose revalidate window has expired, serve the stale
        // cached version immediately and kick off background revalidation.
        // ==================================================================
        {
            const cached = (0, static_cache_1.getCachedPage)(req.path);
            if (cached.page) {
                if (cached.stale) {
                    // ISR: serve stale page immediately, revalidate in background
                    const route = matchRoute(req.path, serverManifest.routes);
                    if (route && !(0, static_cache_1.isRevalidating)(req.path)) {
                        const urlPath = req.path;
                        // Fire-and-forget background revalidation
                        (0, static_generator_1.revalidatePath)(urlPath, route, undefined, cwd, vistaDirRoot).catch((err) => {
                            console.error('[vista:isr] Background revalidation error:', err);
                        });
                    }
                }
                res
                    .status(200)
                    .type('text/html')
                    .setHeader('X-Vista-Cache', cached.stale ? 'STALE' : 'HIT')
                    .send(cached.page.html);
                return;
            }
        }
        // ==================================================================
        // Flight-Based SSR Path
        // ==================================================================
        // If the Flight SSR client + SSR manifest are available, render pages
        // by fetching the Flight stream from upstream and using
        // renderToPipeableStream for streaming HTML with proper hydration.
        // Falls back to legacy renderToString if Flight SSR is unavailable.
        // ==================================================================
        if (useFlightSSR) {
            try {
                // Metadata extraction: still done locally so we have <head> content
                const rootLayout = (0, root_resolver_1.resolveRootLayout)(cwd, isDev);
                const route = matchRoute(req.path, serverManifest.routes);
                let metadataHtml = '';
                if (route) {
                    if (isDev) {
                        for (const key of Object.keys(require.cache)) {
                            if (key.includes(`${path_1.default.sep}app${path_1.default.sep}`)) {
                                delete require.cache[key];
                            }
                        }
                    }
                    const PageModule = require(route.pagePath);
                    let metadata = { ...(rootLayout.metadata || {}) };
                    if (PageModule.metadata) {
                        metadata = { ...metadata, ...PageModule.metadata };
                    }
                    if (typeof PageModule.generateMetadata === 'function') {
                        const params = extractParams(req.path, route);
                        const searchParams = Object.fromEntries(new URLSearchParams(req.query).entries());
                        try {
                            const dynamicMeta = await PageModule.generateMetadata({ params, searchParams }, metadata);
                            metadata = { ...metadata, ...dynamicMeta };
                        }
                        catch (metaErr) {
                            console.error('[vista:rsc] Error in generateMetadata:', metaErr);
                        }
                    }
                    const { generateMetadataHtml } = require('../metadata/generate');
                    metadataHtml = metadata ? generateMetadataHtml(metadata) : '';
                }
                // Render the page via Flight stream → SSR
                await renderFlightToHTMLStream(upstreamOrigin, req.path, req.query ? new URLSearchParams(req.query).toString() : '', metadataHtml, findChunkFiles(cwd), rootLayout.mode, flightSSRClient, ssrManifest, res, isDev);
                return;
            }
            catch (flightError) {
                console.error('[vista:rsc] Flight SSR failed:', flightError.message);
                // If headers haven't been sent yet, show the error overlay directly.
                // This is much better than falling through to legacy renderToString,
                // which will likely hit the same error (e.g. useState in a server component).
                if (isDev && !res.headersSent) {
                    const errorInfo = {
                        type: 'runtime',
                        message: flightError.message || 'Flight SSR Error',
                        stack: flightError.stack,
                    };
                    res.status(500).send((0, dev_error_1.renderErrorHTML)([errorInfo]));
                    return;
                }
                // If headers were already sent (stream was partially flushed),
                // we can't change the status code, but we can inject an error
                // overlay script at the end of the stream.
                if (isDev && res.headersSent) {
                    try {
                        const errMsg = (flightError.message || 'Flight SSR Error')
                            .replace(/'/g, "\\'")
                            .replace(/\n/g, '\\n');
                        res.write(`<script>document.body.innerHTML='';document.body.style.background='#1a1a2e';document.body.style.color='#ff6b6b';document.body.style.fontFamily='monospace';document.body.style.padding='40px';document.body.innerHTML='<h2 style="color:#ff6b6b">\\u26a0 Server Error</h2><pre style="white-space:pre-wrap;color:#ffa07a">${errMsg}</pre>';</script>`);
                        res.end();
                    }
                    catch {
                        res.end();
                    }
                    return;
                }
            }
        }
        // ==================================================================
        // Legacy Fallback: Direct renderToString
        // ==================================================================
        // Used when Flight SSR is unavailable or fails. This path does NOT
        // go through the Flight protocol — it requires page modules directly
        // and renders them with renderToString (synchronous, no streaming).
        // ==================================================================
        try {
            // Check upstream availability for the legacy path
            await withTimeout(`${upstreamOrigin}/rsc/`, { headers: { Accept: 'text/x-component' } }, 3000);
        }
        catch (error) {
            res
                .status(503)
                .type('text/plain')
                .send(`RSC upstream unavailable (${upstreamOrigin}/rsc): ${error.message}`);
            return;
        }
        try {
            const rootLayout = (0, root_resolver_1.resolveRootLayout)(cwd, isDev);
            const route = matchRoute(req.path, serverManifest.routes);
            if (!route) {
                const resolvedNotFound = (0, root_resolver_1.resolveNotFoundComponent)(cwd, rootLayout, isDev);
                if (resolvedNotFound) {
                    const notFoundElement = react_1.default.createElement(resolvedNotFound.component, {
                        params: {},
                        searchParams: {},
                    });
                    const wrapped = react_1.default.createElement(rootLayout.component, { params: {}, searchParams: {} }, notFoundElement);
                    const html = (0, server_1.renderToString)(wrapped);
                    res
                        .status(404)
                        .type('text/html')
                        .send(createHtmlDocument(html, '', findChunkFiles(cwd), rootLayout.mode));
                    return;
                }
                res.status(404).send('<h1>404 - Page Not Found</h1>');
                return;
            }
            const params = extractParams(req.path, route);
            const searchParams = Object.fromEntries(new URLSearchParams(req.query).entries());
            const { element, metadata, rootMode } = await createRouteElement(route, { params, searchParams, req }, isDev, rootLayout);
            const appHtml = (0, server_1.renderToString)(element);
            const { generateMetadataHtml } = require('../metadata/generate');
            const metadataHtml = metadata ? generateMetadataHtml(metadata) : '';
            res
                .status(200)
                .type('text/html')
                .send(createHtmlDocument(appHtml, metadataHtml, findChunkFiles(cwd), rootMode));
        }
        catch (error) {
            if (error?.name === 'NotFoundError') {
                try {
                    const rootLayout = (0, root_resolver_1.resolveRootLayout)(cwd, isDev);
                    const resolvedNotFound = (0, root_resolver_1.resolveNotFoundComponent)(cwd, rootLayout, isDev);
                    if (resolvedNotFound) {
                        const notFoundElement = react_1.default.createElement(resolvedNotFound.component, {
                            params: {},
                            searchParams: {},
                        });
                        const wrapped = react_1.default.createElement(rootLayout.component, { params: {}, searchParams: {} }, notFoundElement);
                        const html = (0, server_1.renderToString)(wrapped);
                        res
                            .status(404)
                            .type('text/html')
                            .send(createHtmlDocument(html, '', findChunkFiles(cwd), rootLayout.mode));
                        return;
                    }
                    res.status(404).send('<h1>404 - Page Not Found</h1>');
                    return;
                }
                catch (notFoundError) {
                    console.error('[vista:rsc] Failed to render NotFoundError fallback:', notFoundError);
                }
            }
            console.error('[vista:rsc] Render error:', error);
            if (isDev) {
                const errorInfo = {
                    type: 'runtime',
                    message: error.message || 'Unknown Server Error',
                    stack: error.stack,
                };
                res.status(500).send((0, dev_error_1.renderErrorHTML)([errorInfo]));
            }
            else {
                res.status(500).send('<h1>Internal Server Error</h1>');
            }
        }
    });
    const server = app.listen(port, () => {
        (0, logger_1.printServerReady)({ port, mode: 'rsc', rscFlight: useFlightSSR });
    });
    httpServer = server;
    server.on('error', (error) => {
        if (error?.code === 'EADDRINUSE') {
            (0, logger_1.logError)(`Port ${port} is already in use.`);
            process.exit(1);
            return;
        }
        (0, logger_1.logError)(`RSC startup failed: ${error?.message || String(error)}`);
        process.exit(1);
    });
}
