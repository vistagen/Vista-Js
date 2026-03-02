/**
 * Vista Font System — Shared Types
 *
 * Next.js-compatible font type definitions for Google Fonts and local fonts.
 */
export type FontWeight = 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900' | 'variable';
export type FontStyle = 'normal' | 'italic';
export type FontDisplay = 'auto' | 'block' | 'swap' | 'fallback' | 'optional';
export interface GoogleFontOptions {
    /** Font weight(s) to load */
    weight?: FontWeight | FontWeight[];
    /** Font style(s) to load */
    style?: FontStyle | FontStyle[];
    /** Character subsets, e.g. ['latin', 'latin-ext'] */
    subsets?: string[];
    /** CSS font-display strategy (default: 'swap') */
    display?: FontDisplay;
    /** Whether to preload the font (default: true) */
    preload?: boolean;
    /** Fallback fonts */
    fallback?: string[];
    /** Adjust metrics of a fallback font to reduce CLS */
    adjustFontFallback?: boolean | string;
    /** CSS variable name, e.g. '--font-inter' */
    variable?: string;
    /** Axes for variable fonts, e.g. { slnt: [-10, 0] } */
    axes?: Record<string, number | [number, number]>;
}
export interface LocalFontOptions {
    /** Path or array of font sources */
    src: string | FontSource[];
    /** Font weight */
    weight?: FontWeight | string;
    /** Font style */
    style?: FontStyle;
    /** CSS font-display strategy (default: 'swap') */
    display?: FontDisplay;
    /** Whether to preload the font (default: true) */
    preload?: boolean;
    /** Fallback fonts */
    fallback?: string[];
    /** CSS variable name */
    variable?: string;
    /** Additional @font-face descriptors */
    declarations?: FontFaceDeclaration[];
}
export interface FontSource {
    /** Path to font file relative to the importing module */
    path: string;
    /** Weight for this particular source */
    weight?: FontWeight | string;
    /** Style for this particular source */
    style?: FontStyle;
}
export interface FontFaceDeclaration {
    prop: string;
    value: string;
}
export interface FontResult {
    /** CSS class name that applies the font-family */
    className: string;
    /** Inline style object ({ fontFamily: '...' }) */
    style: {
        fontFamily: string;
    };
    /** CSS variable name (e.g. '--font-inter') if configured */
    variable?: string;
}
export type FontKind = 'google' | 'local';
export interface FontRegistryEntry {
    kind: FontKind;
    family: string;
    className: string;
    variableName?: string;
    /** For google fonts — full Google Fonts CSS2 URL */
    googleUrl?: string;
    /** For local fonts — raw @font-face CSS */
    fontFaceCSS?: string;
    /** Preload URLs (woff2 files) */
    preloadUrls?: string[];
    /** Full CSS that defines the class + variable */
    injectCSS: string;
}
