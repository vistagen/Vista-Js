/**
 * Vista Client Boundary Component
 *
 * Wraps client components during SSR to add hydration markers.
 * These markers allow the client bundle to find and hydrate only client components.
 */
import * as React from 'react';
/**
 * Check if a file is a client component by checking for 'client load' directive
 */
declare function isClientComponent(filePath: string): boolean;
/**
 * Reset mount counter at the start of each request
 */
export declare function resetMountCounter(): void;
interface ClientBoundaryProps {
    componentId: string;
    componentPath?: string;
    children: React.ReactNode;
    props?: Record<string, any>;
}
/**
 * ClientBoundary - Wraps client components with hydration markers
 *
 * During SSR, this component renders:
 * <div data-vista-client="counter" data-props="{}">
 *   {children from SSR}
 * </div>
 *
 * The client then hydrates only these marked islands.
 */
export declare function ClientBoundary({ componentId, children, props }: ClientBoundaryProps): React.ReactElement;
/**
 * Higher-order function to wrap a client component
 */
export declare function wrapClientComponent<P extends object>(Component: React.ComponentType<P>, componentId: string): React.FC<P>;
/**
 * Check if we're on the server
 */
export declare function isServer(): boolean;
declare const _default: {
    ClientBoundary: typeof ClientBoundary;
    wrapClientComponent: typeof wrapClientComponent;
    resetMountCounter: typeof resetMountCounter;
    isClientComponent: typeof isClientComponent;
    isServer: typeof isServer;
};
export default _default;
