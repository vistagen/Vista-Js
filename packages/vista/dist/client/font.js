"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.localFont = exports.Space_Grotesk = exports.Outfit = exports.Merriweather = exports.Playfair_Display = exports.JetBrains_Mono = exports.Source_Code_Pro = exports.Roboto_Mono = exports.Poppins = exports.Montserrat = exports.Lato = exports.Open_Sans = exports.Roboto = exports.Inter = void 0;
exports.createGoogleFont = createGoogleFont;
exports.createLocalFont = createLocalFont;
exports.FontProvider = FontProvider;
const jsx_runtime_1 = require("react/jsx-runtime");
// Generate unique class name
function generateClassName(name) {
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
function createGoogleFont(fontFamily, options = {}) {
    const { weight = 400, style = 'normal', subsets = ['latin'], display = 'swap', fallback = ['system-ui', 'sans-serif'], variable, } = options;
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
function createLocalFont(options) {
    const { src, weight = 400, style = 'normal', display = 'swap', fallback = ['system-ui', 'sans-serif'], variable, declarations = [], } = options;
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
const Inter = (options) => createGoogleFont('Inter', { ...options, fallback: ['system-ui', 'sans-serif'] });
exports.Inter = Inter;
const Roboto = (options) => createGoogleFont('Roboto', { ...options, fallback: ['system-ui', 'sans-serif'] });
exports.Roboto = Roboto;
const Open_Sans = (options) => createGoogleFont('Open Sans', { ...options, fallback: ['system-ui', 'sans-serif'] });
exports.Open_Sans = Open_Sans;
const Lato = (options) => createGoogleFont('Lato', { ...options, fallback: ['system-ui', 'sans-serif'] });
exports.Lato = Lato;
const Montserrat = (options) => createGoogleFont('Montserrat', { ...options, fallback: ['system-ui', 'sans-serif'] });
exports.Montserrat = Montserrat;
const Poppins = (options) => createGoogleFont('Poppins', { ...options, fallback: ['system-ui', 'sans-serif'] });
exports.Poppins = Poppins;
const Roboto_Mono = (options) => createGoogleFont('Roboto Mono', { ...options, fallback: ['monospace'] });
exports.Roboto_Mono = Roboto_Mono;
const Source_Code_Pro = (options) => createGoogleFont('Source Code Pro', { ...options, fallback: ['monospace'] });
exports.Source_Code_Pro = Source_Code_Pro;
const JetBrains_Mono = (options) => createGoogleFont('JetBrains Mono', { ...options, fallback: ['monospace'] });
exports.JetBrains_Mono = JetBrains_Mono;
const Playfair_Display = (options) => createGoogleFont('Playfair Display', { ...options, fallback: ['serif'] });
exports.Playfair_Display = Playfair_Display;
const Merriweather = (options) => createGoogleFont('Merriweather', { ...options, fallback: ['serif'] });
exports.Merriweather = Merriweather;
const Outfit = (options) => createGoogleFont('Outfit', { ...options, fallback: ['system-ui', 'sans-serif'] });
exports.Outfit = Outfit;
const Space_Grotesk = (options) => createGoogleFont('Space Grotesk', { ...options, fallback: ['system-ui', 'sans-serif'] });
exports.Space_Grotesk = Space_Grotesk;
function FontProvider({ fonts, children }) {
    // Generate CSS for fonts
    const fontCSS = fonts.map(font => {
        if (font.variable) {
            return `:root { ${font.variable}: ${font.style.fontFamily}; }`;
        }
        return '';
    }).filter(Boolean).join('\n');
    return ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [fontCSS && ((0, jsx_runtime_1.jsx)("style", { dangerouslySetInnerHTML: { __html: fontCSS } })), children] }));
}
// Local font helper
exports.localFont = createLocalFont;
// Default export
exports.default = {
    Inter: exports.Inter,
    Roboto: exports.Roboto,
    Open_Sans: exports.Open_Sans,
    Lato: exports.Lato,
    Montserrat: exports.Montserrat,
    Poppins: exports.Poppins,
    Roboto_Mono: exports.Roboto_Mono,
    Source_Code_Pro: exports.Source_Code_Pro,
    JetBrains_Mono: exports.JetBrains_Mono,
    Playfair_Display: exports.Playfair_Display,
    Merriweather: exports.Merriweather,
    Outfit: exports.Outfit,
    Space_Grotesk: exports.Space_Grotesk,
    localFont: exports.localFont,
    FontProvider,
};
