/**
 * Vista Head Component
 * 
 * Allows injection of elements into the document <head>.
 * Similar to Next.js Head component.
 */

import * as React from 'react';

interface HeadProps {
    children: React.ReactNode;
}

// Store for head elements (for SSR)
const headElements: React.ReactNode[] = [];

/**
 * Head component - injects children into document head
 */
export function Head({ children }: HeadProps): null {
    React.useEffect(() => {
        if (typeof document === 'undefined') return;

        const head = document.head;
        const fragment = document.createDocumentFragment();
        const elements: Element[] = [];

        // Process children
        React.Children.forEach(children, (child) => {
            if (!React.isValidElement(child)) return;

            const { type, props } = child as React.ReactElement<Record<string, unknown>>;
            let element: Element | null = null;

            if (type === 'title') {
                // Update existing title or create new
                const existingTitle = head.querySelector('title');
                if (existingTitle) {
                    existingTitle.textContent = props.children as string;
                    return;
                }
                element = document.createElement('title');
                element.textContent = props.children as string;
            } else if (type === 'meta') {
                // Check for existing meta with same name/property
                const name = (props.name || props.property) as string | undefined;
                if (name) {
                    const selector = props.name
                        ? `meta[name="${props.name}"]`
                        : `meta[property="${props.property}"]`;
                    const existing = head.querySelector(selector);
                    if (existing) {
                        existing.setAttribute('content', props.content as string);
                        return;
                    }
                }
                element = document.createElement('meta');
                Object.entries(props).forEach(([key, value]) => {
                    if (key !== 'children' && value !== undefined) {
                        element!.setAttribute(key, String(value));
                    }
                });
            } else if (type === 'link') {
                // Check for existing link with same href
                if (props.rel === 'canonical') {
                    const existing = head.querySelector('link[rel="canonical"]');
                    if (existing) {
                        existing.setAttribute('href', props.href as string);
                        return;
                    }
                }
                element = document.createElement('link');
                Object.entries(props).forEach(([key, value]) => {
                    if (key !== 'children' && value !== undefined) {
                        element!.setAttribute(key, String(value));
                    }
                });
            } else if (type === 'style') {
                element = document.createElement('style');
                if (props.dangerouslySetInnerHTML) {
                    element.innerHTML = (props.dangerouslySetInnerHTML as { __html: string }).__html;
                } else if (props.children) {
                    element.textContent = props.children as string;
                }
                if (props.id) element.id = props.id as string;
            } else if (type === 'script') {
                element = document.createElement('script');
                Object.entries(props).forEach(([key, value]) => {
                    if (key === 'dangerouslySetInnerHTML') {
                        element!.innerHTML = (value as { __html: string }).__html;
                    } else if (key !== 'children' && value !== undefined) {
                        element!.setAttribute(key, String(value));
                    }
                });
                if (props.children) {
                    element.textContent = props.children as string;
                }
            }

            if (element) {
                elements.push(element);
                fragment.appendChild(element);
            }
        });

        // Append all elements
        head.appendChild(fragment);

        // Cleanup on unmount
        return () => {
            elements.forEach((el) => {
                if (el.parentNode === head) {
                    head.removeChild(el);
                }
            });
        };
    }, [children]);

    return null;
}

/**
 * Default metadata configuration
 */
export interface Metadata {
    title?: string | { default: string; template?: string };
    description?: string;
    keywords?: string | string[];
    authors?: { name: string; url?: string }[];
    creator?: string;
    publisher?: string;
    robots?: string | { index?: boolean; follow?: boolean };
    icons?: { icon?: string; apple?: string };
    openGraph?: {
        title?: string;
        description?: string;
        url?: string;
        siteName?: string;
        images?: { url: string; width?: number; height?: number; alt?: string }[];
        locale?: string;
        type?: string;
    };
    twitter?: {
        card?: 'summary' | 'summary_large_image' | 'app' | 'player';
        site?: string;
        creator?: string;
        title?: string;
        description?: string;
        images?: string[];
    };
    viewport?: string | { width?: string; initialScale?: number };
    themeColor?: string | { media?: string; color: string }[];
    manifest?: string;
    alternates?: {
        canonical?: string;
        languages?: Record<string, string>;
    };
}

/**
 * Generate head elements from metadata object
 */
export function generateMetadataHead(metadata: Metadata): React.ReactElement {
    const elements: React.ReactElement[] = [];

    // Title
    if (metadata.title) {
        const titleStr = typeof metadata.title === 'string'
            ? metadata.title
            : metadata.title.default;
        elements.push(<title key="title">{titleStr}</title>);
    }

    // Description
    if (metadata.description) {
        elements.push(
            <meta key="description" name="description" content={metadata.description} />
        );
    }

    // Keywords
    if (metadata.keywords) {
        const keywordsStr = Array.isArray(metadata.keywords)
            ? metadata.keywords.join(', ')
            : metadata.keywords;
        elements.push(
            <meta key="keywords" name="keywords" content={keywordsStr} />
        );
    }

    // Viewport
    if (metadata.viewport) {
        const viewportStr = typeof metadata.viewport === 'string'
            ? metadata.viewport
            : `width=${metadata.viewport.width || 'device-width'}, initial-scale=${metadata.viewport.initialScale || 1}`;
        elements.push(
            <meta key="viewport" name="viewport" content={viewportStr} />
        );
    }

    // Theme color
    if (metadata.themeColor) {
        if (typeof metadata.themeColor === 'string') {
            elements.push(
                <meta key="themeColor" name="theme-color" content={metadata.themeColor} />
            );
        }
    }

    // Robots
    if (metadata.robots) {
        const robotsStr = typeof metadata.robots === 'string'
            ? metadata.robots
            : `${metadata.robots.index !== false ? 'index' : 'noindex'}, ${metadata.robots.follow !== false ? 'follow' : 'nofollow'}`;
        elements.push(
            <meta key="robots" name="robots" content={robotsStr} />
        );
    }

    // Open Graph
    if (metadata.openGraph) {
        const og = metadata.openGraph;
        if (og.title) elements.push(<meta key="og:title" property="og:title" content={og.title} />);
        if (og.description) elements.push(<meta key="og:description" property="og:description" content={og.description} />);
        if (og.url) elements.push(<meta key="og:url" property="og:url" content={og.url} />);
        if (og.siteName) elements.push(<meta key="og:site_name" property="og:site_name" content={og.siteName} />);
        if (og.type) elements.push(<meta key="og:type" property="og:type" content={og.type} />);
        if (og.locale) elements.push(<meta key="og:locale" property="og:locale" content={og.locale} />);
        if (og.images) {
            og.images.forEach((img, i) => {
                elements.push(<meta key={`og:image:${i}`} property="og:image" content={img.url} />);
                if (img.width) elements.push(<meta key={`og:image:width:${i}`} property="og:image:width" content={String(img.width)} />);
                if (img.height) elements.push(<meta key={`og:image:height:${i}`} property="og:image:height" content={String(img.height)} />);
                if (img.alt) elements.push(<meta key={`og:image:alt:${i}`} property="og:image:alt" content={img.alt} />);
            });
        }
    }

    // Twitter
    if (metadata.twitter) {
        const tw = metadata.twitter;
        if (tw.card) elements.push(<meta key="twitter:card" name="twitter:card" content={tw.card} />);
        if (tw.site) elements.push(<meta key="twitter:site" name="twitter:site" content={tw.site} />);
        if (tw.creator) elements.push(<meta key="twitter:creator" name="twitter:creator" content={tw.creator} />);
        if (tw.title) elements.push(<meta key="twitter:title" name="twitter:title" content={tw.title} />);
        if (tw.description) elements.push(<meta key="twitter:description" name="twitter:description" content={tw.description} />);
        if (tw.images) {
            tw.images.forEach((img, i) => {
                elements.push(<meta key={`twitter:image:${i}`} name="twitter:image" content={img} />);
            });
        }
    }

    // Canonical
    if (metadata.alternates?.canonical) {
        elements.push(
            <link key="canonical" rel="canonical" href={metadata.alternates.canonical} />
        );
    }

    // Manifest
    if (metadata.manifest) {
        elements.push(
            <link key="manifest" rel="manifest" href={metadata.manifest} />
        );
    }

    // Icons
    if (metadata.icons) {
        if (metadata.icons.icon) {
            elements.push(<link key="icon" rel="icon" href={metadata.icons.icon} />);
        }
        if (metadata.icons.apple) {
            elements.push(<link key="apple-touch-icon" rel="apple-touch-icon" href={metadata.icons.apple} />);
        }
    }

    return <Head>{elements}</Head>;
}

export default Head;
