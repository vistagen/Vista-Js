/**
 * Vista Route Suspense Wrapper
 *
 * Wraps route segments in a React.Suspense boundary using the
 * user's `loading.tsx` as the fallback. Each layout segment gets
 * its own Suspense boundary for granular streaming (matching
 * Next.js App Router behavior).
 */

import React, { Suspense } from 'react';

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
export function RouteSuspense({
  loadingComponent: LoadingComponent,
  fallback,
  children,
}: RouteSuspenseProps): React.ReactElement {
  let suspenseFallback: React.ReactNode = null;

  if (LoadingComponent) {
    suspenseFallback = React.createElement(LoadingComponent);
  } else if (fallback !== undefined) {
    suspenseFallback = fallback;
  }

  return React.createElement(
    Suspense,
    { fallback: suspenseFallback },
    children
  ) as React.ReactElement;
}

/**
 * Default loading component — shown when no loading.tsx is provided
 * but a Suspense boundary is still needed (e.g., for async server components).
 */
export function DefaultLoadingSkeleton(): React.ReactElement {
  return React.createElement(
    'div',
    {
      role: 'status',
      'aria-label': 'Loading',
      style: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        opacity: 0.5,
      },
    },
    React.createElement(
      'div',
      {
        style: {
          width: '1.5rem',
          height: '1.5rem',
          border: '2px solid currentColor',
          borderTopColor: 'transparent',
          borderRadius: '50%',
          animation: 'vista-spin 0.6s linear infinite',
        },
      }
    ),
    React.createElement(
      'style',
      null,
      '@keyframes vista-spin { to { transform: rotate(360deg); } }'
    )
  );
}
