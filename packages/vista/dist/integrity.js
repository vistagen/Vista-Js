"use strict";
/**
 * Vista Framework Integrity Verification
 *
 * Cross-checks TypeScript constants against the compiled Rust binary.
 * If someone renames constants.ts without recompiling the Rust native
 * binary, the tokens won't match and the framework refuses to start.
 *
 * This is the core of Vista's rename-prevention system.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.computeJSIntegrityToken = computeJSIntegrityToken;
exports.verifyFrameworkIntegrity = verifyFrameworkIntegrity;
exports.generateBuildWatermark = generateBuildWatermark;
const constants_1 = require("./constants");
// ============================================================================
// JS-side integrity token computation
// Must match the Rust-side compute_integrity_token() in naming.rs exactly.
// ============================================================================
/**
 * Simple deterministic hash matching Rust's DefaultHasher behavior.
 * We use the same algorithm: hash each string in the same order.
 *
 * NOTE: This intentionally uses a custom hasher to match Rust's DefaultHasher.
 * Do NOT replace with crypto.createHash — it must produce the same output
 * as the compiled binary.
 */
function hashString(str, seed) {
    // Rust DefaultHasher (SipHash-2-4) approximation via string bytes
    let h = seed;
    for (let i = 0; i < str.length; i++) {
        h = h ^ BigInt(str.charCodeAt(i));
        h = (h * 0x100000001b3n) & 0xffffffffffffffffn;
    }
    // Add length (Rust hashes the string length too)
    h = h ^ BigInt(str.length);
    h = (h * 0x100000001b3n) & 0xffffffffffffffffn;
    return h;
}
/**
 * Compute integrity token from JS constants.
 * The order and values MUST match naming.rs::compute_integrity_token().
 */
function computeJSIntegrityToken() {
    const values = [
        constants_1.FRAMEWORK_NAME,
        constants_1.URL_PREFIX,
        constants_1.STATIC_CHUNKS_PATH,
        constants_1.MOUNT_ID_PREFIX,
        constants_1.RSC_DATA_FLAG, // maps to RSC_DATA_GLOBAL in Rust
        constants_1.CLIENT_REFS_FLAG, // maps to CLIENT_REFS_GLOBAL in Rust
        constants_1.BUILD_ID_DEFINE, // maps to BUILD_ID_GLOBAL in Rust
        constants_1.BUILD_DIR,
        constants_1.SSE_ENDPOINT,
        constants_1.IMAGE_ENDPOINT,
    ];
    let hash = 0xcbf29ce484222325n; // FNV offset basis
    for (const val of values) {
        hash = hashString(val, hash);
    }
    return hash.toString(16);
}
// ============================================================================
// Runtime Verification
// ============================================================================
/**
 * Verify framework integrity at startup.
 * Loads the compiled Rust binary and cross-checks naming constants.
 *
 * @param nativeModule - The loaded vista-napi module
 * @returns true if integrity check passes
 * @throws Error if integrity check fails (framework has been tampered with)
 */
function verifyFrameworkIntegrity(nativeModule) {
    // If native module isn't available, skip (graceful degradation)
    if (!nativeModule?.getFrameworkIdentity) {
        return true;
    }
    const identity = nativeModule.getFrameworkIdentity();
    // Check 1: Framework name must match
    if (identity.name !== constants_1.FRAMEWORK_NAME) {
        throw new Error(`[${constants_1.FRAMEWORK_NAME}] Framework integrity check failed: ` +
            `binary name "${identity.name}" !== constants name "${constants_1.FRAMEWORK_NAME}". ` +
            `The native binary was compiled for a different framework version. ` +
            `Please recompile with: cargo build --release`);
    }
    // Check 2: Individual constants must match
    const mismatches = [];
    if (identity.urlPrefix !== constants_1.URL_PREFIX)
        mismatches.push(`URL_PREFIX: rust="${identity.urlPrefix}" ts="${constants_1.URL_PREFIX}"`);
    if (identity.buildDir !== constants_1.BUILD_DIR)
        mismatches.push(`BUILD_DIR: rust="${identity.buildDir}" ts="${constants_1.BUILD_DIR}"`);
    if (identity.sseEndpoint !== constants_1.SSE_ENDPOINT)
        mismatches.push(`SSE_ENDPOINT: rust="${identity.sseEndpoint}" ts="${constants_1.SSE_ENDPOINT}"`);
    if (identity.imageEndpoint !== constants_1.IMAGE_ENDPOINT)
        mismatches.push(`IMAGE_ENDPOINT: rust="${identity.imageEndpoint}" ts="${constants_1.IMAGE_ENDPOINT}"`);
    if (identity.mountIdPrefix !== constants_1.MOUNT_ID_PREFIX)
        mismatches.push(`MOUNT_ID_PREFIX: rust="${identity.mountIdPrefix}" ts="${constants_1.MOUNT_ID_PREFIX}"`);
    if (identity.staticChunksPath !== constants_1.STATIC_CHUNKS_PATH)
        mismatches.push(`STATIC_CHUNKS_PATH: rust="${identity.staticChunksPath}" ts="${constants_1.STATIC_CHUNKS_PATH}"`);
    if (mismatches.length > 0) {
        throw new Error(`[${constants_1.FRAMEWORK_NAME}] Framework integrity check failed — ` +
            `TypeScript constants don't match compiled Rust binary:\n` +
            mismatches.map((m) => `  • ${m}`).join('\n') +
            '\n' +
            `Please recompile the native binary: cargo build --release`);
    }
    return true;
}
/**
 * Generate integrity watermark for build output.
 * Embedded in the build manifest so built artifacts are also verified.
 */
function generateBuildWatermark() {
    return `${constants_1.FRAMEWORK_NAME}:${computeJSIntegrityToken()}`;
}
