//! Vista RSC (React Server Components) Module
//! 
//! High-performance Rust implementation for RSC compilation:
//! - Fast directory scanning and component classification
//! - Manifest generation (client/server)
//! - RSC payload serialization
//! - Client component pre-rendering for zero CLS
//! - Code transformation

mod scanner;
mod manifest;
mod serializer;
mod prerender;

pub use scanner::*;
pub use manifest::*;
pub use serializer::*;
pub use prerender::*;
