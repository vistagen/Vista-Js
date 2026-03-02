"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultConfig = exports.defaultStructureValidationConfig = void 0;
exports.resolveStructureValidationConfig = resolveStructureValidationConfig;
exports.loadConfig = loadConfig;
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
exports.defaultStructureValidationConfig = {
    enabled: true,
    mode: 'strict',
    includeWarningsInOverlay: false,
    logLevel: 'compact',
    watchDebounceMs: 120,
};
exports.defaultConfig = {
    images: {},
    validation: {
        structure: { ...exports.defaultStructureValidationConfig },
    },
};
/**
 * Resolve the effective structure validation config merging user overrides.
 */
function resolveStructureValidationConfig(config) {
    return {
        ...exports.defaultStructureValidationConfig,
        ...(config.validation?.structure ?? {}),
    };
}
function loadConfig(cwd = process.cwd()) {
    const tsPath = path_1.default.join(cwd, 'vista.config.ts');
    const jsPath = path_1.default.join(cwd, 'vista.config.js');
    try {
        if (fs_1.default.existsSync(tsPath)) {
            // We assume ts-node is registered by engine or bin
            const mod = require(tsPath);
            return { ...exports.defaultConfig, ...(mod.default || mod) };
        }
        else if (fs_1.default.existsSync(jsPath)) {
            const mod = require(jsPath);
            return { ...exports.defaultConfig, ...(mod.default || mod) };
        }
    }
    catch (error) {
        console.error('Error loading vista.config:', error);
    }
    return exports.defaultConfig;
}
