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

// ─── Global Registry ───────────────────────────────────────────────────────

const _registry: FontRegistryEntry[] = [];
const _seen = new Set<string>(); // deduplicate by className

/**
 * Register a font entry.  Called by `createGoogleFont` / `createLocalFont`.
 * Duplicate registrations (same className) are silently ignored.
 */
export function registerFont(entry: FontRegistryEntry): void {
  if (_seen.has(entry.className)) return;
  _seen.add(entry.className);
  _registry.push(entry);
}

/**
 * Return all registered fonts since the last `clearRegistry()`.
 */
export function getRegisteredFonts(): ReadonlyArray<FontRegistryEntry> {
  return _registry;
}

/**
 * Clear the registry (called after SSR head injection).
 */
export function clearRegistry(): void {
  _registry.length = 0;
  _seen.clear();
}

// ─── HTML Generators ───────────────────────────────────────────────────────

/**
 * Build `<link rel="preconnect">` tags needed for Google Fonts.
 */
export function getFontPreconnectHTML(): string {
  const hasGoogle = _registry.some((e) => e.kind === 'google');
  if (!hasGoogle) return '';
  return [
    '<link rel="preconnect" href="https://fonts.googleapis.com" />',
    '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />',
  ].join('\n  ');
}

/**
 * Build `<link rel="stylesheet">` tags for Google Fonts and preload tags
 * for local font files.
 */
export function getFontLinkHTML(): string {
  const tags: string[] = [];

  for (const entry of _registry) {
    if (entry.kind === 'google' && entry.googleUrl) {
      tags.push(`<link rel="stylesheet" href="${entry.googleUrl}" />`);
    }
    // Preload local font files
    if (entry.preloadUrls) {
      for (const url of entry.preloadUrls) {
        const ext = url.split('.').pop() || 'woff2';
        const type =
          ext === 'woff2'
            ? 'font/woff2'
            : ext === 'woff'
              ? 'font/woff'
              : ext === 'ttf'
                ? 'font/ttf'
                : 'font/woff2';
        tags.push(`<link rel="preload" href="${url}" as="font" type="${type}" crossorigin />`);
      }
    }
  }

  return tags.join('\n  ');
}

/**
 * Build a single `<style>` block containing @font-face rules
 * (for local fonts) and utility classes + CSS variables.
 */
export function getFontStyleHTML(): string {
  const parts: string[] = [];

  for (const entry of _registry) {
    if (entry.injectCSS) {
      parts.push(entry.injectCSS);
    }
  }

  if (parts.length === 0) return '';
  return `<style data-vista-fonts>\n${parts.join('\n')}\n</style>`;
}

/**
 * One-shot helper: returns the full HTML to inject into `<head>`.
 * Combines preconnect + links + style block.
 */
export function getFontHeadHTML(): string {
  if (_registry.length === 0) return '';
  return [getFontPreconnectHTML(), getFontLinkHTML(), getFontStyleHTML()]
    .filter(Boolean)
    .join('\n  ');
}

// ─── Default Fonts (Engine-level, zero config) ────────────────────────────

/**
 * Returns the HTML for Vista's default fonts (Geist Sans + Geist Mono).
 * Injected automatically by the SSR engine into every page's `<head>`.
 * Users get `--font-geist-sans` and `--font-geist-mono` CSS variables
 * without importing anything — just like Next.js defaults.
 */
export function getDefaultFontHTML(): string {
  const preconnect = [
    '<link rel="preconnect" href="https://fonts.googleapis.com" />',
    '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />',
  ].join('\n  ');

  const stylesheet =
    '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Geist:wght@100..900&family=Geist+Mono:wght@100..900&display=swap" />';

  const style = `<style data-vista-default-fonts>
:root {
  --font-geist-sans: 'Geist', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-geist-mono: 'Geist Mono', ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace;
}
</style>`;

  return [preconnect, stylesheet, style].join('\n  ');
}

/**
 * Combined helper for engines: default fonts + any user-registered fonts.
 */
export function getAllFontHTML(): string {
  const parts = [getDefaultFontHTML()];
  const userFonts = getFontHeadHTML();
  if (userFonts) parts.push(userFonts);
  return parts.join('\n  ');
}
