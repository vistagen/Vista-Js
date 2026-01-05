"use strict";
/**
 * Vista RSC Module System
 *
 * Intercepts require() calls for client components during SSR.
 * Client components are replaced with placeholder divs that will be
 * hydrated on the client side.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeRSCModuleSystem = initializeRSCModuleSystem;
exports._getMountId = _getMountId;
exports._addReference = _addReference;
exports.resetRSCState = resetRSCState;
exports.getClientReferences = getClientReferences;
exports.shutdownRSCModuleSystem = shutdownRSCModuleSystem;
const path_1 = __importDefault(require("path"));
const module_1 = __importDefault(require("module"));
// Global state for RSC rendering
let clientManifest = null;
let clientReferences = [];
let mountIdCounter = 0;
let isInitialized = false;
let originalCompile = null;
/**
 * Check if file content has 'client load' directive
 */
function hasClientDirective(content) {
    const trimmed = content.trim();
    return trimmed.startsWith("'client load'") || trimmed.startsWith('"client load"');
}
/**
 * Initialize the RSC module system
 * Must be called BEFORE any app modules are loaded
 */
function initializeRSCModuleSystem(manifest, cwd) {
    if (isInitialized)
        return;
    clientManifest = manifest;
    isInitialized = true;
    // Hook into Module._compile which is called for every loaded module
    originalCompile = module_1.default.prototype._compile;
    module_1.default.prototype._compile = function (content, filename) {
        // Check if this is a TypeScript/JavaScript file with client directive
        if (/\.[jt]sx?$/.test(filename) && hasClientDirective(content)) {
            const basename = path_1.default.basename(filename, path_1.default.extname(filename));
            const componentId = `client:${basename}`;
            // This is a client component - return a proxy module that renders a placeholder
            const proxyCode = `
        const React = require('react');
        const clientRefs = require('${__filename.replace(/\\/g, '/')}');
        
        function ClientComponentProxy(props) {
          const mountId = '__vista_cc_' + clientRefs._getMountId();
          const entry = ${JSON.stringify({ id: componentId, chunkName: basename })};
          
          clientRefs._addReference({
            id: entry.id,
            mountId: mountId,
            props: Object.fromEntries(
              Object.entries(props).filter(([k, v]) => 
                k !== 'children' && typeof v !== 'function' && !React.isValidElement(v)
              )
            ),
            chunkUrl: '/_vista/static/chunks/' + entry.chunkName + '.js',
            exportName: 'default'
          });
          
          // Return a placeholder div that will be hydrated on the client
          return React.createElement('div', {
            id: mountId,
            'data-vista-cc': entry.id,
            'data-vista-mount': mountId,
            style: { display: 'contents' }
          }, 'Loading...');
        }
        
        module.exports = ClientComponentProxy;
        module.exports.default = ClientComponentProxy;
        module.exports.__esModule = true;
      `;
            return originalCompile.call(this, proxyCode, filename);
        }
        return originalCompile.call(this, content, filename);
    };
    console.log('[Vista RSC] Module interception initialized');
}
// Helper functions exposed for the proxy code
function _getMountId() {
    return mountIdCounter++;
}
function _addReference(ref) {
    clientReferences.push(ref);
}
/**
 * Reset state for new render
 */
function resetRSCState() {
    clientReferences = [];
    mountIdCounter = 0;
}
/**
 * Get collected client references
 */
function getClientReferences() {
    return [...clientReferences];
}
/**
 * Shutdown the RSC module system
 */
function shutdownRSCModuleSystem() {
    if (originalCompile) {
        module_1.default.prototype._compile = originalCompile;
    }
    clientManifest = null;
    isInitialized = false;
}
