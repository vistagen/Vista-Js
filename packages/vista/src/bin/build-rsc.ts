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
import {
  createVistaDirectories,
  getBuildId,
  writeCanonicalVistaArtifacts,
} from '../build/manifest';
import { generateClientManifestWithRoots } from '../build/rsc/client-manifest';
import { generateServerManifest } from '../build/rsc/server-manifest';
import { scanAppDirectory, isNativeAvailable, getVersion } from './file-scanner';
import { loadConfig, resolveStructureValidationConfig } from '../config';
import { HYDRATE_DOCUMENT_FLAG, SSE_ENDPOINT } from '../constants';
import {
  validateAppStructure,
  type StructureValidationResult,
} from '../server/structure-validator';
import { generateStaticPages } from '../server/static-generator';
import { logValidationResult, formatBuildFailTable } from '../server/structure-log';

const _debug = !!process.env.VISTA_DEBUG;

/**
 * Run PostCSS for CSS compilation
 */
function runPostCSS(cwd: string, vistaDir: string): void {
  const globalsCss = path.join(cwd, 'app/globals.css');
  if (fs.existsSync(globalsCss)) {
    if (_debug) console.log('[Vista JS RSC] Building CSS with PostCSS...');
    const { execSync } = require('child_process');
    try {
      const cssOut = path.join(vistaDir, 'client.css');
      execSync(`npx postcss app/globals.css -o "${cssOut}"`, {
        stdio: _debug ? 'inherit' : 'pipe',
        cwd,
      });
      if (_debug) console.log('[Vista JS RSC] CSS Built Successfully!');
    } catch (cssErr) {
      console.error('[Vista JS RSC] CSS Build failed (PostCSS error).');
    }
  }
}

/**
 * Generate the RSC-aware client entry file
 */
function generateRSCClientEntry(cwd: string, vistaDir: string, isDev: boolean): void {
  const clientEntryContent = `/**
 * Vista RSC Client Entry
 *
 * This file is auto-generated. Do not edit directly.
 * It hydrates using React Flight data from /rsc and enables
 * RSC-aware client-side navigation via RSCRouter.
 */

import * as React from 'react';
import { hydrateRoot } from 'react-dom/client';
import { createFromFetch } from 'react-server-dom-webpack/client';
import { RSCRouter } from 'vista/client/rsc-router';
import { callServer } from 'vista/client/server-actions';

const hydrateDocument = (window as any).${HYDRATE_DOCUMENT_FLAG} === true;
const rootElement = hydrateDocument ? document : document.getElementById('root');
if (!rootElement) {
  throw new Error('Missing #root element for hydration.');
}

const pathname = window.location.pathname;
const search = window.location.search;
const initialResponse = createFromFetch(
  fetch(\`/rsc\${pathname}\${search}\`, { headers: { Accept: 'text/x-component' } }),
  { callServer }
) as Promise<React.ReactNode>;

hydrateRoot(
  rootElement as Document | Element,
  React.createElement(RSCRouter, {
    initialResponse,
    initialPathname: pathname,
  })
);

${
  isDev
    ? `// Vista live-reload: listen for server component changes via SSE
(function connectReload() {
  const es = new EventSource('${SSE_ENDPOINT}');
  es.onmessage = (e) => {
    if (e.data === 'reload') {
      window.location.reload();
    } else {
      try {
        const msg = JSON.parse(e.data);
        if (msg.type === 'error') {
          console.error('[vista] Build error:', msg.message);
        }
      } catch {}
    }
  };
  es.onerror = () => {
    es.close();
    setTimeout(connectReload, 3000);
  };
})();`
    : '// SSE live-reload disabled in production'
}
`;

  fs.writeFileSync(path.join(vistaDir, 'rsc-client.tsx'), clientEntryContent);
  if (_debug) console.log('[vista:build] Generated RSC client entry file');
}

function syncReactServerManifests(vistaDir: string): void {
  const canonicalPath = path.join(vistaDir, 'react-server-manifest.json');
  const legacyPath = path.join(vistaDir, 'react-ssr-manifest.json');

  if (fs.existsSync(canonicalPath) && !fs.existsSync(legacyPath)) {
    fs.copyFileSync(canonicalPath, legacyPath);
  } else if (fs.existsSync(legacyPath) && !fs.existsSync(canonicalPath)) {
    fs.copyFileSync(legacyPath, canonicalPath);
  }
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
  const componentsDir = path.join(cwd, 'components');
  let clientReferenceFiles: string[] = [];

  if (_debug) {
    console.log('');
    console.log('╔══════════════════════════════════════════════════════════════╗');
    console.log('║           Vista JS RSC Build System (React Server Components)   ║');
    console.log('╚══════════════════════════════════════════════════════════════╝');
    console.log('');
  }

  // Create .vista directory structure
  const vistaDirs = createVistaDirectories(cwd, 'rsc');
  const buildId = getBuildId(vistaDirs.root, !watch);

  if (_debug) {
    console.log(`[vista:build] Build ID: ${buildId}`);
    console.log(`[vista:build] Mode: ${watch ? 'Development (Watch)' : 'Production'}`);
    console.log('');
  }

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
  }

  // Scan app directory
  if (fs.existsSync(appDir)) {
    if (_debug) {
      console.log(
        `[Vista JS RSC] Using ${isNativeAvailable() ? 'Rust native' : 'JS fallback'} scanner (v${getVersion()})`
      );
    }

    const scanResult = scanAppDirectory(appDir);
    clientReferenceFiles = scanResult.clientComponents.map((component) => component.absolutePath);
    let componentsScanResult: ReturnType<typeof scanAppDirectory> | null = null;

    if (fs.existsSync(componentsDir)) {
      componentsScanResult = scanAppDirectory(componentsDir);
      clientReferenceFiles = Array.from(
        new Set([
          ...clientReferenceFiles,
          ...componentsScanResult.clientComponents.map((component) => component.absolutePath),
        ])
      );
    }

    if (_debug) {
      console.log(`[Vista JS RSC] Found ${scanResult.serverComponents.length} server components`);
      console.log(
        `[Vista JS RSC] Found ${scanResult.clientComponents.length} client components ('use client') in app/`
      );
      if (componentsScanResult) {
        console.log(
          `[Vista JS RSC] Found ${componentsScanResult.clientComponents.length} client components ('use client') in components/`
        );
      }
      console.log(`[Vista JS RSC] Total client reference modules: ${clientReferenceFiles.length}`);
      console.log('');
    }

    // List client components
    if (scanResult.clientComponents.length > 0 && _debug) {
      console.log('[Vista JS RSC] Client Components (will be hydrated on browser):');
      scanResult.clientComponents.forEach((c) => {
        console.log(`  ✓ ${c.relativePath}`);
      });
      console.log('');
    }
    if (componentsScanResult && componentsScanResult.clientComponents.length > 0 && _debug) {
      console.log('[Vista JS RSC] Components Directory Client Components:');
      componentsScanResult.clientComponents.forEach((c) => {
        console.log(`  ✓ components/${c.relativePath}`);
      });
      console.log('');
    }

    // List server components (first few)
    if (scanResult.serverComponents.length > 0 && _debug) {
      console.log('[Vista JS RSC] Server Components (0kb client bundle contribution):');
      scanResult.serverComponents.slice(0, 5).forEach((c) => {
        console.log(`  • ${c.relativePath}`);
      });
      if (scanResult.serverComponents.length > 5) {
        console.log(`  ... and ${scanResult.serverComponents.length - 5} more`);
      }
      console.log('');
    }

    // Check for errors (using client hooks without 'use client')
    const scanErrors = [
      ...scanResult.errors,
      ...(componentsScanResult?.errors || []).map((error) => ({
        ...error,
        file: `components/${error.file}`,
      })),
    ];

    if (scanErrors.length > 0) {
      console.log('\x1b[41m\x1b[37m ERROR \x1b[0m \x1b[31mServer Component Violations\x1b[0m');
      console.log('');

      for (const error of scanErrors) {
        console.log(`\x1b[31m✗\x1b[0m ${error.file}`);
        console.log(
          `  Using: \x1b[33m${error.hooks.slice(0, 3).join(', ')}\x1b[0m in a Server Component`
        );
        console.log('');
        console.log(
          `  \x1b[36mTo fix:\x1b[0m Add \x1b[33m'use client'\x1b[0m at the top of the file`
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
  if (_debug) console.log('[vista:build] Generating manifests...');

  const additionalClientRoots = fs.existsSync(componentsDir)
    ? [{ dir: componentsDir, prefix: 'components/' }]
    : [];
  const clientManifest = generateClientManifestWithRoots(cwd, appDir, additionalClientRoots);
  fs.writeFileSync(
    path.join(vistaDirs.root, 'client-manifest.json'),
    JSON.stringify(clientManifest, null, 2)
  );
  if (_debug) {
    console.log(
      `  ✓ client-manifest.json (${Object.keys(clientManifest.clientModules).length} modules)`
    );
  }

  const serverManifest = generateServerManifest(cwd, appDir);
  fs.writeFileSync(
    path.join(vistaDirs.server, 'server-manifest.json'),
    JSON.stringify(serverManifest, null, 2)
  );
  if (_debug) {
    console.log(
      `  ✓ server-manifest.json (${Object.keys(serverManifest.serverModules).length} modules, ${serverManifest.routes.length} routes)`
    );
    console.log('');
  }

  writeCanonicalVistaArtifacts(
    cwd,
    vistaDirs.root,
    buildId,
    serverManifest.routes.map((route) => ({
      pattern: route.pattern,
      pagePath: route.pagePath,
      type: route.type,
    }))
  );

  // Generate client entry
  generateRSCClientEntry(cwd, vistaDirs.root, watch);

  // Create webpack configs
  const options: RSCCompilerOptions = {
    cwd,
    isDev: watch,
    vistaDirs,
    buildId,
    clientReferenceFiles,
  };

  // Build CSS
  runPostCSS(cwd, vistaDirs.root);

  if (watch) {
    // Development mode - return compilers for middleware
    if (_debug) console.log('[Vista JS RSC] Creating development compilers...');

    // Clear stale webpack cache.  ReactFlightWebpackPlugin adds
    // AsyncDependenciesBlock entries that can't be serialised by webpack's
    // pack file cache strategy.  A stale cache that was written *before* the
    // plugin ran will skip the parser hook entirely, causing empty Flight
    // manifests.  Clearing on every dev-start is the safest approach –
    // first-compile is ~1s longer but guarantees correct manifests.
    const cacheDir = path.join(vistaDirs.root, 'cache');
    if (fs.existsSync(cacheDir)) {
      fs.rmSync(cacheDir, { recursive: true, force: true });
      if (_debug) console.log('[Vista JS RSC] Cleared stale webpack cache');
    }

    // Write stub Flight manifests so upstream can start before first webpack compile.
    // ReactFlightWebpackPlugin will overwrite these on first successful compilation.
    const stubManifests = [
      path.join(vistaDirs.root, 'react-client-manifest.json'),
      path.join(vistaDirs.root, 'react-server-manifest.json'),
      path.join(vistaDirs.root, 'react-ssr-manifest.json'),
    ];
    for (const manifestPath of stubManifests) {
      if (!fs.existsSync(manifestPath)) {
        fs.writeFileSync(manifestPath, '{}');
      }
    }

    const clientConfig = createClientWebpackConfig(options);
    const clientCompiler = webpack(clientConfig);
    syncReactServerManifests(vistaDirs.root);

    // Watch for CSS changes
    try {
      const chokidar = require('chokidar');
      chokidar.watch(path.join(cwd, 'app/**/*.css'), { ignoreInitial: true }).on('change', () => {
        if (_debug) console.log('[Vista JS RSC] CSS changed, rebuilding...');
        runPostCSS(cwd, vistaDirs.root);
      });
    } catch (e) {
      // chokidar not installed
    }

    if (_debug) {
      console.log('[Vista JS RSC] Ready for development');
      console.log('');
    }

    return { serverCompiler: null, clientCompiler };
  } else {
    // Production build
    console.log('[Vista JS RSC] Building for production...');
    console.log('');

    const serverConfig = createServerWebpackConfig(options);
    const clientConfig = createClientWebpackConfig(options);

    // Build server bundle
    console.log('[Vista JS RSC] Building server bundle...');
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
        console.log('[Vista JS RSC] Server bundle complete');
        resolve();
      });
    });

    // Build client bundle
    console.log('[Vista JS RSC] Building client bundle...');
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
        console.log('[Vista JS RSC] Client bundle complete');
        console.log(stats?.toString('minimal'));
        syncReactServerManifests(vistaDirs.root);
        resolve();
      });
    });

    // ------------------------------------------------------------------
    // Static Generation (SSG / ISR)
    // ------------------------------------------------------------------
    console.log('[Vista JS RSC] Running static generation...');
    const ssgResult = await generateStaticPages({
      cwd,
      vistaDirRoot: vistaDirs.root,
      manifest: serverManifest,
      isDev: false,
      buildId,
    });

    if (ssgResult.pagesGenerated > 0) {
      console.log(
        `[Vista JS RSC] Pre-rendered ${ssgResult.pagesGenerated} page(s): ${ssgResult.generatedPaths.join(', ')}`
      );
    }
    if (ssgResult.failedPaths.length > 0) {
      console.warn(
        `[Vista JS RSC] Failed to pre-render ${ssgResult.failedPaths.length} page(s):`,
        ssgResult.failedPaths.map((f) => `${f.path} (${f.error})`).join(', ')
      );
    }

    // Write the real prerender manifest (overwrite the empty stub)
    const prerenderManifestPath = path.join(vistaDirs.root, 'prerender-manifest.json');
    fs.writeFileSync(prerenderManifestPath, JSON.stringify(ssgResult.manifest, null, 2));
    console.log('[Vista JS RSC] Wrote prerender-manifest.json');
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
