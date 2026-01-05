"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultConfig = void 0;
exports.loadConfig = loadConfig;
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
exports.defaultConfig = {
    images: {},
};
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
        console.error("Error loading vista.config:", error);
    }
    return exports.defaultConfig;
}
