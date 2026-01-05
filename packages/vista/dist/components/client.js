"use strict";
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
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Client = Client;
const React = __importStar(require("react"));
/**
 * Wraps child components and marks them for client-side hydration.
 *
 * During SSR, components are rendered normally (no placeholders).
 * On client, hydrateRoot attaches to existing DOM.
 */
function Client({ children }) {
    // Process children and wrap with hydration markers
    const processedChildren = React.Children.map(children, (child, index) => {
        if (!React.isValidElement(child)) {
            return child;
        }
        // Get component name from displayName, name, or fallback
        const componentType = child.type;
        let componentName = 'unknown';
        if (typeof componentType === 'function') {
            componentName = componentType.displayName ||
                componentType.name ||
                'Component';
        }
        else if (typeof componentType === 'string') {
            // It's a native element - render it normally
            return child;
        }
        // Convert to lowercase for hydration matching
        const componentId = componentName.toLowerCase();
        // Serialize safe props (exclude functions and react elements)
        const safeProps = {};
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
exports.default = Client;
