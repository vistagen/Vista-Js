/**
 * Vista Route Suspense Wrapper
 *
 * Wraps route segments in a React.Suspense boundary using the
 * user's `loading.tsx` as the fallback. Each layout segment gets
 * its own Suspense boundary for granular streaming (matching
 * Next.js App Router behavior).
 */
import React from 'react';
export interface RouteSuspenseProps {
    /** The user's loading.tsx component (default export) */
    loadingComponent?: React.ComponentType<Record<string, never>>;
    /** Static fallback element when no loading component is provided */
    fallback?: React.ReactNode;
    /** Children to render (the route segment) */
    children: React.ReactNode;
}
/**
 * Wraps children in a <Suspense> boundary.
 *
 * If a loadingComponent is provided (from the user's loading.tsx),
 * it becomes the Suspense fallback. Otherwise uses the fallback prop,
 * or null (no loading indicator).
 */
export declare function RouteSuspense({ loadingComponent: LoadingComponent, fallback, children, }: RouteSuspenseProps): React.ReactElement;
/**
 * Default loading component — shown when no loading.tsx is provided
 * but a Suspense boundary is still needed (e.g., for async server components).
 */
export declare function DefaultLoadingSkeleton(): React.ReactElement;
