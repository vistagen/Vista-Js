"use strict";
/**
 * Vista Flight Loader
 *
 * Rust-powered webpack loader that detects 'client load' directive
 * and marks modules with RSC info for proper bundle separation.
 *
 * This is similar to Next.js's flight-loader but uses Vista's Rust scanner.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.raw = void 0;
exports.default = vistaFlightLoader;
// Try to load Rust native bindings
let nativeBindings = null;
try {
    nativeBindings = require('../../../../crates/vista-napi');
}
catch (e) {
    // Fall back to TypeScript implementation
}
/**
 * Fallback TypeScript implementation of client directive detection
 */
function hasClientDirective(source) {
    const lines = source.split('\n');
    for (const line of lines) {
        const trimmed = line.trim();
        // Skip empty lines and comments
        if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('/*')) {
            continue;
        }
        // Check for 'client load' directive
        if (trimmed === "'client load';" || trimmed === '"client load";' ||
            trimmed === "'client load'" || trimmed === '"client load"') {
            return true;
        }
        // If we hit an import or other statement first, it's not a client component
        if (trimmed.startsWith('import') || trimmed.startsWith('export') ||
            trimmed.startsWith('const') || trimmed.startsWith('function')) {
            return false;
        }
    }
    return false;
}
/**
 * Vista Flight Loader
 *
 * Marks modules with RSC info based on 'client load' directive.
 * Uses Rust for detection when available, falls back to TypeScript.
 */
function vistaFlightLoader(source) {
    // Get module's build info
    const buildInfo = this._module.buildInfo;
    const fileName = this.resourcePath.split(/[\\/]/).pop() || '';
    // Only process app directory files
    if (!this.resourcePath.includes('app')) {
        return source;
    }
    if (!buildInfo.rsc) {
        // Detect directive using Rust or fallback
        let isClient = false;
        let directiveLine = 0;
        if (nativeBindings) {
            try {
                const result = nativeBindings.analyzeClientDirective(source);
                isClient = result.isClient;
                directiveLine = result.directiveLine;
            }
            catch (e) {
                // Fallback if Rust call fails
                isClient = hasClientDirective(source);
            }
        }
        else {
            isClient = hasClientDirective(source);
        }
        // Mark module with RSC info (like Next.js does)
        buildInfo.rsc = {
            isClientRef: isClient,
            type: isClient ? 'client' : 'server',
            directiveLine
        };
        // Debug logging (only when VISTA_DEBUG is set)
        if (process.env.VISTA_DEBUG && isClient) {
            console.log(`[Vista Flight Loader] ${fileName}: isClient=${isClient}`);
        }
    }
    // Pass through source unchanged
    // The loader's job is just to mark modules, not transform code
    return source;
}
// Allow async loading
exports.raw = false;
