import type { AppRouterLike, ClientRoutes, CreateVistaClientOptions, VistaClient } from './types';
export declare function createVistaClient<TAppRouter extends AppRouterLike, TRoutes = ClientRoutes<TAppRouter>>(options?: CreateVistaClientOptions): VistaClient<TRoutes>;
