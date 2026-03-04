/**
 * Vista Static Generator
 *
 * Pre-renders pages at build time for SSG and ISR routes.
 * Works with both the RSC pipeline (Flight payloads) and
 * legacy SSR (renderToString).
 *
 * Called after webpack compilation completes in `buildRSC()`.
 */

import path from 'path';
import fs from 'fs';
import type { RouteEntry, ServerManifest } from '../build/rsc/server-manifest';
import {
  type CachedPage,
  type PrerenderManifest,
  writeStaticPageToDisk,
  setCachedPage,
  generatePrerenderManifest,
  isRevalidating,
  markRevalidating,
  clearRevalidating,
} from './static-cache';

const CjsModule = require('module');

let staticRuntimeReady = false;
let reactResolutionInstalled = false;
let originalResolveFilename: any = null;

function installSingleReactResolution(cwd: string): void {
  if (reactResolutionInstalled) return;

  let reactPath: string;
  let reactDomPath: string;
  try {
    reactPath = require.resolve('react', { paths: [cwd] });
    reactDomPath = require.resolve('react-dom', { paths: [cwd] });
  } catch {
    try {
      reactPath = require.resolve('react');
      reactDomPath = require.resolve('react-dom');
    } catch {
      return;
    }
  }

  originalResolveFilename = CjsModule._resolveFilename;
  CjsModule._resolveFilename = function (
    request: string,
    parent: unknown,
    isMain: boolean,
    options: unknown
  ) {
    if (request === 'react') return reactPath;
    if (request === 'react-dom') return reactDomPath;

    if (request.startsWith('react/')) {
      const subPath = request.slice('react/'.length);
      try {
        return require.resolve(`react/${subPath}`, { paths: [path.dirname(reactPath)] });
      } catch {
        // fall through
      }
    }

    if (request.startsWith('react-dom/')) {
      const subPath = request.slice('react-dom/'.length);
      try {
        return require.resolve(`react-dom/${subPath}`, { paths: [path.dirname(reactDomPath)] });
      } catch {
        // fall through
      }
    }

    return originalResolveFilename.call(this, request, parent, isMain, options);
  };

  reactResolutionInstalled = true;
}

function setupTypeScriptRuntime(cwd: string): void {
  try {
    const swcPath = require.resolve('@swc-node/register', { paths: [cwd] });
    require(swcPath);
    return;
  } catch {
    // fallback
  }

  try {
    const tsNodePath = require.resolve('ts-node', { paths: [cwd] });
    require(tsNodePath).register({
      transpileOnly: true,
      compilerOptions: {
        module: 'commonjs',
        jsx: 'react-jsx',
        moduleResolution: 'node16',
        esModuleInterop: true,
      },
    });
    return;
  } catch {
    // fallback
  }

  try {
    require.resolve('tsx', { paths: [cwd] });
    require('tsx/cjs');
  } catch {
    // no transpiler available
  }
}

function setupStaticGenerationRuntime(cwd: string): void {
  if (staticRuntimeReady) return;

  // Ignore CSS imports while requiring app modules for prerender.
  require.extensions['.css'] = (m: any, filename: string) => {
    if (filename.endsWith('.module.css')) {
      m.exports = {};
    }
  };

  installSingleReactResolution(cwd);
  setupTypeScriptRuntime(cwd);
  staticRuntimeReady = true;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface StaticGeneratorOptions {
  /** Project root */
  cwd: string;
  /** .vista directory root */
  vistaDirRoot: string;
  /** Server manifest with route info */
  manifest: ServerManifest;
  /** Whether in dev mode (limits prerendering) */
  isDev: boolean;
  /** Build ID for cache busting */
  buildId: string;
}

export interface StaticGeneratorResult {
  /** Number of pages pre-rendered */
  pagesGenerated: number;
  /** URL paths that were pre-rendered */
  generatedPaths: string[];
  /** Paths that failed */
  failedPaths: Array<{ path: string; error: string }>;
  /** The prerender manifest */
  manifest: PrerenderManifest;
}

// ---------------------------------------------------------------------------
// Static param expansion
// ---------------------------------------------------------------------------

/**
 * For dynamic routes with `generateStaticParams`, call the function
 * and return the list of param sets.
 */
async function resolveStaticParams(
  route: RouteEntry,
  cwd: string
): Promise<Array<Record<string, string | string[]>>> {
  setupStaticGenerationRuntime(cwd);

  if (!route.hasGenerateStaticParams) {
    return [];
  }

  try {
    // Bust require cache to get fresh module
    try {
      delete require.cache[require.resolve(route.pagePath)];
    } catch {
      // ignore
    }

    const pageModule = require(route.pagePath);
    const generateStaticParams =
      pageModule.generateStaticParams || pageModule.default?.generateStaticParams;

    if (typeof generateStaticParams !== 'function') {
      return [];
    }

    const params = await generateStaticParams();
    if (!Array.isArray(params)) {
      console.warn(`[vista:ssg] generateStaticParams for ${route.pattern} did not return an array`);
      return [];
    }

    return params;
  } catch (err) {
    console.error(
      `[vista:ssg] Error calling generateStaticParams for ${route.pattern}:`,
      (err as Error).message
    );
    return [];
  }
}

/**
 * Expand a route pattern with params to get a concrete URL.
 * e.g., '/blog/:slug' + { slug: 'hello' } → '/blog/hello'
 */
function expandPattern(pattern: string, params: Record<string, string | string[]>): string {
  let url = pattern;

  for (const [key, value] of Object.entries(params)) {
    const param = Array.isArray(value) ? value.join('/') : value;
    // Handle catch-all :param* and optional catch-all :param*?
    url = url.replace(new RegExp(`:${key}\\*\\??`), param);
    // Handle regular :param
    url = url.replace(`:${key}`, param);
  }

  return url;
}

// ---------------------------------------------------------------------------
// Page pre-rendering
// ---------------------------------------------------------------------------

/**
 * Pre-render a single page.
 * Loads the page component and renders it to HTML.
 *
 * This is a simplified renderer that works with the compiled webpack
 * server bundle. For RSC mode, the actual Flight prerendering is
 * handled by the upstream process.
 */
async function prerenderPage(
  urlPath: string,
  route: RouteEntry,
  params: Record<string, string | string[]> | undefined,
  cwd: string
): Promise<CachedPage | null> {
  setupStaticGenerationRuntime(cwd);

  try {
    const React = require('react');
    const { renderToString } = require('react-dom/server');

    // Load page component from webpack-built server bundle
    const pageModule = require(route.pagePath);
    const PageComponent = pageModule.default;

    if (!PageComponent) {
      console.warn(`[vista:ssg] No default export in ${route.pagePath}`);
      return null;
    }

    // Build the element, passing params as props
    let element = React.createElement(PageComponent, { params: params || {} });

    // Wrap in layouts (outside-in)
    for (let i = route.layoutPaths.length - 1; i >= 0; i--) {
      try {
        const layoutModule = require(route.layoutPaths[i]);
        const LayoutComponent = layoutModule.default;
        if (LayoutComponent) {
          element = React.createElement(
            LayoutComponent,
            { params: params || {}, searchParams: {} },
            element
          );
        }
      } catch {
        // Skip layout if it fails to load
      }
    }

    // Render to HTML string
    const html = renderToString(element);

    return {
      html: wrapInDocument(html, urlPath),
      generatedAt: Date.now(),
      revalidate: route.revalidate || 0,
      routePattern: route.pattern,
      params,
    };
  } catch (err) {
    console.error(
      `[vista:ssg] Error pre-rendering ${urlPath}:`,
      (err as Error)?.message || String(err)
    );
    return null;
  }
}

/**
 * Wrap rendered HTML in a basic document shell.
 */
function wrapInDocument(bodyHtml: string, _urlPath: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <link rel="stylesheet" href="/styles.css" />
</head>
<body>
  <div id="root">${bodyHtml}</div>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Run static generation for all eligible routes.
 */
export async function generateStaticPages(
  options: StaticGeneratorOptions
): Promise<StaticGeneratorResult> {
  const { cwd, vistaDirRoot, manifest, isDev, buildId } = options;
  const result: StaticGeneratorResult = {
    pagesGenerated: 0,
    generatedPaths: [],
    failedPaths: [],
    manifest: { routes: {}, dynamicRoutes: {}, notFoundRoutes: [] },
  };

  // In dev mode, skip prerendering (pages are rendered on demand)
  if (isDev) {
    result.manifest = generatePrerenderManifest(manifest.routes);
    return result;
  }

  const staticRoutes = manifest.routes.filter(
    (r) => r.renderMode === 'static' || r.renderMode === 'isr'
  );

  console.log(`[vista:ssg] Found ${staticRoutes.length} routes eligible for static generation`);

  for (const route of staticRoutes) {
    if (route.type === 'static') {
      // Simple static route — single URL
      const urlPath = route.pattern;
      const page = await prerenderPage(urlPath, route, undefined, cwd);

      if (page) {
        setCachedPage(urlPath, page);
        writeStaticPageToDisk(vistaDirRoot, urlPath, page);
        result.generatedPaths.push(urlPath);
        result.pagesGenerated++;
      } else {
        result.failedPaths.push({ path: urlPath, error: 'Prerender returned null' });
      }
    } else if (route.hasGenerateStaticParams) {
      // Dynamic route with generateStaticParams — expand to concrete URLs
      const paramSets = await resolveStaticParams(route, cwd);

      if (paramSets.length === 0) {
        console.log(`[vista:ssg] No static params for ${route.pattern} — will render on demand`);
        continue;
      }

      for (const params of paramSets) {
        const urlPath = expandPattern(route.pattern, params);
        const page = await prerenderPage(urlPath, route, params, cwd);

        if (page) {
          setCachedPage(urlPath, page);
          writeStaticPageToDisk(vistaDirRoot, urlPath, page);
          result.generatedPaths.push(urlPath);
          result.pagesGenerated++;
        } else {
          result.failedPaths.push({ path: urlPath, error: 'Prerender returned null' });
        }
      }
    }
  }

  // Generate prerender manifest
  result.manifest = generatePrerenderManifest(manifest.routes);

  // Write manifest to disk
  const manifestPath = path.join(vistaDirRoot, 'prerender-manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(result.manifest, null, 2));

  console.log(
    `[vista:ssg] Generated ${result.pagesGenerated} static pages` +
      (result.failedPaths.length > 0 ? ` (${result.failedPaths.length} failed)` : '')
  );

  return result;
}

/**
 * Trigger ISR revalidation for a specific path.
 * Called at runtime when a stale page is requested.
 */
export async function revalidatePath(
  urlPath: string,
  route: RouteEntry,
  params: Record<string, string | string[]> | undefined,
  cwd: string,
  vistaDirRoot: string
): Promise<boolean> {
  if (isRevalidating(urlPath)) {
    return false; // Already being revalidated
  }

  markRevalidating(urlPath);

  try {
    const page = await prerenderPage(urlPath, route, params, cwd);

    if (page) {
      setCachedPage(urlPath, page);
      writeStaticPageToDisk(vistaDirRoot, urlPath, page);
      return true;
    }

    return false;
  } catch (err) {
    console.error(
      `[vista:isr] Revalidation failed for ${urlPath}:`,
      (err as Error)?.message || String(err)
    );
    return false;
  } finally {
    clearRevalidating(urlPath);
  }
}
