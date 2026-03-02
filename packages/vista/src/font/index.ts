/**
 * Vista Font System — Main Entry
 *
 * Re-exports everything from the font sub-modules.
 *
 *   import { Inter } from 'vista/font/google';
 *   import localFont from 'vista/font/local';
 *   import { getAllFontHTML } from 'vista/font';
 */

// Types
export type {
  FontWeight,
  FontStyle,
  FontDisplay,
  GoogleFontOptions,
  LocalFontOptions,
  FontSource,
  FontFaceDeclaration,
  FontResult,
  FontKind,
  FontRegistryEntry,
} from './types';

// Registry (used by SSR engine)
export {
  registerFont,
  getRegisteredFonts,
  clearRegistry,
  getFontPreconnectHTML,
  getFontLinkHTML,
  getFontStyleHTML,
  getFontHeadHTML,
  getDefaultFontHTML,
  getAllFontHTML,
} from './registry';

// Google Fonts
export { createGoogleFont, googleFont } from './google';

// Local Fonts
export { createLocalFont } from './local';
export { default as localFont } from './local';
