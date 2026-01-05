/**
 * Vista Dynamic Import
 *
 * Dynamic component loading with SSR support.
 * Similar to Next.js dynamic.
 */
'client load';
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = dynamic;
const jsx_runtime_1 = require("react/jsx-runtime");
const React = __importStar(require("react"));
/**
 * Dynamically import a component with loading state
 */
function dynamic(importFn, options = {}) {
    const { loading: LoadingComponent, ssr = true } = options;
    // Use React.lazy for dynamic import
    const LazyComponent = React.lazy(importFn);
    // Wrapper component
    const DynamicComponent = (props) => {
        // Handle SSR disabled
        const [isClient, setIsClient] = React.useState(false);
        React.useEffect(() => {
            setIsClient(true);
        }, []);
        if (!ssr && !isClient) {
            return LoadingComponent ? (0, jsx_runtime_1.jsx)(jsx_runtime_1.Fragment, { children: LoadingComponent() }) : null;
        }
        return ((0, jsx_runtime_1.jsx)(React.Suspense, { fallback: LoadingComponent ? LoadingComponent() : null, children: (0, jsx_runtime_1.jsx)(LazyComponent, { ...props }) }));
    };
    // Preserve display name for debugging
    DynamicComponent.displayName = `Dynamic(${importFn.name || 'Component'})`;
    return DynamicComponent;
}
