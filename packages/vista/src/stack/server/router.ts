import { isOperation } from './procedure';
import type {
  FlatRouteMap,
  MiddlewareFunction,
  OperationType,
  ProcedureRecord,
  RouterMetadata,
  StackErrorHandler,
  StackRouter,
} from './types';

export interface CreateRouterOptions<TEnv = unknown> {
  basePath?: string;
  middlewares?: MiddlewareFunction<any, any, TEnv>[];
  errorHandler?: StackErrorHandler;
  config?: Record<string, unknown>;
}

function normalizePathSegment(path: string): string {
  return path
    .split('/')
    .map((segment) => segment.trim())
    .filter(Boolean)
    .join('/');
}

function normalizeBasePath(basePath = ''): string {
  const normalized = normalizePathSegment(basePath);
  return normalized ? `/${normalized}` : '';
}

function normalizeRoutePath(basePath: string, relativePath: string): string {
  const normalizedRelativePath = normalizePathSegment(relativePath);
  const normalizedBasePath = normalizeBasePath(basePath);
  const combined = normalizePathSegment(
    [normalizedBasePath, normalizedRelativePath].filter(Boolean).join('/')
  );
  return combined ? `/${combined}` : '/';
}

function flattenProcedures<TEnv>(
  procedures: ProcedureRecord,
  basePath: string,
  currentPath: string,
  routes: Record<string, OperationType<any, any, any, TEnv>>
) {
  for (const [segment, node] of Object.entries(procedures)) {
    const nextPath = [currentPath, segment].filter(Boolean).join('/');

    if (isOperation(node)) {
      const routePath = normalizeRoutePath(basePath, nextPath);
      if (routes[routePath]) {
        throw new Error(`Duplicate stack route detected: "${routePath}"`);
      }
      routes[routePath] = node;
      continue;
    }

    if (node && typeof node === 'object' && !Array.isArray(node)) {
      flattenProcedures(node as ProcedureRecord, basePath, nextPath, routes);
      continue;
    }

    throw new Error(`Invalid procedure node at "${nextPath || '/'}"`);
  }
}

export function createRouter<TProcedures extends ProcedureRecord, TCtx = {}, TEnv = unknown>(
  procedures: TProcedures,
  options: CreateRouterOptions<TEnv> = {}
): StackRouter<TProcedures, TCtx, TEnv> {
  const basePath = options.basePath ?? '';
  const globalMiddlewares = [...(options.middlewares ?? [])];

  const routes: Record<string, OperationType<any, any, any, TEnv>> = {};
  flattenProcedures(procedures, basePath, '', routes);

  const procedureMeta: RouterMetadata['procedures'] = {};
  for (const [path, operation] of Object.entries(routes)) {
    procedureMeta[path] = { type: operation.type };
  }

  const metadata: RouterMetadata = {
    basePath: normalizeBasePath(basePath),
    globalMiddlewares,
    procedures: procedureMeta,
    registeredPaths: Object.keys(routes),
    errorHandler: options.errorHandler,
    config: options.config,
  };

  return {
    procedures,
    routes: routes as FlatRouteMap<TProcedures>,
    metadata,
    resolve(path: string, method: string) {
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

export function normalizeStackRoutePath(path: string): string {
  return normalizeRoutePath('', path);
}
