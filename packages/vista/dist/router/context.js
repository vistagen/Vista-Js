"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useRouterContext = exports.useRouter = exports.RouterContext = void 0;
const react_1 = require("react");
exports.RouterContext = (0, react_1.createContext)({
    pathname: '/',
    push: () => { },
    replace: () => { },
});
const useRouter = () => (0, react_1.useContext)(exports.RouterContext);
exports.useRouter = useRouter;
const useRouterContext = () => (0, react_1.useContext)(exports.RouterContext);
exports.useRouterContext = useRouterContext;
