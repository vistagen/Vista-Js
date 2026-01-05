export * from './router';
export * from './components';
export * from './auth';
export * from './types';
export * from './dev-error';

// Client-side features
export { useRouter } from './client/router';
export {
  usePathname,
  useSearchParams,
  useParams,
  useSelectedLayoutSegment,
  useSelectedLayoutSegments,
} from './client/navigation';
export { default as dynamic } from './client/dynamic';
export { default as Script } from './client/script';
export { default as Head, generateMetadataHead } from './client/head';
export type { Metadata as HeadMetadata } from './client/head';

// Font exports
export * from './client/font';

// Metadata exports (Next.js compatible)
export * from './metadata';
export type { Metadata } from './metadata/types';

// RSC (React Server Components) exports
export { hydrateClientComponents, initializeHydration } from './client/hydration';
export { ClientIsland } from './components/client-island';
export { Client } from './components/client';


// Build system exports (for advanced usage)
export type { ClientManifest, ClientComponentEntry } from './build/rsc/client-manifest';
export type { ServerManifest, ServerComponentEntry, RouteEntry } from './build/rsc/server-manifest';
export type { RSCPayload, ClientReference } from './build/rsc/rsc-renderer';
