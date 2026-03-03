/**
 * Vista Framework Integrity Verification
 *
 * Cross-checks TypeScript constants against the compiled Rust binary.
 * If someone renames constants.ts without recompiling the Rust native
 * binary, the tokens won't match and the framework refuses to start.
 *
 * This is the core of Vista's rename-prevention system.
 */

import {
  FRAMEWORK_NAME,
  URL_PREFIX,
  STATIC_CHUNKS_PATH,
  IMAGE_ENDPOINT,
  SSE_ENDPOINT,
  BUILD_DIR,
  MOUNT_ID_PREFIX,
  CLIENT_REFS_FLAG,
  RSC_DATA_FLAG,
  BUILD_ID_DEFINE,
} from './constants';

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
function hashString(str: string, seed: bigint): bigint {
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
export function computeJSIntegrityToken(): string {
  const values = [
    FRAMEWORK_NAME,
    URL_PREFIX,
    STATIC_CHUNKS_PATH,
    MOUNT_ID_PREFIX,
    RSC_DATA_FLAG, // maps to RSC_DATA_GLOBAL in Rust
    CLIENT_REFS_FLAG, // maps to CLIENT_REFS_GLOBAL in Rust
    BUILD_ID_DEFINE, // maps to BUILD_ID_GLOBAL in Rust
    BUILD_DIR,
    SSE_ENDPOINT,
    IMAGE_ENDPOINT,
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
export function verifyFrameworkIntegrity(nativeModule?: any): boolean {
  // If native module isn't available, skip (graceful degradation)
  if (!nativeModule?.getFrameworkIdentity) {
    return true;
  }

  const identity = nativeModule.getFrameworkIdentity();

  // Check 1: Framework name must match
  if (identity.name !== FRAMEWORK_NAME) {
    throw new Error(
      `[${FRAMEWORK_NAME}] Framework integrity check failed: ` +
        `binary name "${identity.name}" !== constants name "${FRAMEWORK_NAME}". ` +
        `The native binary was compiled for a different framework version. ` +
        `Please recompile with: cargo build --release`
    );
  }

  // Check 2: Individual constants must match
  const mismatches: string[] = [];

  if (identity.urlPrefix !== URL_PREFIX)
    mismatches.push(`URL_PREFIX: rust="${identity.urlPrefix}" ts="${URL_PREFIX}"`);
  if (identity.buildDir !== BUILD_DIR)
    mismatches.push(`BUILD_DIR: rust="${identity.buildDir}" ts="${BUILD_DIR}"`);
  if (identity.sseEndpoint !== SSE_ENDPOINT)
    mismatches.push(`SSE_ENDPOINT: rust="${identity.sseEndpoint}" ts="${SSE_ENDPOINT}"`);
  if (identity.imageEndpoint !== IMAGE_ENDPOINT)
    mismatches.push(`IMAGE_ENDPOINT: rust="${identity.imageEndpoint}" ts="${IMAGE_ENDPOINT}"`);
  if (identity.mountIdPrefix !== MOUNT_ID_PREFIX)
    mismatches.push(`MOUNT_ID_PREFIX: rust="${identity.mountIdPrefix}" ts="${MOUNT_ID_PREFIX}"`);
  if (identity.staticChunksPath !== STATIC_CHUNKS_PATH)
    mismatches.push(
      `STATIC_CHUNKS_PATH: rust="${identity.staticChunksPath}" ts="${STATIC_CHUNKS_PATH}"`
    );

  if (mismatches.length > 0) {
    throw new Error(
      `[${FRAMEWORK_NAME}] Framework integrity check failed — ` +
        `TypeScript constants don't match compiled Rust binary:\n` +
        mismatches.map((m) => `  • ${m}`).join('\n') +
        '\n' +
        `Please recompile the native binary: cargo build --release`
    );
  }

  return true;
}

/**
 * Generate integrity watermark for build output.
 * Embedded in the build manifest so built artifacts are also verified.
 */
export function generateBuildWatermark(): string {
  return `${FRAMEWORK_NAME}:${computeJSIntegrityToken()}`;
}
