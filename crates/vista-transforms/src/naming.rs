//! Vista Naming Constants & Integrity
//!
//! Central place for all framework-specific naming. Mirror of the TS
//! `packages/vista/src/constants.ts` so Rust and TypeScript stay in sync.
//!
//! The integrity token is computed at compile time and baked into the
//! native binary — making simple find-replace renames impossible.

use std::collections::hash_map::DefaultHasher;
use std::hash::{Hash, Hasher};

// ============================================================================
// Framework Identity (baked into compiled binary)
// ============================================================================

/// Framework name — the root identity
pub const FRAMEWORK_NAME: &str = "vista";

/// URL prefix for Vista's internal routes (equivalent of `/_next`)
pub const URL_PREFIX: &str = "/_vista";

/// Prefix for static chunk public path
pub const STATIC_CHUNKS_PATH: &str = "/_vista/static/chunks/";

/// Mount-ID prefix used for client component DOM anchors
pub const MOUNT_ID_PREFIX: &str = "__vista_cc_";

/// Window global: RSC payload data
pub const RSC_DATA_GLOBAL: &str = "__VISTA_RSC_DATA__";

/// Window global: client component reference list
pub const CLIENT_REFS_GLOBAL: &str = "__VISTA_CLIENT_REFERENCES__";

/// Window global: build ID
pub const BUILD_ID_GLOBAL: &str = "__VISTA_BUILD_ID__";

/// Build output directory name
pub const BUILD_DIR: &str = ".vista";

/// SSE live-reload endpoint
pub const SSE_ENDPOINT: &str = "/__vista_reload";

/// Image optimization endpoint
pub const IMAGE_ENDPOINT: &str = "/_vista/image";

// ============================================================================
// Integrity Token (compile-time, baked into .node binary)
// ============================================================================

/// Compute a deterministic integrity token from all naming constants.
/// This is called at runtime but the VALUES are baked at compile time.
/// If JS constants don't produce the same token → framework was tampered with.
pub fn compute_integrity_token() -> u64 {
    let mut hasher = DefaultHasher::new();

    // Hash all naming constants in a fixed order
    FRAMEWORK_NAME.hash(&mut hasher);
    URL_PREFIX.hash(&mut hasher);
    STATIC_CHUNKS_PATH.hash(&mut hasher);
    MOUNT_ID_PREFIX.hash(&mut hasher);
    RSC_DATA_GLOBAL.hash(&mut hasher);
    CLIENT_REFS_GLOBAL.hash(&mut hasher);
    BUILD_ID_GLOBAL.hash(&mut hasher);
    BUILD_DIR.hash(&mut hasher);
    SSE_ENDPOINT.hash(&mut hasher);
    IMAGE_ENDPOINT.hash(&mut hasher);

    hasher.finish()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_integrity_token_is_deterministic() {
        let t1 = compute_integrity_token();
        let t2 = compute_integrity_token();
        assert_eq!(t1, t2, "Integrity token must be deterministic");
    }

    #[test]
    fn test_integrity_token_is_nonzero() {
        assert_ne!(compute_integrity_token(), 0);
    }

    #[test]
    fn test_framework_name() {
        assert_eq!(FRAMEWORK_NAME, "vista");
    }
}
