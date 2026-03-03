"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const react_1 = __importDefault(require("react"));
const url_1 = require("url");
const root_resolver_1 = require("./root-resolver");
const constants_1 = require("../constants");
// NOTE: RouteErrorBoundary and RouteSuspense are 'use client' components.
// Under --conditions react-server, React.Component is not available, so we
// must NOT import them at the top level.  Instead we lazy-require them after
// the client-load hook has been installed (which turns them into Flight
// client references automatically).
let _RouteErrorBoundary = null;
let _RouteSuspense = null;
function getRouteErrorBoundary() {
    if (!_RouteErrorBoundary) {
        _RouteErrorBoundary = require('../components/error-boundary').RouteErrorBoundary;
    }
    return _RouteErrorBoundary;
}
function getRouteSuspense() {
    if (!_RouteSuspense) {
        _RouteSuspense = require('../components/route-suspense').RouteSuspense;
    }
    return _RouteSuspense;
}
const CjsModule = require('module');
// Support CSS imports on server runtime
require.extensions['.css'] = (m, filename) => {
    if (filename.endsWith('.module.css')) {
        m.exports = {};
    }
};
let installedClientLoadHook = false;
let originalCompile = null;
let reactResolutionInstalled = false;
let originalResolveFilename = null;
const clientDirectiveCache = new Map();
function parseCliArg(flag) {
    const index = process.argv.indexOf(flag);
    if (index === -1)
        return undefined;
    return process.argv[index + 1];
}
function resolvePort(defaultPort) {
    const raw = parseCliArg('--port') ?? process.env.RSC_UPSTREAM_PORT ?? String(defaultPort);
    const port = Number(raw);
    if (!Number.isInteger(port) || port < 1 || port > 65535) {
        throw new Error(`Invalid upstream port: ${raw}`);
    }
    return port;
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
function normalizeModulePath(filePath) {
    return filePath.replace(/\\/g, '/').toLowerCase();
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
        // tsx/cjs registers the TypeScript loader for require()
        require('tsx/cjs');
        return;
    }
    catch {
        throw new Error('No TypeScript compiler available for RSC upstream runtime. Install one of: @swc-node/register, ts-node, or tsx');
    }
}
function hasClientBoundaryDirective(source) {
    const trimmed = source.trimStart();
    return trimmed.startsWith("'use client'") || trimmed.startsWith('"use client"');
}
function isClientBoundaryFile(filename, transpiledSource) {
    const cached = clientDirectiveCache.get(filename);
    if (cached !== undefined)
        return cached;
    let isClient = false;
    try {
        const originalSource = fs_1.default.readFileSync(filename, 'utf-8');
        isClient = hasClientBoundaryDirective(originalSource);
    }
    catch {
        isClient = hasClientBoundaryDirective(transpiledSource);
    }
    clientDirectiveCache.set(filename, isClient);
    return isClient;
}
function installSingleReactResolution() {
    if (reactResolutionInstalled)
        return;
    let reactPath;
    let reactDomPath;
    try {
        reactPath = require.resolve('react');
        reactDomPath = require.resolve('react-dom');
    }
    catch {
        return;
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
function installClientLoadHook(cwd, createClientModuleProxy) {
    if (installedClientLoadHook)
        return;
    const appDir = path_1.default.join(cwd, 'app');
    const componentsDir = path_1.default.join(cwd, 'components');
    const normalizedAppDir = normalizeModulePath(appDir);
    const normalizedComponentsDir = normalizeModulePath(componentsDir);
    originalCompile = CjsModule.prototype._compile;
    CjsModule.prototype._compile = function (content, filename) {
        const normalized = normalizeModulePath(filename);
        const isInAppTree = normalized.startsWith(normalizedAppDir);
        const isInComponentsTree = normalized.startsWith(normalizedComponentsDir);
        if ((isInAppTree || isInComponentsTree) &&
            /\.[jt]sx?$/.test(filename) &&
            isClientBoundaryFile(filename, content)) {
            const moduleId = (0, url_1.pathToFileURL)(filename).href;
            this.exports = createClientModuleProxy(moduleId);
            return;
        }
        return originalCompile.call(this, content, filename);
    };
    installedClientLoadHook = true;
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
            return true;
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
    const sorted = [...routes].sort((a, b) => {
        const aOptional = a.pattern.includes('*?');
        const bOptional = b.pattern.includes('*?');
        if (aOptional && !bOptional)
            return 1;
        if (!aOptional && bOptional)
            return -1;
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
async function createRouteElement(route, context, isDev) {
    const { params, searchParams, req } = context;
    if (isDev) {
        for (const key of Object.keys(require.cache)) {
            if (key.includes(`${path_1.default.sep}app${path_1.default.sep}`) ||
                key.includes(`${path_1.default.sep}components${path_1.default.sep}`)) {
                delete require.cache[key];
                clientDirectiveCache.delete(key);
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
        // Inner: Suspense boundary for loading states
        if (loadingComponent) {
            element = react_1.default.createElement(getRouteSuspense(), {
                loadingComponent,
                children: element,
            });
        }
        // Outer: Error boundary wraps Suspense
        if (errorComponent) {
            element = react_1.default.createElement(getRouteErrorBoundary(), {
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
    return element;
}
function startUpstream() {
    const cwd = process.cwd();
    const isDev = process.env.NODE_ENV !== 'production';
    const port = resolvePort(3101);
    installSingleReactResolution();
    setupTypeScriptRuntime(cwd);
    const flightServerPath = resolveFromWorkspace('react-server-dom-webpack/server.node', cwd);
    const flightServer = require(flightServerPath);
    installClientLoadHook(cwd, flightServer.createClientModuleProxy);
    const serverManifestPath = path_1.default.join(cwd, constants_1.BUILD_DIR, 'server', 'server-manifest.json');
    const flightManifestPath = path_1.default.join(cwd, constants_1.BUILD_DIR, 'react-client-manifest.json');
    if (!fs_1.default.existsSync(serverManifestPath)) {
        throw new Error('Missing RSC server manifest. Run "vista build" first.');
    }
    // In dev mode the flight manifest may not exist yet (webpack-dev-middleware
    // hasn't completed the first compilation).  Write a stub so we can start,
    // and reload on each request.
    if (!fs_1.default.existsSync(flightManifestPath)) {
        if (isDev) {
            fs_1.default.writeFileSync(flightManifestPath, '{}');
        }
        else {
            throw new Error('Missing RSC flight manifest. Run "vista build" first.');
        }
    }
    let serverManifest = JSON.parse(fs_1.default.readFileSync(serverManifestPath, 'utf-8'));
    let flightManifest = JSON.parse(fs_1.default.readFileSync(flightManifestPath, 'utf-8'));
    const app = (0, express_1.default)();
    const handleRSCRequest = async (req, res) => {
        try {
            // In dev mode, reload manifests from disk on each request so we
            // always pick up the latest output from ReactFlightWebpackPlugin.
            if (isDev) {
                try {
                    serverManifest = JSON.parse(fs_1.default.readFileSync(serverManifestPath, 'utf-8'));
                    flightManifest = JSON.parse(fs_1.default.readFileSync(flightManifestPath, 'utf-8'));
                }
                catch {
                    // Manifests may be mid-write; use whatever we have cached.
                }
            }
            const pathname = req.path.replace(/^\/(?:_rsc|rsc)/, '') || '/';
            const route = matchRoute(pathname, serverManifest.routes);
            if (!route) {
                const rootLayout = (0, root_resolver_1.resolveRootLayout)(cwd, isDev);
                const resolvedNotFound = (0, root_resolver_1.resolveNotFoundComponent)(cwd, rootLayout, isDev);
                let model;
                if (resolvedNotFound) {
                    const notFoundElement = react_1.default.createElement(resolvedNotFound.component, {
                        params: {},
                        searchParams: {},
                    });
                    model = react_1.default.createElement(rootLayout.component, { params: {}, searchParams: {} }, notFoundElement);
                }
                else {
                    model = react_1.default.createElement('div', {
                        style: {
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            height: '100vh',
                            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                            background: '#0a0a0a',
                            color: '#ededed',
                            margin: 0,
                            overflow: 'hidden',
                            textAlign: 'center',
                            userSelect: 'none',
                        },
                    }, react_1.default.createElement('span', {
                        style: {
                            fontSize: '6rem',
                            fontWeight: 800,
                            letterSpacing: '-0.04em',
                            lineHeight: 1,
                            background: 'linear-gradient(135deg, #7c3aed, #2563eb, #06b6d4)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                        },
                    }, '404'), react_1.default.createElement('p', {
                        style: {
                            marginTop: '0.75rem',
                            fontSize: '0.95rem',
                            fontWeight: 400,
                            color: '#555',
                            letterSpacing: '0.02em',
                        },
                    }, "There's nothing here."));
                }
                res.status(404);
                res.setHeader('Content-Type', 'text/x-component');
                res.setHeader('Vary', 'Accept');
                const stream = flightServer.renderToPipeableStream(model, flightManifest, {
                    onError(error) {
                        console.error('[vista:rsc] Flight render error on 404:', error);
                    },
                });
                stream.pipe(res);
                return;
            }
            const params = extractParams(pathname, route);
            const searchParams = Object.fromEntries(new URLSearchParams(req.query).entries());
            const element = await createRouteElement(route, { params, searchParams, req }, isDev);
            res.setHeader('Content-Type', 'text/x-component');
            res.setHeader('Vary', 'Accept');
            const stream = flightServer.renderToPipeableStream(element, flightManifest, {
                onError(error) {
                    console.error('[vista:rsc] Upstream flight render error:', error);
                },
            });
            stream.pipe(res);
        }
        catch (error) {
            if (error?.name === 'NotFoundError') {
                try {
                    const rootLayout = (0, root_resolver_1.resolveRootLayout)(cwd, isDev);
                    const resolvedNotFound = (0, root_resolver_1.resolveNotFoundComponent)(cwd, rootLayout, isDev);
                    let model;
                    if (resolvedNotFound) {
                        const notFoundElement = react_1.default.createElement(resolvedNotFound.component, {
                            params: {},
                            searchParams: {},
                        });
                        model = react_1.default.createElement(rootLayout.component, { params: {}, searchParams: {} }, notFoundElement);
                    }
                    else {
                        model = react_1.default.createElement('h1', null, '404 - Page Not Found');
                    }
                    res.status(404);
                    res.setHeader('Content-Type', 'text/x-component');
                    res.setHeader('Vary', 'Accept');
                    const notFoundStream = flightServer.renderToPipeableStream(model, flightManifest, {
                        onError(notFoundError) {
                            console.error('[vista:rsc] Flight render error on NotFoundError:', notFoundError);
                        },
                    });
                    notFoundStream.pipe(res);
                    return;
                }
                catch (notFoundError) {
                    console.error('[vista:rsc] Failed to render NotFoundError fallback:', notFoundError);
                }
            }
            console.error('[vista:rsc] Upstream request failed:', error);
            res
                .status(500)
                .type('text/plain')
                .send(error.message);
        }
    };
    app.get('/rsc*', handleRSCRequest);
    app.get('/_rsc*', handleRSCRequest);
    // -----------------------------------------------------------------------
    // Server Actions — POST handler
    // -----------------------------------------------------------------------
    app.use(express_1.default.text({ type: 'text/plain', limit: '10mb' }));
    const handleServerAction = async (req, res) => {
        try {
            const actionId = req.headers['rsc-action'];
            if (!actionId) {
                res.status(400).type('text/plain').send('Missing rsc-action header');
                return;
            }
            // actionId format: "file:///.../module.ts#exportName"
            const hashIdx = actionId.lastIndexOf('#');
            const modulePath = hashIdx >= 0 ? actionId.slice(0, hashIdx) : actionId;
            const exportName = hashIdx >= 0 ? actionId.slice(hashIdx + 1) : 'default';
            // Resolve the server module
            let resolvedPath = modulePath;
            if (resolvedPath.startsWith('file://')) {
                resolvedPath = resolvedPath.replace(/^file:\/\/\//, '').replace(/^file:\/\//, '');
                // On Windows, paths look like file:///C:/... so we need to keep the drive letter
                if (process.platform === 'win32' && /^[a-zA-Z]:/.test(resolvedPath) === false) {
                    resolvedPath = '/' + resolvedPath;
                }
            }
            // In dev mode, bust the require cache so we get fresh code
            if (isDev) {
                delete require.cache[require.resolve(resolvedPath)];
            }
            const actionModule = require(resolvedPath);
            const actionFn = actionModule[exportName];
            if (typeof actionFn !== 'function') {
                res.status(404).type('text/plain').send(`Server action not found: ${actionId}`);
                return;
            }
            // Decode the arguments from the request body
            let args;
            const contentType = req.headers['content-type'] || '';
            if (contentType.includes('multipart/form-data')) {
                // For form submissions, decodeAction handles the FormData
                const boundAction = await flightServer.decodeAction(req.body, flightManifest);
                const result = await boundAction();
                // Return the result as a Flight stream
                res.setHeader('Content-Type', 'text/x-component');
                const stream = flightServer.renderToPipeableStream(result, flightManifest, {
                    onError(error) {
                        console.error('[vista:rsc] Server action render error:', error);
                    },
                });
                stream.pipe(res);
                return;
            }
            else {
                // Text body — decode via decodeReply
                args = (await flightServer.decodeReply(req.body, flightManifest));
            }
            // Call the action
            const result = await actionFn(...(Array.isArray(args) ? args : [args]));
            // Return the result as a Flight stream
            res.setHeader('Content-Type', 'text/x-component');
            const stream = flightServer.renderToPipeableStream(result, flightManifest, {
                onError(error) {
                    console.error('[vista:rsc] Server action render error:', error);
                },
            });
            stream.pipe(res);
        }
        catch (error) {
            console.error('[vista:rsc] Server action failed:', error);
            res
                .status(500)
                .type('text/plain')
                .send(error.message);
        }
    };
    app.post('/rsc*', handleServerAction);
    app.post('/_rsc*', handleServerAction);
    const server = app.listen(port, () => {
        console.log(`[vista:rsc:upstream] Listening on http://127.0.0.1:${port}/rsc`);
    });
    server.on('error', (error) => {
        if (error?.code === 'EADDRINUSE') {
            console.error(`[vista:server] Port ${port} is already in use.`);
            process.exit(1);
            return;
        }
        console.error('[vista:server] RSC upstream startup failed:', error);
        process.exit(1);
    });
}
startUpstream();
