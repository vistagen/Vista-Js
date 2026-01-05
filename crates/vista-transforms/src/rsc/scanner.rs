//! RSC Scanner
//! 
//! High-performance Rust scanner for React Server Components.
//! Scans directories and classifies components as client or server.

use std::path::Path;
use std::fs;
use serde::{Serialize, Deserialize};
use crate::has_client_directive;

/// Component type classification
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum ComponentType {
    Page,
    Layout,
    Loading,
    Error,
    NotFound,
    Component,
    Route,  // API route
}

impl ComponentType {
    pub fn from_filename(name: &str) -> Self {
        match name {
            "page" | "index" => ComponentType::Page,
            "layout" | "root" => ComponentType::Layout,
            "loading" => ComponentType::Loading,
            "error" => ComponentType::Error,
            "not-found" => ComponentType::NotFound,
            "route" => ComponentType::Route,
            _ => ComponentType::Component,
        }
    }
}

/// Information about a scanned component
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScannedComponent {
    /// Absolute path to the file
    pub absolute_path: String,
    /// Path relative to app directory
    pub relative_path: String,
    /// Is this a client component (has 'client load' directive)
    pub is_client: bool,
    /// Line number of the directive (0 if not client)
    pub directive_line: usize,
    /// Component type (page, layout, etc.)
    pub component_type: ComponentType,
    /// Exported names from this module
    pub exports: Vec<String>,
    /// Client hooks/APIs used (for error detection)
    pub client_hooks_used: Vec<String>,
    /// Has metadata export
    pub has_metadata: bool,
    /// Has generateMetadata function
    pub has_generate_metadata: bool,
}

/// Error when using client features in server component
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ServerComponentError {
    pub file: String,
    pub message: String,
    pub hooks: Vec<String>,
}

/// Result of scanning the app directory
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScanResult {
    pub client_components: Vec<ScannedComponent>,
    pub server_components: Vec<ScannedComponent>,
    pub pages: Vec<ScannedComponent>,
    pub layouts: Vec<ScannedComponent>,
    pub api_routes: Vec<ScannedComponent>,
    pub errors: Vec<ServerComponentError>,
    /// Total files scanned
    pub total_files: usize,
    /// Time taken in milliseconds
    pub scan_time_ms: u64,
}

/// Client-only hooks that require 'client load' directive
const CLIENT_HOOKS: &[&str] = &[
    "useState", "useEffect", "useLayoutEffect", "useReducer", "useRef",
    "useImperativeHandle", "useCallback", "useMemo", "useContext",
    "useDebugValue", "useDeferredValue", "useTransition", "useId",
    "useSyncExternalStore", "useInsertionEffect",
];

/// Client-only APIs
const CLIENT_APIS: &[&str] = &[
    "createContext", "forwardRef", "memo", "lazy", "startTransition",
    "useFormStatus", "useFormState", "useOptimistic",
];

/// Detect client hooks used in source
fn detect_client_hooks(source: &str) -> Vec<String> {
    let mut used = Vec::new();
    
    for hook in CLIENT_HOOKS {
        // Match hook usage: useState( or useState<
        if source.contains(&format!("{}(", hook)) || source.contains(&format!("{}<", hook)) {
            used.push(hook.to_string());
        }
    }
    
    for api in CLIENT_APIS {
        if source.contains(&format!("{}(", api)) || source.contains(&format!("{}<", api)) {
            used.push(api.to_string());
        }
    }
    
    // Check for event handlers
    if source.contains("onClick=") || source.contains("onChange=") || 
       source.contains("onSubmit=") || source.contains("onFocus=") {
        used.push("event handlers".to_string());
    }
    
    used
}

/// Extract export names from source
fn extract_exports(source: &str) -> Vec<String> {
    let mut exports = Vec::new();
    
    // export default
    if source.contains("export default") {
        exports.push("default".to_string());
    }
    
    // export function Name or export const Name
    for line in source.lines() {
        let trimmed = line.trim();
        
        if trimmed.starts_with("export function ") || trimmed.starts_with("export async function ") {
            if let Some(name) = extract_identifier(trimmed, "function ") {
                exports.push(name);
            }
        } else if trimmed.starts_with("export const ") {
            if let Some(name) = extract_identifier(trimmed, "const ") {
                exports.push(name);
            }
        } else if trimmed.starts_with("export class ") {
            if let Some(name) = extract_identifier(trimmed, "class ") {
                exports.push(name);
            }
        }
    }
    
    exports
}

/// Helper to extract identifier after a keyword
fn extract_identifier(line: &str, after: &str) -> Option<String> {
    if let Some(pos) = line.find(after) {
        let rest = &line[pos + after.len()..];
        let name: String = rest.chars()
            .take_while(|c| c.is_alphanumeric() || *c == '_')
            .collect();
        if !name.is_empty() {
            return Some(name);
        }
    }
    None
}

/// Check for metadata exports
fn has_metadata_export(source: &str) -> bool {
    source.contains("export const metadata") || source.contains("export let metadata")
}

fn has_generate_metadata(source: &str) -> bool {
    source.contains("export function generateMetadata") ||
    source.contains("export async function generateMetadata") ||
    source.contains("export const generateMetadata")
}

/// Scan a single file
fn scan_file(path: &Path, app_dir: &Path) -> Option<ScannedComponent> {
    let source = fs::read_to_string(path).ok()?;
    let relative_path = path.strip_prefix(app_dir).ok()?;
    
    let file_stem = path.file_stem()?.to_str()?;
    let component_type = ComponentType::from_filename(file_stem);
    
    let is_client = has_client_directive(&source);
    let directive_line = if is_client {
        source.lines()
            .enumerate()
            .find(|(_, line)| {
                let trimmed = line.trim();
                trimmed.starts_with("'client load'") || trimmed.starts_with("\"client load\"")
            })
            .map(|(i, _)| i + 1)
            .unwrap_or(1)
    } else {
        0
    };
    
    Some(ScannedComponent {
        absolute_path: path.to_string_lossy().to_string(),
        relative_path: relative_path.to_string_lossy().to_string().replace('\\', "/"),
        is_client,
        directive_line,
        component_type,
        exports: extract_exports(&source),
        client_hooks_used: detect_client_hooks(&source),
        has_metadata: has_metadata_export(&source),
        has_generate_metadata: has_generate_metadata(&source),
    })
}

/// Scan directory recursively
fn scan_directory_recursive(
    dir: &Path,
    app_dir: &Path,
    components: &mut Vec<ScannedComponent>,
    errors: &mut Vec<ServerComponentError>,
) {
    let entries = match fs::read_dir(dir) {
        Ok(e) => e,
        Err(_) => return,
    };
    
    for entry in entries.flatten() {
        let path = entry.path();
        let file_name = entry.file_name().to_string_lossy().to_string();
        
        if path.is_dir() {
            // Skip hidden directories and node_modules
            if !file_name.starts_with('.') && file_name != "node_modules" {
                scan_directory_recursive(&path, app_dir, components, errors);
            }
        } else if path.is_file() {
            // Only process TypeScript/JavaScript files
            let ext = path.extension().and_then(|e| e.to_str()).unwrap_or("");
            if !["ts", "tsx", "js", "jsx"].contains(&ext) {
                continue;
            }
            
            if let Some(component) = scan_file(&path, app_dir) {
                // Check for server component errors
                if !component.is_client && !component.client_hooks_used.is_empty() {
                    errors.push(ServerComponentError {
                        file: component.relative_path.clone(),
                        message: format!(
                            "Using {} in a Server Component. Add 'client load' to make it a Client Component.",
                            component.client_hooks_used.join(", ")
                        ),
                        hooks: component.client_hooks_used.clone(),
                    });
                }
                
                components.push(component);
            }
        }
    }
}

/// Scan the app directory and classify all components
pub fn scan_app_directory(app_dir: &str) -> ScanResult {
    let start = std::time::Instant::now();
    let app_path = Path::new(app_dir);
    
    let mut components = Vec::new();
    let mut errors = Vec::new();
    
    scan_directory_recursive(app_path, app_path, &mut components, &mut errors);
    
    let total_files = components.len();
    
    // Classify components
    let client_components: Vec<_> = components.iter()
        .filter(|c| c.is_client)
        .cloned()
        .collect();
    
    let server_components: Vec<_> = components.iter()
        .filter(|c| !c.is_client && c.component_type != ComponentType::Route)
        .cloned()
        .collect();
    
    let pages: Vec<_> = components.iter()
        .filter(|c| c.component_type == ComponentType::Page)
        .cloned()
        .collect();
    
    let layouts: Vec<_> = components.iter()
        .filter(|c| c.component_type == ComponentType::Layout)
        .cloned()
        .collect();
    
    let api_routes: Vec<_> = components.iter()
        .filter(|c| c.component_type == ComponentType::Route)
        .cloned()
        .collect();
    
    let scan_time_ms = start.elapsed().as_millis() as u64;
    
    ScanResult {
        client_components,
        server_components,
        pages,
        layouts,
        api_routes,
        errors,
        total_files,
        scan_time_ms,
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_detect_client_hooks() {
        let source = r#"
            import { useState, useEffect } from 'react';
            
            export default function Counter() {
                const [count, setCount] = useState(0);
                useEffect(() => {}, []);
                return <div onClick={() => setCount(c => c + 1)}>{count}</div>;
            }
        "#;
        
        let hooks = detect_client_hooks(source);
        assert!(hooks.contains(&"useState".to_string()));
        assert!(hooks.contains(&"useEffect".to_string()));
        assert!(hooks.contains(&"event handlers".to_string()));
    }
    
    #[test]
    fn test_extract_exports() {
        let source = r#"
            export const metadata = { title: 'Test' };
            export function generateMetadata() {}
            export default function Page() {}
        "#;
        
        let exports = extract_exports(source);
        assert!(exports.contains(&"default".to_string()));
        assert!(exports.contains(&"metadata".to_string()));
        assert!(exports.contains(&"generateMetadata".to_string()));
    }
    
    #[test]
    fn test_component_type() {
        assert_eq!(ComponentType::from_filename("page"), ComponentType::Page);
        assert_eq!(ComponentType::from_filename("layout"), ComponentType::Layout);
        assert_eq!(ComponentType::from_filename("loading"), ComponentType::Loading);
        assert_eq!(ComponentType::from_filename("Button"), ComponentType::Component);
    }
}
