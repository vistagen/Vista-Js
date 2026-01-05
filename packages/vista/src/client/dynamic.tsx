/**
 * Vista Dynamic Import
 * 
 * Dynamic component loading with SSR support.
 * Similar to Next.js dynamic.
 */

'client load';

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

type ImportFn<P> = () => Promise<{ default: React.ComponentType<P> }>;

/**
 * Dynamically import a component with loading state
 */
export default function dynamic<P = {}>(
    importFn: ImportFn<P>,
    options: DynamicOptions<P> = {}
): React.ComponentType<P> {
    const { loading: LoadingComponent, ssr = true } = options;

    // Use React.lazy for dynamic import
    const LazyComponent = React.lazy(importFn);

    // Wrapper component
    const DynamicComponent: React.FC<P> = (props) => {
        // Handle SSR disabled
        const [isClient, setIsClient] = React.useState(false);

        React.useEffect(() => {
            setIsClient(true);
        }, []);

        if (!ssr && !isClient) {
            return LoadingComponent ? <>{LoadingComponent()}</> : null;
        }

        return (
            <React.Suspense fallback={LoadingComponent ? LoadingComponent() : null}>
                <LazyComponent {...(props as any)} />
            </React.Suspense>
        );
    };

    // Preserve display name for debugging
    DynamicComponent.displayName = `Dynamic(${importFn.name || 'Component'})`;

    return DynamicComponent;
}
