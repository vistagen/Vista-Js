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
type FontWeight = 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900' | 'variable';
type FontStyle = 'normal' | 'italic';
type FontDisplay = 'auto' | 'block' | 'swap' | 'fallback' | 'optional';
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
    style: {
        fontFamily: string;
    };
    variable?: string;
}
/**
 * Create a Google Font loader
 */
export declare function createGoogleFont(fontFamily: string, options?: GoogleFontOptions): FontResult;
/**
 * Create a local font loader
 */
export declare function createLocalFont(options: LocalFontOptions): FontResult;
export declare const Inter: (options?: Omit<GoogleFontOptions, "fallback">) => FontResult;
export declare const Roboto: (options?: Omit<GoogleFontOptions, "fallback">) => FontResult;
export declare const Open_Sans: (options?: Omit<GoogleFontOptions, "fallback">) => FontResult;
export declare const Lato: (options?: Omit<GoogleFontOptions, "fallback">) => FontResult;
export declare const Montserrat: (options?: Omit<GoogleFontOptions, "fallback">) => FontResult;
export declare const Poppins: (options?: Omit<GoogleFontOptions, "fallback">) => FontResult;
export declare const Roboto_Mono: (options?: Omit<GoogleFontOptions, "fallback">) => FontResult;
export declare const Source_Code_Pro: (options?: Omit<GoogleFontOptions, "fallback">) => FontResult;
export declare const JetBrains_Mono: (options?: Omit<GoogleFontOptions, "fallback">) => FontResult;
export declare const Playfair_Display: (options?: Omit<GoogleFontOptions, "fallback">) => FontResult;
export declare const Merriweather: (options?: Omit<GoogleFontOptions, "fallback">) => FontResult;
export declare const Outfit: (options?: Omit<GoogleFontOptions, "fallback">) => FontResult;
export declare const Space_Grotesk: (options?: Omit<GoogleFontOptions, "fallback">) => FontResult;
/**
 * FontProvider component - injects font styles
 */
interface FontProviderProps {
    fonts: FontResult[];
    children: React.ReactNode;
}
export declare function FontProvider({ fonts, children }: FontProviderProps): React.ReactElement;
export declare const localFont: typeof createLocalFont;
declare const _default: {
    Inter: (options?: Omit<GoogleFontOptions, "fallback">) => FontResult;
    Roboto: (options?: Omit<GoogleFontOptions, "fallback">) => FontResult;
    Open_Sans: (options?: Omit<GoogleFontOptions, "fallback">) => FontResult;
    Lato: (options?: Omit<GoogleFontOptions, "fallback">) => FontResult;
    Montserrat: (options?: Omit<GoogleFontOptions, "fallback">) => FontResult;
    Poppins: (options?: Omit<GoogleFontOptions, "fallback">) => FontResult;
    Roboto_Mono: (options?: Omit<GoogleFontOptions, "fallback">) => FontResult;
    Source_Code_Pro: (options?: Omit<GoogleFontOptions, "fallback">) => FontResult;
    JetBrains_Mono: (options?: Omit<GoogleFontOptions, "fallback">) => FontResult;
    Playfair_Display: (options?: Omit<GoogleFontOptions, "fallback">) => FontResult;
    Merriweather: (options?: Omit<GoogleFontOptions, "fallback">) => FontResult;
    Outfit: (options?: Omit<GoogleFontOptions, "fallback">) => FontResult;
    Space_Grotesk: (options?: Omit<GoogleFontOptions, "fallback">) => FontResult;
    localFont: typeof createLocalFont;
    FontProvider: typeof FontProvider;
};
export default _default;
