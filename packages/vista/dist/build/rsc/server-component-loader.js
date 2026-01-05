"use strict";
/**
 * Vista Server Component Loader
 *
 * Webpack loader that transforms server component imports in client bundles.
 *
 * When a server component is imported in a client bundle:
 * 1. The loader detects if the file has 'client load' directive
 * 2. If NOT a client component, replace the module with a proxy
 * 3. The proxy provides helpful error messages when misused
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = serverComponentLoader;
const path_1 = __importDefault(require("path"));
/**
 * Check if source has 'client load' directive
 */
function hasClientDirective(source) {
    const trimmed = source.trim();
    return trimmed.startsWith("'client load'") || trimmed.startsWith('"client load"');
}
/**
 * Extract the component name from exports
 */
function extractComponentName(source) {
    // Try to find "export default function ComponentName" or "export default ComponentName"
    const defaultFuncMatch = source.match(/export\s+default\s+function\s+([A-Z][a-zA-Z0-9_]*)/);
    if (defaultFuncMatch)
        return defaultFuncMatch[1];
    const defaultClassMatch = source.match(/export\s+default\s+class\s+([A-Z][a-zA-Z0-9_]*)/);
    if (defaultClassMatch)
        return defaultClassMatch[1];
    const defaultConstMatch = source.match(/export\s+default\s+([A-Z][a-zA-Z0-9_]*)/);
    if (defaultConstMatch)
        return defaultConstMatch[1];
    return 'ServerComponent';
}
/**
 * Server Component Loader
 */
function serverComponentLoader(source) {
    const options = this.getOptions();
    const resourcePath = this.resourcePath;
    // Only process files in the app directory
    if (!resourcePath.startsWith(options.appDir)) {
        return source;
    }
    // If this IS a client component, pass through unchanged
    if (hasClientDirective(source)) {
        return source;
    }
    // This is a server component - we need to check how it's being used
    //
    // The key insight: we're building the CLIENT bundle here.
    // Server components should NOT be in the client bundle at all.
    //
    // However, there are valid use cases:
    // 1. A client component might import a server component's TYPE only
    // 2. A server component might be passed as children (rendered server-side)
    //
    // For safety, we replace the module with a proxy that:
    // - Exports a function that throws a helpful error
    // - Has a special marker so the RSC renderer can handle it
    const relativePath = path_1.default.relative(options.appDir, resourcePath);
    const componentId = `server:${relativePath.replace(/\\/g, '/').replace(/\.[jt]sx?$/, '')}`;
    const componentName = extractComponentName(source);
    // Generate proxy module
    const proxyModule = `
// Vista Server Component Proxy
// This file was transformed because "${relativePath}" is a Server Component
// Server Components cannot be rendered on the client.

import * as React from 'react';

const componentId = ${JSON.stringify(componentId)};
const componentName = ${JSON.stringify(componentName)};

function ServerComponentError(props) {
    if (typeof window !== 'undefined') {
        console.error(
            \`[Vista RSC] Attempted to render server component "\${componentName}" on the client.\`,
            \`\\nServer components can only be rendered on the server.\`,
            \`\\nTo fix: add 'client load' at the top of the file if you need client-side interactivity.\`
        );
    }
    
    // In development, show an error UI
    if (process.env.NODE_ENV === 'development') {
        return React.createElement('div', {
            style: {
                padding: '20px',
                background: '#fee2e2',
                border: '2px solid #ef4444',
                borderRadius: '8px',
                color: '#991b1b',
                fontFamily: 'monospace',
            }
        }, [
            React.createElement('h3', { key: 'title', style: { margin: '0 0 10px 0' } }, '⚠️ Server Component Error'),
            React.createElement('p', { key: 'msg', style: { margin: '0 0 10px 0' } }, 
                \`Component "\${componentName}" is a Server Component and cannot be rendered on the client.\`
            ),
            React.createElement('p', { key: 'fix', style: { margin: 0, fontSize: '12px' } }, 
                "Add 'client load' at the top of the file to make it a Client Component."
            ),
        ]);
    }
    
    // In production, render nothing (the server should have rendered it)
    return null;
}

// Mark as server component reference
ServerComponentError.$$typeof = Symbol.for('vista.server.reference');
ServerComponentError.$$id = componentId;
ServerComponentError.$$name = componentName;

// Re-export any named exports as proxies too
${extractNamedExports(source)
        .map((name) => `
export const ${name} = ServerComponentError;
`)
        .join('\n')}

export default ServerComponentError;
`;
    return proxyModule;
}
/**
 * Extract named exports from source
 */
function extractNamedExports(source) {
    const exports = [];
    // Match: export const/let/var Name, export function Name, export class Name
    const namedRegex = /export\s+(?:const|let|var|function|class)\s+([A-Z][a-zA-Z0-9_]*)/g;
    let match;
    while ((match = namedRegex.exec(source)) !== null) {
        exports.push(match[1]);
    }
    return exports;
}
// Also export the raw loader for Webpack
module.exports = serverComponentLoader;
module.exports.default = serverComponentLoader;
