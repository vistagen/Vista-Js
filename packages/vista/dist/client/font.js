"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Bebas_Neue = exports.Space_Mono = exports.Geist_Mono = exports.Inconsolata = exports.IBM_Plex_Mono = exports.Fira_Code = exports.JetBrains_Mono = exports.Source_Code_Pro = exports.Roboto_Mono = exports.Cormorant_Garamond = exports.Crimson_Text = exports.Bitter = exports.DM_Serif_Display = exports.Libre_Baskerville = exports.Noto_Serif = exports.PT_Serif = exports.Lora = exports.Merriweather = exports.Playfair_Display = exports.PT_Sans = exports.Mulish = exports.Rubik = exports.Noto_Sans = exports.Karla = exports.Cabin = exports.Lexend = exports.Sora = exports.Plus_Jakarta_Sans = exports.Geist = exports.Figtree = exports.Barlow = exports.Quicksand = exports.Work_Sans = exports.DM_Sans = exports.Space_Grotesk = exports.Manrope = exports.Outfit = exports.Oswald = exports.Ubuntu = exports.Raleway = exports.Nunito_Sans = exports.Nunito = exports.Poppins = exports.Montserrat = exports.Lato = exports.Open_Sans = exports.Roboto = exports.Inter = exports.googleFont = exports.createGoogleFont = void 0;
exports.getFontHeadHTML = exports.clearRegistry = exports.getRegisteredFonts = exports.registerFont = exports.localFont = exports.createLocalFont = exports.Titan_One = exports.Righteous = exports.Comfortaa = exports.Lobster = exports.Dancing_Script = exports.Permanent_Marker = exports.Pacifico = exports.Abril_Fatface = void 0;
// Re-export Google Fonts
var google_1 = require("../font/google");
Object.defineProperty(exports, "createGoogleFont", { enumerable: true, get: function () { return google_1.createGoogleFont; } });
Object.defineProperty(exports, "googleFont", { enumerable: true, get: function () { return google_1.googleFont; } });
Object.defineProperty(exports, "Inter", { enumerable: true, get: function () { return google_1.Inter; } });
Object.defineProperty(exports, "Roboto", { enumerable: true, get: function () { return google_1.Roboto; } });
Object.defineProperty(exports, "Open_Sans", { enumerable: true, get: function () { return google_1.Open_Sans; } });
Object.defineProperty(exports, "Lato", { enumerable: true, get: function () { return google_1.Lato; } });
Object.defineProperty(exports, "Montserrat", { enumerable: true, get: function () { return google_1.Montserrat; } });
Object.defineProperty(exports, "Poppins", { enumerable: true, get: function () { return google_1.Poppins; } });
Object.defineProperty(exports, "Nunito", { enumerable: true, get: function () { return google_1.Nunito; } });
Object.defineProperty(exports, "Nunito_Sans", { enumerable: true, get: function () { return google_1.Nunito_Sans; } });
Object.defineProperty(exports, "Raleway", { enumerable: true, get: function () { return google_1.Raleway; } });
Object.defineProperty(exports, "Ubuntu", { enumerable: true, get: function () { return google_1.Ubuntu; } });
Object.defineProperty(exports, "Oswald", { enumerable: true, get: function () { return google_1.Oswald; } });
Object.defineProperty(exports, "Outfit", { enumerable: true, get: function () { return google_1.Outfit; } });
Object.defineProperty(exports, "Manrope", { enumerable: true, get: function () { return google_1.Manrope; } });
Object.defineProperty(exports, "Space_Grotesk", { enumerable: true, get: function () { return google_1.Space_Grotesk; } });
Object.defineProperty(exports, "DM_Sans", { enumerable: true, get: function () { return google_1.DM_Sans; } });
Object.defineProperty(exports, "Work_Sans", { enumerable: true, get: function () { return google_1.Work_Sans; } });
Object.defineProperty(exports, "Quicksand", { enumerable: true, get: function () { return google_1.Quicksand; } });
Object.defineProperty(exports, "Barlow", { enumerable: true, get: function () { return google_1.Barlow; } });
Object.defineProperty(exports, "Figtree", { enumerable: true, get: function () { return google_1.Figtree; } });
Object.defineProperty(exports, "Geist", { enumerable: true, get: function () { return google_1.Geist; } });
Object.defineProperty(exports, "Plus_Jakarta_Sans", { enumerable: true, get: function () { return google_1.Plus_Jakarta_Sans; } });
Object.defineProperty(exports, "Sora", { enumerable: true, get: function () { return google_1.Sora; } });
Object.defineProperty(exports, "Lexend", { enumerable: true, get: function () { return google_1.Lexend; } });
Object.defineProperty(exports, "Cabin", { enumerable: true, get: function () { return google_1.Cabin; } });
Object.defineProperty(exports, "Karla", { enumerable: true, get: function () { return google_1.Karla; } });
Object.defineProperty(exports, "Noto_Sans", { enumerable: true, get: function () { return google_1.Noto_Sans; } });
Object.defineProperty(exports, "Rubik", { enumerable: true, get: function () { return google_1.Rubik; } });
Object.defineProperty(exports, "Mulish", { enumerable: true, get: function () { return google_1.Mulish; } });
Object.defineProperty(exports, "PT_Sans", { enumerable: true, get: function () { return google_1.PT_Sans; } });
Object.defineProperty(exports, "Playfair_Display", { enumerable: true, get: function () { return google_1.Playfair_Display; } });
Object.defineProperty(exports, "Merriweather", { enumerable: true, get: function () { return google_1.Merriweather; } });
Object.defineProperty(exports, "Lora", { enumerable: true, get: function () { return google_1.Lora; } });
Object.defineProperty(exports, "PT_Serif", { enumerable: true, get: function () { return google_1.PT_Serif; } });
Object.defineProperty(exports, "Noto_Serif", { enumerable: true, get: function () { return google_1.Noto_Serif; } });
Object.defineProperty(exports, "Libre_Baskerville", { enumerable: true, get: function () { return google_1.Libre_Baskerville; } });
Object.defineProperty(exports, "DM_Serif_Display", { enumerable: true, get: function () { return google_1.DM_Serif_Display; } });
Object.defineProperty(exports, "Bitter", { enumerable: true, get: function () { return google_1.Bitter; } });
Object.defineProperty(exports, "Crimson_Text", { enumerable: true, get: function () { return google_1.Crimson_Text; } });
Object.defineProperty(exports, "Cormorant_Garamond", { enumerable: true, get: function () { return google_1.Cormorant_Garamond; } });
Object.defineProperty(exports, "Roboto_Mono", { enumerable: true, get: function () { return google_1.Roboto_Mono; } });
Object.defineProperty(exports, "Source_Code_Pro", { enumerable: true, get: function () { return google_1.Source_Code_Pro; } });
Object.defineProperty(exports, "JetBrains_Mono", { enumerable: true, get: function () { return google_1.JetBrains_Mono; } });
Object.defineProperty(exports, "Fira_Code", { enumerable: true, get: function () { return google_1.Fira_Code; } });
Object.defineProperty(exports, "IBM_Plex_Mono", { enumerable: true, get: function () { return google_1.IBM_Plex_Mono; } });
Object.defineProperty(exports, "Inconsolata", { enumerable: true, get: function () { return google_1.Inconsolata; } });
Object.defineProperty(exports, "Geist_Mono", { enumerable: true, get: function () { return google_1.Geist_Mono; } });
Object.defineProperty(exports, "Space_Mono", { enumerable: true, get: function () { return google_1.Space_Mono; } });
Object.defineProperty(exports, "Bebas_Neue", { enumerable: true, get: function () { return google_1.Bebas_Neue; } });
Object.defineProperty(exports, "Abril_Fatface", { enumerable: true, get: function () { return google_1.Abril_Fatface; } });
Object.defineProperty(exports, "Pacifico", { enumerable: true, get: function () { return google_1.Pacifico; } });
Object.defineProperty(exports, "Permanent_Marker", { enumerable: true, get: function () { return google_1.Permanent_Marker; } });
Object.defineProperty(exports, "Dancing_Script", { enumerable: true, get: function () { return google_1.Dancing_Script; } });
Object.defineProperty(exports, "Lobster", { enumerable: true, get: function () { return google_1.Lobster; } });
Object.defineProperty(exports, "Comfortaa", { enumerable: true, get: function () { return google_1.Comfortaa; } });
Object.defineProperty(exports, "Righteous", { enumerable: true, get: function () { return google_1.Righteous; } });
Object.defineProperty(exports, "Titan_One", { enumerable: true, get: function () { return google_1.Titan_One; } });
// Re-export Local Font
var local_1 = require("../font/local");
Object.defineProperty(exports, "createLocalFont", { enumerable: true, get: function () { return local_1.createLocalFont; } });
Object.defineProperty(exports, "localFont", { enumerable: true, get: function () { return __importDefault(local_1).default; } });
// Re-export Registry helpers (used by SSR engines)
var registry_1 = require("../font/registry");
Object.defineProperty(exports, "registerFont", { enumerable: true, get: function () { return registry_1.registerFont; } });
Object.defineProperty(exports, "getRegisteredFonts", { enumerable: true, get: function () { return registry_1.getRegisteredFonts; } });
Object.defineProperty(exports, "clearRegistry", { enumerable: true, get: function () { return registry_1.clearRegistry; } });
Object.defineProperty(exports, "getFontHeadHTML", { enumerable: true, get: function () { return registry_1.getFontHeadHTML; } });
