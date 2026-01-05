export type RouterContextType = {
    pathname: string;
    push: (path: string) => void;
    replace: (path: string) => void;
};
export declare const RouterContext: import("react").Context<RouterContextType>;
export declare const useRouter: () => RouterContextType;
export declare const useRouterContext: () => RouterContextType;
