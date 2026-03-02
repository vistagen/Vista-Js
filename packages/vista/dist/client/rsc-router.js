/**
 * Vista RSC Client Router
 *
 * Holds the current Flight response as React state and swaps it on
 * navigation by fetching a new Flight stream from /rsc{pathname}.
 *
 * Navigation is wrapped in React.startTransition so React can
 * show the old UI while the new Flight payload loads (matching
 * Next.js App Router behavior).
 */
'use client';
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
exports.RSCRouterContext = void 0;
exports.RSCRouter = RSCRouter;
exports.useRSCRouter = useRSCRouter;
const jsx_runtime_1 = require("react/jsx-runtime");
const React = __importStar(require("react"));
let _createFromFetch = null;
function getCreateFromFetch() {
    if (!_createFromFetch) {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        _createFromFetch = require('react-server-dom-webpack/client')
            .createFromFetch;
    }
    return _createFromFetch;
}
exports.RSCRouterContext = React.createContext(null);
// ---------------------------------------------------------------------------
// Flight cache — simple in-memory LRU cache keyed by pathname+search
// ---------------------------------------------------------------------------
const CACHE_MAX = 50;
const flightCache = new Map();
function cacheKey(pathname, search) {
    return pathname + search;
}
// Import callServer lazily to avoid circular dependency issues
let _callServer = null;
function getCallServer() {
    if (!_callServer) {
        try {
            // eslint-disable-next-line @typescript-eslint/no-require-imports
            _callServer = require('./server-actions').callServer;
        }
        catch {
            // Fallback no-op if server-actions module isn't bundled
            _callServer = async () => {
                throw new Error('Server Actions are not configured. Ensure react-server-dom-webpack is installed.');
            };
        }
    }
    return _callServer;
}
function fetchFlight(pathname, search) {
    const key = cacheKey(pathname, search);
    const cached = flightCache.get(key);
    if (cached)
        return cached;
    const create = getCreateFromFetch();
    const thenable = create(fetch(`/rsc${pathname}${search}`, {
        headers: { Accept: 'text/x-component' },
    }), { callServer: getCallServer() });
    // Evict oldest if over limit
    if (flightCache.size >= CACHE_MAX) {
        const firstKey = flightCache.keys().next().value;
        if (firstKey !== undefined)
            flightCache.delete(firstKey);
    }
    flightCache.set(key, thenable);
    return thenable;
}
/** Evict a specific cache entry (used on refresh) */
function evictFlight(pathname, search) {
    flightCache.delete(cacheKey(pathname, search));
}
/** Prefetch without blocking — fire-and-forget */
function prefetchFlight(pathname, search) {
    const key = cacheKey(pathname, search);
    if (flightCache.has(key))
        return;
    // Create the thenable which kicks off the fetch
    fetchFlight(pathname, search);
}
// ---------------------------------------------------------------------------
// RSCRoot — reads the current Flight thenable
// ---------------------------------------------------------------------------
function RSCRoot({ response }) {
    return React.use(response);
}
function RSCRouter({ initialResponse, initialPathname }) {
    const [flightResponse, setFlightResponse] = React.useState(initialResponse);
    const [pathname, setPathname] = React.useState(initialPathname || (typeof window !== 'undefined' ? window.location.pathname : '/'));
    const [searchParams, setSearchParams] = React.useState(() => typeof window !== 'undefined'
        ? new URLSearchParams(window.location.search)
        : new URLSearchParams());
    const [isPending, startTransition] = React.useTransition();
    // Handle browser back/forward
    React.useEffect(() => {
        const onPopState = () => {
            const newPath = window.location.pathname;
            const newSearch = window.location.search;
            startTransition(() => {
                setPathname(newPath);
                setSearchParams(new URLSearchParams(newSearch));
                setFlightResponse(fetchFlight(newPath, newSearch));
            });
        };
        window.addEventListener('popstate', onPopState);
        return () => window.removeEventListener('popstate', onPopState);
    }, []);
    // Navigation methods
    const navigate = React.useCallback((url, mode, options) => {
        const parsed = new URL(url, window.location.origin);
        const newPath = parsed.pathname;
        const newSearch = parsed.search;
        if (mode === 'push') {
            window.history.pushState({}, '', url);
        }
        else {
            window.history.replaceState({}, '', url);
        }
        startTransition(() => {
            setPathname(newPath);
            setSearchParams(new URLSearchParams(newSearch));
            setFlightResponse(fetchFlight(newPath, newSearch));
        });
        if (options?.scroll !== false) {
            window.scrollTo(0, 0);
        }
    }, []);
    const push = React.useCallback((url, options) => navigate(url, 'push', options), [navigate]);
    const replace = React.useCallback((url, options) => navigate(url, 'replace', options), [navigate]);
    const back = React.useCallback(() => window.history.back(), []);
    const forward = React.useCallback(() => window.history.forward(), []);
    const prefetch = React.useCallback((url) => {
        const parsed = new URL(url, window.location.origin);
        prefetchFlight(parsed.pathname, parsed.search);
    }, []);
    const refresh = React.useCallback(() => {
        const curPath = window.location.pathname;
        const curSearch = window.location.search;
        evictFlight(curPath, curSearch);
        startTransition(() => {
            setFlightResponse(fetchFlight(curPath, curSearch));
        });
    }, []);
    const contextValue = React.useMemo(() => ({
        pathname,
        searchParams,
        push,
        replace,
        back,
        forward,
        prefetch,
        refresh,
        isPending,
    }), [pathname, searchParams, push, replace, back, forward, prefetch, refresh, isPending]);
    return ((0, jsx_runtime_1.jsx)(exports.RSCRouterContext.Provider, { value: contextValue, children: (0, jsx_runtime_1.jsx)(RSCRoot, { response: flightResponse }) }));
}
// ---------------------------------------------------------------------------
// Hooks — unified versions that work in both RSC and legacy modes
// ---------------------------------------------------------------------------
/**
 * Returns the RSC router instance if inside an RSCRouter,
 * otherwise falls back to null.
 */
function useRSCRouter() {
    return React.useContext(exports.RSCRouterContext);
}
