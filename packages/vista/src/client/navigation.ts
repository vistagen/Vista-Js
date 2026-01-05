/**
 * Vista Navigation Hooks
 * 
 * Provides hooks for reading route information.
 * Similar to Next.js navigation hooks.
 */

'client load';

import * as React from 'react';
import { useRouterContext } from '../router/context';

/**
 * Returns the current pathname
 */
export function usePathname(): string {
    const [pathname, setPathname] = React.useState(() => 
        typeof window !== 'undefined' ? window.location.pathname : '/'
    );
    
    React.useEffect(() => {
        const handlePopState = () => {
            setPathname(window.location.pathname);
        };
        
        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, []);
    
    return pathname;
}

/**
 * Returns the current search params
 */
export function useSearchParams(): URLSearchParams {
    const [searchParams, setSearchParams] = React.useState(() =>
        typeof window !== 'undefined' 
            ? new URLSearchParams(window.location.search)
            : new URLSearchParams()
    );
    
    React.useEffect(() => {
        const handlePopState = () => {
            setSearchParams(new URLSearchParams(window.location.search));
        };
        
        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, []);
    
    return searchParams;
}

/**
 * Returns dynamic route parameters
 * For route /users/[id]/posts/[postId], returns { id: '123', postId: '456' }
 */
export function useParams<T extends Record<string, string> = Record<string, string>>(): T {
    const context = useRouterContext();
    const pathname = usePathname();
    
    // Basic param extraction (simplified)
    // In a full implementation, this would match against route patterns
    const params: Record<string, string> = {};
    
    // Extract dynamic segments from URL
    const pathParts = pathname.split('/').filter(Boolean);
    pathParts.forEach((part, index) => {
        if (part.match(/^\d+$/)) {
            params[`param${index}`] = part;
        }
    });
    
    return params as T;
}

/**
 * Returns the currently active segment of the layout
 */
export function useSelectedLayoutSegment(): string | null {
    const pathname = usePathname();
    const segments = pathname.split('/').filter(Boolean);
    return segments[segments.length - 1] || null;
}

/**
 * Returns all active segments of the layout
 */
export function useSelectedLayoutSegments(): string[] {
    const pathname = usePathname();
    return pathname.split('/').filter(Boolean);
}

export { useRouter } from './router';
