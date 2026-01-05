/**
 * Vista Client Reference Plugin
 *
 * Webpack plugin that transforms server component imports in the client bundle.
 *
 * When a client bundle imports a server component, this plugin:
 * 1. Replaces the import with a client reference proxy
 * 2. The proxy throws an error if used on the client (server components can't run on client)
 * 3. For valid patterns (passing server component as children), the reference works
 *
 * This ensures:
 * - Server code never leaks to the client bundle
 * - Server components contribute 0kb to client JavaScript
 * - Clear error messages when misusing server components
 */
import webpack from 'webpack';
export interface ClientReferencePluginOptions {
    /** Path to the app directory */
    appDir: string;
    /** Path to client manifest JSON */
    clientManifestPath: string;
}
/**
 * Client Reference Plugin
 *
 * Transforms imports of server components in the client bundle
 */
export declare class ClientReferencePlugin {
    private appDir;
    private clientManifestPath;
    private clientManifest;
    constructor(options: ClientReferencePluginOptions);
    apply(compiler: webpack.Compiler): void;
    private loadManifest;
    private getComponentId;
    private generateRuntimeManifest;
}
