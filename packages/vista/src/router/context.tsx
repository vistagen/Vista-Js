import { createContext, useContext } from 'react';

export type RouterContextType = {
    pathname: string;
    push: (path: string) => void;
    replace: (path: string) => void;
};

export const RouterContext = createContext<RouterContextType>({
    pathname: '/',
    push: () => { },
    replace: () => { },
});

export const useRouter = () => useContext(RouterContext);
export const useRouterContext = () => useContext(RouterContext);
