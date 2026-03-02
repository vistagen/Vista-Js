"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultLoader = void 0;
/**
 * Default Vista image loader.
 *
 * Generates URLs that point to the `/_vista/image` optimization endpoint.
 * The endpoint handles resizing, format conversion, and caching.
 *
 * For absolute URLs (remote images), the src is URL-encoded.
 * For relative URLs (local images), they're resolved against the public dir.
 */
const defaultLoader = ({ src, width, quality }) => {
    if (!src)
        return src;
    // If the src is already a data URL or blob, pass through
    if (src.startsWith('data:') || src.startsWith('blob:')) {
        return src;
    }
    const q = quality || 75;
    return `/_vista/image?url=${encodeURIComponent(src)}&w=${width}&q=${q}`;
};
exports.defaultLoader = defaultLoader;
