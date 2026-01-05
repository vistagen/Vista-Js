/**
 * Client Component Manifest Generator
 *
 * Scans the app directory and builds a manifest of all Client Components.
 * Client components are those with 'client load' directive.
 *
 * The manifest maps component paths to their chunk names for client-side loading.
 */
export interface ClientComponentEntry {
    /** Unique ID for this component */
    id: string;
    /** Relative path from app directory */
    path: string;
    /** Absolute file path */
    absolutePath: string;
    /** Generated chunk name */
    chunkName: string;
    /** Exported names from this module */
    exports: string[];
    /** Is async/lazy loaded */
    async: boolean;
}
export interface ClientManifest {
    /** Build ID for cache busting */
    buildId: string;
    /** Map of module ID to client component info */
    clientModules: Record<string, ClientComponentEntry>;
    /** Map of module path to module ID (for lookups) */
    pathToId: Record<string, string>;
    /** SSR module mapping (server paths to client chunks) */
    ssrModuleMapping: Record<string, string>;
}
/**
 * Generate the client component manifest
 */
export declare function generateClientManifest(cwd: string, appDir: string): ClientManifest;
/**
 * Get client component info by module ID
 */
export declare function getClientComponent(manifest: ClientManifest, moduleId: string): ClientComponentEntry | undefined;
/**
 * Get client component by file path
 */
export declare function getClientComponentByPath(manifest: ClientManifest, filePath: string): ClientComponentEntry | undefined;
/**
 * Check if a path is a client component
 */
export declare function isClientComponentPath(manifest: ClientManifest, filePath: string): boolean;
