"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveLegacyApiRoutePath = resolveLegacyApiRoutePath;
exports.runLegacyApiRoute = runLegacyApiRoute;
exports.runTypedApiRoute = runTypedApiRoute;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const server_1 = require("../stack/server");
const TYPED_API_ENTRYPOINTS = [
    path_1.default.join('app', 'api', 'typed.ts'),
    path_1.default.join('app', 'api', 'typed.tsx'),
    path_1.default.join('app', 'api', 'typed.js'),
    path_1.default.join('app', 'api', 'typed.jsx'),
    path_1.default.join('app', 'typed-api.ts'),
    path_1.default.join('app', 'typed-api.tsx'),
    path_1.default.join('app', 'typed-api.js'),
    path_1.default.join('app', 'typed-api.jsx'),
];
class BodyLimitError extends Error {
    status = 413;
    constructor(limitBytes) {
        super(`Typed API body exceeds configured limit (${limitBytes} bytes)`);
        this.name = 'BodyLimitError';
    }
}
class BodyParseError extends Error {
    status = 400;
    constructor(message) {
        super(message);
        this.name = 'BodyParseError';
    }
}
function isStackRouterLike(value) {
    if (!value || typeof value !== 'object') {
        return false;
    }
    const candidate = value;
    return (!!candidate.procedures &&
        !!candidate.routes &&
        !!candidate.metadata &&
        typeof candidate.resolve === 'function');
}
function resolveTypedRouterFromModule(mod) {
    const candidates = [
        mod?.default,
        mod?.router,
        mod?.typedRouter,
        mod?.api,
        typeof mod?.createRouter === 'function' ? mod.createRouter() : null,
        typeof mod?.createTypedRouter === 'function' ? mod.createTypedRouter() : null,
    ];
    for (const candidate of candidates) {
        if (isStackRouterLike(candidate)) {
            return candidate;
        }
    }
    return null;
}
function normalizeApiPath(pathname) {
    if (!pathname.startsWith('/api')) {
        return pathname || '/';
    }
    const stripped = pathname.slice('/api'.length);
    return stripped ? stripped : '/';
}
function buildPathCandidates(pathname) {
    const normalized = pathname || '/';
    const apiNormalized = normalizeApiPath(normalized);
    const dedup = new Set([normalized, apiNormalized]);
    return Array.from(dedup);
}
function hasMethodMatch(router, pathname, method) {
    const normalized = method.toLowerCase();
    return router.resolve(pathname, normalized) !== null;
}
function hasRouteForAnyMethod(router, pathname) {
    return hasMethodMatch(router, pathname, 'get') || hasMethodMatch(router, pathname, 'post');
}
async function parseRequestBody(req, bodySizeLimitBytes) {
    if (req.method === 'GET' || req.method === 'HEAD') {
        return undefined;
    }
    const chunks = [];
    let size = 0;
    for await (const chunk of req) {
        const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
        size += buffer.length;
        if (size > bodySizeLimitBytes) {
            throw new BodyLimitError(bodySizeLimitBytes);
        }
        chunks.push(buffer);
    }
    if (chunks.length === 0) {
        return undefined;
    }
    const raw = Buffer.concat(chunks);
    const contentType = String(req.headers['content-type'] || '')
        .split(';')[0]
        .trim()
        .toLowerCase();
    if (!contentType || contentType === 'application/json' || contentType.endsWith('+json')) {
        try {
            return JSON.parse(raw.toString('utf-8'));
        }
        catch {
            throw new BodyParseError('Invalid JSON body for typed API request.');
        }
    }
    if (contentType === 'application/x-www-form-urlencoded') {
        return Object.fromEntries(new URLSearchParams(raw.toString('utf-8')).entries());
    }
    if (contentType.startsWith('text/')) {
        return raw.toString('utf-8');
    }
    return raw;
}
async function sendFetchResponse(res, response) {
    response.headers.forEach((value, key) => {
        res.setHeader(key, value);
    });
    const arrayBuffer = await response.arrayBuffer();
    const body = Buffer.from(arrayBuffer);
    res.status(response.status).send(body);
}
function getTypedApiEntrypoint(cwd) {
    for (const relativePath of TYPED_API_ENTRYPOINTS) {
        const absolutePath = path_1.default.resolve(cwd, relativePath);
        if (fs_1.default.existsSync(absolutePath)) {
            return absolutePath;
        }
    }
    return null;
}
async function executeTypedRoute(router, options) {
    const pathCandidates = buildPathCandidates(options.req.path);
    const method = options.method.toLowerCase();
    let selectedPath = null;
    let routeExistsForDifferentMethod = false;
    for (const candidate of pathCandidates) {
        if (hasMethodMatch(router, candidate, method)) {
            selectedPath = candidate;
            break;
        }
        if (hasRouteForAnyMethod(router, candidate)) {
            routeExistsForDifferentMethod = true;
        }
    }
    if (!selectedPath) {
        if (routeExistsForDifferentMethod) {
            return {
                kind: 'method-not-allowed',
                status: 405,
                error: `Method ${method.toUpperCase()} not allowed`,
            };
        }
        return { kind: 'not-found' };
    }
    const result = await (0, server_1.executeRoute)(router, {
        path: selectedPath,
        method,
        req: {
            method,
            path: selectedPath,
            query: options.query,
            body: options.body,
            headers: options.req.headers,
            originalUrl: options.req.originalUrl,
            url: options.req.url,
        },
        ctx: options.context,
        env: options.env,
        serialization: options.serialization,
    });
    return {
        kind: 'handled',
        status: 200,
        payload: result.serializedData,
    };
}
function resolveLegacyApiRoutePath(cwd, requestPath) {
    if (!requestPath.startsWith('/api/')) {
        return null;
    }
    const apiRoute = requestPath.substring('/api/'.length);
    const routeCandidates = [
        path_1.default.resolve(cwd, 'app', 'api', apiRoute, 'route.ts'),
        path_1.default.resolve(cwd, 'app', 'api', apiRoute, 'route.tsx'),
        path_1.default.resolve(cwd, 'app', 'api', apiRoute, 'route.js'),
        path_1.default.resolve(cwd, 'app', 'api', apiRoute, 'route.jsx'),
        path_1.default.resolve(cwd, 'app', 'api', `${apiRoute}.ts`),
        path_1.default.resolve(cwd, 'app', 'api', `${apiRoute}.tsx`),
        path_1.default.resolve(cwd, 'app', 'api', `${apiRoute}.js`),
        path_1.default.resolve(cwd, 'app', 'api', `${apiRoute}.jsx`),
    ];
    for (const routePath of routeCandidates) {
        if (fs_1.default.existsSync(routePath)) {
            return routePath;
        }
    }
    return null;
}
async function runLegacyApiRoute(options) {
    const { req, res, apiPath, isDev } = options;
    if (isDev) {
        delete require.cache[require.resolve(apiPath)];
    }
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
            return;
        }
        if (result !== undefined) {
            res.status(200).json(result);
            return;
        }
        res.status(204).end();
        return;
    }
    if (typeof apiModule.default === 'function') {
        apiModule.default(req, res);
        return;
    }
    res.status(405).json({ error: `Method ${method} not allowed` });
}
async function runTypedApiRoute(options) {
    const { req, res, cwd, isDev, config } = options;
    if (!config.enabled) {
        return false;
    }
    const entrypoint = getTypedApiEntrypoint(cwd);
    if (!entrypoint) {
        return false;
    }
    try {
        if (isDev) {
            delete require.cache[require.resolve(entrypoint)];
        }
        const typedModule = require(entrypoint);
        const router = resolveTypedRouterFromModule(typedModule);
        if (!router) {
            res.status(500).json({
                error: `Typed API entrypoint "${path_1.default.relative(cwd, entrypoint)}" does not export a valid stack router.`,
            });
            return true;
        }
        const method = (req.method || 'GET').toUpperCase();
        const body = await parseRequestBody(req, config.bodySizeLimitBytes);
        const query = (req.query ?? {});
        const contextFactory = typeof typedModule.createContext === 'function' ? typedModule.createContext : null;
        const envFactory = typeof typedModule.createEnv === 'function' ? typedModule.createEnv : null;
        const context = contextFactory ? await contextFactory({ req, res }) : {};
        const env = envFactory ? await envFactory({ req, res }) : {};
        const routeResult = await executeTypedRoute(router, {
            req,
            method,
            query,
            body,
            serialization: config.serialization,
            context: context ?? {},
            env,
        });
        if (routeResult.kind === 'not-found') {
            return false;
        }
        if (routeResult.kind === 'method-not-allowed') {
            res.status(routeResult.status).json({ error: routeResult.error });
            return true;
        }
        res.status(routeResult.status).json(routeResult.payload);
        return true;
    }
    catch (error) {
        const typedError = error;
        if (typedError instanceof BodyLimitError || typedError instanceof BodyParseError) {
            res.status(typedError.status).json({ error: typedError.message });
            return true;
        }
        if (typedError instanceof server_1.StackValidationError ||
            typedError instanceof server_1.StackMethodNotAllowedError) {
            const status = typeof typedError.status === 'number' ? typedError.status : 400;
            res.status(status).json({ error: typedError.message });
            return true;
        }
        if (typedError instanceof server_1.StackRouteNotFoundError) {
            return false;
        }
        // Router-level error handler gets first chance.
        try {
            const entrypoint = getTypedApiEntrypoint(cwd);
            if (entrypoint) {
                if (isDev) {
                    delete require.cache[require.resolve(entrypoint)];
                }
                const typedModule = require(entrypoint);
                const router = resolveTypedRouterFromModule(typedModule);
                const errorHandler = router?.metadata?.errorHandler;
                if (typeof errorHandler === 'function') {
                    const response = errorHandler(error, {
                        method: req.method,
                        path: req.path,
                        query: (req.query ?? {}),
                        headers: req.headers,
                    });
                    if (response instanceof Response) {
                        await sendFetchResponse(res, response);
                        return true;
                    }
                }
            }
        }
        catch {
            // Ignore fallback handler errors and use generic 500 response below.
        }
        res.status(500).json({ error: 'Internal Server Error in Typed API' });
        return true;
    }
}
