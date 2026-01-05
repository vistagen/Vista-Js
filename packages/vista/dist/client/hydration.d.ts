/**
 * Vista Selective Hydration
 *
 * This module provides selective hydration for RSC (React Server Components).
 *
 * Key Features:
 * - Only hydrates client component "islands"
 * - Server components are rendered as static HTML
 * - Progressive hydration based on priority and visibility
 * - Minimal JavaScript for maximum performance
 */
export interface ClientReference {
    id: string;
    mountId: string;
    props: Record<string, any>;
    chunkUrl: string;
    exportName: string;
}
export interface HydrationOptions {
    /** Whether to use progressive hydration based on visibility */
    progressive?: boolean;
    /** Hydration priority (higher = sooner) */
    priority?: 'high' | 'normal' | 'low';
    /** Whether to use requestIdleCallback for low priority */
    useIdleCallback?: boolean;
}
/**
 * Hydrate a single client component
 */
declare function hydrateComponent(reference: ClientReference): Promise<void>;
/**
 * Hydrate all client components on the page
 */
export declare function hydrateClientComponents(options?: HydrationOptions): Promise<void>;
/**
 * Initialize Vista hydration
 * Call this after the page loads
 */
export declare function initializeHydration(): void;
declare const _default: {
    hydrateClientComponents: typeof hydrateClientComponents;
    hydrateComponent: typeof hydrateComponent;
    initializeHydration: typeof initializeHydration;
};
export default _default;
