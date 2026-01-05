"use strict";
/**
 * Vista RSC Engine
 *
 * React Server Components aware rendering engine.
 *
 * This engine implements the "True RSC Architecture":
 * 1. Server components render on the server only, contribute 0kb to client
 * 2. Client components are sent as references, hydrated on demand
 * 3. Strict separation ensures server secrets never leak
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startRSCServer = startRSCServer;
exports.default = startRSCServer;
const express_1 = __importDefault(require("express"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const server_1 = require("react-dom/server");
const react_1 = __importDefault(require("react"));
const webpack_dev_middleware_1 = __importDefault(require("webpack-dev-middleware"));
const webpack_hot_middleware_1 = __importDefault(require("webpack-hot-middleware"));
const config_1 = require("../config");
const dev_error_1 = require("../dev-error");
const rsc_renderer_1 = require("../build/rsc/rsc-renderer");
const rsc_module_system_1 = require("./rsc-module-system");
// Support CSS imports (ignore them on server)
require.extensions['.css'] = () => { };
// IMPORTANT: Initialize RSC module system BEFORE TypeScript compiler
// This must happen first so we can intercept client component requires
function earlyInitializeRSC(cwd) {
    try {
        const clientManifestPath = path_1.default.join(cwd, '.vista', 'client-manifest.json');
        if (fs_1.default.existsSync(clientManifestPath)) {
            const manifest = JSON.parse(fs_1.default.readFileSync(clientManifestPath, 'utf-8'));
            (0, rsc_module_system_1.initializeRSCModuleSystem)(manifest);
            return manifest;
        }
    }
    catch (e) {
        // Will initialize later
    }
    return null;
}
// Early init before TypeScript compilation
const earlyManifest = earlyInitializeRSC(process.cwd());
// Use SWC for faster server-side TypeScript compilation
try {
    require('@swc-node/register');
    console.log('[Vista RSC] Using SWC for server-side TypeScript compilation');
}
catch (e) {
    try {
        require('ts-node').register({
            transpileOnly: true,
            compilerOptions: {
                module: 'commonjs',
                jsx: 'react-jsx',
                moduleResolution: 'node',
                esModuleInterop: true,
            },
        });
        console.log('[Vista RSC] Using ts-node for server-side TypeScript compilation');
    }
    catch (e2) {
        console.warn('[Vista RSC] No TypeScript compiler found for SSR.');
    }
}
/**
 * Start the RSC-aware Vista server
 */
function startRSCServer(options = {}) {
    const app = (0, express_1.default)();
    const cwd = process.cwd();
    const vistaConfig = (0, config_1.loadConfig)(cwd);
    const isDev = process.env.NODE_ENV !== 'production';
    const port = options.port || vistaConfig.server?.port || 3003;
    console.log('[Vista RSC] Starting React Server Components Engine...');
    console.log('[Vista RSC] App Directory:', cwd);
    // Initialize RSC renderer
    let rscRenderer = null;
    let clientManifest = null;
    let serverManifest = null;
    function loadManifests() {
        try {
            const clientManifestPath = path_1.default.join(cwd, '.vista', 'client-manifest.json');
            const serverManifestPath = path_1.default.join(cwd, '.vista', 'server', 'server-manifest.json');
            if (fs_1.default.existsSync(clientManifestPath)) {
                clientManifest = JSON.parse(fs_1.default.readFileSync(clientManifestPath, 'utf-8'));
            }
            if (fs_1.default.existsSync(serverManifestPath)) {
                serverManifest = JSON.parse(fs_1.default.readFileSync(serverManifestPath, 'utf-8'));
            }
            if (clientManifest && serverManifest) {
                // Initialize RSC module system to intercept client component requires
                (0, rsc_module_system_1.initializeRSCModuleSystem)(clientManifest);
                rscRenderer = new rsc_renderer_1.RSCRenderer({
                    clientManifest,
                    serverManifest,
                    cwd,
                });
                console.log('[Vista RSC] Manifests loaded successfully');
                console.log('[Vista RSC] Module interception enabled for client components');
            }
        }
        catch (e) {
            console.warn('[Vista RSC] Could not load manifests:', e);
        }
    }
    loadManifests();
    // SSE clients for live reload and error overlay
    const sseClients = new Set();
    // Webpack Dev + Hot Middleware (only in dev mode)
    if (isDev && options.compiler) {
        console.log('[Vista RSC] Enabling Webpack HMR...');
        app.use((0, webpack_dev_middleware_1.default)(options.compiler, {
            publicPath: '/',
            stats: 'minimal',
            writeToDisk: (filePath) => filePath.endsWith('.css'),
        }));
        app.use((0, webpack_hot_middleware_1.default)(options.compiler, {
            log: console.log,
            path: '/__webpack_hmr',
            heartbeat: 2000,
        }));
        // SSE endpoint for live reload and compile errors
        app.get('/__vista_reload', (req, res) => {
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
            res.setHeader('Connection', 'keep-alive');
            res.flushHeaders();
            sseClients.add(res);
            res.write('data: connected\n\n');
            req.on('close', () => {
                sseClients.delete(res);
            });
        });
        // Push compile errors to browser via SSE
        const pushCompileError = (errorMessage) => {
            const errorData = JSON.stringify({
                type: 'error',
                message: errorMessage,
            });
            sseClients.forEach((client) => {
                client.write(`data: ${errorData}\n\n`);
            });
        };
        // Push build success to browser (clears error overlay)
        const pushBuildSuccess = () => {
            const data = JSON.stringify({ type: 'ok' });
            sseClients.forEach((client) => {
                client.write(`data: ${data}\n\n`);
            });
        };
        // Listen to webpack compilation - push errors or success to browser
        options.compiler.hooks.done.tap('VistaRSCErrorOverlay', (stats) => {
            if (stats.hasErrors()) {
                const errors = stats.toJson().errors || [];
                const errorMessage = errors.map((e) => (typeof e === 'string' ? e : e.message)).join('\n');
                console.log('[Vista RSC] Build error detected, pushing to browser...');
                pushCompileError(errorMessage);
            }
            else {
                pushBuildSuccess();
            }
        });
        // Reload manifests on rebuild
        options.compiler.hooks.afterEmit.tap('VistaRSCEngine', () => {
            loadManifests();
        });
        // Watch server files and trigger reload for server component changes
        let debounceTimer = null;
        const triggerReload = () => {
            if (debounceTimer)
                clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                console.log('[Vista RSC] Server file changed, triggering reload...');
                sseClients.forEach((client) => {
                    client.write('data: reload\n\n');
                });
            }, 100);
        };
        // Watch app directory for server component changes
        const appDir = path_1.default.join(cwd, 'app');
        fs_1.default.watch(appDir, { recursive: true }, (event, filename) => {
            if (filename && (filename.endsWith('.tsx') || filename.endsWith('.ts'))) {
                const filePath = path_1.default.join(appDir, filename);
                try {
                    const content = fs_1.default.readFileSync(filePath, 'utf-8');
                    // Server files don't have 'client load' directive - trigger reload
                    if (!content.includes("'client load'") && !content.includes('"client load"')) {
                        triggerReload();
                    }
                }
                catch (e) {
                    // File might be deleted or being written
                }
            }
        });
    }
    // Explicit CSS route - serve .vista/client.css as /styles.css
    app.get('/styles.css', (req, res) => {
        const cssPath = path_1.default.join(cwd, '.vista', 'client.css');
        if (fs_1.default.existsSync(cssPath)) {
            res.setHeader('Content-Type', 'text/css');
            res.sendFile(cssPath);
        }
        else {
            // Fallback to globals.css if client.css doesn't exist
            const globalsPath = path_1.default.join(cwd, 'app', 'globals.css');
            if (fs_1.default.existsSync(globalsPath)) {
                res.setHeader('Content-Type', 'text/css');
                res.sendFile(globalsPath);
            }
            else {
                res.status(404).send('/* CSS not found */');
            }
        }
    });
    // Static file serving
    app.use(express_1.default.static(path_1.default.join(cwd, 'public')));
    app.use('/_vista/static', express_1.default.static(path_1.default.join(cwd, '.vista', 'static')));
    app.use('/_vista', express_1.default.static(path_1.default.join(cwd, '.vista')));
    app.use(express_1.default.static(path_1.default.join(cwd, '.vista')));
    // RSC Payload endpoint (for client-side navigation)
    app.get('/_rsc/*', async (req, res) => {
        const pathname = req.path.replace(/^\/_rsc/, '') || '/';
        if (!rscRenderer || !serverManifest) {
            return res.status(500).json({ error: 'RSC not initialized' });
        }
        try {
            const route = matchRoute(pathname, serverManifest.routes);
            if (!route) {
                return res.status(404).json({ error: 'Route not found' });
            }
            const params = extractParams(pathname, route);
            const searchParams = Object.fromEntries(new URLSearchParams(req.query).entries());
            const payload = await rscRenderer.render({
                clientManifest: clientManifest,
                serverManifest: serverManifest,
                route,
                params,
                searchParams,
                request: {
                    url: req.url,
                    method: req.method,
                    headers: req.headers,
                },
            });
            res.json(payload);
        }
        catch (e) {
            console.error('[Vista RSC] Error rendering RSC payload:', e);
            res.status(500).json({ error: e.message });
        }
    });
    // Main request handler
    app.use(async (req, res, next) => {
        // Skip static files and HMR
        if (req.path.startsWith('/styles.css') ||
            req.path.startsWith('/__webpack_hmr') ||
            req.path.startsWith('/_vista')) {
            return next();
        }
        // Handle API routes (unchanged)
        if (req.path.startsWith('/api/')) {
            return handleApiRoute(req, res, cwd, isDev);
        }
        // Render page with RSC
        try {
            await renderRSCPage(req, res, {
                cwd,
                isDev,
                vistaConfig,
                rscRenderer,
                clientManifest,
                serverManifest,
            });
        }
        catch (err) {
            console.error('[Vista RSC] Render error:', err);
            if (isDev) {
                const errorInfo = {
                    type: 'runtime',
                    message: err.message || 'Unknown Server Error',
                    stack: err.stack,
                };
                const errorHtml = (0, server_1.renderToString)(react_1.default.createElement(dev_error_1.ErrorOverlay, { errors: [errorInfo] }));
                res
                    .status(500)
                    .send(`<!DOCTYPE html><html><body style="margin:0">${errorHtml}</body></html>`);
            }
            else {
                res.status(500).send('<h1>Internal Server Error</h1>');
            }
        }
    });
    app.listen(port, () => {
        console.log(`[Vista RSC] Server running at http://localhost:${port}`);
    });
}
/**
 * Match a pathname to a route
 */
function matchRoute(pathname, routes) {
    for (const route of routes) {
        if (matchPattern(pathname, route.pattern)) {
            return route;
        }
    }
    return null;
}
/**
 * Simple pattern matching for routes
 */
function matchPattern(pathname, pattern) {
    const patternParts = pattern.split('/').filter(Boolean);
    const pathParts = pathname.split('/').filter(Boolean);
    // Root route
    if (patternParts.length === 0 && pathParts.length === 0) {
        return true;
    }
    // Check each segment
    for (let i = 0; i < patternParts.length; i++) {
        const patternPart = patternParts[i];
        const pathPart = pathParts[i];
        // Catch-all
        if (patternPart.endsWith('*')) {
            return true;
        }
        // Dynamic segment
        if (patternPart.startsWith(':')) {
            if (!pathPart)
                return false;
            continue;
        }
        // Static segment
        if (patternPart !== pathPart) {
            return false;
        }
    }
    return patternParts.length === pathParts.length;
}
/**
 * Extract params from pathname based on route pattern
 */
function extractParams(pathname, route) {
    const params = {};
    const patternParts = route.pattern.split('/').filter(Boolean);
    const pathParts = pathname.split('/').filter(Boolean);
    for (let i = 0; i < patternParts.length; i++) {
        const patternPart = patternParts[i];
        if (patternPart.startsWith(':')) {
            const paramName = patternPart.slice(1).replace('*', '');
            if (patternPart.endsWith('*')) {
                // Catch-all: grab rest of path
                params[paramName] = pathParts.slice(i).join('/');
            }
            else {
                params[paramName] = pathParts[i] || '';
            }
        }
    }
    return params;
}
/**
 * Handle API routes
 */
async function handleApiRoute(req, res, cwd, isDev) {
    const apiRoute = req.path.substring(5); // Remove '/api/'
    const routeTsPath = path_1.default.resolve(cwd, 'app', 'api', apiRoute, 'route.ts');
    const routeTsxPath = path_1.default.resolve(cwd, 'app', 'api', apiRoute, 'route.tsx');
    const legacyPath = path_1.default.resolve(cwd, 'app', 'api', apiRoute + '.ts');
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
        }
        else if (apiModule.default) {
            apiModule.default(req, res);
        }
        else {
            res.status(405).json({ error: `Method ${method} not allowed` });
        }
    }
    catch (err) {
        console.error('[Vista RSC] API Route Error:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}
/**
 * Render a page using RSC
 */
async function renderRSCPage(req, res, context) {
    const { cwd, isDev, vistaConfig, rscRenderer, clientManifest, serverManifest } = context;
    // If RSC is not initialized, fall back to legacy rendering
    if (!rscRenderer || !serverManifest) {
        return legacyRender(req, res, cwd, isDev, vistaConfig);
    }
    // Match the route
    const route = matchRoute(req.path, serverManifest.routes);
    if (!route) {
        // Try not-found page
        const notFoundPath = path_1.default.resolve(cwd, 'app', 'not-found.tsx');
        if (fs_1.default.existsSync(notFoundPath)) {
            // Render not-found page
            res.status(404);
            return legacyRender(req, res, cwd, isDev, vistaConfig, notFoundPath);
        }
        res.status(404).send('<h1>404 - Page Not Found</h1>');
        return;
    }
    // Extract params and search params
    const params = extractParams(req.path, route);
    const searchParams = Object.fromEntries(new URLSearchParams(req.query).entries());
    // Render using RSC renderer
    const payload = await rscRenderer.render({
        clientManifest: clientManifest,
        serverManifest: serverManifest,
        route,
        params,
        searchParams,
        request: {
            url: req.url,
            method: req.method,
            headers: req.headers,
        },
    });
    // Generate the full HTML document
    const html = generateFullHtml(payload, vistaConfig, isDev, cwd);
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
}
/**
 * Find all JS chunk files in the static directory
 * Returns them sorted by size (smallest first = runtime chunks first)
 */
function findAllChunkFiles(cwd) {
    const chunksDir = path_1.default.join(cwd, '.vista', 'static', 'chunks');
    const jsFiles = [];
    if (!fs_1.default.existsSync(chunksDir)) {
        return [];
    }
    try {
        const entries = fs_1.default.readdirSync(chunksDir);
        for (const entry of entries) {
            if (entry.endsWith('.js') && !entry.endsWith('.map')) {
                const stat = fs_1.default.statSync(path_1.default.join(chunksDir, entry));
                jsFiles.push({ name: entry, size: stat.size });
            }
        }
    }
    catch (e) {
        // Ignore
    }
    // Sort by size (smallest first - runtime/webpack chunks are usually smallest)
    jsFiles.sort((a, b) => a.size - b.size);
    return jsFiles.map((f) => f.name);
}
/**
 * Generate full HTML document from RSC payload
 */
function generateFullHtml(payload, config, isDev, cwd = process.cwd()) {
    const hydrationScript = (0, rsc_renderer_1.generateHydrationScript)(payload);
    const chunkFiles = findAllChunkFiles(cwd);
    // Build script tags for all chunks
    const scriptTags = chunkFiles.map((chunk) => `<script src="/_vista/static/chunks/${chunk}"></script>`);
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="preload" href="/styles.css" as="style">
    <link rel="stylesheet" href="/styles.css">
    <style>
      /* Critical styles - prevents FOUC */
      :root {
        --background: #ffffff;
        --foreground: #171717;
      }
      @media (prefers-color-scheme: dark) {
        :root {
          --background: #0a0a0a;
          --foreground: #ededed;
        }
      }
      *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
      html, body { height: 100%; }
      body { 
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        background: var(--background);
        color: var(--foreground);
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
      }
      #root { min-height: 100%; }
      /* Tailwind critical classes */
      .flex { display: flex; }
      .min-h-screen { min-height: 100vh; }
      .flex-col { flex-direction: column; }
      .items-center { align-items: center; }
      .justify-center { justify-content: center; }
      .text-center { text-align: center; }
      .text-3xl { font-size: 1.875rem; line-height: 2.25rem; }
      .font-semibold { font-weight: 600; }
      .relative { position: relative; }
      .absolute { position: absolute; }
      .border { border-width: 1px; }
      .border-dashed { border-style: dashed; }
      .rounded-full { border-radius: 9999px; }
      .p-10 { padding: 2.5rem; }
      .mb-10 { margin-bottom: 2.5rem; }
      .-mt-20 { margin-top: -5rem; }
      .max-w-xs { max-width: 20rem; }
      .tracking-tight { letter-spacing: -0.025em; }
      .leading-10 { line-height: 2.5rem; }
      .bg-white { background-color: #fff; }
      .bg-black { background-color: #000; }
      .text-black { color: #000; }
      .border-gray-300 { border-color: #d1d5db; }
      .transition-colors { transition-property: color, background-color, border-color; transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1); transition-duration: 150ms; }
      .duration-200 { transition-duration: 200ms; }
      @media (prefers-color-scheme: dark) {
        .dark\\:bg-black { background-color: #000; }
        .dark\\:text-zinc-50 { color: #fafafa; }
        .dark\\:border-neutral-700 { border-color: #404040; }
        .dark\\:invert { filter: invert(1); }
      }
      @media (min-width: 640px) {
        .sm\\:max-w-none { max-width: none; }
      }
      [data-vista-cc] { display: contents; }
    </style>
</head>
<body>
    <div id="root">${payload.html}</div>
    ${hydrationScript}
    ${scriptTags.join('\n    ')}
</body>
</html>`;
}
/**
 * Legacy render for fallback or when RSC is not available
 */
function legacyRender(req, res, cwd, isDev, config, customPage) {
    // Import the original engine for legacy rendering
    const { startServer } = require('./engine');
    // This is a simplified fallback - in practice, you'd handle this better
    res.status(500).send('RSC not initialized. Please run build first.');
}
