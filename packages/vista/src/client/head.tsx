/**
 * Vista Head Component
 * 
 * Allows injection of elements into the document <head>.
 * Similar to Next.js Head component.
 */

import * as React from 'react';
import { MetadataRenderer } from '../metadata/generate';
import type { Metadata as AppMetadata } from '../metadata/types';

interface HeadProps {
    children: React.ReactNode;
}

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

export type Metadata = AppMetadata;

/**
 * Generate head elements from metadata object
 */
export function generateMetadataHead(metadata: Metadata): React.ReactElement {
    return (
        <Head>
            <MetadataRenderer metadata={metadata} />
        </Head>
    );
}

export default Head;
