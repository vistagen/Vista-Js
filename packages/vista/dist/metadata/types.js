"use strict";
/**
 * Vista Metadata Types
 *
 * Complete TypeScript types for Next.js-compatible metadata API.
 * Supports static `metadata` exports and dynamic `generateMetadata` function.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.isTemplateString = isTemplateString;
// ============================================================================
// Export type guard
// ============================================================================
function isTemplateString(title) {
    return typeof title === 'object' && title !== null && 'default' in title;
}
