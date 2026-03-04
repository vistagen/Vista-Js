"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mergeRouters = mergeRouters;
const procedure_1 = require("./procedure");
const router_1 = require("./router");
function isObjectRecord(value) {
    return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
function mergeProcedureRecords(target, source, currentPath = '') {
    for (const [key, sourceNode] of Object.entries(source)) {
        const scopedPath = [currentPath, key].filter(Boolean).join('/');
        const targetNode = target[key];
        if (targetNode === undefined) {
            target[key] = sourceNode;
            continue;
        }
        if ((0, procedure_1.isOperation)(targetNode) && (0, procedure_1.isOperation)(sourceNode)) {
            throw new Error(`Duplicate procedure found while merging routers: "${scopedPath}"`);
        }
        if (isObjectRecord(targetNode) && isObjectRecord(sourceNode)) {
            target[key] = mergeProcedureRecords(targetNode, sourceNode, scopedPath);
            continue;
        }
        throw new Error(`Incompatible procedure nodes while merging routers: "${scopedPath}"`);
    }
    return target;
}
function mergeRouters(...routers) {
    const mergedProcedures = {};
    const mergedRoutes = {};
    const mergedMiddlewares = [];
    let sharedErrorHandler;
    for (const router of routers) {
        mergeProcedureRecords(mergedProcedures, router.procedures);
        for (const [path, operation] of Object.entries(router.routes)) {
            const normalizedPath = (0, router_1.normalizeStackRoutePath)(path);
            if (mergedRoutes[normalizedPath]) {
                throw new Error(`Duplicate route found while merging routers: "${normalizedPath}"`);
            }
            mergedRoutes[normalizedPath] = operation;
        }
        mergedMiddlewares.push(...router.metadata.globalMiddlewares);
        if (router.metadata.errorHandler) {
            if (sharedErrorHandler && sharedErrorHandler !== router.metadata.errorHandler) {
                throw new Error('Cannot merge routers with different error handlers.');
            }
            sharedErrorHandler = router.metadata.errorHandler;
        }
    }
    const procedureMeta = {};
    for (const [path, operation] of Object.entries(mergedRoutes)) {
        procedureMeta[path] = { type: operation.type };
    }
    const metadata = {
        basePath: '',
        globalMiddlewares: mergedMiddlewares,
        procedures: procedureMeta,
        registeredPaths: Object.keys(mergedRoutes),
        errorHandler: sharedErrorHandler,
    };
    return {
        procedures: mergedProcedures,
        routes: mergedRoutes,
        metadata,
        resolve(path, method) {
            const normalizedPath = (0, router_1.normalizeStackRoutePath)(path);
            const operation = mergedRoutes[normalizedPath];
            if (!operation) {
                return null;
            }
            if (operation.type !== String(method).toLowerCase()) {
                return null;
            }
            return {
                path: normalizedPath,
                operation,
            };
        },
    };
}
