/**
 * Vista Server Component Webpack Plugin
 *
 * Checks for server component violations on every webpack compilation.
 * Fails the build if client hooks are used without 'client load' directive.
 */
import type { Compiler } from 'webpack';
export declare class VistaServerComponentPlugin {
    private appDir;
    constructor(options: {
        appDir: string;
    });
    apply(compiler: Compiler): void;
    private checkServerComponents;
    private scanDirectory;
}
export default VistaServerComponentPlugin;
