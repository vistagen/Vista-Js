/**
 * Vista RSC Build System
 *
 * Builds the application using the True RSC Architecture:
 * 1. Server bundle (.vista/server/) - All code for SSR
 * 2. Client bundle (.vista/static/) - Only client components
 * 3. Manifests for hydration coordination
 */
import webpack from 'webpack';
/**
 * Build with RSC architecture
 */
export declare function buildRSC(watch?: boolean): Promise<{
    serverCompiler: webpack.Compiler | null;
    clientCompiler: webpack.Compiler | null;
}>;
export { buildRSC as default };
