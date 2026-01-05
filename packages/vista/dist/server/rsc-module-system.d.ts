/**
 * Vista RSC Module System
 *
 * Intercepts require() calls for client components during SSR.
 * Client components are replaced with placeholder divs that will be
 * hydrated on the client side.
 */
export interface ClientReference {
    id: string;
    mountId: string;
    props: Record<string, any>;
    chunkUrl: string;
    exportName: string;
}
/**
 * Initialize the RSC module system
 * Must be called BEFORE any app modules are loaded
 */
export declare function initializeRSCModuleSystem(manifest: any, cwd?: string): void;
export declare function _getMountId(): number;
export declare function _addReference(ref: ClientReference): void;
/**
 * Reset state for new render
 */
export declare function resetRSCState(): void;
/**
 * Get collected client references
 */
export declare function getClientReferences(): ClientReference[];
/**
 * Shutdown the RSC module system
 */
export declare function shutdownRSCModuleSystem(): void;
