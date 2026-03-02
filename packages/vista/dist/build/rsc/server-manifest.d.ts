/**
 * Server Component Manifest Generator
 *
 * Scans the app directory and builds a manifest of all Server Components.
 * Server components are all components WITHOUT 'use client' directive.
 *
 * Server components:
 * - Render on the server only
 * - Have access to server resources (DB, file system, env vars)
 * - Contribute 0kb to the client JavaScript bundle
 */
export interface ServerComponentEntry {
    /** Unique ID for this component */
    id: string;
    /** Relative path from app directory */
    path: string;
    /** Absolute file path */
    absolutePath: string;
    /** Component type: page, layout, loading, error, component */
    type: 'page' | 'layout' | 'loading' | 'error' | 'not-found' | 'component';
    /** Has static metadata export */
    hasMetadata: boolean;
    /** Has generateMetadata function */
    hasGenerateMetadata: boolean;
    /** Has generateStaticParams function */
    hasGenerateStaticParams: boolean;
    /** Rendering mode: 'static' | 'dynamic' | 'auto' (from export const dynamic) */
    renderMode: 'static' | 'dynamic' | 'auto';
    /** ISR revalidate interval in seconds (from export const revalidate) */
    revalidate?: number;
    /** List of client components this server component imports */
    clientDependencies: string[];
}
export interface ServerManifest {
    /** Build ID */
    buildId: string;
    /** Map of module ID to server component info */
    serverModules: Record<string, ServerComponentEntry>;
    /** Map of path to module ID */
    pathToId: Record<string, string>;
    /** Routes discovered */
    routes: RouteEntry[];
}
export interface RouteEntry {
    /** URL path pattern */
    pattern: string;
    /** Page component path */
    pagePath: string;
    /** Layout component paths (from root to this route) */
    layoutPaths: string[];
    /** Loading component path if exists */
    loadingPath?: string;
    /** Error component path if exists */
    errorPath?: string;
    /** Route type (URL pattern shape) */
    type: 'static' | 'dynamic' | 'catch-all';
    /** Rendering mode: derived from page exports */
    renderMode: 'static' | 'dynamic' | 'isr';
    /** ISR revalidate interval in seconds */
    revalidate?: number;
    /** Whether page exports generateStaticParams */
    hasGenerateStaticParams: boolean;
}
/**
 * Generate the server component manifest
 */
export declare function generateServerManifest(cwd: string, appDir: string): ServerManifest;
/**
 * Get server component by path
 */
export declare function getServerComponent(manifest: ServerManifest, filePath: string): ServerComponentEntry | undefined;
/**
 * Check if a path is a server component
 */
export declare function isServerComponentPath(manifest: ServerManifest, filePath: string): boolean;
