import * as React from 'react';
export declare const RouterContext: React.Context<{
    push: (url: string, options?: RouterOptions) => void;
    replace: (url: string, options?: RouterOptions) => void;
    back: () => void;
    forward: () => void;
    prefetch: (url: string) => void;
    refresh: () => void;
    params: Record<string, string>;
    pathname: string;
}>;
export interface RouterOptions {
    scroll?: boolean;
}
export interface AppRouterInstance {
    push(url: string, options?: RouterOptions): void;
    replace(url: string, options?: RouterOptions): void;
    back(): void;
    forward(): void;
    prefetch(url: string): void;
    refresh(): void;
}
interface RouteNode {
    segment: string;
    kind: 'static' | 'dynamic' | 'catch-all';
    index?: React.ComponentType<any>;
    layout?: React.ComponentType<any>;
    loading?: React.ComponentType<any>;
    error?: React.ComponentType<any>;
    notFound?: React.ComponentType<any>;
    children?: RouteNode[];
}
interface RouterProps {
    routeTree: RouteNode;
    initialPath?: string;
}
export declare function Router({ routeTree, initialPath }: RouterProps): import("react/jsx-runtime").JSX.Element;
export declare function useRouter(): AppRouterInstance;
export declare function useParams(): Record<string, string>;
export declare function usePathname(): string;
export {};
