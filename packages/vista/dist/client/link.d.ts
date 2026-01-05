import React, { AnchorHTMLAttributes } from 'react';
type Url = string | {
    href: string;
    query?: Record<string, string>;
    hash?: string;
};
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
export declare const Link: React.ForwardRefExoticComponent<LinkProps & React.RefAttributes<HTMLAnchorElement>>;
/**
 * Hook to check link navigation status
 */
export declare const useLinkStatus: () => {
    pending: boolean;
};
/**
 * Hook to check if a path is active
 */
export declare const useIsActive: (path: string) => boolean;
export default Link;
