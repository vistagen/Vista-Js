import path from 'path';
import fs from 'fs';
import webpack from 'webpack';
import { createWebpackConfig } from './webpack.config';
import { scanAppDirectory, isNativeAvailable, getVersion } from './file-scanner';
import {
  createVistaDirectories,
  getBuildId,
  writeCanonicalVistaArtifacts,
} from '../build/manifest';
import { loadConfig, resolveStructureValidationConfig } from '../config';
import { CLIENT_COMPONENTS_FLAG, SSE_ENDPOINT } from '../constants';
import {
  validateAppStructure,
  type StructureValidationResult,
} from '../server/structure-validator';
import { logValidationResult, formatBuildFailTable } from '../server/structure-log';

const _debug = !!process.env.VISTA_DEBUG;

interface RouteArtifactEntry {
  pattern: string;
  pagePath: string;
  type: 'static' | 'dynamic' | 'catch-all';
}

// Helper to run PostCSS
function runPostCSS(cwd: string, vistaDir: string) {
  const globalsCss = path.join(cwd, 'app/globals.css');
  if (fs.existsSync(globalsCss)) {
    if (_debug) console.log('Building CSS with PostCSS...');
    const { execSync } = require('child_process');
    try {
      const cssOut = path.join(vistaDir, 'client.css');
      execSync(`npx postcss app/globals.css -o "${cssOut}"`, {
        stdio: _debug ? 'inherit' : 'pipe',
        cwd,
      });
      if (_debug) console.log('CSS Built Successfully!');
    } catch (cssErr) {
      console.error('CSS Build failed (PostCSS error).');
    }
  }
}

function collectRouteArtifactEntries(
  node: any,
  segments: string[] = [],
  entries: RouteArtifactEntry[] = []
): RouteArtifactEntry[] {
  const nextSegments = [...segments];
  if (node.segment) {
    if (node.kind === 'dynamic') {
      nextSegments.push(`:${node.segment}`);
    } else if (node.kind === 'catch-all') {
      nextSegments.push(`:${node.segment}*`);
    } else if (node.kind !== 'group') {
      nextSegments.push(node.segment);
    }
  }

  if (node.indexPath) {
    const pattern = nextSegments.length === 0 ? '/' : `/${nextSegments.join('/')}`;
    const type: RouteArtifactEntry['type'] = pattern.includes('*')
      ? 'catch-all'
      : pattern.includes(':')
        ? 'dynamic'
        : 'static';
    entries.push({
      pattern,
      pagePath: String(node.indexPath),
      type,
    });
  }

  if (Array.isArray(node.children)) {
    node.children.forEach((child: any) =>
      collectRouteArtifactEntries(child, nextSegments, entries)
    );
  }

  return entries;
}

// Generate Client Entry File - TRUE RSC
// Only imports components with 'use client' directive
function generateClientEntry(
  cwd: string,
  vistaDir: string,
  clientComponents: Array<{ relativePath: string; absolutePath: string }>,
  isDev: boolean = false
) {
  const appDir = path.join(cwd, 'app');

  // Generate imports ONLY for client components
  const clientImports: string[] = [];
  const clientRegistrations: string[] = [];

  clientComponents.forEach((comp, index) => {
    const relativePath = './' + path.relative(vistaDir, comp.absolutePath).replace(/\\/g, '/');
    const componentName = `ClientComponent_${index}`;
    const componentId = comp.relativePath.replace(/\\/g, '/').replace(/\.(tsx|ts|jsx|js)$/, '');

    // Extract just the component name (e.g., "Navbar" from "components/Navbar")
    const baseName = path.basename(comp.relativePath).replace(/\.(tsx|ts|jsx|js)$/, '');
    const lowercaseName = baseName.toLowerCase();

    clientImports.push(`import ${componentName} from "${relativePath}";`);
    // Register by full path (for standard RSC)
    clientRegistrations.push(`  "${componentId}": ${componentName},`);
    // Also register by lowercase name (for <Client> wrapper compatibility)
    clientRegistrations.push(`  "${lowercaseName}": ${componentName},`);
  });

  // Get Route Tree from Rust (but DON'T bundle server components)
  const { getRouteTree } = require('./file-scanner');
  let routeTree;
  try {
    routeTree = getRouteTree(appDir);
  } catch (e) {
    console.error('Failed to generate route tree:', e);
    process.exit(1);
  }

  // For RSC, we only serialize the STRUCTURE, not the components
  // Components are loaded separately
  function serializeRouteStructure(node: any): string {
    const props = [];
    props.push(`segment: "${node.segment}"`);
    props.push(`kind: "${node.kind}"`);

    // Store paths as strings, NOT require() - server renders these
    if (node.indexPath) {
      const componentId = path
        .relative(appDir, node.indexPath)
        .replace(/\\/g, '/')
        .replace(/\.(tsx|ts|jsx|js)$/, '');
      props.push(`indexId: "${componentId}"`);
    }
    if (node.layoutPath) {
      const componentId = path
        .relative(appDir, node.layoutPath)
        .replace(/\\/g, '/')
        .replace(/\.(tsx|ts|jsx|js)$/, '');
      props.push(`layoutId: "${componentId}"`);
    }
    if (node.loadingPath) {
      const componentId = path
        .relative(appDir, node.loadingPath)
        .replace(/\\/g, '/')
        .replace(/\.(tsx|ts|jsx|js)$/, '');
      props.push(`loadingId: "${componentId}"`);
    }

    if (node.children && node.children.length > 0) {
      const childrenStr = node.children
        .map((child: any) => serializeRouteStructure(child))
        .join(',\n');
      props.push(`children: [\n${childrenStr}\n]`);
    } else {
      props.push(`children: []`);
    }

    return `{\n${props.join(',\n')}\n}`;
  }

  const routeStructure = serializeRouteStructure(routeTree);

  // TRUE RSC CLIENT ENTRY
  // Only client components are imported here
  const clientEntryContent = `
// Vista Client Entry - TRUE RSC
// Only client components are bundled here
import * as React from 'react';
import { hydrateRoot } from 'react-dom/client';

// CLIENT COMPONENTS ONLY (marked with 'use client')
${clientImports.join('\n')}

// Register client components for selective hydration
const CLIENT_COMPONENTS: Record<string, React.ComponentType<any>> = {
${clientRegistrations.join('\n')}
};

// Route structure (NO server component code included)
const routeStructure = ${routeStructure};

// Selective Hydration - Only hydrate client component "islands"
function hydrateClientIslands() {
    const islands = document.querySelectorAll('[data-vista-client]');
    
    if (islands.length === 0) {
        // No client islands, but we still need to hydrate for routing
        const root = document.getElementById('root');
        if (root && root.hasChildNodes()) {
            console.log('[Vista RSC] Server-rendered content, minimal client JS loaded');
        }
        return;
    }
    
    console.log(\`[Vista RSC] Hydrating \${islands.length} client component(s)\`);
    
    islands.forEach((island) => {
        const componentId = island.getAttribute('data-vista-client');
        const propsJson = island.getAttribute('data-props') || '{}';
        
        if (componentId && CLIENT_COMPONENTS[componentId]) {
            const Component = CLIENT_COMPONENTS[componentId];
            const props = JSON.parse(propsJson);
            
            // Hydrate this island
            hydrateRoot(island as HTMLElement, React.createElement(Component, props));
            island.removeAttribute('data-vista-client');
            island.setAttribute('data-hydrated', 'true');
        }
    });
}

// Run hydration
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', hydrateClientIslands);
} else {
    hydrateClientIslands();
}

// Hot Module Replacement (HMR) Support
if ((module as any).hot) {
    (module as any).hot.accept();
}

// Server-Side Live Reload (for server component changes)
${
  isDev
    ? `
// Vista Error Overlay Logic
const VISTA_ERROR_ID = 'vista-compile-error';

function showCompileError(message: string) {
    let div = document.getElementById(VISTA_ERROR_ID);
    if (!div) {
        div = document.createElement('div');
        div.id = VISTA_ERROR_ID;
        div.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.85);z-index:99999;display:flex;align-items:center;justify-content:center;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;backdrop-filter:blur(4px);';
        document.body.appendChild(div);
    }
    
    div.innerHTML = \`
        <div style="width:100%;max-width:900px;max-height:90vh;display:flex;flex-direction:column;background:#0a0a0a;border:1px solid #333;border-radius:12px;box-shadow:0 24px 48px -12px rgba(0,0,0,0.5);overflow:hidden;">
            <div style="padding:16px 24px;background:#111;border-bottom:1px solid #333;display:flex;align-items:center;justify-content:space-between;">
                <div style="display:flex;align-items:center;gap:12px;">
                     <span style="font-weight:600;color:#f87171;background:rgba(248,113,113,0.1);padding:4px 12px;border-radius:99px;font-size:12px;display:flex;align-items:center;gap:6px;">
                        <span style="width:8px;height:8px;background:currentColor;border-radius:50%;"></span>
                        BUILD ERROR
                    </span>
                    <span style="color:#666;font-size:13px;">Vista JS Dev</span>
                </div>
            </div>
            <div style="padding:24px;overflow:auto;background:#0a0a0a;">
                <pre style="margin:0;font-size:13px;line-height:1.6;color:#e5e7eb;white-space:pre-wrap;">\${message.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
            </div>
        </div>
    \`;
}

function hideCompileError() {
    const div = document.getElementById(VISTA_ERROR_ID);
    if (div) div.remove();
}

const sse = new EventSource('${SSE_ENDPOINT}');
sse.onmessage = (event) => {
    if (event.data === 'reload') {
        hideCompileError();
        console.log('[Vista] Server component changed, reloading...');
        window.location.reload();
        return;
    }
    
    try {
        const data = JSON.parse(event.data);
        if (data.type === 'error') {
            showCompileError(data.message);
        } else if (data.type === 'ok') {
            hideCompileError();
        }
    } catch (e) {
        // Ignore JSON parse errors for non-JSON messages
    }
};

sse.onerror = (e) => {
    console.log('[Vista] SSE connection lost');
};
`
    : '// SSE reload disabled in production'
}

// Export for debugging
(window as any).${CLIENT_COMPONENTS_FLAG} = CLIENT_COMPONENTS;
    `;

  fs.writeFileSync(path.join(vistaDir, 'client.tsx'), clientEntryContent);
  if (_debug) {
    console.log(
      `[Vista JS RSC] Generated client entry with ${clientComponents.length} client component(s)`
    );
  }
}

// Webpack Compiler Instance (reused for watch mode)
let compiler: webpack.Compiler | null = null;

export async function buildClient(
  watch: boolean = false,
  onRebuild?: () => void
): Promise<webpack.Compiler | null> {
  const cwd = process.cwd();
  const vistaDirs = createVistaDirectories(cwd);
  const vistaDir = vistaDirs.root;
  const buildId = getBuildId(vistaDir, !watch);

  if (_debug) console.log(`Building Client (Watch Mode: ${watch}, Bundler: Webpack + SWC)...`);

  // ========================================================================
  // Pre-build Structure Validation
  // ========================================================================
  const vistaConfig = loadConfig(cwd);
  const structureConfig = resolveStructureValidationConfig(vistaConfig);

  if (structureConfig.enabled) {
    const result: StructureValidationResult = validateAppStructure({ cwd });
    logValidationResult(result, structureConfig.logLevel);

    if (result.state === 'error' && structureConfig.mode === 'strict') {
      console.error(formatBuildFailTable(result));
      process.exit(1);
    }
    // Warnings: continue build, already logged above.
  }

  // Scan app directory using Rust bindings to get client components
  const appDir = path.join(cwd, 'app');
  const componentsDir = path.join(cwd, 'components');
  let clientComponents: Array<{ relativePath: string; absolutePath: string }> = [];

  if (fs.existsSync(appDir)) {
    if (_debug) {
      console.log(
        `[Vista JS] Using ${isNativeAvailable() ? 'Rust native' : 'JS fallback'} scanner (v${getVersion()})`
      );
    }
    const scanResult = scanAppDirectory(appDir);
    if (_debug) {
      console.log(
        `[Vista JS] Found ${scanResult.clientComponents.length} client components, ${scanResult.serverComponents.length} server components in app/`
      );
    }

    // Store client components for entry generation
    clientComponents = scanResult.clientComponents.map((c) => ({
      relativePath: c.relativePath,
      absolutePath: c.absolutePath,
    }));

    // Log client components
    if (scanResult.clientComponents.length > 0 && _debug) {
      console.log(`[Vista JS] Client components ('use client') from app/:`);
      scanResult.clientComponents.forEach((c) => {
        console.log(`  - ${c.relativePath}`);
      });
    }

    // Check for server component errors (using client hooks without 'use client')
    if (scanResult.errors.length > 0) {
      console.log('');
      console.log('\x1b[41m\x1b[37m ERROR \x1b[0m \x1b[31mServer Component Error\x1b[0m');
      console.log('');

      for (const error of scanResult.errors) {
        console.log(`\x1b[31m✗\x1b[0m ${error.file}`);
        console.log(
          `  You're importing a component that needs \x1b[33m${error.hooks.slice(0, 3).join(', ')}\x1b[0m.`
        );
        console.log(`  These only work in a Client Component.`);
        console.log('');
        console.log(
          `  \x1b[36mTo fix:\x1b[0m Add \x1b[33m'use client'\x1b[0m at the top of your file:`
        );
        console.log('');
        console.log(`    \x1b[32m'use client';\x1b[0m`);
        console.log('');
      }
    }
  }

  // Also scan components directory (outside app folder) for client components
  if (fs.existsSync(componentsDir)) {
    if (_debug) console.log(`[Vista JS] Scanning components/ directory...`);
    const componentsScanResult = scanAppDirectory(componentsDir);

    // Map relativePath to include 'components/' prefix for proper resolution
    const componentsClientList = componentsScanResult.clientComponents.map((c) => ({
      relativePath: 'components/' + c.relativePath,
      absolutePath: c.absolutePath,
    }));

    clientComponents = [...clientComponents, ...componentsClientList];

    if (componentsScanResult.clientComponents.length > 0 && _debug) {
      console.log(`[Vista JS] Client components ('use client') from components/:`);
      componentsScanResult.clientComponents.forEach((c) => {
        console.log(`  - components/${c.relativePath}`);
      });
    }
  }

  if (_debug) console.log(`[Vista JS] Total client components: ${clientComponents.length}`);

  // Write canonical artifact manifests for legacy mode.
  try {
    const { getRouteTree } = require('./file-scanner');
    const routeTree = getRouteTree(appDir);
    const routes = collectRouteArtifactEntries(routeTree);
    writeCanonicalVistaArtifacts(cwd, vistaDir, buildId, routes);
  } catch (error) {
    // Keep build behavior resilient in environments where route scan fails.
    writeCanonicalVistaArtifacts(cwd, vistaDir, buildId, []);
    console.warn(`[vista:build] Failed to derive route artifacts: ${(error as Error).message}`);
  }

  // Generate client entry - TRUE RSC: only client components
  generateClientEntry(cwd, vistaDir, clientComponents, watch);

  // Create Webpack config
  const config = createWebpackConfig({ cwd, isDev: watch });

  // Create Webpack compiler
  compiler = webpack(config);

  if (watch) {
    // In watch mode, we return the compiler for use with dev middleware
    // Initial CSS build
    runPostCSS(cwd, vistaDir);

    // Watch for CSS changes separately (simple approach)
    const chokidar = require('chokidar');
    try {
      chokidar.watch(path.join(cwd, 'app/**/*.css'), { ignoreInitial: true }).on('change', () => {
        if (_debug) console.log('CSS changed, rebuilding...');
        runPostCSS(cwd, vistaDir);
      });
    } catch (e) {
      // chokidar not installed, skip CSS watch
    }

    if (_debug) console.log('Webpack compiler ready for dev middleware.');
    return compiler;
  } else {
    // Production build
    return new Promise((resolve, reject) => {
      compiler!.run((err, stats) => {
        if (err) {
          console.error('Webpack build error:', err);
          reject(err);
          return;
        }
        if (stats?.hasErrors()) {
          console.error('Webpack compilation errors:', stats.toString('errors-only'));
          reject(new Error('Compilation failed'));
          return;
        }
        console.log('Webpack build complete!');
        console.log(stats?.toString('minimal'));

        // Build CSS
        runPostCSS(cwd, vistaDir);

        compiler!.close((closeErr) => {
          if (closeErr) console.error('Error closing compiler:', closeErr);
          resolve(null);
        });
      });
    });
  }
}

export { compiler };
