/**
 * Vista Font — Legacy re-export
 *
 * This file re-exports everything from the new `font/` module system.
 * Users should prefer the explicit imports:
 *
 *   import { Inter } from '@vistagenic/vista/font/google';
 *   import localFont from '@vistagenic/vista/font/local';
 *
 * But `import { Inter } from '@vistagenic/vista/font'` still works.
 */
export type { FontWeight, FontStyle, FontDisplay, GoogleFontOptions, LocalFontOptions, FontSource, FontFaceDeclaration, FontResult, } from '../font/types';
export { createGoogleFont, googleFont, Inter, Roboto, Open_Sans, Lato, Montserrat, Poppins, Nunito, Nunito_Sans, Raleway, Ubuntu, Oswald, Outfit, Manrope, Space_Grotesk, DM_Sans, Work_Sans, Quicksand, Barlow, Figtree, Geist, Plus_Jakarta_Sans, Sora, Lexend, Cabin, Karla, Noto_Sans, Rubik, Mulish, PT_Sans, Playfair_Display, Merriweather, Lora, PT_Serif, Noto_Serif, Libre_Baskerville, DM_Serif_Display, Bitter, Crimson_Text, Cormorant_Garamond, Roboto_Mono, Source_Code_Pro, JetBrains_Mono, Fira_Code, IBM_Plex_Mono, Inconsolata, Geist_Mono, Space_Mono, Bebas_Neue, Abril_Fatface, Pacifico, Permanent_Marker, Dancing_Script, Lobster, Comfortaa, Righteous, Titan_One, } from '../font/google';
export { createLocalFont, default as localFont } from '../font/local';
export { registerFont, getRegisteredFonts, clearRegistry, getFontHeadHTML } from '../font/registry';
