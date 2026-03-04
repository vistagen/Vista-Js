"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultConfig = exports.defaultTypedApiConfig = exports.defaultStructureValidationConfig = void 0;
exports.resolveStructureValidationConfig = resolveStructureValidationConfig;
exports.resolveTypedApiConfig = resolveTypedApiConfig;
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
exports.defaultTypedApiConfig = {
    enabled: false,
    serialization: 'json',
    bodySizeLimitBytes: 1024 * 1024,
};
exports.defaultConfig = {
    images: {},
    validation: {
        structure: { ...exports.defaultStructureValidationConfig },
    },
    experimental: {
        typedApi: { ...exports.defaultTypedApiConfig },
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
/**
 * Resolve and sanitize experimental typed API config.
 */
function resolveTypedApiConfig(config) {
    const merged = {
        ...exports.defaultTypedApiConfig,
        ...(config.experimental?.typedApi ?? {}),
    };
    const serialization = merged.serialization === 'superjson' ? 'superjson' : 'json';
    const parsedLimit = Number(merged.bodySizeLimitBytes);
    const bodySizeLimitBytes = Number.isFinite(parsedLimit) && parsedLimit > 0
        ? Math.floor(parsedLimit)
        : exports.defaultTypedApiConfig.bodySizeLimitBytes;
    return {
        enabled: Boolean(merged.enabled),
        serialization,
        bodySizeLimitBytes,
    };
}
function mergeConfig(userConfig) {
    return {
        ...exports.defaultConfig,
        ...userConfig,
        images: {
            ...(exports.defaultConfig.images ?? {}),
            ...(userConfig.images ?? {}),
        },
        server: {
            ...(exports.defaultConfig.server ?? {}),
            ...(userConfig.server ?? {}),
        },
        validation: {
            ...(exports.defaultConfig.validation ?? {}),
            ...(userConfig.validation ?? {}),
            structure: {
                ...exports.defaultStructureValidationConfig,
                ...(userConfig.validation?.structure ?? {}),
            },
        },
        experimental: {
            ...(exports.defaultConfig.experimental ?? {}),
            ...(userConfig.experimental ?? {}),
            typedApi: {
                ...exports.defaultTypedApiConfig,
                ...(userConfig.experimental?.typedApi ?? {}),
            },
        },
    };
}
function loadConfig(cwd = process.cwd()) {
    const tsPath = path_1.default.join(cwd, 'vista.config.ts');
    const jsPath = path_1.default.join(cwd, 'vista.config.js');
    try {
        if (fs_1.default.existsSync(tsPath)) {
            // We assume ts-node is registered by engine or bin
            const mod = require(tsPath);
            return mergeConfig(mod.default || mod);
        }
        else if (fs_1.default.existsSync(jsPath)) {
            const mod = require(jsPath);
            return mergeConfig(mod.default || mod);
        }
    }
    catch (error) {
        console.error('Error loading vista.config:', error);
    }
    return mergeConfig({});
}
