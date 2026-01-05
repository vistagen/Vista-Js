/**
 * Vista Script Component
 *
 * Optimized script loading with different strategies.
 * Similar to Next.js Script component.
 */
export type ScriptStrategy = 'beforeInteractive' | 'afterInteractive' | 'lazyOnload' | 'worker';
export interface ScriptProps {
    /**
     * URL of the script
     */
    src?: string;
    /**
     * Inline script content
     */
    dangerouslySetInnerHTML?: {
        __html: string;
    };
    /**
     * Loading strategy
     * - beforeInteractive: Load before page becomes interactive
     * - afterInteractive: Load after hydration (default)
     * - lazyOnload: Load during idle time
     * - worker: Load in a web worker (experimental)
     */
    strategy?: ScriptStrategy;
    /**
     * Callback when script loads
     */
    onLoad?: () => void;
    /**
     * Callback when script errors
     */
    onError?: () => void;
    /**
     * Callback when script is ready (for inline scripts)
     */
    onReady?: () => void;
    /**
     * Script ID for deduplication
     */
    id?: string;
    /**
     * Additional script attributes
     */
    [key: string]: any;
}
/**
 * Script component for optimized script loading
 */
export default function Script({ src, dangerouslySetInnerHTML, strategy, onLoad, onError, onReady, id, ...rest }: ScriptProps): import("react/jsx-runtime").JSX.Element;
