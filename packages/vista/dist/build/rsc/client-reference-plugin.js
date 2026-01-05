"use strict";
/**
 * Vista Client Reference Plugin
 *
 * Webpack plugin that transforms server component imports in the client bundle.
 *
 * When a client bundle imports a server component, this plugin:
 * 1. Replaces the import with a client reference proxy
 * 2. The proxy throws an error if used on the client (server components can't run on client)
 * 3. For valid patterns (passing server component as children), the reference works
 *
 * This ensures:
 * - Server code never leaks to the client bundle
 * - Server components contribute 0kb to client JavaScript
 * - Clear error messages when misusing server components
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClientReferencePlugin = void 0;
const webpack_1 = __importDefault(require("webpack"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
/**
 * Virtual module that provides server component proxies
 * These proxies throw helpful errors when server components are incorrectly used client-side
 */
const SERVER_COMPONENT_PROXY = `
// Vista Server Component Proxy
// This module is injected when a client bundle tries to import a server component

export function createServerComponentProxy(id, name) {
    const proxy = function ServerComponentProxy(props) {
        throw new Error(
            \`[Vista] Cannot render server component "\${name}" on the client.\n\` +
            \`Server components can only be rendered on the server.\n\n\` +
            \`To fix this:\n\` +
            \`1. If you need interactivity, add 'client load' at the top of the component file\n\` +
            \`2. If passing as children, ensure the parent is a client component\n\` +
            \`\nComponent ID: \${id}\`
        );
    };
    
    proxy.$$typeof = Symbol.for('vista.server.reference');
    proxy.$$id = id;
    proxy.$$name = name;
    
    return proxy;
}

export default createServerComponentProxy;
`;
/**
 * Check if a file is a client component by reading 'client load' directive
 */
function isClientComponent(filePath) {
    try {
        const content = fs_1.default.readFileSync(filePath, 'utf-8');
        const trimmed = content.trim();
        return trimmed.startsWith("'client load'") || trimmed.startsWith('"client load"');
    }
    catch {
        return false;
    }
}
/**
 * Client Reference Plugin
 *
 * Transforms imports of server components in the client bundle
 */
class ClientReferencePlugin {
    appDir;
    clientManifestPath;
    clientManifest = null;
    constructor(options) {
        this.appDir = options.appDir;
        this.clientManifestPath = options.clientManifestPath;
    }
    apply(compiler) {
        const pluginName = 'VistaClientReferencePlugin';
        // Load client manifest
        compiler.hooks.beforeCompile.tap(pluginName, () => {
            this.loadManifest();
        });
        // Provide virtual module for server component proxies
        compiler.hooks.normalModuleFactory.tap(pluginName, (nmf) => {
            nmf.hooks.beforeResolve.tap(pluginName, (resolveData) => {
                if (!resolveData)
                    return;
                // Check if this is importing a server component from client code
                const request = resolveData.request;
                if (request === 'vista/server-component-proxy') {
                    // Virtual module - allow it to continue
                    return;
                }
            });
            nmf.hooks.afterResolve.tap(pluginName, (resolveData) => {
                if (!resolveData || !resolveData.createData)
                    return;
                const resourcePath = resolveData.createData.resource;
                if (!resourcePath)
                    return;
                // Check if this is a file in the app directory
                if (!resourcePath.startsWith(this.appDir))
                    return;
                // Check if this is a TypeScript/JavaScript file
                if (!/\.[jt]sx?$/.test(resourcePath))
                    return;
                // Check if this is a server component (NOT a client component)
                if (!isClientComponent(resourcePath)) {
                    // This is a server component being imported in client bundle
                    // We need to replace it with a proxy
                    // Mark it for replacement (use any to add custom properties)
                    resolveData.createData.vistaServerComponent = true;
                    resolveData.createData.vistaComponentId = this.getComponentId(resourcePath);
                }
            });
        });
        // Transform the module content for server components
        compiler.hooks.compilation.tap(pluginName, (compilation) => {
            // Add the server component proxy to the beginning of affected modules
            compilation.hooks.succeedModule.tap(pluginName, (module) => {
                if (module.vistaServerComponent) {
                    // This module is a server component - it should be replaced with a proxy
                    // In practice, we handle this via the loader
                }
            });
        });
        // Add a loader to handle server component replacement
        compiler.options.module?.rules?.push({
            test: /\.[jt]sx?$/,
            include: this.appDir,
            enforce: 'pre',
            use: [
                {
                    loader: require.resolve('./server-component-loader'),
                    options: {
                        appDir: this.appDir,
                        clientManifestPath: this.clientManifestPath,
                    },
                },
            ],
        });
        // Generate client reference manifest for runtime
        compiler.hooks.emit.tap(pluginName, (compilation) => {
            if (this.clientManifest) {
                const runtimeManifest = this.generateRuntimeManifest();
                const manifestSource = JSON.stringify(runtimeManifest, null, 2);
                compilation.emitAsset('client-reference-manifest.json', new webpack_1.default.sources.RawSource(manifestSource));
            }
        });
    }
    loadManifest() {
        try {
            if (fs_1.default.existsSync(this.clientManifestPath)) {
                const content = fs_1.default.readFileSync(this.clientManifestPath, 'utf-8');
                this.clientManifest = JSON.parse(content);
            }
        }
        catch (e) {
            console.warn('[Vista] Failed to load client manifest:', e);
        }
    }
    getComponentId(filePath) {
        const relative = path_1.default.relative(this.appDir, filePath);
        return `server:${relative.replace(/\\/g, '/').replace(/\.[jt]sx?$/, '')}`;
    }
    generateRuntimeManifest() {
        if (!this.clientManifest)
            return {};
        return {
            clientModules: Object.keys(this.clientManifest.clientModules).reduce((acc, key) => {
                const entry = this.clientManifest.clientModules[key];
                acc[key] = {
                    id: entry.id,
                    chunks: [entry.chunkName],
                    name: entry.exports[0] || 'default',
                };
                return acc;
            }, {}),
        };
    }
}
exports.ClientReferencePlugin = ClientReferencePlugin;
