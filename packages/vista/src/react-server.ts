/**
 * React Server Components entrypoint.
 *
 * Keep this surface intentionally small and server-safe so apps can import
 * `vista` under the `react-server` condition without pulling client-only APIs.
 */

export { Client } from './components/client';
export { default as Head, generateMetadataHead } from './client/head.react-server';

export type { Metadata } from './metadata/types';
export type { Metadata as HeadMetadata } from './client/head.react-server';
export type { ClientManifest, ClientComponentEntry } from './build/rsc/client-manifest';
export type { ServerManifest, ServerComponentEntry, RouteEntry } from './build/rsc/server-manifest';
