"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultLoader = void 0;
// Default loader: simple pass-through for now, 
// envisioning a future where this hits an optimization endpoint.
const defaultLoader = ({ src, width, quality }) => {
    // If user wants optimization, they would hook up a real loader here.
    // For static dev, we just return the src.
    // In a real Next.js app, this would be: `/_next/image?url=${encodeURIComponent(src)}&w=${width}&q=${quality || 75}`
    // NOTE: Emulating optimizing behavior by appending query params for now (if backend supported it)
    // return `${src}?w=${width}&q=${quality || 75}`;
    return src;
};
exports.defaultLoader = defaultLoader;
