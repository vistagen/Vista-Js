import React, { useState, useEffect } from 'react';
import { RouterContext } from './context';

export function RouterProvider({ children, initialPath }: { children: React.ReactNode, initialPath?: string }) {
    const [pathname, setPathname] = useState(initialPath || (typeof window !== 'undefined' ? window.location.pathname : '/'));

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const onPopState = () => {
            setPathname(window.location.pathname);
        };

        window.addEventListener('popstate', onPopState);
        return () => window.removeEventListener('popstate', onPopState);
    }, []);

    const push = (path: string) => {
        if (typeof window !== 'undefined') {
            window.history.pushState({}, '', path);
            setPathname(path);
        }
    };

    const replace = (path: string) => {
        if (typeof window !== 'undefined') {
            window.history.replaceState({}, '', path);
            setPathname(path);
        }
    };

    return (
        <RouterContext.Provider value={{ pathname, push, replace }}>
            {children}
        </RouterContext.Provider>
    );
}
