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
export function Client({ children }: ClientProps): React.ReactElement {
    // Process children and wrap with hydration markers
    const processedChildren = React.Children.map(children, (child, index) => {
        if (!React.isValidElement(child)) {
            return child;
        }

        // Get component name from displayName, name, or fallback
        const componentType = child.type;
        let componentName = 'unknown';

        if (typeof componentType === 'function') {
            componentName = (componentType as any).displayName ||
                (componentType as any).name ||
                'Component';
        } else if (typeof componentType === 'string') {
            // It's a native element - render it normally
            return child;
        }

        // Convert to lowercase for hydration matching
        const componentId = componentName.toLowerCase();

        // Serialize safe props (exclude functions and react elements)
        const safeProps: Record<string, any> = {};
        if (child.props) {
            for (const [key, value] of Object.entries(child.props)) {
                if (key !== 'children' &&
                    typeof value !== 'function' &&
                    !React.isValidElement(value)) {
                    safeProps[key] = value;
                }
            }
        }

        // Wrap the child with hydration marker AND render the actual child
        // This is the Next.js/Astro approach - SSR the content, hydrate on client
        return React.createElement('div', {
            key: index,
            'data-vista-client': componentId,
            'data-props': JSON.stringify(safeProps),
            style: { display: 'contents' } // Don't affect layout
        }, child); // RENDER THE CHILD during SSR!
    });

    return React.createElement(React.Fragment, null, processedChildren);
}

export default Client;
