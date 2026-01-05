"use strict";
/**
 * Vista Selective Hydration
 *
 * This module provides selective hydration for RSC (React Server Components).
 *
 * Key Features:
 * - Only hydrates client component "islands"
 * - Server components are rendered as static HTML
 * - Progressive hydration based on priority and visibility
 * - Minimal JavaScript for maximum performance
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
exports.hydrateClientComponents = hydrateClientComponents;
exports.initializeHydration = initializeHydration;
const React = __importStar(require("react"));
const client_1 = require("react-dom/client");
// Track hydrated components
const hydratedComponents = new Set();
const loadedChunks = new Map();
const pendingHydrations = new Map();
/**
 * Deserialize props that were serialized on the server
 */
function deserializeProps(props) {
    const result = {};
    for (const [key, value] of Object.entries(props)) {
        if (value && typeof value === 'object' && value.__type) {
            switch (value.__type) {
                case 'Date':
                    result[key] = new Date(value.value);
                    break;
                case 'undefined':
                    result[key] = undefined;
                    break;
                case 'ReactElement':
                    // React elements rendered on server - keep as is
                    result[key] = null;
                    break;
                default:
                    result[key] = value;
            }
        }
        else {
            result[key] = value;
        }
    }
    return result;
}
/**
 * Load a chunk dynamically
 * Uses indirect eval to bypass webpack's static analysis
 */
async function loadChunk(chunkUrl) {
    if (loadedChunks.has(chunkUrl)) {
        return loadedChunks.get(chunkUrl);
    }
    try {
        // Use Function constructor to create dynamic import that webpack won't analyze
        // This prevents the "Critical dependency" warning
        const dynamicImport = new Function('url', 'return import(url)');
        const module = await dynamicImport(chunkUrl);
        loadedChunks.set(chunkUrl, module);
        return module;
    }
    catch (error) {
        console.error(`[Vista] Failed to load chunk: ${chunkUrl}`, error);
        throw error;
    }
}
/**
 * Hydrate a single client component
 */
async function hydrateComponent(reference) {
    // Skip if already hydrated
    if (hydratedComponents.has(reference.mountId)) {
        return;
    }
    // Check if already pending
    if (pendingHydrations.has(reference.mountId)) {
        return pendingHydrations.get(reference.mountId);
    }
    const hydrationPromise = (async () => {
        try {
            // Find mount point
            const mountPoint = document.getElementById(reference.mountId);
            if (!mountPoint) {
                console.warn(`[Vista] Mount point not found: ${reference.mountId}`);
                return;
            }
            // Load the component chunk
            const module = await loadChunk(reference.chunkUrl);
            const Component = module[reference.exportName] || module.default;
            if (!Component) {
                console.error(`[Vista] Component not found in chunk: ${reference.exportName}`);
                return;
            }
            // Deserialize props
            const props = deserializeProps(reference.props);
            // Check if there's existing content to hydrate
            const hasContent = mountPoint.innerHTML.trim().length > 0;
            if (hasContent) {
                // Hydrate existing SSR content
                (0, client_1.hydrateRoot)(mountPoint, React.createElement(Component, props));
            }
            else {
                // No SSR content - create new root
                const root = (0, client_1.createRoot)(mountPoint);
                root.render(React.createElement(Component, props));
            }
            // Mark as hydrated
            hydratedComponents.add(reference.mountId);
            mountPoint.removeAttribute('data-vista-cc');
            mountPoint.setAttribute('data-hydrated', 'true');
        }
        catch (error) {
            console.error(`[Vista] Hydration error for ${reference.id}:`, error);
            // In development, show error in the mount point
            if (process.env.NODE_ENV === 'development') {
                const mountPoint = document.getElementById(reference.mountId);
                if (mountPoint) {
                    mountPoint.innerHTML = `
                        <div style="padding: 20px; background: #fee2e2; border: 2px solid #ef4444; border-radius: 8px; color: #991b1b; font-family: monospace;">
                            <h3 style="margin: 0 0 10px 0;">⚠️ Hydration Error</h3>
                            <p style="margin: 0 0 10px 0;">${error.message}</p>
                            <p style="margin: 0; font-size: 12px;">Component: ${reference.id}</p>
                        </div>
                    `;
                }
            }
        }
        finally {
            pendingHydrations.delete(reference.mountId);
        }
    })();
    pendingHydrations.set(reference.mountId, hydrationPromise);
    return hydrationPromise;
}
/**
 * Hydrate all client components on the page
 */
async function hydrateClientComponents(options = {}) {
    const { progressive = false, priority = 'normal', useIdleCallback = false } = options;
    // Get references from window
    const references = window.__VISTA_CLIENT_REFERENCES__ || [];
    if (references.length === 0) {
        console.log('[Vista] No client components to hydrate');
        return;
    }
    console.log(`[Vista] Hydrating ${references.length} client component(s)`);
    if (progressive) {
        // Progressive hydration - hydrate visible components first
        await hydrateProgressively(references);
    }
    else if (useIdleCallback && priority === 'low') {
        // Use idle callback for low priority hydration
        await hydrateOnIdle(references);
    }
    else {
        // Hydrate all at once
        await Promise.all(references.map(hydrateComponent));
    }
}
/**
 * Progressive hydration based on visibility
 */
async function hydrateProgressively(references) {
    // First, hydrate above-the-fold components
    const aboveTheFold = [];
    const belowTheFold = [];
    for (const ref of references) {
        const element = document.getElementById(ref.mountId);
        if (element && isInViewport(element)) {
            aboveTheFold.push(ref);
        }
        else {
            belowTheFold.push(ref);
        }
    }
    // Hydrate above-the-fold immediately
    await Promise.all(aboveTheFold.map(hydrateComponent));
    // Set up intersection observer for below-the-fold
    if (belowTheFold.length > 0 && 'IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
            for (const entry of entries) {
                if (entry.isIntersecting) {
                    const mountId = entry.target.id;
                    const ref = belowTheFold.find((r) => r.mountId === mountId);
                    if (ref) {
                        hydrateComponent(ref);
                        observer.unobserve(entry.target);
                    }
                }
            }
        }, {
            rootMargin: '50px', // Start loading slightly before visible
        });
        for (const ref of belowTheFold) {
            const element = document.getElementById(ref.mountId);
            if (element) {
                observer.observe(element);
            }
        }
    }
    else {
        // Fallback: hydrate after a delay
        setTimeout(() => {
            Promise.all(belowTheFold.map(hydrateComponent));
        }, 1000);
    }
}
/**
 * Hydrate during browser idle time
 */
async function hydrateOnIdle(references) {
    const requestIdleCallback = window.requestIdleCallback || ((cb) => setTimeout(cb, 1));
    for (const ref of references) {
        await new Promise((resolve) => {
            requestIdleCallback(() => {
                hydrateComponent(ref).then(resolve);
            });
        });
    }
}
/**
 * Check if an element is in the viewport
 */
function isInViewport(element) {
    const rect = element.getBoundingClientRect();
    return (rect.top < window.innerHeight + 100 &&
        rect.bottom > -100 &&
        rect.left < window.innerWidth + 100 &&
        rect.right > -100);
}
/**
 * Initialize Vista hydration
 * Call this after the page loads
 */
function initializeHydration() {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            hydrateClientComponents({ progressive: true });
        });
    }
    else {
        hydrateClientComponents({ progressive: true });
    }
}
// Auto-initialize if this module is loaded
if (typeof window !== 'undefined') {
    initializeHydration();
}
exports.default = {
    hydrateClientComponents,
    hydrateComponent,
    initializeHydration,
};
