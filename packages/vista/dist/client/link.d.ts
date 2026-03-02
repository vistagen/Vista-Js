import React, { AnchorHTMLAttributes } from 'react';
type Url = string | {
    href: string;
    query?: Record<string, string>;
    hash?: string;
};
export interface LinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
    /** Destination URL (string or URL object) */
    href: Url;
    /** Resolved URL override (like Next.js `as`) */
    as?: Url;
    /** Use history.replaceState instead of pushState */
    replace?: boolean;
    /** Scroll to top after navigation (default: true) */
    scroll?: boolean;
    /** Client-side only transition (no SSR refetch) */
    shallow?: boolean;
    /** Force href on child element */
    passHref?: boolean;
    /** Prefetch strategy: true = viewport+hover, 'auto' = hover-only, false/null = off */
    prefetch?: boolean | 'auto' | null;
    /** Locale for internationalised routing */
    locale?: string | false;
    /** Render as legacy <a> with child element */
    legacyBehavior?: boolean;
    /** Callback fired when navigation starts */
    onNavigate?: () => void;
}
export declare const Link: React.ForwardRefExoticComponent<LinkProps & React.RefAttributes<HTMLAnchorElement>>;
/**
 * Hook to check link navigation status.
 * Returns `{ pending: true }` while a Flight navigation is in progress.
 */
export declare const useLinkStatus: () => {
    pending: boolean;
};
/**
 * Hook to check if a path is active
 */
export declare const useIsActive: (path: string) => boolean;
export default Link;
