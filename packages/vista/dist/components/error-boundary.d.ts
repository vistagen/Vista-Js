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
import React from 'react';
export interface ErrorBoundaryProps {
    /** The user's error.tsx component (default export) */
    fallbackComponent?: React.ComponentType<{
        error: Error;
        reset: () => void;
    }>;
    /** Static fallback element when no error component is provided */
    fallback?: React.ReactNode;
    /** Children to render (the route segment) */
    children: React.ReactNode;
}
interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}
export declare class RouteErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps);
    static getDerivedStateFromError(error: Error): ErrorBoundaryState;
    componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void;
    reset: () => void;
    render(): React.ReactNode;
}
/**
 * Default error component used when a route has no error.tsx
 */
export declare function DefaultErrorFallback({ error, reset, }: {
    error: Error;
    reset: () => void;
}): React.ReactElement;
export {};
