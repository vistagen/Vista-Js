"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRouter = createRouter;
exports.normalizeStackRoutePath = normalizeStackRoutePath;
const procedure_1 = require("./procedure");
function normalizePathSegment(path) {
    return path
        .split('/')
        .map((segment) => segment.trim())
        .filter(Boolean)
        .join('/');
}
function normalizeBasePath(basePath = '') {
    const normalized = normalizePathSegment(basePath);
    return normalized ? `/${normalized}` : '';
}
function normalizeRoutePath(basePath, relativePath) {
    const normalizedRelativePath = normalizePathSegment(relativePath);
    const normalizedBasePath = normalizeBasePath(basePath);
    const combined = normalizePathSegment([normalizedBasePath, normalizedRelativePath].filter(Boolean).join('/'));
    return combined ? `/${combined}` : '/';
}
function flattenProcedures(procedures, basePath, currentPath, routes) {
    for (const [segment, node] of Object.entries(procedures)) {
        const nextPath = [currentPath, segment].filter(Boolean).join('/');
        if ((0, procedure_1.isOperation)(node)) {
            const routePath = normalizeRoutePath(basePath, nextPath);
            if (routes[routePath]) {
                throw new Error(`Duplicate stack route detected: "${routePath}"`);
            }
            routes[routePath] = node;
            continue;
        }
        if (node && typeof node === 'object' && !Array.isArray(node)) {
            flattenProcedures(node, basePath, nextPath, routes);
            continue;
        }
        throw new Error(`Invalid procedure node at "${nextPath || '/'}"`);
    }
}
function createRouter(procedures, options = {}) {
    const basePath = options.basePath ?? '';
    const globalMiddlewares = [...(options.middlewares ?? [])];
    const routes = {};
    flattenProcedures(procedures, basePath, '', routes);
    const procedureMeta = {};
    for (const [path, operation] of Object.entries(routes)) {
        procedureMeta[path] = { type: operation.type };
    }
    const metadata = {
        basePath: normalizeBasePath(basePath),
        globalMiddlewares,
        procedures: procedureMeta,
        registeredPaths: Object.keys(routes),
        errorHandler: options.errorHandler,
        config: options.config,
    };
    return {
        procedures,
        routes: routes,
        metadata,
        resolve(path, method) {
            const normalizedPath = normalizeRoutePath('', path);
            const route = routes[normalizedPath];
            if (!route) {
                return null;
            }
            if (route.type !== String(method).toLowerCase()) {
                return null;
            }
            return {
                path: normalizedPath,
                operation: route,
            };
        },
    };
}
function normalizeStackRoutePath(path) {
    return normalizeRoutePath('', path);
}
