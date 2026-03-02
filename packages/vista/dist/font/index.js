"use strict";
/**
 * Vista Font System — Main Entry
 *
 * Re-exports everything from the font sub-modules.
 *
 *   import { Inter } from 'vista/font/google';
 *   import localFont from 'vista/font/local';
 *   import { getAllFontHTML } from 'vista/font';
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.localFont = exports.createLocalFont = exports.googleFont = exports.createGoogleFont = exports.getAllFontHTML = exports.getDefaultFontHTML = exports.getFontHeadHTML = exports.getFontStyleHTML = exports.getFontLinkHTML = exports.getFontPreconnectHTML = exports.clearRegistry = exports.getRegisteredFonts = exports.registerFont = void 0;
// Registry (used by SSR engine)
var registry_1 = require("./registry");
Object.defineProperty(exports, "registerFont", { enumerable: true, get: function () { return registry_1.registerFont; } });
Object.defineProperty(exports, "getRegisteredFonts", { enumerable: true, get: function () { return registry_1.getRegisteredFonts; } });
Object.defineProperty(exports, "clearRegistry", { enumerable: true, get: function () { return registry_1.clearRegistry; } });
Object.defineProperty(exports, "getFontPreconnectHTML", { enumerable: true, get: function () { return registry_1.getFontPreconnectHTML; } });
Object.defineProperty(exports, "getFontLinkHTML", { enumerable: true, get: function () { return registry_1.getFontLinkHTML; } });
Object.defineProperty(exports, "getFontStyleHTML", { enumerable: true, get: function () { return registry_1.getFontStyleHTML; } });
Object.defineProperty(exports, "getFontHeadHTML", { enumerable: true, get: function () { return registry_1.getFontHeadHTML; } });
Object.defineProperty(exports, "getDefaultFontHTML", { enumerable: true, get: function () { return registry_1.getDefaultFontHTML; } });
Object.defineProperty(exports, "getAllFontHTML", { enumerable: true, get: function () { return registry_1.getAllFontHTML; } });
// Google Fonts
var google_1 = require("./google");
Object.defineProperty(exports, "createGoogleFont", { enumerable: true, get: function () { return google_1.createGoogleFont; } });
Object.defineProperty(exports, "googleFont", { enumerable: true, get: function () { return google_1.googleFont; } });
// Local Fonts
var local_1 = require("./local");
Object.defineProperty(exports, "createLocalFont", { enumerable: true, get: function () { return local_1.createLocalFont; } });
var local_2 = require("./local");
Object.defineProperty(exports, "localFont", { enumerable: true, get: function () { return __importDefault(local_2).default; } });
