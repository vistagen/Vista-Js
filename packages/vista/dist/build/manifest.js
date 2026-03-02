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
exports.generateAppPathRoutesManifest = generateAppPathRoutesManifest;
exports.generatePrerenderManifest = generatePrerenderManifest;
exports.generateRequiredServerFilesManifest = generateRequiredServerFilesManifest;
exports.ensureJsonFile = ensureJsonFile;
exports.writeArtifactManifest = writeArtifactManifest;
exports.writeCanonicalVistaArtifacts = writeCanonicalVistaArtifacts;
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
 * In legacy mode, only creates root + cache (no empty server/static dirs).
 * In RSC mode, creates the full structure for server/client bundles.
 */
function createVistaDirectories(cwd, mode = 'legacy') {
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
    // Always create root
    fs_1.default.mkdirSync(root, { recursive: true });
    if (mode === 'rsc') {
        // RSC mode: create full directory tree
        Object.values(dirs).forEach((dir) => {
            fs_1.default.mkdirSync(dir, { recursive: true });
        });
        // Cache subdirectories
        fs_1.default.mkdirSync(path_1.default.join(dirs.cache, 'webpack'), { recursive: true });
        fs_1.default.mkdirSync(path_1.default.join(dirs.cache, 'swc'), { recursive: true });
        fs_1.default.mkdirSync(path_1.default.join(dirs.cache, 'images'), { recursive: true });
        // Server subdirectories
        fs_1.default.mkdirSync(path_1.default.join(dirs.server, 'app'), { recursive: true });
        fs_1.default.mkdirSync(path_1.default.join(dirs.server, 'chunks'), { recursive: true });
    }
    // Legacy mode: only root dir is created — webpack outputs directly into .vista/
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
        rootMainFiles: ['/_vista/static/chunks/webpack.js', '/_vista/static/chunks/main.js'],
        pages,
    };
    const manifestPath = path_1.default.join(vistaDir, 'build-manifest.json');
    fs_1.default.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    return manifest;
}
function toRegexFromPattern(pattern) {
    const escaped = pattern
        .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        .replace(/:([a-zA-Z0-9_]+)\*/g, '(?<$1>.+)')
        .replace(/:([a-zA-Z0-9_]+)/g, '(?<$1>[^/]+)');
    return `^${escaped}$`;
}
function toRouteInfo(route) {
    return {
        page: route.pagePath,
        regex: toRegexFromPattern(route.pattern),
        routeKeys: {},
        namedRegex: toRegexFromPattern(route.pattern),
    };
}
function generateAppPathRoutesManifest(vistaDir, routes = []) {
    const manifest = {};
    routes.forEach((route) => {
        manifest[route.pattern] = route.pagePath;
    });
    fs_1.default.writeFileSync(path_1.default.join(vistaDir, 'app-path-routes-manifest.json'), JSON.stringify(manifest, null, 2));
    return manifest;
}
function generatePrerenderManifest(vistaDir) {
    const manifest = {
        version: 1,
        routes: {},
        dynamicRoutes: {},
        notFoundRoutes: [],
        preview: {
            previewModeId: '',
            previewModeSigningKey: '',
            previewModeEncryptionKey: '',
        },
    };
    fs_1.default.writeFileSync(path_1.default.join(vistaDir, 'prerender-manifest.json'), JSON.stringify(manifest, null, 2));
}
function generateRequiredServerFilesManifest(cwd, vistaDir) {
    const manifest = {
        version: 1,
        config: {},
        appDir: cwd,
        relativeAppDir: '.',
        files: [
            '.vista/BUILD_ID',
            '.vista/build-manifest.json',
            '.vista/routes-manifest.json',
            '.vista/app-path-routes-manifest.json',
        ],
    };
    fs_1.default.writeFileSync(path_1.default.join(vistaDir, 'required-server-files.json'), JSON.stringify(manifest, null, 2));
}
function ensureJsonFile(vistaDir, relativePath, fallback = {}) {
    const absolutePath = path_1.default.join(vistaDir, relativePath);
    if (!fs_1.default.existsSync(absolutePath)) {
        fs_1.default.writeFileSync(absolutePath, JSON.stringify(fallback, null, 2));
    }
}
function writeArtifactManifest(vistaDir, buildId) {
    const artifactManifest = {
        schemaVersion: 1,
        buildId,
        generatedAt: new Date().toISOString(),
        manifests: {
            buildManifest: 'build-manifest.json',
            routesManifest: 'routes-manifest.json',
            appPathRoutesManifest: 'app-path-routes-manifest.json',
            prerenderManifest: 'prerender-manifest.json',
            requiredServerFiles: 'required-server-files.json',
            reactClientManifest: 'react-client-manifest.json',
            reactServerManifest: 'react-server-manifest.json',
        },
    };
    fs_1.default.writeFileSync(path_1.default.join(vistaDir, 'artifact-manifest.json'), JSON.stringify(artifactManifest, null, 2));
    return artifactManifest;
}
function writeCanonicalVistaArtifacts(cwd, vistaDir, buildId, routes = []) {
    const staticRoutes = routes.filter((route) => route.type === 'static').map(toRouteInfo);
    const dynamicRoutes = routes.filter((route) => route.type !== 'static').map(toRouteInfo);
    generateBuildManifest(vistaDir, buildId);
    generateRoutesManifest(vistaDir, staticRoutes, dynamicRoutes);
    generateAppPathRoutesManifest(vistaDir, routes);
    generatePrerenderManifest(vistaDir);
    generateRequiredServerFilesManifest(cwd, vistaDir);
    // Keep canonical React manifest filenames present for validation consistency.
    ensureJsonFile(vistaDir, 'react-client-manifest.json', {});
    ensureJsonFile(vistaDir, 'react-server-manifest.json', {});
    return writeArtifactManifest(vistaDir, buildId);
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
 * Generate manifest of client components (files with 'use client').
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
    const entries = fs_1.default
        .readdirSync(cacheDir)
        .map((name) => ({
        name,
        path: path_1.default.join(cacheDir, name),
        stat: fs_1.default.statSync(path_1.default.join(cacheDir, name)),
    }))
        .filter((e) => e.stat.isDirectory())
        .sort((a, b) => b.stat.mtimeMs - a.stat.mtimeMs);
    // Remove old cache directories
    entries.slice(keepBuilds).forEach((entry) => {
        fs_1.default.rmSync(entry.path, { recursive: true, force: true });
    });
}
