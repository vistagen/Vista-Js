"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.createLocalFont = createLocalFont;
const registry_1 = require("./registry");
// ─── Helpers ───────────────────────────────────────────────────────────────
let _counter = 0;
function hashName(name) {
    let h = 0x811c9dc5;
    for (let i = 0; i < name.length; i++) {
        h ^= name.charCodeAt(i);
        h = (h * 0x01000193) | 0;
    }
    return Math.abs(h).toString(36);
}
/**
 * Detect font format from file extension.
 */
function detectFormat(filePath) {
    const ext = filePath.split('.').pop()?.toLowerCase() || '';
    switch (ext) {
        case 'woff2':
            return 'woff2';
        case 'woff':
            return 'woff';
        case 'ttf':
        case 'truetype':
            return 'truetype';
        case 'otf':
        case 'opentype':
            return 'opentype';
        case 'eot':
            return 'embedded-opentype';
        case 'svg':
            return 'svg';
        default:
            return 'woff2';
    }
}
/**
 * Build `src:` value for @font-face from FontSource[].
 */
function buildSrcValue(sources) {
    return sources
        .map((s) => {
        const format = detectFormat(s.path);
        return `url('${s.path}') format('${format}')`;
    })
        .join(',\n    ');
}
// ─── Local Font Factory ───────────────────────────────────────────────────
/**
 * Create a local font.  Generates `@font-face` CSS, registers it in the
 * global font registry, and returns the familiar `{ className, style, variable }`.
 */
function createLocalFont(options) {
    const { src, weight = '400', style = 'normal', display = 'swap', fallback = ['system-ui', 'sans-serif'], variable, declarations = [], } = options;
    // Normalise sources
    const sources = typeof src === 'string' ? [{ path: src, weight: String(weight), style }] : src;
    // Generate a unique family name
    _counter++;
    const familyName = `__vista_local_${hashName(sources.map((s) => s.path).join('|') + _counter)}`;
    const className = `__font_${hashName(familyName)}`;
    const variableName = variable || `--font-local-${hashName(familyName)}`;
    const fontFamilyValue = `'${familyName}', ${fallback.join(', ')}`;
    // Preload URLs (woff2 first, or first source)
    const preloadUrls = sources.filter((s) => s.path.endsWith('.woff2')).map((s) => s.path);
    if (preloadUrls.length === 0 && sources.length > 0) {
        preloadUrls.push(sources[0].path);
    }
    // Build @font-face rules
    // If there are multiple sources with different weights/styles, we emit
    // one @font-face per source entry.
    const fontFaceRules = [];
    // Check if sources have individual weight/style overrides
    const hasIndividualProps = sources.some((s) => s.weight || s.style);
    if (hasIndividualProps) {
        // Multiple @font-face blocks, one per source
        for (const source of sources) {
            const srcValue = `url('${source.path}') format('${detectFormat(source.path)}')`;
            const w = source.weight || weight;
            const s = source.style || style;
            const extraDecls = declarations.map((d) => `  ${d.prop}: ${d.value};`).join('\n');
            fontFaceRules.push(`@font-face {\n` +
                `  font-family: '${familyName}';\n` +
                `  src: ${srcValue};\n` +
                `  font-weight: ${w};\n` +
                `  font-style: ${s};\n` +
                `  font-display: ${display};\n` +
                (extraDecls ? extraDecls + '\n' : '') +
                `}`);
        }
    }
    else {
        // Single @font-face with all sources combined
        const srcValue = buildSrcValue(sources);
        const extraDecls = declarations.map((d) => `  ${d.prop}: ${d.value};`).join('\n');
        fontFaceRules.push(`@font-face {\n` +
            `  font-family: '${familyName}';\n` +
            `  src: ${srcValue};\n` +
            `  font-weight: ${weight};\n` +
            `  font-style: ${style};\n` +
            `  font-display: ${display};\n` +
            (extraDecls ? extraDecls + '\n' : '') +
            `}`);
    }
    // Utility class + CSS variable
    const injectCSS = [
        ...fontFaceRules,
        `.${className} { font-family: ${fontFamilyValue}; }`,
        `:root { ${variableName}: ${fontFamilyValue}; }`,
    ].join('\n');
    const entry = {
        kind: 'local',
        family: familyName,
        className,
        variableName,
        fontFaceCSS: fontFaceRules.join('\n'),
        preloadUrls,
        injectCSS,
    };
    (0, registry_1.registerFont)(entry);
    return {
        className,
        style: { fontFamily: fontFamilyValue },
        variable: variableName,
    };
}
// Default export for Next.js-compatible `import localFont from 'vista/font/local'`
exports.default = createLocalFont;
