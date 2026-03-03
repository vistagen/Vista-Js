"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeComponentPath = normalizeComponentPath;
exports.stripComponentExtension = stripComponentExtension;
exports.relativeComponentPath = relativeComponentPath;
exports.createComponentIdentity = createComponentIdentity;
exports.createComponentId = createComponentId;
exports.createChunkName = createChunkName;
const crypto_1 = __importDefault(require("crypto"));
const path_1 = __importDefault(require("path"));
const SCRIPT_EXTENSION_REGEX = /\.[jt]sx?$/i;
function normalizeComponentPath(input) {
    return input.replace(/\\/g, '/').replace(/^\.\//, '');
}
function stripComponentExtension(input) {
    return input.replace(SCRIPT_EXTENSION_REGEX, '');
}
function relativeComponentPath(baseDir, absolutePath) {
    return normalizeComponentPath(path_1.default.relative(baseDir, absolutePath));
}
function shortHash(input) {
    return crypto_1.default.createHash('sha1').update(input).digest('hex').slice(0, 8);
}
function createComponentIdentity(relativePath) {
    const normalized = stripComponentExtension(normalizeComponentPath(relativePath));
    return `${normalized}#${shortHash(normalized)}`;
}
function createComponentId(scope, relativePath, exportName = 'default') {
    return `${scope}:${createComponentIdentity(relativePath)}:${exportName}`;
}
function createChunkName(relativePath) {
    const normalized = stripComponentExtension(normalizeComponentPath(relativePath));
    const safe = normalized
        .replace(/[^a-zA-Z0-9]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_+|_+$/g, '')
        .toLowerCase();
    return `${safe || 'component'}_${shortHash(normalized)}`;
}
