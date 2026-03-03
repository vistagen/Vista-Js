/**
 * Vista Framework Integrity Verification
 *
 * Cross-checks TypeScript constants against the compiled Rust binary.
 * If someone renames constants.ts without recompiling the Rust native
 * binary, the tokens won't match and the framework refuses to start.
 *
 * This is the core of Vista's rename-prevention system.
 */
/**
 * Compute integrity token from JS constants.
 * The order and values MUST match naming.rs::compute_integrity_token().
 */
export declare function computeJSIntegrityToken(): string;
/**
 * Verify framework integrity at startup.
 * Loads the compiled Rust binary and cross-checks naming constants.
 *
 * @param nativeModule - The loaded vista-napi module
 * @returns true if integrity check passes
 * @throws Error if integrity check fails (framework has been tampered with)
 */
export declare function verifyFrameworkIntegrity(nativeModule?: any): boolean;
/**
 * Generate integrity watermark for build output.
 * Embedded in the build manifest so built artifacts are also verified.
 */
export declare function generateBuildWatermark(): string;
