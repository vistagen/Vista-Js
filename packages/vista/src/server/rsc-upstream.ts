import express from 'express';
import fs from 'fs';
import path from 'path';
import React from 'react';
import { pathToFileURL } from 'url';

import type { RouteEntry, ServerManifest } from '../build/rsc/server-manifest';
import { resolveNotFoundComponent, resolveRootLayout } from './root-resolver';
import { BUILD_DIR } from '../constants';

// NOTE: RouteErrorBoundary and RouteSuspense are 'use client' components.
// Under --conditions react-server, React.Component is not available, so we
// must NOT import them at the top level.  Instead we lazy-require them after
// the client-load hook has been installed (which turns them into Flight
// client references automatically).
let _RouteErrorBoundary: any = null;
let _RouteSuspense: any = null;

function getRouteErrorBoundary() {
  if (!_RouteErrorBoundary) {
    _RouteErrorBoundary = require('../components/error-boundary').RouteErrorBoundary;
  }
  return _RouteErrorBoundary;
}

function getRouteSuspense() {
  if (!_RouteSuspense) {
    _RouteSuspense = require('../components/route-suspense').RouteSuspense;
  }
  return _RouteSuspense;
}

const CjsModule = require('module');
// Support CSS imports on server runtime
require.extensions['.css'] = (m: any, filename: string) => {
  if (filename.endsWith('.module.css')) {
    m.exports = {};
  }
};

type FlightServerApi = {
  renderToPipeableStream: (
    model: React.ReactNode,
    moduleMap: any,
    options?: { onError?: (error: unknown) => void }
  ) => { pipe: (destination: NodeJS.WritableStream) => void };
  createClientModuleProxy: (id: string) => any;
  decodeReply: (body: string | FormData, webpackMap: any) => Promise<unknown[]>;
  decodeAction: (body: FormData, serverManifest: any) => Promise<() => unknown>;
  registerServerReference: (reference: Function, id: string, exportName: string) => void;
};

let installedClientLoadHook = false;
let originalCompile: any = null;
let reactResolutionInstalled = false;
let originalResolveFilename: any = null;
const clientDirectiveCache = new Map<string, boolean>();

function parseCliArg(flag: string): string | undefined {
  const index = process.argv.indexOf(flag);
  if (index === -1) return undefined;
  return process.argv[index + 1];
}

function resolvePort(defaultPort: number): number {
  const raw = parseCliArg('--port') ?? process.env.RSC_UPSTREAM_PORT ?? String(defaultPort);
  const port = Number(raw);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`Invalid upstream port: ${raw}`);
  }
  return port;
}

function resolveFromWorkspace(specifier: string, cwd: string): string {
  const searchRoots = [
    cwd,
    path.resolve(cwd, '..'),
    path.resolve(cwd, '..', '..'),
    path.resolve(cwd, '..', '..', 'rsc'),
    path.resolve(cwd, '..', '..', '..'),
    path.resolve(cwd, '..', '..', '..', 'rsc'),
  ];

  for (const root of searchRoots) {
    try {
      return require.resolve(specifier, { paths: [root] });
    } catch {
      // continue
    }
  }

  return require.resolve(specifier);
}

function normalizeModulePath(filePath: string): string {
  return filePath.replace(/\\/g, '/').toLowerCase();
}

function shouldInvalidateDevModule(modulePath: string, cwd: string): boolean {
  const normalized = normalizeModulePath(modulePath);
  const rootPrefix = normalizeModulePath(`${cwd}${path.sep}`);

  if (!normalized.startsWith(rootPrefix)) return false;
  if (normalized.includes('/node_modules/')) return false;
  if (normalized.includes(`/${BUILD_DIR.toLowerCase()}/`)) return false;

  return /\.(?:[cm]?[jt]sx?|json)$/i.test(normalized);
}

function clearProjectRequireCache(cwd: string): void {
  for (const key of Object.keys(require.cache)) {
    if (!shouldInvalidateDevModule(key, cwd)) continue;
    delete require.cache[key];
    clientDirectiveCache.delete(key);
  }
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
    // tsx/cjs registers the TypeScript loader for require()
    require('tsx/cjs');
    return;
  } catch {
    throw new Error(
      'No TypeScript compiler available for RSC upstream runtime. Install one of: @swc-node/register, ts-node, or tsx'
    );
  }
}

function hasClientBoundaryDirective(source: string): boolean {
  const trimmed = source.trimStart();
  return trimmed.startsWith("'use client'") || trimmed.startsWith('"use client"');
}

function isClientBoundaryFile(filename: string, transpiledSource: string): boolean {
  const cached = clientDirectiveCache.get(filename);
  if (cached !== undefined) return cached;

  let isClient = false;
  try {
    const originalSource = fs.readFileSync(filename, 'utf-8');
    isClient = hasClientBoundaryDirective(originalSource);
  } catch {
    isClient = hasClientBoundaryDirective(transpiledSource);
  }

  clientDirectiveCache.set(filename, isClient);
  return isClient;
}

function installSingleReactResolution(): void {
  if (reactResolutionInstalled) return;

  let reactPath: string;
  let reactDomPath: string;
  try {
    reactPath = require.resolve('react');
    reactDomPath = require.resolve('react-dom');
  } catch {
    return;
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

function installClientLoadHook(cwd: string, createClientModuleProxy: (id: string) => any): void {
  if (installedClientLoadHook) return;

  originalCompile = CjsModule.prototype._compile;

  CjsModule.prototype._compile = function (content: string, filename: string) {
    const isJavaScriptModule = /\.[jt]sx?$/.test(filename);

    if (isJavaScriptModule && isClientBoundaryFile(filename, content)) {
      const moduleId = pathToFileURL(filename).href;
      this.exports = createClientModuleProxy(moduleId);
      return;
    }

    return originalCompile.call(this, content, filename);
  };

  installedClientLoadHook = true;
}

function matchPattern(pathname: string, pattern: string): boolean {
  const patternParts = pattern.split('/').filter(Boolean);
  const pathParts = pathname.split('/').filter(Boolean);

  if (patternParts.length === 0 && pathParts.length === 0) return true;

  for (let i = 0; i < patternParts.length; i++) {
    const patternPart = patternParts[i];
    const pathPart = pathParts[i];

    // Optional catch-all: matches zero or more segments
    if (patternPart.endsWith('*?')) {
      return true;
    }

    // Required catch-all: matches one or more remaining segments
    if (patternPart.endsWith('*')) {
      return pathParts.length >= i + 1;
    }

    if (patternPart.startsWith(':')) {
      if (!pathPart) return false;
      continue;
    }
    if (patternPart !== pathPart) return false;
  }

  return patternParts.length === pathParts.length;
}

function matchRoute(pathname: string, routes: RouteEntry[]): RouteEntry | null {
  const sorted = [...routes].sort((a, b) => {
    const aOptional = a.pattern.includes('*?');
    const bOptional = b.pattern.includes('*?');
    if (aOptional && !bOptional) return 1;
    if (!aOptional && bOptional) return -1;
    return b.pattern.split('/').length - a.pattern.split('/').length;
  });

  for (const route of sorted) {
    if (matchPattern(pathname, route.pattern)) return route;
  }
  return null;
}

function extractParams(pathname: string, route: RouteEntry): Record<string, string> {
  const params: Record<string, string> = {};
  const patternParts = route.pattern.split('/').filter(Boolean);
  const pathParts = pathname.split('/').filter(Boolean);

  for (let i = 0; i < patternParts.length; i++) {
    const patternPart = patternParts[i];
    if (!patternPart.startsWith(':')) continue;

    const name = patternPart.slice(1).replace(/\*\??/, '');
    if (patternPart.endsWith('*?') || patternPart.endsWith('*')) {
      params[name] = pathParts.slice(i).join('/');
    } else {
      params[name] = pathParts[i] || '';
    }
  }

  return params;
}

async function createRouteElement(
  route: RouteEntry,
  context: {
    params: Record<string, string>;
    searchParams: Record<string, string>;
    req: express.Request;
  },
  isDev: boolean,
  cwd: string
): Promise<React.ReactElement> {
  const { params, searchParams, req } = context;

  if (isDev) {
    clearProjectRequireCache(cwd);
  }

  const PageModule = require(route.pagePath);
  const PageComponent = PageModule.default;
  if (!PageComponent) {
    throw new Error(`Page module does not export default component: ${route.pagePath}`);
  }

  const pageProps =
    typeof PageModule.getServerProps === 'function'
      ? await PageModule.getServerProps({ query: req.query, params, req })
      : {};

  let element = React.createElement(PageComponent, {
    ...pageProps,
    params,
    searchParams,
  }) as React.ReactElement;

  // Wrap page in loading/error boundaries if discovered
  if (route.loadingPath || route.errorPath) {
    const loadingComponent = route.loadingPath
      ? (() => {
          try {
            return require(route.loadingPath!).default;
          } catch {
            return undefined;
          }
        })()
      : undefined;
    const errorComponent = route.errorPath
      ? (() => {
          try {
            return require(route.errorPath!).default;
          } catch {
            return undefined;
          }
        })()
      : undefined;

    // Inner: Suspense boundary for loading states
    if (loadingComponent) {
      element = React.createElement(getRouteSuspense(), {
        loadingComponent,
        children: element,
      } as any) as React.ReactElement;
    }

    // Outer: Error boundary wraps Suspense
    if (errorComponent) {
      element = React.createElement(getRouteErrorBoundary(), {
        fallbackComponent: errorComponent,
        children: element,
      } as any) as React.ReactElement;
    }
  }

  for (let i = route.layoutPaths.length - 1; i >= 0; i--) {
    const layoutPath = route.layoutPaths[i];
    const LayoutModule = require(layoutPath);
    const LayoutComponent = LayoutModule.default;
    if (!LayoutComponent) continue;
    element = React.createElement(
      LayoutComponent,
      { params, searchParams },
      element
    ) as React.ReactElement;
  }

  return element;
}

function startUpstream(): void {
  const cwd = process.cwd();
  const isDev = process.env.NODE_ENV !== 'production';
  const port = resolvePort(3101);

  installSingleReactResolution();
  setupTypeScriptRuntime(cwd);

  const flightServerPath = resolveFromWorkspace('react-server-dom-webpack/server.node', cwd);
  const flightServer = require(flightServerPath) as FlightServerApi;
  installClientLoadHook(cwd, flightServer.createClientModuleProxy);

  const serverManifestPath = path.join(cwd, BUILD_DIR, 'server', 'server-manifest.json');
  const flightManifestPath = path.join(cwd, BUILD_DIR, 'react-client-manifest.json');

  if (!fs.existsSync(serverManifestPath)) {
    throw new Error('Missing RSC server manifest. Run "vista build" first.');
  }
  // In dev mode the flight manifest may not exist yet (webpack-dev-middleware
  // hasn't completed the first compilation).  Write a stub so we can start,
  // and reload on each request.
  if (!fs.existsSync(flightManifestPath)) {
    if (isDev) {
      fs.writeFileSync(flightManifestPath, '{}');
    } else {
      throw new Error('Missing RSC flight manifest. Run "vista build" first.');
    }
  }

  let serverManifest = JSON.parse(fs.readFileSync(serverManifestPath, 'utf-8')) as ServerManifest;
  let flightManifest = JSON.parse(fs.readFileSync(flightManifestPath, 'utf-8'));

  const app = express();

  const handleRSCRequest = async (req: express.Request, res: express.Response) => {
    try {
      // In dev mode, reload manifests from disk on each request so we
      // always pick up the latest output from ReactFlightWebpackPlugin.
      if (isDev) {
        try {
          serverManifest = JSON.parse(
            fs.readFileSync(serverManifestPath, 'utf-8')
          ) as ServerManifest;
          flightManifest = JSON.parse(fs.readFileSync(flightManifestPath, 'utf-8'));
        } catch {
          // Manifests may be mid-write; use whatever we have cached.
        }
      }

      const pathname = req.path.replace(/^\/(?:_rsc|rsc)/, '') || '/';
      const route = matchRoute(pathname, serverManifest.routes);
      if (!route) {
        const rootLayout = resolveRootLayout(cwd, isDev);
        const resolvedNotFound = resolveNotFoundComponent(cwd, rootLayout, isDev);

        let model: React.ReactElement;
        if (resolvedNotFound) {
          const notFoundElement = React.createElement(resolvedNotFound.component, {
            params: {},
            searchParams: {},
          }) as React.ReactElement;
          model = React.createElement(
            rootLayout.component,
            { params: {}, searchParams: {} },
            notFoundElement
          ) as React.ReactElement;
        } else {
          model = React.createElement(
            'div',
            {
              style: {
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100vh',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                background: '#0a0a0a',
                color: '#ededed',
                margin: 0,
                overflow: 'hidden',
                textAlign: 'center',
                userSelect: 'none',
              },
            },
            React.createElement(
              'span',
              {
                style: {
                  fontSize: '6rem',
                  fontWeight: 800,
                  letterSpacing: '-0.04em',
                  lineHeight: 1,
                  background: 'linear-gradient(135deg, #7c3aed, #2563eb, #06b6d4)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                },
              },
              '404'
            ),
            React.createElement(
              'p',
              {
                style: {
                  marginTop: '0.75rem',
                  fontSize: '0.95rem',
                  fontWeight: 400,
                  color: '#555',
                  letterSpacing: '0.02em',
                },
              },
              "There's nothing here."
            )
          );
        }

        res.status(404);
        res.setHeader('Content-Type', 'text/x-component');
        res.setHeader('Vary', 'Accept');

        const stream = flightServer.renderToPipeableStream(model, flightManifest, {
          onError(error) {
            console.error('[vista:rsc] Flight render error on 404:', error);
          },
        });
        stream.pipe(res);
        return;
      }

      const params = extractParams(pathname, route);
      const searchParams = Object.fromEntries(new URLSearchParams(req.query as any).entries());
      const element = await createRouteElement(route, { params, searchParams, req }, isDev, cwd);

      res.setHeader('Content-Type', 'text/x-component');
      res.setHeader('Vary', 'Accept');

      const stream = flightServer.renderToPipeableStream(element, flightManifest, {
        onError(error) {
          console.error('[vista:rsc] Upstream flight render error:', error);
        },
      });
      stream.pipe(res);
    } catch (error) {
      if ((error as any)?.name === 'NotFoundError') {
        try {
          const rootLayout = resolveRootLayout(cwd, isDev);
          const resolvedNotFound = resolveNotFoundComponent(cwd, rootLayout, isDev);

          let model: React.ReactElement;
          if (resolvedNotFound) {
            const notFoundElement = React.createElement(resolvedNotFound.component, {
              params: {},
              searchParams: {},
            }) as React.ReactElement;
            model = React.createElement(
              rootLayout.component,
              { params: {}, searchParams: {} },
              notFoundElement
            ) as React.ReactElement;
          } else {
            model = React.createElement('h1', null, '404 - Page Not Found');
          }

          res.status(404);
          res.setHeader('Content-Type', 'text/x-component');
          res.setHeader('Vary', 'Accept');

          const notFoundStream = flightServer.renderToPipeableStream(model, flightManifest, {
            onError(notFoundError) {
              console.error('[vista:rsc] Flight render error on NotFoundError:', notFoundError);
            },
          });
          notFoundStream.pipe(res);
          return;
        } catch (notFoundError) {
          console.error('[vista:rsc] Failed to render NotFoundError fallback:', notFoundError);
        }
      }
      console.error('[vista:rsc] Upstream request failed:', error);
      res
        .status(500)
        .type('text/plain')
        .send((error as Error).message);
    }
  };

  app.get('/rsc*', handleRSCRequest);
  app.get('/_rsc*', handleRSCRequest);

  // -----------------------------------------------------------------------
  // Server Actions — POST handler
  // -----------------------------------------------------------------------
  app.use(express.text({ type: 'text/plain', limit: '10mb' }));

  const handleServerAction = async (req: express.Request, res: express.Response) => {
    try {
      const actionId = req.headers['rsc-action'] as string | undefined;
      if (!actionId) {
        res.status(400).type('text/plain').send('Missing rsc-action header');
        return;
      }

      // actionId format: "file:///.../module.ts#exportName"
      const hashIdx = actionId.lastIndexOf('#');
      const modulePath = hashIdx >= 0 ? actionId.slice(0, hashIdx) : actionId;
      const exportName = hashIdx >= 0 ? actionId.slice(hashIdx + 1) : 'default';

      // Resolve the server module
      let resolvedPath = modulePath;
      if (resolvedPath.startsWith('file://')) {
        resolvedPath = resolvedPath.replace(/^file:\/\/\//, '').replace(/^file:\/\//, '');
        // On Windows, paths look like file:///C:/... so we need to keep the drive letter
        if (process.platform === 'win32' && /^[a-zA-Z]:/.test(resolvedPath) === false) {
          resolvedPath = '/' + resolvedPath;
        }
      }

      // In dev mode, bust the require cache so we get fresh code
      if (isDev) {
        delete require.cache[require.resolve(resolvedPath)];
      }

      const actionModule = require(resolvedPath);
      const actionFn = actionModule[exportName];

      if (typeof actionFn !== 'function') {
        res.status(404).type('text/plain').send(`Server action not found: ${actionId}`);
        return;
      }

      // Decode the arguments from the request body
      let args: unknown[];
      const contentType = req.headers['content-type'] || '';
      if (contentType.includes('multipart/form-data')) {
        // For form submissions, decodeAction handles the FormData
        const boundAction = await flightServer.decodeAction(req.body, flightManifest);
        const result = await boundAction();

        // Return the result as a Flight stream
        res.setHeader('Content-Type', 'text/x-component');
        const stream = flightServer.renderToPipeableStream(
          result as React.ReactNode,
          flightManifest,
          {
            onError(error) {
              console.error('[vista:rsc] Server action render error:', error);
            },
          }
        );
        stream.pipe(res);
        return;
      } else {
        // Text body — decode via decodeReply
        args = (await flightServer.decodeReply(req.body as string, flightManifest)) as unknown[];
      }

      // Call the action
      const result = await actionFn(...(Array.isArray(args) ? args : [args]));

      // Return the result as a Flight stream
      res.setHeader('Content-Type', 'text/x-component');
      const stream = flightServer.renderToPipeableStream(
        result as React.ReactNode,
        flightManifest,
        {
          onError(error) {
            console.error('[vista:rsc] Server action render error:', error);
          },
        }
      );
      stream.pipe(res);
    } catch (error) {
      console.error('[vista:rsc] Server action failed:', error);
      res
        .status(500)
        .type('text/plain')
        .send((error as Error).message);
    }
  };

  app.post('/rsc*', handleServerAction);
  app.post('/_rsc*', handleServerAction);

  const server = app.listen(port, () => {
    console.log(`[vista:rsc:upstream] Listening on http://127.0.0.1:${port}/rsc`);
  });

  server.on('error', (error: any) => {
    if (error?.code === 'EADDRINUSE') {
      console.error(`[vista:server] Port ${port} is already in use.`);
      process.exit(1);
      return;
    }
    console.error('[vista:server] RSC upstream startup failed:', error);
    process.exit(1);
  });
}

startUpstream();
