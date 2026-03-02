/**
 * Type declarations for react-server-dom-webpack
 *
 * These ambient declarations cover the subset of APIs Vista uses.
 * The upstream package does not ship its own .d.ts files.
 */

declare module 'react-server-dom-webpack/client' {
  import type { ReactNode } from 'react';

  interface CreateFromFetchOptions {
    callServer?: (id: string, args: unknown[]) => Promise<unknown>;
  }

  export function createFromFetch(
    fetchPromise: Promise<Response>,
    options?: CreateFromFetchOptions,
  ): Promise<ReactNode>;

  export function createFromReadableStream(
    stream: ReadableStream,
    options?: CreateFromFetchOptions,
  ): Promise<ReactNode>;

  export function encodeReply(value: unknown[]): Promise<string | FormData>;

  export function createServerReference(
    id: string,
    callServer: (id: string, args: unknown[]) => Promise<unknown>,
  ): (...args: unknown[]) => Promise<unknown>;

  export function registerServerReference(
    reference: Function,
    id: string,
  ): void;

  export function createTemporaryReferenceSet(): Set<unknown>;
}

declare module 'react-server-dom-webpack/client.node' {
  import type { Readable } from 'stream';
  import type { ReactNode } from 'react';

  interface SSRManifest {
    moduleMap: Record<string, any>;
    moduleLoading: any;
    serverModuleMap?: Record<string, any>;
  }

  interface CreateFromNodeStreamOptions {
    callServer?: (id: string, args: unknown[]) => Promise<unknown>;
  }

  export function createFromNodeStream(
    stream: Readable,
    ssrManifest: SSRManifest,
    options?: CreateFromNodeStreamOptions,
  ): Promise<ReactNode>;
}

declare module 'react-server-dom-webpack/server.node' {
  import type { ReactNode } from 'react';
  import type { Writable } from 'stream';

  interface RenderOptions {
    onError?: (error: unknown) => void;
  }

  interface PipeableStream {
    pipe(destination: Writable): Writable;
  }

  export function renderToPipeableStream(
    model: ReactNode,
    webpackMap: any,
    options?: RenderOptions,
  ): PipeableStream;

  export function renderToReadableStream(
    model: ReactNode,
    webpackMap: any,
    options?: RenderOptions,
  ): ReadableStream;

  export function createClientModuleProxy(moduleId: string): any;

  export function decodeReply(
    body: string | FormData,
    webpackMap: any,
  ): Promise<unknown[]>;

  export function decodeAction(
    body: FormData,
    serverManifest: any,
  ): Promise<() => unknown>;

  export function decodeFormState(
    actionResult: unknown,
    body: FormData,
    serverManifest: any,
  ): Promise<unknown>;

  export function registerServerReference(
    reference: Function,
    id: string,
    exportName: string,
  ): void;

  export function registerClientReference(
    moduleId: string,
    exportName: string,
  ): any;

  export function createTemporaryReferenceSet(): Set<unknown>;

  export function prerender(
    model: ReactNode,
    webpackMap: any,
    options?: RenderOptions,
  ): Promise<PipeableStream>;

  export function prerenderToNodeStream(
    model: ReactNode,
    webpackMap: any,
    options?: RenderOptions,
  ): Promise<PipeableStream>;
}

declare module 'react-server-dom-webpack/plugin' {
  import type { Compiler } from 'webpack';

  interface ReactFlightWebpackPluginOptions {
    isServer?: boolean;
    clientReferences?: string[];
    clientManifestFilename?: string;
    ssrManifestFilename?: string;
  }

  export default class ReactFlightWebpackPlugin {
    constructor(options?: ReactFlightWebpackPluginOptions);
    apply(compiler: Compiler): void;
  }
}
