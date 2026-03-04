import { isOperation } from './procedure';
import { normalizeStackRoutePath } from './router';
import type {
  FlatRouteMap,
  OperationType,
  ProcedureRecord,
  RouterMetadata,
  StackRouter,
} from './types';

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function mergeProcedureRecords(
  target: ProcedureRecord,
  source: ProcedureRecord,
  currentPath = ''
): ProcedureRecord {
  for (const [key, sourceNode] of Object.entries(source)) {
    const scopedPath = [currentPath, key].filter(Boolean).join('/');
    const targetNode = target[key];

    if (targetNode === undefined) {
      target[key] = sourceNode;
      continue;
    }

    if (isOperation(targetNode) && isOperation(sourceNode)) {
      throw new Error(`Duplicate procedure found while merging routers: "${scopedPath}"`);
    }

    if (isObjectRecord(targetNode) && isObjectRecord(sourceNode)) {
      target[key] = mergeProcedureRecords(
        targetNode as ProcedureRecord,
        sourceNode as ProcedureRecord,
        scopedPath
      );
      continue;
    }

    throw new Error(`Incompatible procedure nodes while merging routers: "${scopedPath}"`);
  }

  return target;
}

export function mergeRouters(
  ...routers: Array<StackRouter<ProcedureRecord, any, any>>
): StackRouter<ProcedureRecord, any, any> {
  const mergedProcedures: ProcedureRecord = {};
  const mergedRoutes: Record<string, OperationType<any, any, any, any>> = {};
  const mergedMiddlewares: unknown[] = [];
  let sharedErrorHandler: RouterMetadata['errorHandler'];

  for (const router of routers) {
    mergeProcedureRecords(mergedProcedures, router.procedures as ProcedureRecord);

    for (const [path, operation] of Object.entries(
      router.routes as Record<string, OperationType<any, any, any, any>>
    )) {
      const normalizedPath = normalizeStackRoutePath(path);
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

  const procedureMeta: RouterMetadata['procedures'] = {};
  for (const [path, operation] of Object.entries(mergedRoutes)) {
    procedureMeta[path] = { type: operation.type };
  }

  const metadata: RouterMetadata = {
    basePath: '',
    globalMiddlewares: mergedMiddlewares,
    procedures: procedureMeta,
    registeredPaths: Object.keys(mergedRoutes),
    errorHandler: sharedErrorHandler,
  };

  return {
    procedures: mergedProcedures,
    routes: mergedRoutes as FlatRouteMap<ProcedureRecord>,
    metadata,
    resolve(path: string, method: string) {
      const normalizedPath = normalizeStackRoutePath(path);
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
