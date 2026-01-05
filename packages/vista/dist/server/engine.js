"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.enableClientComponentWrapping = enableClientComponentWrapping;
exports.disableClientComponentWrapping = disableClientComponentWrapping;
exports.startServer = startServer;
const express_1 = __importDefault(require("express"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const server_1 = require("react-dom/server");
const react_1 = __importDefault(require("react"));
const stream_1 = require("stream");
const webpack_dev_middleware_1 = __importDefault(require("webpack-dev-middleware"));
const webpack_hot_middleware_1 = __importDefault(require("webpack-hot-middleware"));
const config_1 = require("../config");
const dev_error_1 = require("../dev-error");
// Support CSS imports (ignore them on server)
require.extensions['.css'] = () => { };
// Use SWC for faster server-side TypeScript compilation
try {
    require('@swc-node/register');
    console.log("Using SWC for server-side TypeScript compilation (Rust-powered)");
}
catch (e) {
    // Fallback to ts-node if @swc-node not available
    try {
        require('ts-node').register({
            transpileOnly: true,
            compilerOptions: {
                module: 'commonjs',
                jsx: 'react-jsx',
                moduleResolution: 'node',
                esModuleInterop: true
            }
        });
        console.log("Using ts-node for server-side TypeScript compilation");
    }
    catch (e2) {
        console.warn("No TypeScript compiler found for SSR.");
    }
}
// ============================================================================
// RSC: Auto-wrap client components with hydration markers
// ============================================================================
const client_boundary_1 = require("./client-boundary");
// Cache to track which files are client components
const clientComponentFiles = new Set();
// Initialize client component registry from scan
function initClientComponentRegistry(appDir) {
    const { scanAppDirectory, isNativeAvailable } = require('../bin/file-scanner');
    try {
        const result = scanAppDirectory(appDir);
        result.clientComponents.forEach((c) => {
            // Normalize path for comparison
            const normalized = c.absolutePath.replace(/\\/g, '/').toLowerCase();
            clientComponentFiles.add(normalized);
        });
        console.log(`[Vista RSC] Registered ${clientComponentFiles.size} client component(s) for hydration wrapping`);
    }
    catch (e) {
        // Fallback - scanning not available
    }
}
// Check if a file is a client component
function isClientComponentFile(filePath) {
    const normalized = filePath.replace(/\\/g, '/').toLowerCase();
    return clientComponentFiles.has(normalized);
}
// Store original require for tsx/ts files
const Module = require('module');
const originalLoad = Module._load;
// CRITICAL: Ensure single React instance across all requires
// This fixes "Invalid hook call" errors during SSR with monorepo/linked packages
const reactPath = require.resolve('react');
const reactDomPath = require.resolve('react-dom');
const originalResolveFilename = Module._resolveFilename;
Module._resolveFilename = function (request, parent, isMain, options) {
    // Redirect all react/react-dom requires to our single instance
    if (request === 'react') {
        return reactPath;
    }
    if (request === 'react-dom') {
        return reactDomPath;
    }
    if (request.startsWith('react-dom/')) {
        // Handle subpaths like react-dom/server, react-dom/client
        const subpath = request.replace('react-dom/', '');
        try {
            return require.resolve(`react-dom/${subpath}`, { paths: [path_1.default.dirname(reactDomPath)] });
        }
        catch {
            return originalResolveFilename.call(this, request, parent, isMain, options);
        }
    }
    if (request.startsWith('react/')) {
        // Handle subpaths like react/jsx-runtime
        const subpath = request.replace('react/', '');
        try {
            return require.resolve(`react/${subpath}`, { paths: [path_1.default.dirname(reactPath)] });
        }
        catch {
            return originalResolveFilename.call(this, request, parent, isMain, options);
        }
    }
    return originalResolveFilename.call(this, request, parent, isMain, options);
};
// Global flag to control wrapping
let wrapClientComponents = false;
function enableClientComponentWrapping(appDir) {
    initClientComponentRegistry(appDir);
    // Clear require cache for client component files so they can be wrapped
    for (const clientPath of clientComponentFiles) {
        // Find and clear all cached versions of this module
        for (const cachedPath of Object.keys(require.cache)) {
            const normalizedCached = cachedPath.replace(/\\/g, '/').toLowerCase();
            if (normalizedCached === clientPath) {
                delete require.cache[cachedPath];
            }
        }
    }
    wrapClientComponents = true;
    // Override Module._load to wrap client components
    Module._load = function (request, parent, isMain) {
        const result = originalLoad.apply(this, arguments);
        // Only process if wrapping is enabled and we have a parent with filename
        if (wrapClientComponents && parent?.filename) {
            try {
                const resolved = Module._resolveFilename(request, parent, isMain);
                // Check if this is a client component
                if (isClientComponentFile(resolved) && result?.default) {
                    // Get component ID from filename
                    const componentId = path_1.default.basename(resolved).replace(/\.(tsx|ts|jsx|js)$/, '');
                    // Wrap the default export if not already wrapped
                    if (!result.default.__vistaWrapped) {
                        const OriginalComponent = result.default;
                        const WrappedComponent = (0, client_boundary_1.wrapClientComponent)(OriginalComponent, componentId);
                        WrappedComponent.__vistaWrapped = true;
                        result.default = WrappedComponent;
                    }
                }
            }
            catch (e) {
                // Ignore resolution errors
            }
        }
        return result;
    };
}
function disableClientComponentWrapping() {
    wrapClientComponents = false;
}
// ============================================================================
console.log("React Path (Engine):", require.resolve('react'));
console.log("ReactDOM Path (Engine):", require.resolve('react-dom'));
function startServer(port = 3003, compiler) {
    const app = (0, express_1.default)();
    const cwd = process.cwd();
    const vistaConfig = (0, config_1.loadConfig)(cwd);
    const isDev = process.env.NODE_ENV !== 'production';
    const appDir = path_1.default.join(cwd, 'app');
    // Allow port override from config
    const finalPort = vistaConfig.server?.port || port;
    console.log("Starting Vista Server...");
    console.log("App Directory:", cwd);
    console.log("Loaded Config:", JSON.stringify(vistaConfig, null, 2));
    // Enable RSC: Auto-wrap client components with hydration markers
    enableClientComponentWrapping(appDir);
    // Webpack Dev + Hot Middleware (only in dev mode with compiler)
    if (isDev && compiler) {
        console.log("Enabling Webpack HMR...");
        app.use((0, webpack_dev_middleware_1.default)(compiler, {
            publicPath: '/',
            stats: 'minimal',
            writeToDisk: (filePath) => {
                // Write CSS to disk (served statically)
                return filePath.endsWith('.css');
            }
        }));
        app.use((0, webpack_hot_middleware_1.default)(compiler, {
            log: false, // Reduce console noise
            path: '/__webpack_hmr',
            heartbeat: 2000,
        }));
        // Server-Side Live Reload via SSE
        // Watches server component files and triggers page reload
        const sseClients = new Set();
        // SSE endpoint for server reload
        app.get('/__vista_reload', (req, res) => {
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');
            res.flushHeaders();
            sseClients.add(res);
            // Send initial connection message
            res.write('data: connected\n\n');
            req.on('close', () => {
                sseClients.delete(res);
            });
        });
        // Watch server files and trigger reload
        let debounceTimer = null;
        const triggerReload = () => {
            if (debounceTimer)
                clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                console.log('[Vista] Server file changed, triggering reload...');
                sseClients.forEach(client => {
                    client.write('data: reload\n\n');
                });
            }, 100);
        };
        // Push compile errors to browser via SSE
        const pushCompileError = (errorMessage) => {
            const errorData = JSON.stringify({
                type: 'error',
                message: errorMessage
            });
            sseClients.forEach(client => {
                client.write(`data: ${errorData}\n\n`);
            });
        };
        // Push build success to browser
        const pushBuildSuccess = () => {
            const data = JSON.stringify({ type: 'ok' });
            sseClients.forEach(client => {
                client.write(`data: ${data}\n\n`);
            });
        };
        // Listen to webpack compilation errors
        compiler.hooks.done.tap('VistaSSE', (stats) => {
            if (stats.hasErrors()) {
                const errors = stats.toJson().errors || [];
                const errorMessage = errors.map(e => typeof e === 'string' ? e : e.message).join('\n');
                console.log('[Vista] Build error detected, pushing to browser...');
                pushCompileError(errorMessage);
            }
            else {
                pushBuildSuccess();
            }
        });
        // Watch the app directory for server file changes
        fs_1.default.watch(appDir, { recursive: true }, (event, filename) => {
            if (filename && (filename.endsWith('.tsx') || filename.endsWith('.ts'))) {
                // Check if it's a server component (not client)
                const filePath = path_1.default.join(appDir, filename);
                try {
                    const content = fs_1.default.readFileSync(filePath, 'utf-8');
                    // Server files don't have 'client load' directive
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
    // Serve static files (public)
    app.use(express_1.default.static(path_1.default.join(cwd, 'public')));
    // Serve .vista build artifacts with proper routing
    // /_vista/static/* -> .vista/static/*
    app.use('/_vista/static', express_1.default.static(path_1.default.join(cwd, '.vista', 'static')));
    // Legacy: Serve .vista root for backward compatibility (client.css, etc.)
    app.use(express_1.default.static(path_1.default.join(cwd, '.vista')));
    app.use(async (req, res, next) => {
        if (req.path.startsWith('/styles.css') || req.path.startsWith('/__webpack_hmr')) {
            return next();
        }
        // MIDDLEWARE SUPPORT
        const middlewarePath = path_1.default.resolve(cwd, 'middleware.ts');
        const middlewareTsxPath = path_1.default.resolve(cwd, 'middleware.tsx');
        const middlewareJsPath = path_1.default.resolve(cwd, 'middleware.js');
        let middlewareFile = null;
        if (fs_1.default.existsSync(middlewarePath)) {
            middlewareFile = middlewarePath;
        }
        else if (fs_1.default.existsSync(middlewareTsxPath)) {
            middlewareFile = middlewareTsxPath;
        }
        else if (fs_1.default.existsSync(middlewareJsPath)) {
            middlewareFile = middlewareJsPath;
        }
        if (middlewareFile) {
            try {
                // Clear cache for hot reloading
                if (isDev) {
                    delete require.cache[require.resolve(middlewareFile)];
                }
                const middlewareModule = require(middlewareFile);
                const middleware = middlewareModule.default || middlewareModule.middleware;
                if (typeof middleware === 'function') {
                    // Create NextRequest-like object
                    const nextRequest = {
                        url: req.protocol + '://' + req.get('host') + req.originalUrl,
                        method: req.method,
                        headers: new Map(Object.entries(req.headers)),
                        nextUrl: {
                            pathname: req.path,
                            searchParams: new URLSearchParams(req.query),
                            href: req.protocol + '://' + req.get('host') + req.originalUrl,
                            origin: req.protocol + '://' + req.get('host'),
                        },
                        cookies: {
                            get: (name) => req.cookies?.[name] ? { name, value: req.cookies[name] } : undefined,
                            getAll: () => Object.entries(req.cookies || {}).map(([name, value]) => ({ name, value })),
                            has: (name) => !!req.cookies?.[name],
                        },
                    };
                    const response = await middleware(nextRequest);
                    // Handle middleware response
                    if (response) {
                        // Check for redirect
                        const location = response.headers?.get?.('Location');
                        if (location) {
                            return res.redirect(response.status || 307, location);
                        }
                        // Check for rewrite
                        const rewrite = response.headers?.get?.('x-middleware-rewrite');
                        if (rewrite) {
                            req.url = rewrite;
                        }
                        // Check if middleware wants to continue
                        const shouldContinue = response.headers?.get?.('x-middleware-next');
                        if (!shouldContinue && response.status && response.status !== 200) {
                            return res.status(response.status).end();
                        }
                    }
                }
            }
            catch (err) {
                console.error('Middleware Error:', err);
            }
        }
        // API ROUTES SUPPORT - Next.js App Router Style
        if (req.path.startsWith('/api/')) {
            // Remove /api/ prefix and check for route.ts file
            const apiRoute = req.path.substring(5); // Remove '/api/'
            // Try route.ts pattern first (Next.js App Router style)
            const routeTsPath = path_1.default.resolve(cwd, 'app', 'api', apiRoute, 'route.ts');
            const routeTsxPath = path_1.default.resolve(cwd, 'app', 'api', apiRoute, 'route.tsx');
            // Fallback to old pattern (api/path.ts)
            const legacyPath = path_1.default.resolve(cwd, 'app', 'api', apiRoute + '.ts');
            let apiPath = null;
            if (fs_1.default.existsSync(routeTsPath)) {
                apiPath = routeTsPath;
            }
            else if (fs_1.default.existsSync(routeTsxPath)) {
                apiPath = routeTsxPath;
            }
            else if (fs_1.default.existsSync(legacyPath)) {
                apiPath = legacyPath;
            }
            if (apiPath) {
                try {
                    delete require.cache[require.resolve(apiPath)];
                    const apiModule = require(apiPath);
                    // Next.js App Router style: named exports for HTTP methods
                    const method = req.method?.toUpperCase() || 'GET';
                    const methodHandler = apiModule[method];
                    if (typeof methodHandler === 'function') {
                        // Create Request-like object for App Router compatibility
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
                        // Handle Response object
                        if (result && typeof result.json === 'function') {
                            const json = await result.json();
                            return res.status(result.status || 200).json(json);
                        }
                        else if (result) {
                            return res.status(200).json(result);
                        }
                        return res.status(204).end();
                    }
                    // Fallback to default export (Pages Router style)
                    const handler = apiModule.default;
                    if (typeof handler === 'function') {
                        return handler(req, res);
                    }
                    return res.status(405).json({ error: `Method ${method} not allowed` });
                }
                catch (err) {
                    console.error('API Route Error:', err);
                    return res.status(500).json({ error: "Internal Server Error in API" });
                }
            }
            else {
                return res.status(404).json({ error: "API Route Not Found" });
            }
        }
        try {
            let pagePath;
            let params = {};
            // Route Matching Logic
            const getExactPath = (p) => {
                if (p === '/' || p === '/index')
                    return path_1.default.resolve(cwd, 'app', 'index.tsx');
                return path_1.default.resolve(cwd, 'app', p.substring(1), 'page.tsx');
            };
            const tryPath = getExactPath(req.path);
            // Clear require cache for hot reloading in dev
            if (isDev) {
                Object.keys(require.cache).forEach(key => {
                    if (key.includes(cwd) && key.includes('app')) {
                        delete require.cache[key];
                    }
                });
            }
            if (fs_1.default.existsSync(tryPath)) {
                pagePath = tryPath;
            }
            else {
                // Dynamic Route Matching
                const segments = req.path.split('/').filter(Boolean);
                const appDir = path_1.default.resolve(cwd, 'app');
                if (segments.length === 2) {
                    const [section, paramVal] = segments;
                    const sectionPath = path_1.default.join(appDir, section);
                    if (fs_1.default.existsSync(sectionPath) && fs_1.default.statSync(sectionPath).isDirectory()) {
                        const subEntries = fs_1.default.readdirSync(sectionPath, { withFileTypes: true });
                        const dynamicFolder = subEntries.find(d => d.isDirectory() && d.name.startsWith('[') && d.name.endsWith(']'));
                        if (dynamicFolder) {
                            const paramName = dynamicFolder.name.slice(1, -1);
                            params[paramName] = paramVal;
                            pagePath = path_1.default.join(sectionPath, dynamicFolder.name, 'page.tsx');
                        }
                    }
                }
            }
            // 404 Handling
            if (!pagePath || !fs_1.default.existsSync(pagePath)) {
                const notFoundPath = path_1.default.resolve(cwd, 'app', 'not-found.tsx');
                if (fs_1.default.existsSync(notFoundPath)) {
                    const NotFoundModule = require(notFoundPath);
                    const NotFoundComponent = NotFoundModule.default;
                    const RootModule = require(path_1.default.resolve(cwd, 'app', 'root.tsx'));
                    const RootComponent = RootModule.default;
                    renderApp(req, res, NotFoundComponent, RootComponent, {}, { title: "404 Not Found" }, vistaConfig, 404, isDev);
                    return;
                }
                res.status(404).send('<h1>404 - Page Not Found</h1>');
                return;
            }
            // Load Modules
            const PageModule = require(pagePath);
            const PageComponent = PageModule.default;
            const RootModule = require(path_1.default.resolve(cwd, 'app', 'root.tsx'));
            const RootComponent = RootModule.default;
            if (!PageComponent) {
                res.status(500).send('<h1>Page does not export default component</h1>');
                return;
            }
            // Data Fetching
            let props = {};
            if (PageModule.getServerProps) {
                props = await PageModule.getServerProps({ query: req.query, params, req });
            }
            // Metadata extraction - merge layout + page metadata
            let metadata = {};
            // Get root layout metadata first
            if (RootModule.metadata) {
                metadata = { ...RootModule.metadata };
            }
            // Get page static metadata (overrides root)
            if (PageModule.metadata) {
                metadata = { ...metadata, ...PageModule.metadata };
            }
            // Get dynamic metadata from generateMetadata function
            if (typeof PageModule.generateMetadata === 'function') {
                try {
                    const dynamicMeta = await PageModule.generateMetadata({ params, searchParams: req.query }, metadata // parent metadata
                    );
                    metadata = { ...metadata, ...dynamicMeta };
                }
                catch (e) {
                    console.error('Error in generateMetadata:', e);
                }
            }
            // Render with merged metadata
            renderApp(req, res, PageComponent, RootComponent, { ...props, params }, metadata, vistaConfig, 200, isDev);
        }
        catch (err) {
            console.error(err);
            // Render Server-Side Error Overlay
            const errorInfo = {
                type: 'runtime',
                message: err.message || 'Unknown Server Error',
                stack: err.stack,
                file: err.message.match && err.message.match(/(app\/.*?):(\d+):(\d+)/)?.[1] || undefined,
            };
            const errorHtml = (0, server_1.renderToStaticMarkup)(react_1.default.createElement(dev_error_1.ErrorOverlay, { errors: [errorInfo] }));
            res.status(500).send(`<!DOCTYPE html><html><body style="margin:0">${errorHtml}</body></html>`);
        }
    });
    app.listen(finalPort, () => {
        console.log(`Vista Server running at http://localhost:${finalPort}`);
    });
}
// Helper to encapsulate Render Logic
function renderApp(req, res, PageComponent, RootComponent, props, metadata, config, status = 200, isDev = false) {
    // Import RouterContext from the router module
    const { RouterContext } = require('../client/router');
    const { generateMetadataHtml } = require('../metadata/generate');
    // Create router context value matching client structure
    const routerValue = {
        push: () => { },
        replace: () => { },
        back: () => { },
        forward: () => { },
        prefetch: () => { },
        refresh: () => { },
        params: props.params || {},
        pathname: req.path
    };
    // App content that will be hydrated inside #root
    const appContent = react_1.default.createElement(RouterContext.Provider, { value: routerValue }, react_1.default.createElement(RootComponent, { params: props.params || {} }, react_1.default.createElement(PageComponent, props)));
    // Full HTML document shell - matches what client expects to hydrate
    // Critical CSS AND blocking script to prevent FOUC (Flash of Unstyled Content)
    const criticalCss = `
        html, body { background: #0a0a0a; color: #ededed; }
        html.light, html.light body { background: #ffffff; color: #171717; }
    `;
    // Blocking script that runs immediately to set theme class
    // This runs before any CSS loads, preventing flash
    // Also sets up atomic theme switching after page load (next-themes style)
    const themeScript = `
        (function() {
            var d = document.documentElement;
            
            // Immediately set theme before paint
            var theme = localStorage.getItem('vista-theme');
            var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            var effectiveTheme = theme === 'light' ? 'light' : (theme === 'dark' ? 'dark' : (prefersDark ? 'dark' : 'light'));
            
            d.classList.add(effectiveTheme);
            d.classList.remove(effectiveTheme === 'dark' ? 'light' : 'dark');
            d.style.colorScheme = effectiveTheme;
            
            // Global theme setter for components to use (next-themes style)
            // Uses temporary stylesheet to disable ALL transitions during switch
            window.__vistaSetTheme = function(newTheme) {
                // Create a temporary style element to disable all transitions
                var css = document.createElement('style');
                css.appendChild(document.createTextNode(
                    '*,*::before,*::after{-webkit-transition:none!important;-moz-transition:none!important;-o-transition:none!important;-ms-transition:none!important;transition:none!important}'
                ));
                document.head.appendChild(css);
                
                // Apply theme classes
                d.classList.remove('light', 'dark');
                d.classList.add(newTheme);
                d.style.colorScheme = newTheme;
                
                // Save to localStorage
                localStorage.setItem('vista-theme', newTheme);
                
                // Force a reflow to ensure the transition-blocking style is applied
                // before we remove it. getComputedStyle forces a synchronous layout.
                window.getComputedStyle(css).opacity;
                
                // Remove the transition-blocking style on next frame
                // This ensures all theme changes have been applied
                requestAnimationFrame(function() {
                    requestAnimationFrame(function() {
                        document.head.removeChild(css);
                    });
                });
            };
            
            // Listen for system preference changes
            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function(e) {
                var currentTheme = localStorage.getItem('vista-theme');
                if (!currentTheme || currentTheme === 'system') {
                    window.__vistaSetTheme(e.matches ? 'dark' : 'light');
                }
            });
        })();
    `;
    const appElement = react_1.default.createElement('html', { lang: 'en', className: 'dark' }, // Default to dark class
    react_1.default.createElement('head', null, 
    // Critical CSS first
    react_1.default.createElement('style', {
        dangerouslySetInnerHTML: { __html: criticalCss },
        'data-vista-critical': 'true'
    }), 
    // Blocking theme script
    react_1.default.createElement('script', {
        dangerouslySetInnerHTML: { __html: themeScript }
    })), react_1.default.createElement('body', { className: 'antialiased' }, react_1.default.createElement('div', { id: 'root' }, appContent)));
    let didError = false;
    // Generate metadata HTML from metadata object
    let metadataHtml = '';
    if (metadata) {
        try {
            metadataHtml = generateMetadataHtml(metadata);
        }
        catch (e) {
            console.error('Error generating metadata HTML:', e);
        }
    }
    const injectStream = new stream_1.Transform({
        transform(chunk, encoding, callback) {
            let chunkString = chunk.toString();
            if (chunkString.includes('</head>')) {
                // Inject metadata + CSS
                const headInjection = `${metadataHtml}<link rel="stylesheet" href="/client.css">`;
                chunkString = chunkString.replace('</head>', `${headInjection}</head>`);
            }
            if (chunkString.includes('</body>')) {
                const hydrationScript = `
                    <script>
                        window.__INITIAL_PROPS__ = ${JSON.stringify(props)};
                        window.__VISTA_CONFIG__ = ${JSON.stringify(config)};
                    </script>
                    <script src="/vista-client-manifest.js"></script>
                    <script src="/client.js"></script>
                `;
                chunkString = chunkString.replace('</body>', `${hydrationScript}</body>`);
            }
            this.push(chunkString);
            callback();
        }
    });
    const stream = (0, server_1.renderToPipeableStream)(appElement, {
        onShellReady() {
            res.statusCode = didError ? 500 : status;
            res.setHeader('Content-type', 'text/html');
            stream.pipe(injectStream).pipe(res);
        },
        onShellError(err) {
            res.statusCode = 500;
            res.send('<!doctype html><p>Loading...</p>');
        },
        onError(err) {
            didError = true;
            console.error(err);
        }
    });
}
