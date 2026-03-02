import React from 'react';
export type RootRenderMode = 'document' | 'legacy';
export interface ResolvedRootLayout {
    appDir: string;
    rootPath: string;
    component: React.ComponentType<any>;
    metadata: any;
    notFoundRoute?: string;
    mode: RootRenderMode;
    usedLayoutFallback: boolean;
}
export declare function resolveRootLayout(cwd: string, isDev: boolean): ResolvedRootLayout;
export declare function resolveRoutePagePath(cwd: string, routePath: string): string | null;
export interface ResolvedNotFoundComponent {
    component: React.ComponentType<any>;
    sourcePath: string;
}
export declare function resolveNotFoundComponent(cwd: string, rootLayout: ResolvedRootLayout, isDev: boolean): ResolvedNotFoundComponent | null;
export interface ResolvedLayout {
    /** Absolute file path of the layout */
    filePath: string;
    /** The React component */
    component: React.ComponentType<any>;
    /** Metadata exports, if any */
    metadata?: any;
}
/**
 * Resolve the full chain of layout components from the app root down to the
 * directory containing the target page. Returns an array ordered from
 * outermost (root) to innermost (closest to the page).
 *
 * This is the legacy-engine counterpart to the `layoutPaths` array that the
 * RSC manifest already computes. We need it because the legacy engine never
 * consults the server manifest.
 *
 * @param cwd     Project root
 * @param pageDir Absolute path of the directory that contains the page file
 * @param isDev   Bust require-cache in development
 */
export declare function resolveLayoutChain(cwd: string, pageDir: string, isDev: boolean): ResolvedLayout[];
