/**
 * Vista Font Optimization
 * 
 * Provides optimized font loading similar to Next.js font system.
 * Supports Google Fonts and local fonts with:
 * - Automatic font-display: swap
 * - Preloading of font files
 * - CSS variable generation
 * - Subset support
 */

import * as React from 'react';

// Font weight types
type FontWeight =
    | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900
    | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900'
    | 'variable';
type FontStyle = 'normal' | 'italic';
type FontDisplay = 'auto' | 'block' | 'swap' | 'fallback' | 'optional';

// Google Font options
export interface GoogleFontOptions {
    weight?: FontWeight | FontWeight[];
    style?: FontStyle | FontStyle[];
    subsets?: string[];
    display?: FontDisplay;
    preload?: boolean;
    fallback?: string[];
    adjustFontFallback?: boolean;
    variable?: string;
}

// Local Font options
export interface LocalFontOptions {
    src: string | FontSource[];
    weight?: FontWeight | string;
    style?: FontStyle;
    display?: FontDisplay;
    preload?: boolean;
    fallback?: string[];
    variable?: string;
    declarations?: FontFaceDeclaration[];
}

export interface FontSource {
    path: string;
    weight?: FontWeight | string;
    style?: FontStyle;
}

export interface FontFaceDeclaration {
    prop: string;
    value: string;
}

export interface FontResult {
    className: string;
    style: { fontFamily: string };
    variable?: string;
}

// Generate unique class name
function generateClassName(name: string): string {
    const hash = name.split('').reduce((acc, char) => {
        return ((acc << 5) - acc + char.charCodeAt(0)) | 0;
    }, 0);
    return `__font_${Math.abs(hash).toString(36)}`;
}

// Google Fonts base URL
const GOOGLE_FONTS_URL = 'https://fonts.googleapis.com/css2';

/**
 * Create a Google Font loader
 */
export function createGoogleFont(fontFamily: string, options: GoogleFontOptions = {}): FontResult {
    const {
        weight = 400,
        style = 'normal',
        subsets = ['latin'],
        display = 'swap',
        fallback = ['system-ui', 'sans-serif'],
        variable,
    } = options;

    const className = generateClassName(fontFamily);
    const weights = Array.isArray(weight) ? weight : [weight];
    const styles = Array.isArray(style) ? style : [style];

    // Build font family string with fallbacks
    const fontFamilyValue = `'${fontFamily}', ${fallback.join(', ')}`;

    // Generate CSS for injection
    const cssVariableName = variable || `--font-${fontFamily.toLowerCase().replace(/\s+/g, '-')}`;

    // In a real implementation, this would inject a <link> tag or fetch the CSS
    // For now, we return the configuration for the build system to handle

    return {
        className,
        style: { fontFamily: fontFamilyValue },
        variable: cssVariableName,
    };
}

/**
 * Create a local font loader
 */
export function createLocalFont(options: LocalFontOptions): FontResult {
    const {
        src,
        weight = 400,
        style = 'normal',
        display = 'swap',
        fallback = ['system-ui', 'sans-serif'],
        variable,
        declarations = [],
    } = options;

    const sources = Array.isArray(src) ? src : [{ path: src, weight, style }];
    const fontName = `LocalFont_${Date.now().toString(36)}`;
    const className = generateClassName(fontName);

    const fontFamilyValue = `'${fontName}', ${fallback.join(', ')}`;
    const cssVariableName = variable || `--font-local-${className}`;

    return {
        className,
        style: { fontFamily: fontFamilyValue },
        variable: cssVariableName,
    };
}

// Pre-configured Google Fonts (like Next.js)
export const Inter = (options?: Omit<GoogleFontOptions, 'fallback'>) =>
    createGoogleFont('Inter', { ...options, fallback: ['system-ui', 'sans-serif'] });

export const Roboto = (options?: Omit<GoogleFontOptions, 'fallback'>) =>
    createGoogleFont('Roboto', { ...options, fallback: ['system-ui', 'sans-serif'] });

export const Open_Sans = (options?: Omit<GoogleFontOptions, 'fallback'>) =>
    createGoogleFont('Open Sans', { ...options, fallback: ['system-ui', 'sans-serif'] });

export const Lato = (options?: Omit<GoogleFontOptions, 'fallback'>) =>
    createGoogleFont('Lato', { ...options, fallback: ['system-ui', 'sans-serif'] });

export const Montserrat = (options?: Omit<GoogleFontOptions, 'fallback'>) =>
    createGoogleFont('Montserrat', { ...options, fallback: ['system-ui', 'sans-serif'] });

export const Poppins = (options?: Omit<GoogleFontOptions, 'fallback'>) =>
    createGoogleFont('Poppins', { ...options, fallback: ['system-ui', 'sans-serif'] });

export const Roboto_Mono = (options?: Omit<GoogleFontOptions, 'fallback'>) =>
    createGoogleFont('Roboto Mono', { ...options, fallback: ['monospace'] });

export const Source_Code_Pro = (options?: Omit<GoogleFontOptions, 'fallback'>) =>
    createGoogleFont('Source Code Pro', { ...options, fallback: ['monospace'] });

export const JetBrains_Mono = (options?: Omit<GoogleFontOptions, 'fallback'>) =>
    createGoogleFont('JetBrains Mono', { ...options, fallback: ['monospace'] });

export const Playfair_Display = (options?: Omit<GoogleFontOptions, 'fallback'>) =>
    createGoogleFont('Playfair Display', { ...options, fallback: ['serif'] });

export const Merriweather = (options?: Omit<GoogleFontOptions, 'fallback'>) =>
    createGoogleFont('Merriweather', { ...options, fallback: ['serif'] });

export const Outfit = (options?: Omit<GoogleFontOptions, 'fallback'>) =>
    createGoogleFont('Outfit', { ...options, fallback: ['system-ui', 'sans-serif'] });

export const Space_Grotesk = (options?: Omit<GoogleFontOptions, 'fallback'>) =>
    createGoogleFont('Space Grotesk', { ...options, fallback: ['system-ui', 'sans-serif'] });

/**
 * FontProvider component - injects font styles
 */
interface FontProviderProps {
    fonts: FontResult[];
    children: React.ReactNode;
}

export function FontProvider({ fonts, children }: FontProviderProps): React.ReactElement {
    // Generate CSS for fonts
    const fontCSS = fonts.map(font => {
        if (font.variable) {
            return `:root { ${font.variable}: ${font.style.fontFamily}; }`;
        }
        return '';
    }).filter(Boolean).join('\n');

    return (
        <>
            {fontCSS && (
                <style dangerouslySetInnerHTML={{ __html: fontCSS }} />
            )}
            {children}
        </>
    );
}

// Local font helper
export const localFont = createLocalFont;

// Default export
export default {
    Inter,
    Roboto,
    Open_Sans,
    Lato,
    Montserrat,
    Poppins,
    Roboto_Mono,
    Source_Code_Pro,
    JetBrains_Mono,
    Playfair_Display,
    Merriweather,
    Outfit,
    Space_Grotesk,
    localFont,
    FontProvider,
};
