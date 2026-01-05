/**
 * Vista Head Component
 *
 * Allows injection of elements into the document <head>.
 * Similar to Next.js Head component.
 */
import * as React from 'react';
interface HeadProps {
    children: React.ReactNode;
}
/**
 * Head component - injects children into document head
 */
export declare function Head({ children }: HeadProps): null;
/**
 * Default metadata configuration
 */
export interface Metadata {
    title?: string | {
        default: string;
        template?: string;
    };
    description?: string;
    keywords?: string | string[];
    authors?: {
        name: string;
        url?: string;
    }[];
    creator?: string;
    publisher?: string;
    robots?: string | {
        index?: boolean;
        follow?: boolean;
    };
    icons?: {
        icon?: string;
        apple?: string;
    };
    openGraph?: {
        title?: string;
        description?: string;
        url?: string;
        siteName?: string;
        images?: {
            url: string;
            width?: number;
            height?: number;
            alt?: string;
        }[];
        locale?: string;
        type?: string;
    };
    twitter?: {
        card?: 'summary' | 'summary_large_image' | 'app' | 'player';
        site?: string;
        creator?: string;
        title?: string;
        description?: string;
        images?: string[];
    };
    viewport?: string | {
        width?: string;
        initialScale?: number;
    };
    themeColor?: string | {
        media?: string;
        color: string;
    }[];
    manifest?: string;
    alternates?: {
        canonical?: string;
        languages?: Record<string, string>;
    };
}
/**
 * Generate head elements from metadata object
 */
export declare function generateMetadataHead(metadata: Metadata): React.ReactElement;
export default Head;
