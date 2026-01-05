"use strict";
/**
 * RSC Webpack Compiler
 *
 * Creates separate webpack configurations for:
 * 1. Server Bundle (.vista/server/) - All app code for SSR
 * 2. Client Bundle (.vista/static/) - Only 'client load' components
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createServerWebpackConfig = createServerWebpackConfig;
exports.createClientWebpackConfig = createClientWebpackConfig;
exports.runRSCBuild = runRSCBuild;
const path_1 = __importDefault(require("path"));
const webpack_1 = __importDefault(require("webpack"));
const fs_1 = __importDefault(require("fs"));
const manifest_1 = require("../manifest");
const client_reference_plugin_1 = require("./client-reference-plugin");
const client_manifest_1 = require("./client-manifest");
const server_manifest_1 = require("./server-manifest");
// Find module path (handles monorepo hoisting)
const findModulePath = (moduleName, cwd) => {
    const localPath = path_1.default.resolve(cwd, 'node_modules', moduleName);
    if (fs_1.default.existsSync(localPath)) {
        return localPath;
    }
    try {
        return path_1.default.dirname(require.resolve(`${moduleName}/package.json`, { paths: [cwd] }));
    }
    catch {
        return path_1.default.dirname(require.resolve(`${moduleName}/package.json`));
    }
};
/**
 * Create Server-Side Webpack Configuration
 *
 * Builds ALL components for server-side rendering.
 * Output goes to .vista/server/ and is NEVER sent to the client.
 */
function createServerWebpackConfig(options) {
    const { cwd, isDev, vistaDirs, buildId } = options;
    // Generate server manifest first
    const serverManifest = (0, server_manifest_1.generateServerManifest)(cwd, path_1.default.join(cwd, 'app'));
    fs_1.default.writeFileSync(path_1.default.join(vistaDirs.server, 'server-manifest.json'), JSON.stringify(serverManifest, null, 2));
    return {
        mode: isDev ? 'development' : 'production',
        name: 'server',
        target: 'node',
        // Entry: All pages and layouts for SSR
        entry: () => {
            const entries = {};
            const appDir = path_1.default.join(cwd, 'app');
            // Scan for all page.tsx, layout.tsx files
            function scanDir(dir, prefix = '') {
                if (!fs_1.default.existsSync(dir))
                    return;
                const items = fs_1.default.readdirSync(dir, { withFileTypes: true });
                for (const item of items) {
                    if (item.isDirectory()) {
                        if (!item.name.startsWith('.') && item.name !== 'node_modules') {
                            scanDir(path_1.default.join(dir, item.name), prefix + item.name + '/');
                        }
                    }
                    else if (item.isFile()) {
                        const ext = path_1.default.extname(item.name);
                        const base = path_1.default.basename(item.name, ext);
                        if (['.tsx', '.ts', '.jsx', '.js'].includes(ext)) {
                            if (['page', 'layout', 'loading', 'error', 'not-found', 'root', 'index'].includes(base)) {
                                const entryName = (prefix + base).replace(/\//g, '_') || 'root';
                                entries[entryName] = path_1.default.join(dir, item.name);
                            }
                        }
                    }
                }
            }
            scanDir(appDir);
            return entries;
        },
        output: {
            path: path_1.default.join(vistaDirs.server, 'app'),
            filename: '[name].js',
            libraryTarget: 'commonjs2',
            clean: !isDev,
        },
        externals: [
            // Don't bundle node_modules on server
            ({ request }, callback) => {
                if (request &&
                    !request.startsWith('.') &&
                    !request.startsWith('/') &&
                    !path_1.default.isAbsolute(request)) {
                    // External - don't bundle
                    return callback(null, 'commonjs ' + request);
                }
                callback();
            },
        ],
        cache: isDev ? (0, manifest_1.getWebpackCacheConfig)(vistaDirs.root, buildId, 'server-development') : false,
        resolve: {
            extensions: ['.tsx', '.ts', '.jsx', '.js'],
            modules: [path_1.default.resolve(cwd, 'node_modules'), 'node_modules'],
        },
        module: {
            rules: [
                {
                    test: /\.[jt]sx?$/,
                    exclude: /node_modules/,
                    use: {
                        loader: 'swc-loader',
                        options: {
                            jsc: {
                                parser: {
                                    syntax: 'typescript',
                                    tsx: true,
                                },
                                transform: {
                                    react: {
                                        runtime: 'automatic',
                                    },
                                },
                                target: 'es2020',
                            },
                            module: {
                                type: 'commonjs',
                            },
                        },
                    },
                },
                {
                    test: /\.css$/,
                    use: 'null-loader', // CSS handled separately
                },
            ],
        },
        plugins: [
            new webpack_1.default.DefinePlugin({
                'process.env.NODE_ENV': JSON.stringify(isDev ? 'development' : 'production'),
                __VISTA_BUILD_ID__: JSON.stringify(buildId),
                __VISTA_SERVER__: 'true',
            }),
        ],
        devtool: isDev ? 'source-map' : false,
        stats: 'minimal',
    };
}
/**
 * Create Client-Side Webpack Configuration (RSC-aware)
 *
 * ONLY bundles components marked with 'client load'.
 * Server components are replaced with client references.
 */
function createClientWebpackConfig(options) {
    const { cwd, isDev, vistaDirs, buildId } = options;
    // Generate client manifest
    const clientManifest = (0, client_manifest_1.generateClientManifest)(cwd, path_1.default.join(cwd, 'app'));
    fs_1.default.writeFileSync(path_1.default.join(vistaDirs.root, 'client-manifest.json'), JSON.stringify(clientManifest, null, 2));
    const reactPath = findModulePath('react', cwd);
    const reactDomPath = findModulePath('react-dom', cwd);
    // Entry: Only client components
    const clientEntry = path_1.default.join(vistaDirs.root, 'rsc-client.tsx');
    return {
        mode: isDev ? 'development' : 'production',
        name: 'client',
        target: 'web',
        entry: isDev
            ? ['webpack-hot-middleware/client?reload=true&overlay=true', clientEntry]
            : clientEntry,
        output: {
            path: vistaDirs.chunks,
            filename: isDev ? 'main.js' : 'main-[contenthash:8].js',
            chunkFilename: isDev ? '[name].js' : '[name]-[contenthash:8].js',
            publicPath: '/_vista/static/chunks/',
            clean: !isDev,
        },
        cache: isDev ? (0, manifest_1.getWebpackCacheConfig)(vistaDirs.root, buildId, 'client-rsc-development') : false,
        resolve: {
            extensions: ['.tsx', '.ts', '.jsx', '.js'],
            alias: {
                react: reactPath,
                'react-dom': reactDomPath,
                'react/jsx-runtime': path_1.default.join(reactPath, 'jsx-runtime'),
                'react/jsx-dev-runtime': path_1.default.join(reactPath, 'jsx-dev-runtime'),
            },
            modules: [path_1.default.resolve(cwd, 'node_modules'), 'node_modules'],
        },
        optimization: {
            splitChunks: {
                chunks: 'all',
                cacheGroups: {
                    framework: {
                        name: 'framework',
                        test: /[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/,
                        priority: 40,
                        chunks: 'all',
                        enforce: true,
                    },
                    vendor: {
                        name: 'vendor',
                        test: /[\\/]node_modules[\\/]/,
                        priority: 30,
                        chunks: 'all',
                    },
                },
            },
            runtimeChunk: {
                name: 'webpack',
            },
            moduleIds: isDev ? 'named' : 'deterministic',
            chunkIds: isDev ? 'named' : 'deterministic',
        },
        module: {
            rules: [
                {
                    test: /\.[jt]sx?$/,
                    exclude: /node_modules/,
                    use: {
                        loader: 'swc-loader',
                        options: {
                            jsc: {
                                parser: {
                                    syntax: 'typescript',
                                    tsx: true,
                                    dynamicImport: true,
                                },
                                transform: {
                                    react: {
                                        runtime: 'automatic',
                                        development: isDev,
                                        refresh: isDev,
                                    },
                                },
                                target: 'es2020',
                            },
                            module: {
                                type: 'es6',
                            },
                        },
                    },
                },
                {
                    test: /\.css$/,
                    use: 'null-loader',
                },
            ],
        },
        plugins: [
            // Replace server component imports with client references
            new client_reference_plugin_1.ClientReferencePlugin({
                appDir: path_1.default.join(cwd, 'app'),
                clientManifestPath: path_1.default.join(vistaDirs.root, 'client-manifest.json'),
            }),
            new webpack_1.default.DefinePlugin({
                'process.env.NODE_ENV': JSON.stringify(isDev ? 'development' : 'production'),
                __VISTA_BUILD_ID__: JSON.stringify(buildId),
                __VISTA_SERVER__: 'false',
            }),
            ...(isDev ? [new webpack_1.default.HotModuleReplacementPlugin()] : []),
        ],
        devtool: isDev ? 'eval-cheap-module-source-map' : 'source-map',
        stats: 'minimal',
    };
}
/**
 * Run both server and client builds
 */
async function runRSCBuild(cwd, isDev) {
    const { createVistaDirectories, getBuildId } = await Promise.resolve().then(() => __importStar(require('../manifest')));
    const vistaDirs = createVistaDirectories(cwd);
    const buildId = getBuildId(vistaDirs.root, !isDev);
    const options = { cwd, isDev, vistaDirs, buildId };
    const serverConfig = createServerWebpackConfig(options);
    const clientConfig = createClientWebpackConfig(options);
    const serverCompiler = (0, webpack_1.default)(serverConfig);
    const clientCompiler = (0, webpack_1.default)(clientConfig);
    return { serverCompiler, clientCompiler };
}
