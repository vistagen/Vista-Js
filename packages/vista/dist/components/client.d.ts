/**
 * Vista Client Component Wrapper
 *
 * A wrapper that marks children as client components for hydration.
 * SSR: Renders the component normally (like Next.js/Astro)
 * Client: Hydrates the existing DOM (attaches event handlers)
 *
 * Usage:
 * ```tsx
 * import { Client } from 'vista';
 *
 * <Client>
 *   <Counter />
 * </Client>
 * ```
 */
import * as React from 'react';
interface ClientProps {
    /** Children - client components to hydrate */
    children: React.ReactNode;
}
/**
 * Wraps child components and marks them for client-side hydration.
 *
 * During SSR, components are rendered normally (no placeholders).
 * On client, hydrateRoot attaches to existing DOM.
 */
export declare function Client({ children }: ClientProps): React.ReactElement;
export default Client;
