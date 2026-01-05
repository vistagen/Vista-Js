/**
 * Vista Dynamic Import
 *
 * Dynamic component loading with SSR support.
 * Similar to Next.js dynamic.
 */
import * as React from 'react';
export interface DynamicOptions<P = {}> {
    /**
     * Loading component to show while the dynamic component is loading
     */
    loading?: () => React.ReactNode;
    /**
     * Whether to disable SSR for this component
     */
    ssr?: boolean;
}
type ImportFn<P> = () => Promise<{
    default: React.ComponentType<P>;
}>;
/**
 * Dynamically import a component with loading state
 */
export default function dynamic<P = {}>(importFn: ImportFn<P>, options?: DynamicOptions<P>): React.ComponentType<P>;
export {};
