/**
 * Vista Local Font Loader
 *
 * Usage (Next.js-compatible):
 *
 *   import localFont from '@vistagenic/vista/font/local';
 *
 *   const myFont = localFont({
 *     src: './fonts/MyFont.woff2',
 *     display: 'swap',
 *     weight: '400',
 *     variable: '--font-my',
 *   });
 *
 *   // Multiple sources:
 *   const brandFont = localFont({
 *     src: [
 *       { path: './fonts/Brand-Regular.woff2', weight: '400', style: 'normal' },
 *       { path: './fonts/Brand-Bold.woff2', weight: '700', style: 'normal' },
 *       { path: './fonts/Brand-Italic.woff2', weight: '400', style: 'italic' },
 *     ],
 *     variable: '--font-brand',
 *   });
 *
 *   <div className={myFont.className}>Hello</div>
 *   <div style={myFont.style}>World</div>
 */
import type { LocalFontOptions, FontResult } from './types';
/**
 * Create a local font.  Generates `@font-face` CSS, registers it in the
 * global font registry, and returns the familiar `{ className, style, variable }`.
 */
export declare function createLocalFont(options: LocalFontOptions): FontResult;
export default createLocalFont;
