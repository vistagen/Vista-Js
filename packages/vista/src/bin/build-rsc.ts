/**
 * Vista RSC Build System
 *
 * Builds the application using the True RSC Architecture:
 * 1. Server bundle (.vista/server/) - All code for SSR
 * 2. Client bundle (.vista/static/) - Only client components
 * 3. Manifests for hydration coordination
 */

import path from 'path';
import fs from 'fs';
import webpack from 'webpack';
import {
  createServerWebpackConfig,
  createClientWebpackConfig,
  type RSCCompilerOptions,
} from '../build/rsc/compiler';
import { createVistaDirectories, getBuildId } from '../build/manifest';
import { generateClientManifest } from '../build/rsc/client-manifest';
import { generateServerManifest } from '../build/rsc/server-manifest';
import { scanAppDirectory, isNativeAvailable, getVersion } from './file-scanner';

/**
 * Run PostCSS for CSS compilation
 */
function runPostCSS(cwd: string, vistaDir: string): void {
  const globalsCss = path.join(cwd, 'app/globals.css');
  if (fs.existsSync(globalsCss)) {
    console.log('[Vista RSC] Building CSS with PostCSS...');
    const { execSync } = require('child_process');
    try {
      const cssOut = path.join(vistaDir, 'client.css');
      execSync(`npx postcss app/globals.css -o "${cssOut}"`, { stdio: 'inherit', cwd });
      console.log('[Vista RSC] CSS Built Successfully!');
    } catch (cssErr) {
      console.error('[Vista RSC] CSS Build failed (PostCSS error).');
    }
  }
}

/**
 * Generate the RSC-aware client entry file
 */
function generateRSCClientEntry(cwd: string, vistaDir: string): void {
  const clientManifestPath = path.join(vistaDir, 'client-manifest.json');

  let clientImports = '';
  let clientComponents = '{}';

  if (fs.existsSync(clientManifestPath)) {
    const manifest = JSON.parse(fs.readFileSync(clientManifestPath, 'utf-8'));

    // Generate imports for all client components
    const imports: string[] = [];
    const components: string[] = [];

    Object.values(manifest.clientModules).forEach((entry: any, index: number) => {
      const varName = `ClientComponent_${index}`;
      const relativePath = './' + path.relative(vistaDir, entry.absolutePath).replace(/\\/g, '/');
      imports.push(`import ${varName} from '${relativePath}';`);
      components.push(`'${entry.id}': ${varName}`);
    });

    clientImports = imports.join('\n');
    clientComponents = `{\n    ${components.join(',\n    ')}\n}`;
  }

  const clientEntryContent = `/**
 * Vista RSC Client Entry
 * 
 * This file is auto-generated. Do not edit directly.
 * It handles selective hydration of client components.
 */

import * as React from 'react';
import { createRoot } from 'react-dom/client';

// Import all client components
${clientImports}

// Client component registry
const clientComponents = ${clientComponents};

// Hydration logic
interface ClientReference {
    id: string;
    mountId: string;
    props: Record<string, any>;
    chunkUrl: string;
    exportName: string;
}

function deserializeProps(props: Record<string, any>): Record<string, any> {
    const result: Record<string, any> = {};
    for (const [key, value] of Object.entries(props)) {
        if (value && typeof value === 'object' && value.__type) {
            switch (value.__type) {
                case 'Date':
                    result[key] = new Date(value.value);
                    break;
                case 'undefined':
                    result[key] = undefined;
                    break;
                default:
                    result[key] = value;
            }
        } else {
            result[key] = value;
        }
    }
    return result;
}

async function hydrateClientComponents() {
    const references: ClientReference[] = (window as any).__VISTA_CLIENT_REFERENCES__ || [];
    
    console.log('[Vista RSC] Hydrating', references.length, 'client component(s)');
    
    for (const ref of references) {
        try {
            const mountPoint = document.getElementById(ref.mountId);
            if (!mountPoint) {
                console.warn('[Vista RSC] Mount point not found:', ref.mountId);
                continue;
            }
            
            // Get component from registry
            let Component = clientComponents[ref.id];
            
            if (!Component) {
                // Try dynamic import
                try {
                    const module = await import(/* webpackIgnore: true */ ref.chunkUrl);
                    Component = module[ref.exportName] || module.default;
                } catch (e) {
                    console.error('[Vista RSC] Failed to load component:', ref.id, e);
                    continue;
                }
            }
            
            if (!Component) {
                console.error('[Vista RSC] Component not found:', ref.id);
                continue;
            }
            
            const props = deserializeProps(ref.props);
            
            // Use createRoot since we render a placeholder on server
            const root = createRoot(mountPoint);
            root.render(React.createElement(Component, props));
            
            mountPoint.setAttribute('data-hydrated', 'true');
            
        } catch (e) {
            console.error('[Vista RSC] Hydration error:', ref.id, e);
        }
    }
}

// Initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', hydrateClientComponents);
} else {
    hydrateClientComponents();
}

// HMR Support
if ((module as any).hot) {
    (module as any).hot.accept();
}
`;

  fs.writeFileSync(path.join(vistaDir, 'rsc-client.tsx'), clientEntryContent);
  console.log('[Vista RSC] Generated client entry file');
}

/**
 * Build with RSC architecture
 */
export async function buildRSC(watch: boolean = false): Promise<{
  serverCompiler: webpack.Compiler | null;
  clientCompiler: webpack.Compiler | null;
}> {
  const cwd = process.cwd();
  const appDir = path.join(cwd, 'app');

  console.log('');
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║           Vista RSC Build System (React Server Components)   ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log('');

  // Create .vista directory structure
  const vistaDirs = createVistaDirectories(cwd);
  const buildId = getBuildId(vistaDirs.root, !watch);

  console.log(`[Vista RSC] Build ID: ${buildId}`);
  console.log(`[Vista RSC] Mode: ${watch ? 'Development (Watch)' : 'Production'}`);
  console.log('');

  // Scan app directory
  if (fs.existsSync(appDir)) {
    console.log(
      `[Vista RSC] Using ${isNativeAvailable() ? 'Rust native' : 'JS fallback'} scanner (v${getVersion()})`
    );

    const scanResult = scanAppDirectory(appDir);

    console.log(`[Vista RSC] Found ${scanResult.serverComponents.length} server components`);
    console.log(
      `[Vista RSC] Found ${scanResult.clientComponents.length} client components ('client load')`
    );
    console.log('');

    // List client components
    if (scanResult.clientComponents.length > 0) {
      console.log('[Vista RSC] Client Components (will be hydrated on browser):');
      scanResult.clientComponents.forEach((c) => {
        console.log(`  ✓ ${c.relativePath}`);
      });
      console.log('');
    }

    // List server components (first few)
    if (scanResult.serverComponents.length > 0) {
      console.log('[Vista RSC] Server Components (0kb client bundle contribution):');
      scanResult.serverComponents.slice(0, 5).forEach((c) => {
        console.log(`  • ${c.relativePath}`);
      });
      if (scanResult.serverComponents.length > 5) {
        console.log(`  ... and ${scanResult.serverComponents.length - 5} more`);
      }
      console.log('');
    }

    // Check for errors (using client hooks without 'client load')
    if (scanResult.errors.length > 0) {
      console.log('\x1b[41m\x1b[37m ERROR \x1b[0m \x1b[31mServer Component Violations\x1b[0m');
      console.log('');

      for (const error of scanResult.errors) {
        console.log(`\x1b[31m✗\x1b[0m ${error.file}`);
        console.log(
          `  Using: \x1b[33m${error.hooks.slice(0, 3).join(', ')}\x1b[0m in a Server Component`
        );
        console.log('');
        console.log(
          `  \x1b[36mTo fix:\x1b[0m Add \x1b[33m'client load'\x1b[0m at the top of the file`
        );
        console.log('');
      }

      if (!watch) {
        console.log('\x1b[31mBuild failed due to Server Component violations.\x1b[0m');
        process.exit(1);
      }
    }
  }

  // Generate manifests
  console.log('[Vista RSC] Generating manifests...');

  const clientManifest = generateClientManifest(cwd, appDir);
  fs.writeFileSync(
    path.join(vistaDirs.root, 'client-manifest.json'),
    JSON.stringify(clientManifest, null, 2)
  );
  console.log(
    `  ✓ client-manifest.json (${Object.keys(clientManifest.clientModules).length} modules)`
  );

  const serverManifest = generateServerManifest(cwd, appDir);
  fs.writeFileSync(
    path.join(vistaDirs.server, 'server-manifest.json'),
    JSON.stringify(serverManifest, null, 2)
  );
  console.log(
    `  ✓ server-manifest.json (${Object.keys(serverManifest.serverModules).length} modules, ${serverManifest.routes.length} routes)`
  );
  console.log('');

  // Generate client entry
  generateRSCClientEntry(cwd, vistaDirs.root);

  // Create webpack configs
  const options: RSCCompilerOptions = { cwd, isDev: watch, vistaDirs, buildId };

  // Build CSS
  runPostCSS(cwd, vistaDirs.root);

  if (watch) {
    // Development mode - return compilers for middleware
    console.log('[Vista RSC] Creating development compilers...');

    const clientConfig = createClientWebpackConfig(options);
    const clientCompiler = webpack(clientConfig);

    // Watch for CSS changes
    try {
      const chokidar = require('chokidar');
      chokidar.watch(path.join(cwd, 'app/**/*.css'), { ignoreInitial: true }).on('change', () => {
        console.log('[Vista RSC] CSS changed, rebuilding...');
        runPostCSS(cwd, vistaDirs.root);
      });
    } catch (e) {
      // chokidar not installed
    }

    console.log('[Vista RSC] Ready for development');
    console.log('');

    return { serverCompiler: null, clientCompiler };
  } else {
    // Production build
    console.log('[Vista RSC] Building for production...');
    console.log('');

    const serverConfig = createServerWebpackConfig(options);
    const clientConfig = createClientWebpackConfig(options);

    // Build server bundle
    console.log('[Vista RSC] Building server bundle...');
    await new Promise<void>((resolve, reject) => {
      webpack(serverConfig).run((err, stats) => {
        if (err) {
          console.error('[Vista RSC] Server build error:', err);
          reject(err);
          return;
        }
        if (stats?.hasErrors()) {
          console.error('[Vista RSC] Server compilation errors:', stats.toString('errors-only'));
          reject(new Error('Server compilation failed'));
          return;
        }
        console.log('[Vista RSC] Server bundle complete');
        resolve();
      });
    });

    // Build client bundle
    console.log('[Vista RSC] Building client bundle...');
    await new Promise<void>((resolve, reject) => {
      webpack(clientConfig).run((err, stats) => {
        if (err) {
          console.error('[Vista RSC] Client build error:', err);
          reject(err);
          return;
        }
        if (stats?.hasErrors()) {
          console.error('[Vista RSC] Client compilation errors:', stats.toString('errors-only'));
          reject(new Error('Client compilation failed'));
          return;
        }
        console.log('[Vista RSC] Client bundle complete');
        console.log(stats?.toString('minimal'));
        resolve();
      });
    });

    console.log('');
    console.log('╔══════════════════════════════════════════════════════════════╗');
    console.log('║                    Build Complete! 🎉                        ║');
    console.log('╚══════════════════════════════════════════════════════════════╝');
    console.log('');
    console.log('  Output directory: .vista/');
    console.log('    ├── server/     (Server-side bundle - NEVER sent to client)');
    console.log('    ├── static/     (Client assets - only client components)');
    console.log('    └── cache/      (Build cache for faster rebuilds)');
    console.log('');

    return { serverCompiler: null, clientCompiler: null };
  }
}

export { buildRSC as default };
