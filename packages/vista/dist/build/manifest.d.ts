/**
 * Vista Build Utilities
 *
 * Generates build manifests, BUILD_ID, and manages .vista output structure.
 */
/**
 * Generate a unique build ID based on timestamp and random bytes.
 */
export declare function generateBuildId(): string;
/**
 * Read existing BUILD_ID or generate a new one.
 */
export declare function getBuildId(vistaDir: string, forceNew?: boolean): string;
export interface VistaDirs {
    root: string;
    cache: string;
    server: string;
    static: string;
    chunks: string;
    css: string;
    media: string;
}
/**
 * Create the .vista directory structure.
 */
export declare function createVistaDirectories(cwd: string): VistaDirs;
export interface BuildManifest {
    buildId: string;
    polyfillFiles: string[];
    devFiles: string[];
    lowPriorityFiles: string[];
    rootMainFiles: string[];
    pages: Record<string, string[]>;
}
/**
 * Generate build-manifest.json
 */
export declare function generateBuildManifest(vistaDir: string, buildId: string, pages?: Record<string, string[]>): BuildManifest;
export interface RouteInfo {
    page: string;
    regex: string;
    routeKeys: Record<string, string>;
    namedRegex?: string;
}
export interface RoutesManifest {
    version: number;
    basePath: string;
    redirects: any[];
    rewrites: any[];
    headers: any[];
    staticRoutes: RouteInfo[];
    dynamicRoutes: RouteInfo[];
}
/**
 * Generate routes-manifest.json from route tree.
 */
export declare function generateRoutesManifest(vistaDir: string, staticRoutes?: RouteInfo[], dynamicRoutes?: RouteInfo[]): RoutesManifest;
export interface ClientComponentInfo {
    filePath: string;
    chunkName: string;
    exports: string[];
}
export interface ClientComponentsManifest {
    buildId: string;
    clientModules: Record<string, ClientComponentInfo>;
}
/**
 * Generate manifest of client components (files with 'client load').
 */
export declare function generateClientComponentsManifest(vistaDir: string, buildId: string, clientModules?: Record<string, ClientComponentInfo>): ClientComponentsManifest;
export interface ServerComponentInfo {
    filePath: string;
    hasMetadata: boolean;
    hasGenerateMetadata: boolean;
}
/**
 * Generate manifest of server components.
 */
export declare function generateServerComponentsManifest(vistaDir: string, serverModules?: Record<string, ServerComponentInfo>): void;
/**
 * Get Webpack cache configuration for persistent caching.
 */
export declare function getWebpackCacheConfig(vistaDir: string, buildId: string, name: string): {
    type: "filesystem";
    version: string;
    cacheDirectory: string;
    name: string;
    buildDependencies: {
        config: string[];
    };
};
/**
 * Clean old cache entries (keeps last N builds).
 */
export declare function cleanOldCache(vistaDir: string, keepBuilds?: number): void;
