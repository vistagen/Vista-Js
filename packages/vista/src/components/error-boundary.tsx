/**
 * Vista Route Error Boundary
 *
 * React class component that catches errors thrown by route segments.
 * Each layout segment gets its own ErrorBoundary so errors are isolated
 * to the nearest boundary (matching Next.js App Router behavior).
 *
 * The user's `error.tsx` receives:
 *   - error: Error — the thrown error
 *   - reset: () => void — callback to re-render the boundary
 */

'use client';

import React from 'react';

export interface ErrorBoundaryProps {
  /** The user's error.tsx component (default export) */
  fallbackComponent?: React.ComponentType<{ error: Error; reset: () => void }>;
  /** Static fallback element when no error component is provided */
  fallback?: React.ReactNode;
  /** Children to render (the route segment) */
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class RouteErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('[vista:error-boundary] Caught error:', error, errorInfo);
  }

  reset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): React.ReactNode {
    if (this.state.hasError && this.state.error) {
      const { fallbackComponent: FallbackComponent, fallback } = this.props;

      if (FallbackComponent) {
        return React.createElement(FallbackComponent, {
          error: this.state.error,
          reset: this.reset,
        });
      }

      if (fallback !== undefined) {
        return fallback;
      }

      // Default error UI
      return React.createElement(
        'div',
        {
          style: {
            padding: '2rem',
            fontFamily: 'system-ui, sans-serif',
            color: '#dc2626',
          },
        },
        React.createElement('h2', null, 'Something went wrong'),
        React.createElement('p', { style: { color: '#666' } }, this.state.error.message),
        React.createElement(
          'button',
          {
            onClick: this.reset,
            style: {
              marginTop: '1rem',
              padding: '0.5rem 1rem',
              border: '1px solid #dc2626',
              borderRadius: '0.375rem',
              background: 'transparent',
              color: '#dc2626',
              cursor: 'pointer',
            },
          },
          'Try again'
        )
      );
    }

    return this.props.children;
  }
}

/**
 * Default error component used when a route has no error.tsx
 */
export function DefaultErrorFallback({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}): React.ReactElement {
  return React.createElement(
    'div',
    {
      style: {
        padding: '2rem',
        fontFamily: 'system-ui, sans-serif',
      },
    },
    React.createElement('h2', { style: { color: '#dc2626' } }, 'Application Error'),
    React.createElement('p', null, error.message),
    React.createElement(
      'button',
      { onClick: reset, style: { marginTop: '0.5rem', cursor: 'pointer' } },
      'Retry'
    )
  );
}
