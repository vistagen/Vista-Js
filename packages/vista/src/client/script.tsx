/**
 * Vista Script Component
 * 
 * Optimized script loading with different strategies.
 * Similar to Next.js Script component.
 */

'client load';

import * as React from 'react';

export type ScriptStrategy =
    | 'beforeInteractive'
    | 'afterInteractive'
    | 'lazyOnload'
    | 'worker';

export interface ScriptProps {
    /**
     * URL of the script
     */
    src?: string;

    /**
     * Inline script content
     */
    dangerouslySetInnerHTML?: { __html: string };

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

// Track loaded scripts to prevent duplicates
const loadedScripts = new Set<string>();

/**
 * Script component for optimized script loading
 */
export default function Script({
    src,
    dangerouslySetInnerHTML,
    strategy = 'afterInteractive',
    onLoad,
    onError,
    onReady,
    id,
    ...rest
}: ScriptProps) {
    const scriptId = id || src;

    React.useEffect(() => {
        // Skip if already loaded
        if (scriptId && loadedScripts.has(scriptId)) {
            onLoad?.();
            return;
        }

        const loadScript = () => {
            const script = document.createElement('script');

            if (src) {
                script.src = src;
                script.async = true;

                script.onload = () => {
                    if (scriptId) loadedScripts.add(scriptId);
                    onLoad?.();
                };

                script.onerror = () => {
                    onError?.();
                };
            } else if (dangerouslySetInnerHTML) {
                script.innerHTML = dangerouslySetInnerHTML.__html;
            }

            // Apply additional attributes
            Object.entries(rest).forEach(([key, value]) => {
                if (typeof value === 'string') {
                    script.setAttribute(key, value);
                }
            });

            document.body.appendChild(script);

            if (dangerouslySetInnerHTML) {
                onReady?.();
            }
        };

        switch (strategy) {
            case 'beforeInteractive':
                // Already handled during SSR, just mark as loaded
                if (scriptId) loadedScripts.add(scriptId);
                break;

            case 'afterInteractive':
                // Load immediately after hydration
                loadScript();
                break;

            case 'lazyOnload':
                // Load during idle time
                if ('requestIdleCallback' in window) {
                    (window as any).requestIdleCallback(loadScript);
                } else {
                    setTimeout(loadScript, 200);
                }
                break;

            case 'worker':
                // Web worker loading (simplified - would need full worker setup)
                console.warn('[Vista Script] strategy="worker" is experimental');
                loadScript();
                break;
        }
    }, [src, strategy, scriptId]);

    // beforeInteractive scripts are rendered in SSR
    if (strategy === 'beforeInteractive' && src) {
        return <script src={src} {...rest} />;
    }

    return null;
}
