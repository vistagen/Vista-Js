"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RouterProvider = RouterProvider;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const context_1 = require("./context");
function RouterProvider({ children, initialPath }) {
    const [pathname, setPathname] = (0, react_1.useState)(initialPath || (typeof window !== 'undefined' ? window.location.pathname : '/'));
    (0, react_1.useEffect)(() => {
        if (typeof window === 'undefined')
            return;
        const onPopState = () => {
            setPathname(window.location.pathname);
        };
        window.addEventListener('popstate', onPopState);
        return () => window.removeEventListener('popstate', onPopState);
    }, []);
    const push = (path) => {
        if (typeof window !== 'undefined') {
            window.history.pushState({}, '', path);
            setPathname(path);
        }
    };
    const replace = (path) => {
        if (typeof window !== 'undefined') {
            window.history.replaceState({}, '', path);
            setPathname(path);
        }
    };
    return ((0, jsx_runtime_1.jsx)(context_1.RouterContext.Provider, { value: { pathname, push, replace }, children: children }));
}
