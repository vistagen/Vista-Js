/**
 * Vista ClientIsland Component
 *
 * Wraps client components to mark them for hydration.
 * Usage in server components:
 *
 * import { ClientIsland } from 'vista/client-island';
 * import Counter from './counter';
 *
 * <ClientIsland component="counter">
 *   <Counter />
 * </ClientIsland>
 */
import * as React from 'react';
interface ClientIslandProps {
    /** Component ID - must match the registered client component name */
    component: string;
    /** Props to pass to the client component for hydration */
    props?: Record<string, any>;
    /** Children - the server-rendered content of the client component */
    children: React.ReactNode;
}
/**
 * ClientIsland wraps client components with hydration markers.
 *
 * During SSR, it renders:
 * <div data-vista-client="counter" data-props="{}">
 *   {children from SSR}
 * </div>
 *
 * The client then hydrates only these marked islands.
 */
export declare function ClientIsland({ component, props, children }: ClientIslandProps): React.ReactElement;
export default ClientIsland;
