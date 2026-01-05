/**
 * Vista RSC Engine
 *
 * React Server Components aware rendering engine.
 *
 * This engine implements the "True RSC Architecture":
 * 1. Server components render on the server only, contribute 0kb to client
 * 2. Client components are sent as references, hydrated on demand
 * 3. Strict separation ensures server secrets never leak
 */
import webpack from 'webpack';
export interface RSCEngineOptions {
    port?: number;
    compiler?: webpack.Compiler;
}
/**
 * Start the RSC-aware Vista server
 */
export declare function startRSCServer(options?: RSCEngineOptions): void;
export { startRSCServer as default };
