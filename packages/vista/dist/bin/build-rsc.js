"use strict";
/**
 * Vista RSC Build System
 *
 * Builds the application using the True RSC Architecture:
 * 1. Server bundle (.vista/server/) - All code for SSR
 * 2. Client bundle (.vista/static/) - Only client components
 * 3. Manifests for hydration coordination
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildRSC = buildRSC;
exports.default = buildRSC;
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const webpack_1 = __importDefault(require("webpack"));
const compiler_1 = require("../build/rsc/compiler");
const manifest_1 = require("../build/manifest");
const client_manifest_1 = require("../build/rsc/client-manifest");
const server_manifest_1 = require("../build/rsc/server-manifest");
const file_scanner_1 = require("./file-scanner");
const config_1 = require("../config");
const constants_1 = require("../constants");
const structure_validator_1 = require("../server/structure-validator");
const static_generator_1 = require("../server/static-generator");
const structure_log_1 = require("../server/structure-log");
const _debug = !!process.env.VISTA_DEBUG;
/**
 * Run PostCSS for CSS compilation
 */
function runPostCSS(cwd, vistaDir) {
    const globalsCss = path_1.default.join(cwd, 'app/globals.css');
    if (fs_1.default.existsSync(globalsCss)) {
        if (_debug)
            console.log('[Vista JS RSC] Building CSS with PostCSS...');
        const { execSync } = require('child_process');
        try {
            const cssOut = path_1.default.join(vistaDir, 'client.css');
            execSync(`npx postcss app/globals.css -o "${cssOut}"`, {
                stdio: _debug ? 'inherit' : 'pipe',
                cwd,
            });
            if (_debug)
                console.log('[Vista JS RSC] CSS Built Successfully!');
        }
        catch (cssErr) {
            console.error('[Vista JS RSC] CSS Build failed (PostCSS error).');
        }
    }
}
function hasUseClientDirective(filePath) {
    try {
        const source = fs_1.default.readFileSync(filePath, 'utf-8');
        return /^\s*['"]use client['"]\s*;?/m.test(source);
    }
    catch {
        return false;
    }
}
function collectUseClientFiles(dir, collected) {
    if (!fs_1.default.existsSync(dir))
        return;
    const entries = fs_1.default.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        const absolutePath = path_1.default.join(dir, entry.name);
        if (entry.isDirectory()) {
            collectUseClientFiles(absolutePath, collected);
            continue;
        }
        if (!entry.isFile() || !entry.name.endsWith('.js')) {
            continue;
        }
        if (hasUseClientDirective(absolutePath)) {
            collected.add(path_1.default.resolve(absolutePath));
        }
    }
}
function resolvePackageRoot(cwd, packageName) {
    try {
        return path_1.default.dirname(require.resolve(`${packageName}/package.json`, { paths: [cwd] }));
    }
    catch {
        return null;
    }
}
function collectFrameworkClientReferences(cwd) {
    const roots = [resolvePackageRoot(cwd, 'vista'), resolvePackageRoot(cwd, '@vistagenic/vista')].filter((value) => Boolean(value));
    if (roots.length === 0) {
        return [];
    }
    const collected = new Set();
    for (const packageRoot of roots) {
        collectUseClientFiles(path_1.default.join(packageRoot, 'dist', 'client'), collected);
        collectUseClientFiles(path_1.default.join(packageRoot, 'dist', 'components'), collected);
    }
    return Array.from(collected);
}
/**
 * Generate the RSC-aware client entry file
 */
function generateRSCClientEntry(cwd, vistaDir, isDev) {
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

const hydrateDocument = (window as any).${constants_1.HYDRATE_DOCUMENT_FLAG} === true;
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

${isDev
        ? `// Vista live-reload: listen for server component changes via SSE
(function connectReload() {
  const es = new EventSource('${constants_1.SSE_ENDPOINT}');
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
        : '// SSE live-reload disabled in production'}
`;
    fs_1.default.writeFileSync(path_1.default.join(vistaDir, 'rsc-client.tsx'), clientEntryContent);
    if (_debug)
        console.log('[vista:build] Generated RSC client entry file');
}
function syncReactServerManifests(vistaDir) {
    const canonicalPath = path_1.default.join(vistaDir, 'react-server-manifest.json');
    const legacyPath = path_1.default.join(vistaDir, 'react-ssr-manifest.json');
    if (fs_1.default.existsSync(canonicalPath) && !fs_1.default.existsSync(legacyPath)) {
        fs_1.default.copyFileSync(canonicalPath, legacyPath);
    }
    else if (fs_1.default.existsSync(legacyPath) && !fs_1.default.existsSync(canonicalPath)) {
        fs_1.default.copyFileSync(legacyPath, canonicalPath);
    }
}
/**
 * Build with RSC architecture
 */
async function buildRSC(watch = false) {
    const cwd = process.cwd();
    const appDir = path_1.default.join(cwd, 'app');
    const componentsDir = path_1.default.join(cwd, 'components');
    let clientReferenceFiles = [];
    if (_debug) {
        console.log('');
        console.log('╔══════════════════════════════════════════════════════════════╗');
        console.log('║           Vista JS RSC Build System (React Server Components)   ║');
        console.log('╚══════════════════════════════════════════════════════════════╝');
        console.log('');
    }
    // Create .vista directory structure
    const vistaDirs = (0, manifest_1.createVistaDirectories)(cwd, 'rsc');
    const buildId = (0, manifest_1.getBuildId)(vistaDirs.root, !watch);
    if (_debug) {
        console.log(`[vista:build] Build ID: ${buildId}`);
        console.log(`[vista:build] Mode: ${watch ? 'Development (Watch)' : 'Production'}`);
        console.log('');
    }
    // ========================================================================
    // Pre-build Structure Validation
    // ========================================================================
    const vistaConfig = (0, config_1.loadConfig)(cwd);
    const structureConfig = (0, config_1.resolveStructureValidationConfig)(vistaConfig);
    if (structureConfig.enabled) {
        const result = (0, structure_validator_1.validateAppStructure)({ cwd });
        (0, structure_log_1.logValidationResult)(result, structureConfig.logLevel);
        if (result.state === 'error' && structureConfig.mode === 'strict') {
            console.error((0, structure_log_1.formatBuildFailTable)(result));
            process.exit(1);
        }
    }
    // Scan app directory
    if (fs_1.default.existsSync(appDir)) {
        if (_debug) {
            console.log(`[Vista JS RSC] Using ${(0, file_scanner_1.isNativeAvailable)() ? 'Rust native' : 'JS fallback'} scanner (v${(0, file_scanner_1.getVersion)()})`);
        }
        const scanResult = (0, file_scanner_1.scanAppDirectory)(appDir);
        clientReferenceFiles = scanResult.clientComponents.map((component) => component.absolutePath);
        let componentsScanResult = null;
        if (fs_1.default.existsSync(componentsDir)) {
            componentsScanResult = (0, file_scanner_1.scanAppDirectory)(componentsDir);
            clientReferenceFiles = Array.from(new Set([
                ...clientReferenceFiles,
                ...componentsScanResult.clientComponents.map((component) => component.absolutePath),
            ]));
        }
        if (_debug) {
            console.log(`[Vista JS RSC] Found ${scanResult.serverComponents.length} server components`);
            console.log(`[Vista JS RSC] Found ${scanResult.clientComponents.length} client components ('use client') in app/`);
            if (componentsScanResult) {
                console.log(`[Vista JS RSC] Found ${componentsScanResult.clientComponents.length} client components ('use client') in components/`);
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
                console.log(`  Using: \x1b[33m${error.hooks.slice(0, 3).join(', ')}\x1b[0m in a Server Component`);
                console.log('');
                console.log(`  \x1b[36mTo fix:\x1b[0m Add \x1b[33m'use client'\x1b[0m at the top of the file`);
                console.log('');
            }
            if (!watch) {
                console.log('\x1b[31mBuild failed due to Server Component violations.\x1b[0m');
                process.exit(1);
            }
        }
    }
    // Include framework-level client boundaries (e.g. vista/link) so external
    // package client modules resolve in React Flight manifests.
    const frameworkClientReferences = collectFrameworkClientReferences(cwd);
    if (frameworkClientReferences.length > 0) {
        clientReferenceFiles = Array.from(new Set([...clientReferenceFiles, ...frameworkClientReferences]));
        if (_debug) {
            console.log(`[Vista JS RSC] Added ${frameworkClientReferences.length} framework client references`);
        }
    }
    // Generate manifests
    if (_debug)
        console.log('[vista:build] Generating manifests...');
    const additionalClientRoots = fs_1.default.existsSync(componentsDir)
        ? [{ dir: componentsDir, prefix: 'components/' }]
        : [];
    const clientManifest = (0, client_manifest_1.generateClientManifestWithRoots)(cwd, appDir, additionalClientRoots);
    fs_1.default.writeFileSync(path_1.default.join(vistaDirs.root, 'client-manifest.json'), JSON.stringify(clientManifest, null, 2));
    if (_debug) {
        console.log(`  ✓ client-manifest.json (${Object.keys(clientManifest.clientModules).length} modules)`);
    }
    const serverManifest = (0, server_manifest_1.generateServerManifest)(cwd, appDir);
    fs_1.default.writeFileSync(path_1.default.join(vistaDirs.server, 'server-manifest.json'), JSON.stringify(serverManifest, null, 2));
    if (_debug) {
        console.log(`  ✓ server-manifest.json (${Object.keys(serverManifest.serverModules).length} modules, ${serverManifest.routes.length} routes)`);
        console.log('');
    }
    (0, manifest_1.writeCanonicalVistaArtifacts)(cwd, vistaDirs.root, buildId, serverManifest.routes.map((route) => ({
        pattern: route.pattern,
        pagePath: route.pagePath,
        type: route.type,
    })));
    // Generate client entry
    generateRSCClientEntry(cwd, vistaDirs.root, watch);
    // Create webpack configs
    const options = {
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
        if (_debug)
            console.log('[Vista JS RSC] Creating development compilers...');
        // Clear stale webpack cache.  ReactFlightWebpackPlugin adds
        // AsyncDependenciesBlock entries that can't be serialised by webpack's
        // pack file cache strategy.  A stale cache that was written *before* the
        // plugin ran will skip the parser hook entirely, causing empty Flight
        // manifests.  Clearing on every dev-start is the safest approach –
        // first-compile is ~1s longer but guarantees correct manifests.
        const cacheDir = path_1.default.join(vistaDirs.root, 'cache');
        if (fs_1.default.existsSync(cacheDir)) {
            fs_1.default.rmSync(cacheDir, { recursive: true, force: true });
            if (_debug)
                console.log('[Vista JS RSC] Cleared stale webpack cache');
        }
        // Write stub Flight manifests so upstream can start before first webpack compile.
        // ReactFlightWebpackPlugin will overwrite these on first successful compilation.
        const stubManifests = [
            path_1.default.join(vistaDirs.root, 'react-client-manifest.json'),
            path_1.default.join(vistaDirs.root, 'react-server-manifest.json'),
            path_1.default.join(vistaDirs.root, 'react-ssr-manifest.json'),
        ];
        for (const manifestPath of stubManifests) {
            if (!fs_1.default.existsSync(manifestPath)) {
                fs_1.default.writeFileSync(manifestPath, '{}');
            }
        }
        const clientConfig = (0, compiler_1.createClientWebpackConfig)(options);
        const clientCompiler = (0, webpack_1.default)(clientConfig);
        syncReactServerManifests(vistaDirs.root);
        // Watch for CSS + source changes that can affect Tailwind output.
        try {
            const chokidar = require('chokidar');
            const styleWatchRoots = ['app', 'components', 'content', 'lib', 'ctx', 'data']
                .map((entry) => path_1.default.join(cwd, entry))
                .filter((entry) => fs_1.default.existsSync(entry));
            let cssTimer = null;
            const scheduleCSSBuild = () => {
                if (cssTimer)
                    clearTimeout(cssTimer);
                cssTimer = setTimeout(() => {
                    if (_debug)
                        console.log('[Vista JS RSC] Style source changed, rebuilding CSS...');
                    runPostCSS(cwd, vistaDirs.root);
                }, 120);
            };
            chokidar
                .watch(styleWatchRoots, {
                ignoreInitial: true,
                ignored: (watchedPath) => watchedPath.includes(`${path_1.default.sep}node_modules${path_1.default.sep}`) ||
                    watchedPath.includes(`${path_1.default.sep}.git${path_1.default.sep}`) ||
                    watchedPath.includes(`${path_1.default.sep}.vista${path_1.default.sep}`),
            })
                .on('all', (_event, changedPath) => {
                if (/\.(?:css|[cm]?[jt]sx?|md|mdx)$/i.test(changedPath)) {
                    scheduleCSSBuild();
                }
            });
        }
        catch (e) {
            // chokidar not installed
        }
        if (_debug) {
            console.log('[Vista JS RSC] Ready for development');
            console.log('');
        }
        return { serverCompiler: null, clientCompiler };
    }
    else {
        // Production build
        console.log('[Vista JS RSC] Building for production...');
        console.log('');
        const serverConfig = (0, compiler_1.createServerWebpackConfig)(options);
        const clientConfig = (0, compiler_1.createClientWebpackConfig)(options);
        // Build server bundle
        console.log('[Vista JS RSC] Building server bundle...');
        await new Promise((resolve, reject) => {
            (0, webpack_1.default)(serverConfig).run((err, stats) => {
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
        await new Promise((resolve, reject) => {
            (0, webpack_1.default)(clientConfig).run((err, stats) => {
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
        const ssgResult = await (0, static_generator_1.generateStaticPages)({
            cwd,
            vistaDirRoot: vistaDirs.root,
            manifest: serverManifest,
            isDev: false,
            buildId,
        });
        if (ssgResult.pagesGenerated > 0) {
            console.log(`[Vista JS RSC] Pre-rendered ${ssgResult.pagesGenerated} page(s): ${ssgResult.generatedPaths.join(', ')}`);
        }
        if (ssgResult.failedPaths.length > 0) {
            console.warn(`[Vista JS RSC] Failed to pre-render ${ssgResult.failedPaths.length} page(s):`, ssgResult.failedPaths.map((f) => `${f.path} (${f.error})`).join(', '));
        }
        // Write the real prerender manifest (overwrite the empty stub)
        const prerenderManifestPath = path_1.default.join(vistaDirs.root, 'prerender-manifest.json');
        fs_1.default.writeFileSync(prerenderManifestPath, JSON.stringify(ssgResult.manifest, null, 2));
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
