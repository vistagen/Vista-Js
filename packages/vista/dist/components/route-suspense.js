"use strict";
/**
 * Vista Route Suspense Wrapper
 *
 * Wraps route segments in a React.Suspense boundary using the
 * user's `loading.tsx` as the fallback. Each layout segment gets
 * its own Suspense boundary for granular streaming (matching
 * Next.js App Router behavior).
 */
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
exports.RouteSuspense = RouteSuspense;
exports.DefaultLoadingSkeleton = DefaultLoadingSkeleton;
const react_1 = __importStar(require("react"));
/**
 * Wraps children in a <Suspense> boundary.
 *
 * If a loadingComponent is provided (from the user's loading.tsx),
 * it becomes the Suspense fallback. Otherwise uses the fallback prop,
 * or null (no loading indicator).
 */
function RouteSuspense({ loadingComponent: LoadingComponent, fallback, children, }) {
    let suspenseFallback = null;
    if (LoadingComponent) {
        suspenseFallback = react_1.default.createElement(LoadingComponent);
    }
    else if (fallback !== undefined) {
        suspenseFallback = fallback;
    }
    return react_1.default.createElement(react_1.Suspense, { fallback: suspenseFallback }, children);
}
/**
 * Default loading component — shown when no loading.tsx is provided
 * but a Suspense boundary is still needed (e.g., for async server components).
 */
function DefaultLoadingSkeleton() {
    return react_1.default.createElement('div', {
        role: 'status',
        'aria-label': 'Loading',
        style: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
            opacity: 0.5,
        },
    }, react_1.default.createElement('div', {
        style: {
            width: '1.5rem',
            height: '1.5rem',
            border: '2px solid currentColor',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            animation: 'vista-spin 0.6s linear infinite',
        },
    }), react_1.default.createElement('style', null, '@keyframes vista-spin { to { transform: rotate(360deg); } }'));
}
