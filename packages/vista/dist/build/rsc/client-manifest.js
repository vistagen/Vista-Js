"use strict";
/**
 * Client Component Manifest Generator
 *
 * Scans the app directory and builds a manifest of all Client Components.
 * Client components are those with 'client load' directive.
 *
 * The manifest maps component paths to their chunk names for client-side loading.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateClientManifest = generateClientManifest;
exports.getClientComponent = getClientComponent;
exports.getClientComponentByPath = getClientComponentByPath;
exports.isClientComponentPath = isClientComponentPath;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
// Try to load Rust NAPI bindings
let rustNative = null;
try {
    const possiblePaths = [
        path_1.default.resolve(__dirname, '../../../../../crates/vista-napi'),
        path_1.default.resolve(__dirname, '../../../../crates/vista-napi'),
    ];
    for (const p of possiblePaths) {
        try {
            rustNative = require(p);
            break;
        }
        catch (e) {
            // Try next
        }
    }
}
catch (e) {
    // Fallback to JS
}
/**
 * Check if source has 'client load' directive
 */
function hasClientDirective(source) {
    if (rustNative?.isClientComponent) {
        return rustNative.isClientComponent(source);
    }
    const trimmed = source.trim();
    return trimmed.startsWith("'client load'") || trimmed.startsWith('"client load"');
}
/**
 * Extract export names from source (simple regex approach)
 */
function extractExports(source) {
    const exports = [];
    // Default export
    if (/export\s+default\s+/.test(source)) {
        exports.push('default');
    }
    // Named exports: export function Name, export const Name, export class Name
    const namedExportRegex = /export\s+(?:async\s+)?(?:function|const|let|var|class)\s+([A-Z][a-zA-Z0-9_]*)/g;
    let match;
    while ((match = namedExportRegex.exec(source)) !== null) {
        exports.push(match[1]);
    }
    // Export { Name1, Name2 }
    const reExportRegex = /export\s+\{([^}]+)\}/g;
    while ((match = reExportRegex.exec(source)) !== null) {
        const names = match[1]
            .split(',')
            .map((n) => n
            .trim()
            .split(/\s+as\s+/)
            .pop()
            ?.trim())
            .filter(Boolean);
        exports.push(...names);
    }
    return [...new Set(exports)];
}
/**
 * Generate a unique chunk name for a component
 */
function generateChunkName(relativePath) {
    return relativePath
        .replace(/\\/g, '/')
        .replace(/\.[jt]sx?$/, '')
        .replace(/[^a-zA-Z0-9]/g, '_')
        .toLowerCase();
}
/**
 * Generate unique module ID
 */
function generateModuleId(relativePath) {
    // Use a hash-like ID for production, readable path for dev
    const normalized = relativePath.replace(/\\/g, '/').replace(/\.[jt]sx?$/, '');
    return `client:${normalized}`;
}
/**
 * Scan directory recursively for client components
 */
function scanForClientComponents(dir, appDir, components) {
    if (!fs_1.default.existsSync(dir))
        return;
    const items = fs_1.default.readdirSync(dir, { withFileTypes: true });
    for (const item of items) {
        const fullPath = path_1.default.join(dir, item.name);
        if (item.isDirectory()) {
            if (!item.name.startsWith('.') && item.name !== 'node_modules') {
                scanForClientComponents(fullPath, appDir, components);
            }
        }
        else if (item.isFile()) {
            const ext = path_1.default.extname(item.name);
            if (!['.tsx', '.ts', '.jsx', '.js'].includes(ext))
                continue;
            try {
                const source = fs_1.default.readFileSync(fullPath, 'utf-8');
                if (hasClientDirective(source)) {
                    const relativePath = path_1.default.relative(appDir, fullPath);
                    const moduleId = generateModuleId(relativePath);
                    components.push({
                        id: moduleId,
                        path: relativePath,
                        absolutePath: fullPath,
                        chunkName: generateChunkName(relativePath),
                        exports: extractExports(source),
                        async: false,
                    });
                }
            }
            catch (e) {
                console.warn(`[Vista RSC] Failed to read ${fullPath}:`, e);
            }
        }
    }
}
/**
 * Generate the client component manifest
 */
function generateClientManifest(cwd, appDir) {
    const components = [];
    scanForClientComponents(appDir, appDir, components);
    const clientModules = {};
    const pathToId = {};
    const ssrModuleMapping = {};
    for (const component of components) {
        clientModules[component.id] = component;
        pathToId[component.path] = component.id;
        pathToId[component.absolutePath] = component.id;
        // Map server path to client chunk for SSR
        ssrModuleMapping[component.absolutePath] = `/_vista/static/chunks/${component.chunkName}.js`;
    }
    // Get or generate build ID
    const buildIdPath = path_1.default.join(cwd, '.vista', 'BUILD_ID');
    let buildId = 'dev';
    try {
        if (fs_1.default.existsSync(buildIdPath)) {
            buildId = fs_1.default.readFileSync(buildIdPath, 'utf-8').trim();
        }
    }
    catch (e) {
        // Use dev
    }
    return {
        buildId,
        clientModules,
        pathToId,
        ssrModuleMapping,
    };
}
/**
 * Get client component info by module ID
 */
function getClientComponent(manifest, moduleId) {
    return manifest.clientModules[moduleId];
}
/**
 * Get client component by file path
 */
function getClientComponentByPath(manifest, filePath) {
    const moduleId = manifest.pathToId[filePath];
    if (!moduleId)
        return undefined;
    return manifest.clientModules[moduleId];
}
/**
 * Check if a path is a client component
 */
function isClientComponentPath(manifest, filePath) {
    return filePath in manifest.pathToId;
}
