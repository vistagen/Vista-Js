"use strict";
/**
 * Vista File Scanner
 *
 * Scans the app directory and categorizes files as client or server components
 * using Rust NAPI bindings for fast detection.
 *
 * Server Component Rules:
 * - By default, all components are Server Components
 * - Using 'client load' directive makes it a Client Component
 * - Using client hooks (useState, useEffect, etc.) without 'client load' is an ERROR
 *
 * Performance: Uses Rust-powered RSC scanner when available (~10-100x faster)
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRouteTree = getRouteTree;
exports.scanAppDirectory = scanAppDirectory;
exports.isNativeAvailable = isNativeAvailable;
exports.getVersion = getVersion;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const native_scanner_1 = require("../build/rsc/native-scanner");
// Try to load Rust NAPI bindings, fallback to JS if not available
let rustNative = null;
try {
    // Try multiple paths since we might be running from src or dist
    const possiblePaths = [
        // From compiled dist/bin/file-scanner.js
        require('path').resolve(__dirname, '../../../../crates/vista-napi'),
        // From source src/bin/file-scanner.ts
        require('path').resolve(__dirname, '../../../crates/vista-napi'),
        // From workspace root
        require('path').resolve(process.cwd(), '../crates/vista-napi'),
    ];
    for (const p of possiblePaths) {
        try {
            rustNative = require(p);
            console.log(`[Vista] Loaded Rust native bindings from ${p}`);
            break;
        }
        catch (e) {
            // Try next path
        }
    }
    if (!rustNative) {
        console.log('[Vista] Rust native bindings not found, using JS fallback');
    }
}
catch (e) {
    console.log('[Vista] Rust native bindings not found, using JS fallback');
}
function getRouteTree(appDir) {
    if (rustNative && rustNative.getRouteTree) {
        return rustNative.getRouteTree(appDir);
    }
    throw new Error('Vista Rust bindings not loaded. Cannot generate route tree.');
}
// Client-only hooks and APIs that require 'client load' directive
const CLIENT_HOOKS = [
    'useState',
    'useEffect',
    'useLayoutEffect',
    'useReducer',
    'useRef',
    'useImperativeHandle',
    'useCallback',
    'useMemo',
    'useContext',
    'useDebugValue',
    'useDeferredValue',
    'useTransition',
    'useId',
    'useSyncExternalStore',
    'useInsertionEffect',
];
const CLIENT_APIS = [
    'createContext',
    'forwardRef',
    'memo',
    'lazy',
    'startTransition',
    'useFormStatus',
    'useFormState',
    'useOptimistic',
];
const BROWSER_APIS = [
    'window',
    'document',
    'localStorage',
    'sessionStorage',
    'navigator',
    'location',
    'history',
    'addEventListener',
    'removeEventListener',
    'setTimeout',
    'setInterval',
    'requestAnimationFrame',
    'fetch', // Can be server but often client
];
/**
 * Fast check using Rust if available, else JS fallback
 */
function isClientComponent(source) {
    if (rustNative) {
        return rustNative.isClientComponent(source);
    }
    // JS Fallback
    const trimmed = source.trim();
    return trimmed.startsWith("'client load'") || trimmed.startsWith('"client load"');
}
/**
 * Analyze directive with line number
 */
function analyzeClientDirective(source) {
    if (rustNative) {
        return rustNative.analyzeClientDirective(source);
    }
    // JS Fallback
    const isClient = isClientComponent(source);
    let directiveLine = 0;
    if (isClient) {
        const lines = source.split('\n');
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (line.startsWith("'client load'") || line.startsWith('"client load"')) {
                directiveLine = i + 1;
                break;
            }
        }
    }
    return { isClient, directiveLine };
}
/**
 * Detect client-only hooks/APIs used in source
 */
function detectClientHooks(source) {
    const usedHooks = [];
    // Check for React hooks
    for (const hook of CLIENT_HOOKS) {
        // Match hook usage: useState, useState(, useState<
        const regex = new RegExp(`\\b${hook}\\s*[(<]`, 'g');
        if (regex.test(source)) {
            usedHooks.push(hook);
        }
    }
    // Check for client APIs
    for (const api of CLIENT_APIS) {
        const regex = new RegExp(`\\b${api}\\s*[(<]`, 'g');
        if (regex.test(source)) {
            usedHooks.push(api);
        }
    }
    // Check for browser APIs (with more context to avoid false positives)
    for (const api of BROWSER_APIS) {
        // Look for direct usage like window.something or just window
        const regex = new RegExp(`\\b${api}\\s*[.\\[]`, 'g');
        if (regex.test(source)) {
            usedHooks.push(api);
        }
    }
    // Check for event handlers (onClick, onChange, etc.)
    const eventHandlerRegex = /\bon[A-Z][a-zA-Z]*\s*=/g;
    if (eventHandlerRegex.test(source)) {
        usedHooks.push('event handlers (onClick, onChange, etc.)');
    }
    return [...new Set(usedHooks)]; // Remove duplicates
}
/**
 * Extract exports from source (basic detection)
 */
function extractExports(source) {
    const exports = [];
    const lines = source.split('\n');
    for (const line of lines) {
        const trimmed = line.trim();
        // export default function Name
        if (trimmed.startsWith('export default function ')) {
            const match = trimmed.match(/export default function (\w+)/);
            if (match)
                exports.push(match[1]);
        }
        // export function Name
        else if (trimmed.startsWith('export function ')) {
            const match = trimmed.match(/export function (\w+)/);
            if (match)
                exports.push(match[1]);
        }
        // export const Name
        else if (trimmed.startsWith('export const ')) {
            const match = trimmed.match(/export const (\w+)/);
            if (match)
                exports.push(match[1]);
        }
        // export default
        else if (trimmed.startsWith('export default')) {
            exports.push('default');
        }
    }
    return exports;
}
/**
 * Recursively scan directory for TypeScript/TSX files
 */
function scanDirectory(dir, baseDir, errors) {
    const results = [];
    if (!fs.existsSync(dir)) {
        return results;
    }
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            // Skip node_modules and hidden directories
            if (entry.name.startsWith('.') || entry.name === 'node_modules') {
                continue;
            }
            results.push(...scanDirectory(fullPath, baseDir, errors));
        }
        else if (entry.isFile() && /\.(tsx?|jsx?)$/.test(entry.name)) {
            const source = fs.readFileSync(fullPath, 'utf-8');
            const analysis = analyzeClientDirective(source);
            const exports = extractExports(source);
            const clientHooksUsed = detectClientHooks(source);
            let hasError = false;
            let errorMessage;
            // ERROR: Using client hooks without 'client load' directive
            if (!analysis.isClient && clientHooksUsed.length > 0) {
                hasError = true;
                const hookList = clientHooksUsed.slice(0, 3).join(', ');
                const more = clientHooksUsed.length > 3 ? ` and ${clientHooksUsed.length - 3} more` : '';
                errorMessage = `Server Component Error: You're using ${hookList}${more} in a Server Component.\n\nTo fix this, add 'client load' at the top of your file to make it a Client Component:\n\n'client load';\n\nimport ...`;
                errors.push({
                    file: path.relative(baseDir, fullPath),
                    message: errorMessage,
                    hooks: clientHooksUsed,
                });
            }
            results.push({
                absolutePath: fullPath,
                relativePath: path.relative(baseDir, fullPath),
                isClient: analysis.isClient,
                directiveLine: analysis.directiveLine,
                exports,
                clientHooksUsed,
                hasError,
                errorMessage,
            });
        }
    }
    return results;
}
/**
 * Scan the app directory and return categorized files
 * Uses Rust-powered RSC scanner when available for ~10-100x faster performance
 */
function scanAppDirectory(appDir) {
    // Try native RSC scanner first (Rust-powered, much faster)
    if ((0, native_scanner_1.isNativeAvailable)()) {
        const nativeResult = (0, native_scanner_1.scanAppNative)(appDir);
        if (nativeResult) {
            const converted = (0, native_scanner_1.convertScanResult)(nativeResult);
            // Transform to our ScanResult format
            const result = {
                clientComponents: converted.clientComponents.map((c) => ({
                    absolutePath: c.absolutePath,
                    relativePath: c.relativePath,
                    isClient: c.isClient,
                    directiveLine: c.directiveLine,
                    exports: c.exports,
                    clientHooksUsed: c.clientHooksUsed,
                    hasError: false,
                    errorMessage: undefined,
                })),
                serverComponents: converted.serverComponents.map((c) => ({
                    absolutePath: c.absolutePath,
                    relativePath: c.relativePath,
                    isClient: false,
                    directiveLine: 0,
                    exports: c.exports,
                    clientHooksUsed: [],
                    hasError: false,
                    errorMessage: undefined,
                })),
                layouts: nativeResult.layouts.map((c) => ({
                    absolutePath: c.absolutePath,
                    relativePath: c.relativePath,
                    isClient: c.isClient,
                    directiveLine: c.directiveLine,
                    exports: c.exports,
                    clientHooksUsed: c.clientHooksUsed,
                    hasError: false,
                    errorMessage: undefined,
                })),
                pages: nativeResult.pages.map((c) => ({
                    absolutePath: c.absolutePath,
                    relativePath: c.relativePath,
                    isClient: c.isClient,
                    directiveLine: c.directiveLine,
                    exports: c.exports,
                    clientHooksUsed: c.clientHooksUsed,
                    hasError: false,
                    errorMessage: undefined,
                })),
                errors: nativeResult.errors.map((e) => ({
                    file: e.file,
                    message: e.message,
                    hooks: e.hooks,
                })),
            };
            return result;
        }
    }
    // Fallback to JS-based scanner
    const errors = [];
    const files = scanDirectory(appDir, appDir, errors);
    const result = {
        clientComponents: [],
        serverComponents: [],
        layouts: [],
        pages: [],
        errors,
    };
    for (const file of files) {
        const basename = path.basename(file.relativePath, path.extname(file.relativePath));
        // Categorize by file convention
        if (basename === 'root' || basename === 'layout') {
            result.layouts.push(file);
        }
        else if (basename === 'index' || basename === 'page') {
            result.pages.push(file);
        }
        else if (basename === 'not-found') {
            result.notFound = file;
        }
        else if (basename === 'error') {
            result.error = file;
        }
        else if (basename === 'loading') {
            result.loading = file;
        }
        // Also categorize by client/server
        if (file.isClient) {
            result.clientComponents.push(file);
        }
        else {
            result.serverComponents.push(file);
        }
    }
    return result;
}
/**
 * Check if Rust native bindings are available
 */
function isNativeAvailable() {
    return rustNative !== null || (0, native_scanner_1.isNativeAvailable)();
}
/**
 * Get version info
 */
function getVersion() {
    if (rustNative && rustNative.version) {
        return rustNative.version();
    }
    return '0.1.0-js-fallback';
}
