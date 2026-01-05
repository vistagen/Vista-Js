//! RSC Payload Serializer
//! 
//! Serializes React Server Components to a streamable format.
//! This is Vista's implementation of the React Flight protocol.
//! 
//! The RSC payload contains:
//! - Server-rendered HTML
//! - Client component references (holes to fill)
//! - Props and data for hydration

use std::collections::HashMap;
use serde::{Serialize, Deserialize};

/// Reference to a client component that needs hydration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ClientReference {
    /// Unique ID matching client manifest
    pub id: String,
    /// DOM element ID where component mounts
    pub mount_id: String,
    /// Serialized props for the component
    pub props: HashMap<String, SerializedValue>,
    /// Chunk URL to load
    pub chunk_url: String,
    /// Export name to use
    pub export_name: String,
}

/// Serialized value types for props
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", content = "value")]
pub enum SerializedValue {
    Null,
    Undefined,
    Boolean(bool),
    Number(f64),
    String(String),
    Date(String),
    Array(Vec<SerializedValue>),
    Object(HashMap<String, SerializedValue>),
    /// Reference to a React element rendered on server
    ReactElement { id: String },
    /// Symbol reference
    Symbol(String),
    /// Function (cannot be serialized - marker only)
    Function { name: String },
}

/// RSC Payload - the complete data structure sent to client
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RSCPayload {
    /// Server-rendered HTML string
    pub html: String,
    /// Client component references for hydration
    pub client_references: Vec<ClientReference>,
    /// Route data
    pub data: RouteData,
    /// Build ID for cache validation
    pub build_id: String,
}

/// Route-specific data
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RouteData {
    /// Current route pattern
    pub route: String,
    /// URL parameters
    pub params: HashMap<String, String>,
    /// Search parameters
    pub search_params: HashMap<String, String>,
}

/// Counter for generating unique mount IDs
static MOUNT_ID_COUNTER: std::sync::atomic::AtomicUsize = std::sync::atomic::AtomicUsize::new(0);

/// Reset mount ID counter (call at start of each request)
pub fn reset_mount_counter() {
    MOUNT_ID_COUNTER.store(0, std::sync::atomic::Ordering::SeqCst);
}

/// Generate unique mount ID for a client component
pub fn generate_mount_id() -> String {
    let id = MOUNT_ID_COUNTER.fetch_add(1, std::sync::atomic::Ordering::SeqCst);
    format!("__vista_cc_{}", id)
}

/// Serialize a JavaScript value to SerializedValue
pub fn serialize_value(value: &serde_json::Value) -> SerializedValue {
    match value {
        serde_json::Value::Null => SerializedValue::Null,
        serde_json::Value::Bool(b) => SerializedValue::Boolean(*b),
        serde_json::Value::Number(n) => {
            SerializedValue::Number(n.as_f64().unwrap_or(0.0))
        }
        serde_json::Value::String(s) => {
            // Check for special serialized types
            if s.starts_with("__DATE__:") {
                SerializedValue::Date(s[9..].to_string())
            } else if s.starts_with("__SYMBOL__:") {
                SerializedValue::Symbol(s[11..].to_string())
            } else {
                SerializedValue::String(s.clone())
            }
        }
        serde_json::Value::Array(arr) => {
            SerializedValue::Array(arr.iter().map(serialize_value).collect())
        }
        serde_json::Value::Object(obj) => {
            // Check for special object types
            if let Some(type_marker) = obj.get("__type") {
                if let serde_json::Value::String(t) = type_marker {
                    match t.as_str() {
                        "undefined" => return SerializedValue::Undefined,
                        "Date" => {
                            if let Some(serde_json::Value::String(v)) = obj.get("value") {
                                return SerializedValue::Date(v.clone());
                            }
                        }
                        "ReactElement" => {
                            if let Some(serde_json::Value::String(id)) = obj.get("id") {
                                return SerializedValue::ReactElement { id: id.clone() };
                            }
                        }
                        "Function" => {
                            if let Some(serde_json::Value::String(name)) = obj.get("name") {
                                return SerializedValue::Function { name: name.clone() };
                            }
                        }
                        _ => {}
                    }
                }
            }
            
            SerializedValue::Object(
                obj.iter()
                    .map(|(k, v)| (k.clone(), serialize_value(v)))
                    .collect()
            )
        }
    }
}

/// Create a client reference for a component
pub fn create_client_reference(
    module_id: &str,
    chunk_url: &str,
    props: HashMap<String, SerializedValue>,
) -> ClientReference {
    ClientReference {
        id: module_id.to_string(),
        mount_id: generate_mount_id(),
        props,
        chunk_url: chunk_url.to_string(),
        export_name: "default".to_string(),
    }
}

/// Generate the hydration script for client-side
pub fn generate_hydration_script(payload: &RSCPayload) -> String {
    let data_json = serde_json::to_string(&payload.data).unwrap_or_default();
    let refs_json = serde_json::to_string(&payload.client_references).unwrap_or_default();
    
    format!(r#"
<script>
    window.__VISTA_RSC_DATA__ = {data_json};
    window.__VISTA_CLIENT_REFERENCES__ = {refs_json};
    window.__VISTA_BUILD_ID__ = "{build_id}";
</script>
<script type="module">
    const refs = window.__VISTA_CLIENT_REFERENCES__;
    
    async function hydrateAll() {{
        for (const ref of refs) {{
            try {{
                const mod = await import(ref.chunk_url);
                const Comp = mod[ref.export_name] || mod.default;
                const el = document.getElementById(ref.mount_id);
                if (el && Comp) {{
                    const {{ hydrateRoot }} = await import('react-dom/client');
                    const React = await import('react');
                    const props = deserializeProps(ref.props);
                    hydrateRoot(el, React.createElement(Comp, props));
                }}
            }} catch (e) {{
                console.error('[Vista RSC] Hydration error:', ref.id, e);
            }}
        }}
    }}
    
    function deserializeProps(props) {{
        const result = {{}};
        for (const [k, v] of Object.entries(props)) {{
            result[k] = deserializeValue(v);
        }}
        return result;
    }}
    
    function deserializeValue(v) {{
        if (!v || typeof v !== 'object') return v;
        switch (v.type) {{
            case 'Null': return null;
            case 'Undefined': return undefined;
            case 'Boolean': return v.value;
            case 'Number': return v.value;
            case 'String': return v.value;
            case 'Date': return new Date(v.value);
            case 'Array': return v.value.map(deserializeValue);
            case 'Object': return deserializeProps(v.value);
            default: return v.value;
        }}
    }}
    
    if (document.readyState === 'loading') {{
        document.addEventListener('DOMContentLoaded', hydrateAll);
    }} else {{
        hydrateAll();
    }}
</script>
"#, 
        data_json = data_json,
        refs_json = refs_json,
        build_id = payload.build_id,
    )
}

/// Encode RSC payload for streaming
pub fn encode_rsc_payload(payload: &RSCPayload) -> Vec<u8> {
    serde_json::to_vec(payload).unwrap_or_default()
}

/// Decode RSC payload from bytes
pub fn decode_rsc_payload(bytes: &[u8]) -> Option<RSCPayload> {
    serde_json::from_slice(bytes).ok()
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_generate_mount_id() {
        reset_mount_counter();
        assert_eq!(generate_mount_id(), "__vista_cc_0");
        assert_eq!(generate_mount_id(), "__vista_cc_1");
        assert_eq!(generate_mount_id(), "__vista_cc_2");
    }
    
    #[test]
    fn test_serialize_value() {
        let json = serde_json::json!({
            "name": "test",
            "count": 42,
            "active": true,
            "items": [1, 2, 3]
        });
        
        let serialized = serialize_value(&json);
        
        if let SerializedValue::Object(obj) = serialized {
            assert!(obj.contains_key("name"));
            assert!(obj.contains_key("count"));
        } else {
            panic!("Expected Object");
        }
    }
    
    #[test]
    fn test_create_client_reference() {
        reset_mount_counter();
        
        let mut props = HashMap::new();
        props.insert("title".to_string(), SerializedValue::String("Hello".to_string()));
        
        let ref_ = create_client_reference(
            "client:components/Button",
            "/_vista/static/chunks/button.js",
            props,
        );
        
        assert_eq!(ref_.id, "client:components/Button");
        assert_eq!(ref_.mount_id, "__vista_cc_0");
        assert_eq!(ref_.export_name, "default");
    }
}
