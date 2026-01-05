/**
 * Vista RSC Renderer
 *
 * Renders React Server Components to an RSC Payload format.
 * This is the core of the "Zero Bundle Size Server Components" feature.
 *
 * RSC Payload Format:
 * - Server components render to a special streaming format
 * - Client component references are serialized as "holes" to be filled client-side
 * - The client receives a stream of instructions + HTML
 */
import type { ClientManifest } from './client-manifest';
import type { ServerManifest, RouteEntry } from './server-manifest';
export interface RSCPayload {
    /** The rendered HTML for server components */
    html: string;
    /** Client component references to hydrate */
    clientReferences: ClientReference[];
    /** Data passed to client for hydration */
    data: Record<string, any>;
    /** Flight data for streaming (if enabled) */
    flight?: string;
}
export interface ClientReference {
    /** Unique ID matching client manifest */
    id: string;
    /** DOM element ID where component should mount */
    mountId: string;
    /** Props to pass to the client component */
    props: Record<string, any>;
    /** Chunk URL to load */
    chunkUrl: string;
    /** Export name to use (usually 'default') */
    exportName: string;
}
export interface RSCRenderContext {
    /** Client manifest for resolving client components */
    clientManifest: ClientManifest;
    /** Server manifest for component metadata */
    serverManifest: ServerManifest;
    /** Current route being rendered */
    route: RouteEntry;
    /** URL parameters */
    params: Record<string, string>;
    /** Search params */
    searchParams: Record<string, string>;
    /** Request metadata */
    request: {
        url: string;
        method: string;
        headers: Record<string, string>;
    };
}
/**
 * Reset mount ID counter (call at start of each request)
 */
export declare function resetMountIdCounter(): void;
/**
 * RSC Renderer class
 * Handles rendering a route with proper server/client component separation
 */
export declare class RSCRenderer {
    private clientManifest;
    private serverManifest;
    private clientReferences;
    private cwd;
    constructor(options: {
        clientManifest: ClientManifest;
        serverManifest: ServerManifest;
        cwd: string;
    });
    /**
     * Render a route to RSC Payload
     */
    render(context: RSCRenderContext): Promise<RSCPayload>;
    /**
     * Render a route with nested layouts
     */
    private renderRoute;
    /**
     * Require a component with cache clearing in dev
     */
    private requireComponent;
    /**
     * Check if a component is a client component
     */
    private isClientComponent;
}
/**
 * Create an RSC renderer instance
 */
export declare function createRSCRenderer(cwd: string): RSCRenderer | null;
/**
 * Generate the client-side hydration script
 *
 * This just sets the data - the actual hydration is handled by rsc-client.tsx
 * which is bundled and has all client components pre-imported.
 */
export declare function generateHydrationScript(payload: RSCPayload): string;
