"use strict";
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
exports.Head = Head;
exports.generateMetadataHead = generateMetadataHead;
const jsx_runtime_1 = require("react/jsx-runtime");
/**
 * Vista Head Component
 *
 * Allows injection of elements into the document <head>.
 * Similar to Next.js Head component.
 */
const React = __importStar(require("react"));
// Store for head elements (for SSR)
const headElements = [];
/**
 * Head component - injects children into document head
 */
function Head({ children }) {
    React.useEffect(() => {
        if (typeof document === 'undefined')
            return;
        const head = document.head;
        const fragment = document.createDocumentFragment();
        const elements = [];
        // Process children
        React.Children.forEach(children, (child) => {
            if (!React.isValidElement(child))
                return;
            const { type, props } = child;
            let element = null;
            if (type === 'title') {
                // Update existing title or create new
                const existingTitle = head.querySelector('title');
                if (existingTitle) {
                    existingTitle.textContent = props.children;
                    return;
                }
                element = document.createElement('title');
                element.textContent = props.children;
            }
            else if (type === 'meta') {
                // Check for existing meta with same name/property
                const name = (props.name || props.property);
                if (name) {
                    const selector = props.name
                        ? `meta[name="${props.name}"]`
                        : `meta[property="${props.property}"]`;
                    const existing = head.querySelector(selector);
                    if (existing) {
                        existing.setAttribute('content', props.content);
                        return;
                    }
                }
                element = document.createElement('meta');
                Object.entries(props).forEach(([key, value]) => {
                    if (key !== 'children' && value !== undefined) {
                        element.setAttribute(key, String(value));
                    }
                });
            }
            else if (type === 'link') {
                // Check for existing link with same href
                if (props.rel === 'canonical') {
                    const existing = head.querySelector('link[rel="canonical"]');
                    if (existing) {
                        existing.setAttribute('href', props.href);
                        return;
                    }
                }
                element = document.createElement('link');
                Object.entries(props).forEach(([key, value]) => {
                    if (key !== 'children' && value !== undefined) {
                        element.setAttribute(key, String(value));
                    }
                });
            }
            else if (type === 'style') {
                element = document.createElement('style');
                if (props.dangerouslySetInnerHTML) {
                    element.innerHTML = props.dangerouslySetInnerHTML.__html;
                }
                else if (props.children) {
                    element.textContent = props.children;
                }
                if (props.id)
                    element.id = props.id;
            }
            else if (type === 'script') {
                element = document.createElement('script');
                Object.entries(props).forEach(([key, value]) => {
                    if (key === 'dangerouslySetInnerHTML') {
                        element.innerHTML = value.__html;
                    }
                    else if (key !== 'children' && value !== undefined) {
                        element.setAttribute(key, String(value));
                    }
                });
                if (props.children) {
                    element.textContent = props.children;
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
 * Generate head elements from metadata object
 */
function generateMetadataHead(metadata) {
    const elements = [];
    // Title
    if (metadata.title) {
        const titleStr = typeof metadata.title === 'string'
            ? metadata.title
            : metadata.title.default;
        elements.push((0, jsx_runtime_1.jsx)("title", { children: titleStr }, "title"));
    }
    // Description
    if (metadata.description) {
        elements.push((0, jsx_runtime_1.jsx)("meta", { name: "description", content: metadata.description }, "description"));
    }
    // Keywords
    if (metadata.keywords) {
        const keywordsStr = Array.isArray(metadata.keywords)
            ? metadata.keywords.join(', ')
            : metadata.keywords;
        elements.push((0, jsx_runtime_1.jsx)("meta", { name: "keywords", content: keywordsStr }, "keywords"));
    }
    // Viewport
    if (metadata.viewport) {
        const viewportStr = typeof metadata.viewport === 'string'
            ? metadata.viewport
            : `width=${metadata.viewport.width || 'device-width'}, initial-scale=${metadata.viewport.initialScale || 1}`;
        elements.push((0, jsx_runtime_1.jsx)("meta", { name: "viewport", content: viewportStr }, "viewport"));
    }
    // Theme color
    if (metadata.themeColor) {
        if (typeof metadata.themeColor === 'string') {
            elements.push((0, jsx_runtime_1.jsx)("meta", { name: "theme-color", content: metadata.themeColor }, "themeColor"));
        }
    }
    // Robots
    if (metadata.robots) {
        const robotsStr = typeof metadata.robots === 'string'
            ? metadata.robots
            : `${metadata.robots.index !== false ? 'index' : 'noindex'}, ${metadata.robots.follow !== false ? 'follow' : 'nofollow'}`;
        elements.push((0, jsx_runtime_1.jsx)("meta", { name: "robots", content: robotsStr }, "robots"));
    }
    // Open Graph
    if (metadata.openGraph) {
        const og = metadata.openGraph;
        if (og.title)
            elements.push((0, jsx_runtime_1.jsx)("meta", { property: "og:title", content: og.title }, "og:title"));
        if (og.description)
            elements.push((0, jsx_runtime_1.jsx)("meta", { property: "og:description", content: og.description }, "og:description"));
        if (og.url)
            elements.push((0, jsx_runtime_1.jsx)("meta", { property: "og:url", content: og.url }, "og:url"));
        if (og.siteName)
            elements.push((0, jsx_runtime_1.jsx)("meta", { property: "og:site_name", content: og.siteName }, "og:site_name"));
        if (og.type)
            elements.push((0, jsx_runtime_1.jsx)("meta", { property: "og:type", content: og.type }, "og:type"));
        if (og.locale)
            elements.push((0, jsx_runtime_1.jsx)("meta", { property: "og:locale", content: og.locale }, "og:locale"));
        if (og.images) {
            og.images.forEach((img, i) => {
                elements.push((0, jsx_runtime_1.jsx)("meta", { property: "og:image", content: img.url }, `og:image:${i}`));
                if (img.width)
                    elements.push((0, jsx_runtime_1.jsx)("meta", { property: "og:image:width", content: String(img.width) }, `og:image:width:${i}`));
                if (img.height)
                    elements.push((0, jsx_runtime_1.jsx)("meta", { property: "og:image:height", content: String(img.height) }, `og:image:height:${i}`));
                if (img.alt)
                    elements.push((0, jsx_runtime_1.jsx)("meta", { property: "og:image:alt", content: img.alt }, `og:image:alt:${i}`));
            });
        }
    }
    // Twitter
    if (metadata.twitter) {
        const tw = metadata.twitter;
        if (tw.card)
            elements.push((0, jsx_runtime_1.jsx)("meta", { name: "twitter:card", content: tw.card }, "twitter:card"));
        if (tw.site)
            elements.push((0, jsx_runtime_1.jsx)("meta", { name: "twitter:site", content: tw.site }, "twitter:site"));
        if (tw.creator)
            elements.push((0, jsx_runtime_1.jsx)("meta", { name: "twitter:creator", content: tw.creator }, "twitter:creator"));
        if (tw.title)
            elements.push((0, jsx_runtime_1.jsx)("meta", { name: "twitter:title", content: tw.title }, "twitter:title"));
        if (tw.description)
            elements.push((0, jsx_runtime_1.jsx)("meta", { name: "twitter:description", content: tw.description }, "twitter:description"));
        if (tw.images) {
            tw.images.forEach((img, i) => {
                elements.push((0, jsx_runtime_1.jsx)("meta", { name: "twitter:image", content: img }, `twitter:image:${i}`));
            });
        }
    }
    // Canonical
    if (metadata.alternates?.canonical) {
        elements.push((0, jsx_runtime_1.jsx)("link", { rel: "canonical", href: metadata.alternates.canonical }, "canonical"));
    }
    // Manifest
    if (metadata.manifest) {
        elements.push((0, jsx_runtime_1.jsx)("link", { rel: "manifest", href: metadata.manifest }, "manifest"));
    }
    // Icons
    if (metadata.icons) {
        if (metadata.icons.icon) {
            elements.push((0, jsx_runtime_1.jsx)("link", { rel: "icon", href: metadata.icons.icon }, "icon"));
        }
        if (metadata.icons.apple) {
            elements.push((0, jsx_runtime_1.jsx)("link", { rel: "apple-touch-icon", href: metadata.icons.apple }, "apple-touch-icon"));
        }
    }
    return (0, jsx_runtime_1.jsx)(Head, { children: elements });
}
exports.default = Head;
