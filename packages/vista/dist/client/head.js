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
const generate_1 = require("../metadata/generate");
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
    return ((0, jsx_runtime_1.jsx)(Head, { children: (0, jsx_runtime_1.jsx)(generate_1.MetadataRenderer, { metadata: metadata }) }));
}
exports.default = Head;
