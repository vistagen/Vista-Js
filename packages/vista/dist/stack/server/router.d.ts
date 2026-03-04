import type { MiddlewareFunction, ProcedureRecord, StackErrorHandler, StackRouter } from './types';
export interface CreateRouterOptions<TEnv = unknown> {
    basePath?: string;
    middlewares?: MiddlewareFunction<any, any, TEnv>[];
    errorHandler?: StackErrorHandler;
    config?: Record<string, unknown>;
}
export declare function createRouter<TProcedures extends ProcedureRecord, TCtx = {}, TEnv = unknown>(procedures: TProcedures, options?: CreateRouterOptions<TEnv>): StackRouter<TProcedures, TCtx, TEnv>;
export declare function normalizeStackRoutePath(path: string): string;
