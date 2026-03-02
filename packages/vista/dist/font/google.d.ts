/**
 * Vista Google Font Loader
 *
 * Usage (Next.js-compatible):
 *
 *   import { Inter, Roboto_Mono } from '@vistagenic/vista/font/google';
 *
 *   const inter = Inter({ subsets: ['latin'], weight: ['400', '700'] });
 *   const mono  = Roboto_Mono({ variable: '--font-mono' });
 *
 *   // In root layout:
 *   <html className={`${inter.className} ${mono.variable}`}>
 *
 *   // Or inline:
 *   <div style={inter.style}>Hello</div>
 */
import type { GoogleFontOptions, FontResult } from './types';
/**
 * Core factory: creates a configured Google Font and registers it in the
 * global font registry for SSR head injection.
 */
export declare function createGoogleFont(family: string, defaultFallback: string[], options?: GoogleFontOptions): FontResult;
export declare const Inter: (opts?: GoogleFontOptions) => FontResult;
export declare const Roboto: (opts?: GoogleFontOptions) => FontResult;
export declare const Open_Sans: (opts?: GoogleFontOptions) => FontResult;
export declare const Lato: (opts?: GoogleFontOptions) => FontResult;
export declare const Montserrat: (opts?: GoogleFontOptions) => FontResult;
export declare const Poppins: (opts?: GoogleFontOptions) => FontResult;
export declare const Nunito: (opts?: GoogleFontOptions) => FontResult;
export declare const Nunito_Sans: (opts?: GoogleFontOptions) => FontResult;
export declare const Raleway: (opts?: GoogleFontOptions) => FontResult;
export declare const Ubuntu: (opts?: GoogleFontOptions) => FontResult;
export declare const Oswald: (opts?: GoogleFontOptions) => FontResult;
export declare const Outfit: (opts?: GoogleFontOptions) => FontResult;
export declare const Manrope: (opts?: GoogleFontOptions) => FontResult;
export declare const Space_Grotesk: (opts?: GoogleFontOptions) => FontResult;
export declare const DM_Sans: (opts?: GoogleFontOptions) => FontResult;
export declare const Work_Sans: (opts?: GoogleFontOptions) => FontResult;
export declare const Quicksand: (opts?: GoogleFontOptions) => FontResult;
export declare const Barlow: (opts?: GoogleFontOptions) => FontResult;
export declare const Figtree: (opts?: GoogleFontOptions) => FontResult;
export declare const Geist: (opts?: GoogleFontOptions) => FontResult;
export declare const Plus_Jakarta_Sans: (opts?: GoogleFontOptions) => FontResult;
export declare const Sora: (opts?: GoogleFontOptions) => FontResult;
export declare const Lexend: (opts?: GoogleFontOptions) => FontResult;
export declare const Cabin: (opts?: GoogleFontOptions) => FontResult;
export declare const Karla: (opts?: GoogleFontOptions) => FontResult;
export declare const Noto_Sans: (opts?: GoogleFontOptions) => FontResult;
export declare const Rubik: (opts?: GoogleFontOptions) => FontResult;
export declare const Mulish: (opts?: GoogleFontOptions) => FontResult;
export declare const PT_Sans: (opts?: GoogleFontOptions) => FontResult;
export declare const Playfair_Display: (opts?: GoogleFontOptions) => FontResult;
export declare const Merriweather: (opts?: GoogleFontOptions) => FontResult;
export declare const Lora: (opts?: GoogleFontOptions) => FontResult;
export declare const PT_Serif: (opts?: GoogleFontOptions) => FontResult;
export declare const Noto_Serif: (opts?: GoogleFontOptions) => FontResult;
export declare const Libre_Baskerville: (opts?: GoogleFontOptions) => FontResult;
export declare const DM_Serif_Display: (opts?: GoogleFontOptions) => FontResult;
export declare const Bitter: (opts?: GoogleFontOptions) => FontResult;
export declare const Crimson_Text: (opts?: GoogleFontOptions) => FontResult;
export declare const Cormorant_Garamond: (opts?: GoogleFontOptions) => FontResult;
export declare const Roboto_Mono: (opts?: GoogleFontOptions) => FontResult;
export declare const Source_Code_Pro: (opts?: GoogleFontOptions) => FontResult;
export declare const JetBrains_Mono: (opts?: GoogleFontOptions) => FontResult;
export declare const Fira_Code: (opts?: GoogleFontOptions) => FontResult;
export declare const IBM_Plex_Mono: (opts?: GoogleFontOptions) => FontResult;
export declare const Inconsolata: (opts?: GoogleFontOptions) => FontResult;
export declare const Geist_Mono: (opts?: GoogleFontOptions) => FontResult;
export declare const Space_Mono: (opts?: GoogleFontOptions) => FontResult;
export declare const Bebas_Neue: (opts?: GoogleFontOptions) => FontResult;
export declare const Abril_Fatface: (opts?: GoogleFontOptions) => FontResult;
export declare const Pacifico: (opts?: GoogleFontOptions) => FontResult;
export declare const Permanent_Marker: (opts?: GoogleFontOptions) => FontResult;
export declare const Dancing_Script: (opts?: GoogleFontOptions) => FontResult;
export declare const Lobster: (opts?: GoogleFontOptions) => FontResult;
export declare const Comfortaa: (opts?: GoogleFontOptions) => FontResult;
export declare const Righteous: (opts?: GoogleFontOptions) => FontResult;
export declare const Titan_One: (opts?: GoogleFontOptions) => FontResult;
/**
 * Load any Google Font by name (for fonts not pre-configured above).
 *
 *   import { googleFont } from '@vistagenic/vista/font/google';
 *   const font = googleFont('Fira Sans', { weight: ['400', '700'] });
 */
export declare function googleFont(family: string, opts?: GoogleFontOptions): FontResult;
