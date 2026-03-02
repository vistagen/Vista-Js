/**
 * Vista Font Registry
 *
 * Global singleton that collects every font instantiated during the
 * current request (SSR) or application lifetime (client).
 *
 * During SSR the engine calls `getRegisteredFonts()` to collect all
 * entries and inject the appropriate `<link>` / `<style>` / preload
 * tags into `<head>`.  After injection it calls `clearRegistry()`.
 */
import type { FontRegistryEntry } from './types';
/**
 * Register a font entry.  Called by `createGoogleFont` / `createLocalFont`.
 * Duplicate registrations (same className) are silently ignored.
 */
export declare function registerFont(entry: FontRegistryEntry): void;
/**
 * Return all registered fonts since the last `clearRegistry()`.
 */
export declare function getRegisteredFonts(): ReadonlyArray<FontRegistryEntry>;
/**
 * Clear the registry (called after SSR head injection).
 */
export declare function clearRegistry(): void;
/**
 * Build `<link rel="preconnect">` tags needed for Google Fonts.
 */
export declare function getFontPreconnectHTML(): string;
/**
 * Build `<link rel="stylesheet">` tags for Google Fonts and preload tags
 * for local font files.
 */
export declare function getFontLinkHTML(): string;
/**
 * Build a single `<style>` block containing @font-face rules
 * (for local fonts) and utility classes + CSS variables.
 */
export declare function getFontStyleHTML(): string;
/**
 * One-shot helper: returns the full HTML to inject into `<head>`.
 * Combines preconnect + links + style block.
 */
export declare function getFontHeadHTML(): string;
/**
 * Returns the HTML for Vista's default fonts (Geist Sans + Geist Mono).
 * Injected automatically by the SSR engine into every page's `<head>`.
 * Users get `--font-geist-sans` and `--font-geist-mono` CSS variables
 * without importing anything — just like Next.js defaults.
 */
export declare function getDefaultFontHTML(): string;
/**
 * Combined helper for engines: default fonts + any user-registered fonts.
 */
export declare function getAllFontHTML(): string;
