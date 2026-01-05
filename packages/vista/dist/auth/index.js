"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useAuth = void 0;
exports.AuthProvider = AuthProvider;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const AuthContext = (0, react_1.createContext)({ user: null, login: () => { } });
function AuthProvider({ children }) {
    const [user, setUser] = (0, react_1.useState)(null);
    const login = () => {
        setUser({ name: "Vista User" });
    };
    return ((0, jsx_runtime_1.jsx)(AuthContext.Provider, { value: { user, login }, children: children }));
}
const useAuth = () => (0, react_1.useContext)(AuthContext);
exports.useAuth = useAuth;
