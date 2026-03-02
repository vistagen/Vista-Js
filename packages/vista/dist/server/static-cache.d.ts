/**
 * Vista Static Page Cache & ISR (Incremental Static Regeneration)
 *
 * Manages pre-rendered HTML and Flight payload caching with support for:
 * - Build-time static generation (SSG)
 * - Runtime revalidation with stale-while-revalidate (ISR)
 * - On-demand revalidation API
 * - Cache invalidation for updated pages
 */
import type { RouteEntry } from '../build/rsc/server-manifest';
export interface CachedPage {
    /** Pre-rendered HTML string */
    html: string;
    /** Flight payload (RSC serialized stream data) */
    flightData?: string;
    /** When this page was generated (epoch ms) */
    generatedAt: number;
    /** Revalidate interval in seconds, or 0 for permanent static */
    revalidate: number;
    /** Route pattern that generated this page */
    routePattern: string;
    /** Route params used to generate this page */
    params?: Record<string, string | string[]>;
}
export interface PrerenderManifest {
    /** Map of URL path to prerender info */
    routes: Record<string, PrerenderRoute>;
    /** Dynamic routes with generateStaticParams */
    dynamicRoutes: Record<string, DynamicPrerenderRoute>;
    /** Routes that returned 404 during prerender */
    notFoundRoutes: string[];
}
export interface PrerenderRoute {
    /** When this page was generated (epoch ms) */
    initialRevalidateSeconds: number | false;
    /** Source file path */
    srcRoute: string;
    /** Data route for Flight payload */
    dataRoute: string;
}
export interface DynamicPrerenderRoute {
    /** Route pattern with :param placeholders */
    routePattern: string;
    /** Data route pattern */
    dataRoutePattern: string;
    /** Fallback: 'blocking' | false | string (HTML) */
    fallback: 'blocking' | false | string;
}
/**
 * Get a cached page for the given URL path.
 * Returns the page if found and not expired.
 * For ISR pages, returns stale page and triggers background revalidation.
 */
export declare function getCachedPage(urlPath: string): {
    page: CachedPage | null;
    stale: boolean;
};
/**
 * Store a pre-rendered page in the cache.
 */
export declare function setCachedPage(urlPath: string, page: CachedPage): void;
/**
 * Remove a cached page (for on-demand revalidation).
 */
export declare function invalidateCachedPage(urlPath: string): boolean;
/**
 * Check if a path is currently being revalidated.
 */
export declare function isRevalidating(urlPath: string): boolean;
/**
 * Mark a path as currently being revalidated.
 */
export declare function markRevalidating(urlPath: string): void;
/**
 * Clear the revalidating flag for a path.
 */
export declare function clearRevalidating(urlPath: string): void;
/**
 * Load pre-rendered pages from disk into memory cache.
 */
export declare function loadStaticPagesFromDisk(vistaDirRoot: string): number;
/**
 * Write a pre-rendered page to disk.
 */
export declare function writeStaticPageToDisk(vistaDirRoot: string, urlPath: string, page: CachedPage): void;
/**
 * Generate the prerender manifest from route entries.
 */
export declare function generatePrerenderManifest(routes: RouteEntry[], cachedPages?: Map<string, CachedPage>): PrerenderManifest;
/**
 * Get cache statistics.
 */
export declare function getCacheStats(): {
    totalPages: number;
    stalePages: number;
    freshPages: number;
    revalidating: number;
};
