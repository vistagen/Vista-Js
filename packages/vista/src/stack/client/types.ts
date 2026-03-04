import type {
  FlatRouteMap,
  OperationType,
  ProcedureRecord,
  StackRouter,
  StackSerializationMode,
} from '../server/types';

type NormalizeRoutePathKey<TPath extends string> = TPath extends `/${string}` ? TPath : `/${TPath}`;

export type OperationRouteMap<TValue> = {
  [TPath in Extract<keyof TValue, string> as TValue[TPath] extends OperationType<any, any, any, any>
    ? NormalizeRoutePathKey<TPath>
    : never]: Extract<TValue[TPath], OperationType<any, any, any, any>>;
};

export type AppRouterLike = StackRouter<ProcedureRecord, any, any> | { routes: unknown } | object;

export type ClientRoutes<TAppRouter> = TAppRouter extends StackRouter<infer TProcedures, any, any>
  ? FlatRouteMap<TProcedures>
  : TAppRouter extends { routes: infer TRoutes }
    ? OperationRouteMap<TRoutes>
    : OperationRouteMap<TAppRouter>;

type NormalizedClientRoutes<TRoutes> = OperationRouteMap<TRoutes>;

export type RoutePath<TRoutes> = Extract<keyof NormalizedClientRoutes<TRoutes>, string>;

export type GetRoutePath<TRoutes> = {
  [TPath in RoutePath<TRoutes>]: NormalizedClientRoutes<TRoutes>[TPath] extends { type: 'get' }
    ? TPath
    : never;
}[RoutePath<TRoutes>];

export type PostRoutePath<TRoutes> = {
  [TPath in RoutePath<TRoutes>]: NormalizedClientRoutes<TRoutes>[TPath] extends { type: 'post' }
    ? TPath
    : never;
}[RoutePath<TRoutes>];

export type RouteInput<TRoutes, TPath extends RoutePath<TRoutes>> =
  NormalizedClientRoutes<TRoutes>[TPath] extends OperationType<
  infer TInput,
  any,
  any,
  any
>
    ? TInput
    : never;

export type RouteOutput<TRoutes, TPath extends RoutePath<TRoutes>> =
  NormalizedClientRoutes<TRoutes>[TPath] extends OperationType<
  any,
  infer TOutput,
  any,
  any
>
    ? TOutput
    : never;

export type OptionalInputArg<TInput> = [TInput] extends [void]
  ? [input?: undefined]
  : [input: TInput];

export type VistaFetch = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

export interface CreateVistaClientOptions {
  baseUrl?: string;
  fetch?: VistaFetch;
  serialization?: StackSerializationMode;
  headers?: HeadersInit | (() => HeadersInit | Promise<HeadersInit>);
}

export interface VistaClient<TRoutes> {
  $url<TPath extends RoutePath<TRoutes>>(
    path: TPath,
    ...args: OptionalInputArg<RouteInput<TRoutes, TPath>>
  ): string;
  $get<TPath extends GetRoutePath<TRoutes>>(
    path: TPath,
    ...args: OptionalInputArg<RouteInput<TRoutes, TPath>>
  ): Promise<RouteOutput<TRoutes, TPath>>;
  $post<TPath extends PostRoutePath<TRoutes>>(
    path: TPath,
    ...args: OptionalInputArg<RouteInput<TRoutes, TPath>>
  ): Promise<RouteOutput<TRoutes, TPath>>;
}
