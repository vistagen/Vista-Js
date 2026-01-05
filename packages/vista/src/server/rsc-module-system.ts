/**
 * Vista RSC Module System
 *
 * Intercepts require() calls for client components during SSR.
 * Client components are replaced with placeholder divs that will be
 * hydrated on the client side.
 */

import path from 'path';
import Module from 'module';
import React from 'react';

// Global state for RSC rendering
let clientManifest: any = null;
let clientReferences: ClientReference[] = [];
let mountIdCounter = 0;
let isInitialized = false;
let originalCompile: any = null;

export interface ClientReference {
  id: string;
  mountId: string;
  props: Record<string, any>;
  chunkUrl: string;
  exportName: string;
}

/**
 * Check if file content has 'client load' directive
 */
function hasClientDirective(content: string): boolean {
  const trimmed = content.trim();
  return trimmed.startsWith("'client load'") || trimmed.startsWith('"client load"');
}

/**
 * Initialize the RSC module system
 * Must be called BEFORE any app modules are loaded
 */
export function initializeRSCModuleSystem(manifest: any, cwd?: string) {
  if (isInitialized) return;

  clientManifest = manifest;
  isInitialized = true;

  // Hook into Module._compile which is called for every loaded module
  originalCompile = (Module as any).prototype._compile;

  (Module as any).prototype._compile = function (content: string, filename: string) {
    // Check if this is a TypeScript/JavaScript file with client directive
    if (/\.[jt]sx?$/.test(filename) && hasClientDirective(content)) {
      const basename = path.basename(filename, path.extname(filename));
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
export function _getMountId(): number {
  return mountIdCounter++;
}

export function _addReference(ref: ClientReference): void {
  clientReferences.push(ref);
}

/**
 * Reset state for new render
 */
export function resetRSCState() {
  clientReferences = [];
  mountIdCounter = 0;
}

/**
 * Get collected client references
 */
export function getClientReferences(): ClientReference[] {
  return [...clientReferences];
}

/**
 * Shutdown the RSC module system
 */
export function shutdownRSCModuleSystem() {
  if (originalCompile) {
    (Module as any).prototype._compile = originalCompile;
  }
  clientManifest = null;
  isInitialized = false;
}
