/**
 * Vista Flight Client Entry Plugin
 *
 * Webpack plugin that creates separate client entries for components
 * marked with 'client load' directive. Uses Rust scanner for detection.
 *
 * This is similar to Next.js's FlightClientEntryPlugin.
 */
import webpack from 'webpack';
interface PluginOptions {
    appDir: string;
    dev: boolean;
}
interface ClientModuleInfo {
    moduleId: string | number;
    absolutePath: string;
    relativePath: string;
    exports: string[];
}
export declare class VistaFlightPlugin {
    private appDir;
    private dev;
    constructor(options: PluginOptions);
    apply(compiler: webpack.Compiler): void;
    /**
     * Collect information about all modules and their RSC status
     */
    private collectModuleInfo;
    /**
     * Generate client reference manifest for hydration
     */
    private generateClientManifest;
}
export declare function getClientModules(): Map<string, ClientModuleInfo>;
export declare function isClientModule(resourcePath: string): boolean;
export default VistaFlightPlugin;
