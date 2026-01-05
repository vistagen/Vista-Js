'use client';

import React, { AnchorHTMLAttributes, useEffect, useRef, useCallback, useState } from 'react';
import { useRouter, usePathname } from './router';

/* 
 * Vista Link Component
 * Next.js-compatible Link with prefetching and enhanced navigation
 */

type Url = string | { href: string; query?: Record<string, string>; hash?: string };

export interface LinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
    href: Url;
    as?: Url;
    replace?: boolean;
    scroll?: boolean;
    shallow?: boolean;
    passHref?: boolean;
    prefetch?: boolean | 'auto' | null;
    locale?: string | false;
    legacyBehavior?: boolean;
    onNavigate?: () => void;
}

// Normalize href (string or object) to string
const formatUrl = (url: Url): string => {
    if (typeof url === 'string') return url;
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
const prefetchedUrls = new Set<string>();

// Prefetch a URL by creating a hidden link element
const prefetchUrl = (url: string) => {
    if (prefetchedUrls.has(url)) return;
    if (typeof window === 'undefined') return;

    // Don't prefetch external URLs
    if (url.startsWith('http://') || url.startsWith('https://')) {
        if (!url.startsWith(window.location.origin)) return;
    }

    prefetchedUrls.add(url);

    // Create prefetch link
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = url;
    link.as = 'document';
    document.head.appendChild(link);
};

export const Link = React.forwardRef<HTMLAnchorElement, LinkProps>(({
    href,
    as,
    replace,
    scroll = true,
    shallow,
    passHref,
    prefetch = true,
    legacyBehavior,
    children,
    onClick,
    onMouseEnter,
    onNavigate,
    ...props
}, ref) => {
    const router = useRouter();
    const pathname = usePathname();
    const linkRef = useRef<HTMLAnchorElement | null>(null);
    const targetPath = formatUrl(as || href);
    const [isActive, setIsActive] = useState(false);

    // Combine refs
    const setRefs = useCallback((node: HTMLAnchorElement | null) => {
        linkRef.current = node;
        if (typeof ref === 'function') {
            ref(node);
        } else if (ref) {
            (ref as React.MutableRefObject<HTMLAnchorElement | null>).current = node;
        }
    }, [ref]);

    // Check if link is active (current route)
    useEffect(() => {
        if (typeof window !== 'undefined') {
            setIsActive(pathname === targetPath);
        }
    }, [targetPath, pathname]);

    // Prefetch on viewport intersection
    useEffect(() => {
        if (!prefetch || prefetch === null) return;
        if (typeof window === 'undefined') return;

        const element = linkRef.current;
        if (!element) return;

        // Only prefetch visible links
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        prefetchUrl(targetPath);
                        observer.disconnect();
                    }
                });
            },
            {
                rootMargin: '200px',
                threshold: 0,
            }
        );

        observer.observe(element);

        return () => observer.disconnect();
    }, [prefetch, targetPath]);

    // Prefetch on hover
    const handleMouseEnter = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
        if (onMouseEnter) onMouseEnter(e);
        if (prefetch !== false && prefetch !== null) {
            prefetchUrl(targetPath);
        }
    }, [onMouseEnter, prefetch, targetPath]);

    // Handle navigation
    const handleClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
        if (onClick) onClick(e);

        // Standard link behavior checks
        if (e.defaultPrevented) return;
        if (e.button !== 0) return; // ignore right clicks
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return; // ignore open in new tab
        if (!href) return;

        // Check for external links
        if (targetPath.startsWith('http://') || targetPath.startsWith('https://')) {
            if (!targetPath.startsWith(window.location.origin)) {
                return; // Let browser handle external links
            }
        }

        e.preventDefault();

        // Call onNavigate callback
        if (onNavigate) onNavigate();

        // Navigate
        if (replace) {
            router.replace(targetPath, { scroll });
        } else {
            router.push(targetPath, { scroll });
        }
    }, [onClick, href, targetPath, replace, scroll, router, onNavigate]);

    // Data attributes for styling active links
    const dataProps = {
        'data-active': isActive ? 'true' : undefined,
    };

    return (
        <a
            href={targetPath}
            onClick={handleClick}
            onMouseEnter={handleMouseEnter}
            ref={setRefs}
            {...dataProps}
            {...props}
        >
            {children}
        </a>
    );
});

Link.displayName = 'Link';

/**
 * Hook to check link navigation status
 */
export const useLinkStatus = () => {
    // In a real implementation, this would track navigation state
    const [pending, setPending] = useState(false);
    return { pending };
};

/**
 * Hook to check if a path is active
 */
export const useIsActive = (path: string): boolean => {
    const pathname = usePathname();
    return pathname === path;
};

export default Link;
