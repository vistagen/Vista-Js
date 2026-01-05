"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RSCRenderer = void 0;
exports.resetMountIdCounter = resetMountIdCounter;
exports.createRSCRenderer = createRSCRenderer;
exports.generateHydrationScript = generateHydrationScript;
const react_1 = __importDefault(require("react"));
const server_1 = require("react-dom/server");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
// Import RSC module system for client component interception
let rscModuleSystem = null;
try {
    rscModuleSystem = require('../../server/rsc-module-system');
}
catch {
    // Module system not available (during build)
}
// Counter for generating unique mount IDs
let mountIdCounter = 0;
/**
 * Reset mount ID counter (call at start of each request)
 */
function resetMountIdCounter() {
    mountIdCounter = 0;
}
/**
 * Generate a unique mount ID for a client component
 */
function generateMountId() {
    return `__vista_cc_${++mountIdCounter}`;
}
/**
 * Check if a component module is a client component
 */
function isClientComponent(modulePath, manifest) {
    return modulePath in manifest.pathToId;
}
/**
 * Create a client component placeholder
 * This renders a marker div that will be hydrated on the client
 */
function createClientComponentPlaceholder(entry, props, children) {
    const mountId = generateMountId();
    // Create the reference for hydration
    const reference = {
        id: entry.id,
        mountId,
        props: serializeProps(props),
        chunkUrl: `/_vista/static/chunks/${entry.chunkName}.js`,
        exportName: 'default',
    };
    // Create placeholder element
    // Children are rendered server-side if they're server components
    const element = react_1.default.createElement('div', {
        'data-vista-cc': entry.id,
        'data-vista-mount': mountId,
        id: mountId,
        suppressHydrationWarning: true,
    }, children);
    return { element, reference };
}
/**
 * Serialize props for client-side hydration
 * Handles Date, undefined, functions, etc.
 */
function serializeProps(props) {
    const serialized = {};
    for (const [key, value] of Object.entries(props)) {
        if (key === 'children') {
            // Children are handled separately
            continue;
        }
        if (typeof value === 'function') {
            // Functions can't be serialized - skip or warn
            console.warn(`[Vista RSC] Cannot serialize function prop "${key}" to client`);
            continue;
        }
        if (value instanceof Date) {
            serialized[key] = { __type: 'Date', value: value.toISOString() };
        }
        else if (value === undefined) {
            serialized[key] = { __type: 'undefined' };
        }
        else if (react_1.default.isValidElement(value)) {
            // React elements need special handling
            serialized[key] = { __type: 'ReactElement', rendered: true };
        }
        else {
            serialized[key] = value;
        }
    }
    return serialized;
}
/**
 * RSC Renderer class
 * Handles rendering a route with proper server/client component separation
 */
class RSCRenderer {
    clientManifest;
    serverManifest;
    clientReferences = [];
    cwd;
    constructor(options) {
        this.clientManifest = options.clientManifest;
        this.serverManifest = options.serverManifest;
        this.cwd = options.cwd;
    }
    /**
     * Render a route to RSC Payload
     */
    async render(context) {
        // Reset counters
        resetMountIdCounter();
        this.clientReferences = [];
        // Reset RSC module system state (for client component interception)
        if (rscModuleSystem) {
            rscModuleSystem.resetRSCState();
        }
        const { route, params, searchParams } = context;
        // Load and render layouts + page
        const element = await this.renderRoute(route, params, searchParams);
        // Render to HTML string
        const html = (0, server_1.renderToString)(element);
        // Collect client references from module system (intercepted requires)
        let collectedReferences = this.clientReferences;
        if (rscModuleSystem) {
            const moduleReferences = rscModuleSystem.getClientReferences();
            collectedReferences = [...collectedReferences, ...moduleReferences];
        }
        return {
            html,
            clientReferences: collectedReferences,
            data: {
                params,
                searchParams,
                route: route.pattern,
            },
        };
    }
    /**
     * Render a route with nested layouts
     */
    async renderRoute(route, params, searchParams) {
        // Load the page component
        const PageModule = this.requireComponent(route.pagePath);
        const PageComponent = PageModule.default;
        // Fetch page metadata if exists
        let metadata = {};
        if (PageModule.metadata) {
            metadata = { ...metadata, ...PageModule.metadata };
        }
        if (typeof PageModule.generateMetadata === 'function') {
            try {
                const dynamicMeta = await PageModule.generateMetadata({ params, searchParams });
                metadata = { ...metadata, ...dynamicMeta };
            }
            catch (e) {
                console.error('[Vista RSC] generateMetadata error:', e);
            }
        }
        // Create page element
        let pageElement = react_1.default.createElement(PageComponent, {
            params,
            searchParams,
        });
        // Check if page is a client component
        if (this.isClientComponent(route.pagePath)) {
            const entry = this.clientManifest.clientModules[this.clientManifest.pathToId[route.pagePath]];
            const { element, reference } = createClientComponentPlaceholder(entry, {
                params,
                searchParams,
            });
            this.clientReferences.push(reference);
            pageElement = element;
        }
        // Wrap in layouts (innermost to outermost)
        let wrappedElement = pageElement;
        for (let i = route.layoutPaths.length - 1; i >= 0; i--) {
            const layoutPath = route.layoutPaths[i];
            const LayoutModule = this.requireComponent(layoutPath);
            const LayoutComponent = LayoutModule.default;
            if (this.isClientComponent(layoutPath)) {
                // Client component layout
                const entry = this.clientManifest.clientModules[this.clientManifest.pathToId[layoutPath]];
                const { element, reference } = createClientComponentPlaceholder(entry, { params, searchParams }, wrappedElement);
                this.clientReferences.push(reference);
                wrappedElement = element;
            }
            else {
                // Server component layout
                wrappedElement = react_1.default.createElement(LayoutComponent, { params, searchParams }, wrappedElement);
            }
        }
        return wrappedElement;
    }
    /**
     * Require a component with cache clearing in dev
     */
    requireComponent(componentPath) {
        // Clear cache in development
        if (process.env.NODE_ENV !== 'production') {
            delete require.cache[require.resolve(componentPath)];
        }
        return require(componentPath);
    }
    /**
     * Check if a component is a client component
     */
    isClientComponent(componentPath) {
        return componentPath in this.clientManifest.pathToId;
    }
}
exports.RSCRenderer = RSCRenderer;
/**
 * Create an RSC renderer instance
 */
function createRSCRenderer(cwd) {
    const clientManifestPath = path_1.default.join(cwd, '.vista', 'client-manifest.json');
    const serverManifestPath = path_1.default.join(cwd, '.vista', 'server', 'server-manifest.json');
    if (!fs_1.default.existsSync(clientManifestPath) || !fs_1.default.existsSync(serverManifestPath)) {
        console.warn('[Vista RSC] Manifests not found. Run build first.');
        return null;
    }
    try {
        const clientManifest = JSON.parse(fs_1.default.readFileSync(clientManifestPath, 'utf-8'));
        const serverManifest = JSON.parse(fs_1.default.readFileSync(serverManifestPath, 'utf-8'));
        return new RSCRenderer({
            clientManifest,
            serverManifest,
            cwd,
        });
    }
    catch (e) {
        console.error('[Vista RSC] Failed to load manifests:', e);
        return null;
    }
}
/**
 * Generate the client-side hydration script
 *
 * This just sets the data - the actual hydration is handled by rsc-client.tsx
 * which is bundled and has all client components pre-imported.
 */
function generateHydrationScript(payload) {
    const references = JSON.stringify(payload.clientReferences);
    const data = JSON.stringify(payload.data);
    return `
<script>
    window.__VISTA_RSC_DATA__ = ${data};
    window.__VISTA_CLIENT_REFERENCES__ = ${references};
    console.log('[Vista RSC] Client references:', ${references.length > 2 ? references.length : 0});
</script>
`;
}
