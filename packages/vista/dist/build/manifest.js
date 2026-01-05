"use strict";
/**
 * Vista Build Utilities
 *
 * Generates build manifests, BUILD_ID, and manages .vista output structure.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateBuildId = generateBuildId;
exports.getBuildId = getBuildId;
exports.createVistaDirectories = createVistaDirectories;
exports.generateBuildManifest = generateBuildManifest;
exports.generateRoutesManifest = generateRoutesManifest;
exports.generateClientComponentsManifest = generateClientComponentsManifest;
exports.generateServerComponentsManifest = generateServerComponentsManifest;
exports.getWebpackCacheConfig = getWebpackCacheConfig;
exports.cleanOldCache = cleanOldCache;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const crypto_1 = __importDefault(require("crypto"));
// ============================================================================
// BUILD_ID Generation
// ============================================================================
/**
 * Generate a unique build ID based on timestamp and random bytes.
 */
function generateBuildId() {
    const timestamp = Date.now().toString(36);
    const random = crypto_1.default.randomBytes(4).toString('hex');
    return `${timestamp}-${random}`;
}
/**
 * Read existing BUILD_ID or generate a new one.
 */
function getBuildId(vistaDir, forceNew = false) {
    const buildIdPath = path_1.default.join(vistaDir, 'BUILD_ID');
    if (!forceNew && fs_1.default.existsSync(buildIdPath)) {
        return fs_1.default.readFileSync(buildIdPath, 'utf-8').trim();
    }
    const buildId = generateBuildId();
    fs_1.default.mkdirSync(vistaDir, { recursive: true });
    fs_1.default.writeFileSync(buildIdPath, buildId);
    return buildId;
}
/**
 * Create the .vista directory structure.
 */
function createVistaDirectories(cwd) {
    const root = path_1.default.join(cwd, '.vista');
    const dirs = {
        root,
        cache: path_1.default.join(root, 'cache'),
        server: path_1.default.join(root, 'server'),
        static: path_1.default.join(root, 'static'),
        chunks: path_1.default.join(root, 'static', 'chunks'),
        css: path_1.default.join(root, 'static', 'css'),
        media: path_1.default.join(root, 'static', 'media'),
    };
    // Create all directories
    Object.values(dirs).forEach(dir => {
        fs_1.default.mkdirSync(dir, { recursive: true });
    });
    // Create cache subdirectories
    fs_1.default.mkdirSync(path_1.default.join(dirs.cache, 'webpack'), { recursive: true });
    fs_1.default.mkdirSync(path_1.default.join(dirs.cache, 'swc'), { recursive: true });
    fs_1.default.mkdirSync(path_1.default.join(dirs.cache, 'images'), { recursive: true });
    // Create server subdirectories
    fs_1.default.mkdirSync(path_1.default.join(dirs.server, 'app'), { recursive: true });
    fs_1.default.mkdirSync(path_1.default.join(dirs.server, 'chunks'), { recursive: true });
    return dirs;
}
/**
 * Generate build-manifest.json
 */
function generateBuildManifest(vistaDir, buildId, pages = {}) {
    const manifest = {
        buildId,
        polyfillFiles: [],
        devFiles: [],
        lowPriorityFiles: [],
        rootMainFiles: [
            '/_vista/static/chunks/webpack.js',
            '/_vista/static/chunks/main.js',
        ],
        pages,
    };
    const manifestPath = path_1.default.join(vistaDir, 'build-manifest.json');
    fs_1.default.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    return manifest;
}
/**
 * Generate routes-manifest.json from route tree.
 */
function generateRoutesManifest(vistaDir, staticRoutes = [], dynamicRoutes = []) {
    const manifest = {
        version: 1,
        basePath: '',
        redirects: [],
        rewrites: [],
        headers: [],
        staticRoutes,
        dynamicRoutes,
    };
    const manifestPath = path_1.default.join(vistaDir, 'routes-manifest.json');
    fs_1.default.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    return manifest;
}
/**
 * Generate manifest of client components (files with 'client load').
 */
function generateClientComponentsManifest(vistaDir, buildId, clientModules = {}) {
    const manifest = {
        buildId,
        clientModules,
    };
    const manifestPath = path_1.default.join(vistaDir, 'client-components-manifest.json');
    fs_1.default.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    return manifest;
}
/**
 * Generate manifest of server components.
 */
function generateServerComponentsManifest(vistaDir, serverModules = {}) {
    const manifest = {
        serverModules,
    };
    const manifestPath = path_1.default.join(vistaDir, 'server', 'server-components-manifest.json');
    fs_1.default.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
}
// ============================================================================
// Cache Utilities
// ============================================================================
/**
 * Get Webpack cache configuration for persistent caching.
 */
function getWebpackCacheConfig(vistaDir, buildId, name) {
    return {
        type: 'filesystem',
        version: buildId,
        cacheDirectory: path_1.default.join(vistaDir, 'cache', 'webpack'),
        name: name,
        buildDependencies: {
            config: [__filename],
        },
    };
}
/**
 * Clean old cache entries (keeps last N builds).
 */
function cleanOldCache(vistaDir, keepBuilds = 5) {
    const cacheDir = path_1.default.join(vistaDir, 'cache', 'webpack');
    if (!fs_1.default.existsSync(cacheDir))
        return;
    const entries = fs_1.default.readdirSync(cacheDir)
        .map(name => ({
        name,
        path: path_1.default.join(cacheDir, name),
        stat: fs_1.default.statSync(path_1.default.join(cacheDir, name)),
    }))
        .filter(e => e.stat.isDirectory())
        .sort((a, b) => b.stat.mtimeMs - a.stat.mtimeMs);
    // Remove old cache directories
    entries.slice(keepBuilds).forEach(entry => {
        fs_1.default.rmSync(entry.path, { recursive: true, force: true });
    });
}
