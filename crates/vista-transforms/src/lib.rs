//! Vista SWC Transforms
//! 
//! This crate provides Rust-based transforms for Vista framework.
//! 
//! Features:
//! - `'client load'` directive detection
//! - Component categorization (server vs client)
//! - RSC (React Server Components) build system
//! - Manifest generation
//! - RSC payload serialization

mod client_directive;
pub mod rsc;

pub use client_directive::*;
pub use rsc::*;
