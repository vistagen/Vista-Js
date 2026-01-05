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
exports.useIsActive = exports.useLinkStatus = exports.Link = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = __importStar(require("react"));
const router_1 = require("./router");
// Normalize href (string or object) to string
const formatUrl = (url) => {
    if (typeof url === 'string')
        return url;
    if (typeof url === 'object' && url !== null) {
        let result = url.href || '';
        if (url.query) {
            const params = new URLSearchParams(url.query).toString();
            result += (result.includes('?') ? '&' : '?') + params;
        }
        if (url.hash) {
            result += url.hash.startsWith('#') ? url.hash : `#${url.hash}`;
        }
        return result;
    }
    return '';
};
// Set of URLs that have been prefetched
const prefetchedUrls = new Set();
// Prefetch a URL by creating a hidden link element
const prefetchUrl = (url) => {
    if (prefetchedUrls.has(url))
        return;
    if (typeof window === 'undefined')
        return;
    // Don't prefetch external URLs
    if (url.startsWith('http://') || url.startsWith('https://')) {
        if (!url.startsWith(window.location.origin))
            return;
    }
    prefetchedUrls.add(url);
    // Create prefetch link
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = url;
    link.as = 'document';
    document.head.appendChild(link);
};
exports.Link = react_1.default.forwardRef(({ href, as, replace, scroll = true, shallow, passHref, prefetch = true, legacyBehavior, children, onClick, onMouseEnter, onNavigate, ...props }, ref) => {
    const router = (0, router_1.useRouter)();
    const pathname = (0, router_1.usePathname)();
    const linkRef = (0, react_1.useRef)(null);
    const targetPath = formatUrl(as || href);
    const [isActive, setIsActive] = (0, react_1.useState)(false);
    // Combine refs
    const setRefs = (0, react_1.useCallback)((node) => {
        linkRef.current = node;
        if (typeof ref === 'function') {
            ref(node);
        }
        else if (ref) {
            ref.current = node;
        }
    }, [ref]);
    // Check if link is active (current route)
    (0, react_1.useEffect)(() => {
        if (typeof window !== 'undefined') {
            setIsActive(pathname === targetPath);
        }
    }, [targetPath, pathname]);
    // Prefetch on viewport intersection
    (0, react_1.useEffect)(() => {
        if (!prefetch || prefetch === null)
            return;
        if (typeof window === 'undefined')
            return;
        const element = linkRef.current;
        if (!element)
            return;
        // Only prefetch visible links
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    prefetchUrl(targetPath);
                    observer.disconnect();
                }
            });
        }, {
            rootMargin: '200px',
            threshold: 0,
        });
        observer.observe(element);
        return () => observer.disconnect();
    }, [prefetch, targetPath]);
    // Prefetch on hover
    const handleMouseEnter = (0, react_1.useCallback)((e) => {
        if (onMouseEnter)
            onMouseEnter(e);
        if (prefetch !== false && prefetch !== null) {
            prefetchUrl(targetPath);
        }
    }, [onMouseEnter, prefetch, targetPath]);
    // Handle navigation
    const handleClick = (0, react_1.useCallback)((e) => {
        if (onClick)
            onClick(e);
        // Standard link behavior checks
        if (e.defaultPrevented)
            return;
        if (e.button !== 0)
            return; // ignore right clicks
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey)
            return; // ignore open in new tab
        if (!href)
            return;
        // Check for external links
        if (targetPath.startsWith('http://') || targetPath.startsWith('https://')) {
            if (!targetPath.startsWith(window.location.origin)) {
                return; // Let browser handle external links
            }
        }
        e.preventDefault();
        // Call onNavigate callback
        if (onNavigate)
            onNavigate();
        // Navigate
        if (replace) {
            router.replace(targetPath, { scroll });
        }
        else {
            router.push(targetPath, { scroll });
        }
    }, [onClick, href, targetPath, replace, scroll, router, onNavigate]);
    // Data attributes for styling active links
    const dataProps = {
        'data-active': isActive ? 'true' : undefined,
    };
    return ((0, jsx_runtime_1.jsx)("a", { href: targetPath, onClick: handleClick, onMouseEnter: handleMouseEnter, ref: setRefs, ...dataProps, ...props, children: children }));
});
exports.Link.displayName = 'Link';
/**
 * Hook to check link navigation status
 */
const useLinkStatus = () => {
    // In a real implementation, this would track navigation state
    const [pending, setPending] = (0, react_1.useState)(false);
    return { pending };
};
exports.useLinkStatus = useLinkStatus;
/**
 * Hook to check if a path is active
 */
const useIsActive = (path) => {
    const pathname = (0, router_1.usePathname)();
    return pathname === path;
};
exports.useIsActive = useIsActive;
exports.default = exports.Link;
