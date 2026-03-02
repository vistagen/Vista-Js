/**
 * Vista Flight Client Entry Plugin
 *
 * Generates lightweight client manifest artifacts for legacy mode.
 * This plugin intentionally stays isolated from Flight RSC mode.
 */
import webpack from 'webpack';
interface PluginOptions {
    appDir: string;
    dev: boolean;
}
export declare class VistaFlightPlugin {
    private readonly appDir;
    private readonly dev;
    constructor(options: PluginOptions);
    apply(compiler: webpack.Compiler): void;
    private collectModuleInfo;
    private emitClientManifest;
}
export default VistaFlightPlugin;
