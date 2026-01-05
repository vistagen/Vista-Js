/**
 * Vista Server Component Loader
 *
 * Webpack loader that transforms server component imports in client bundles.
 *
 * When a server component is imported in a client bundle:
 * 1. The loader detects if the file has 'client load' directive
 * 2. If NOT a client component, replace the module with a proxy
 * 3. The proxy provides helpful error messages when misused
 */
import type { LoaderContext } from 'webpack';
export interface ServerComponentLoaderOptions {
    appDir: string;
    clientManifestPath: string;
}
/**
 * Server Component Loader
 */
export default function serverComponentLoader(this: LoaderContext<ServerComponentLoaderOptions>, source: string): string;
