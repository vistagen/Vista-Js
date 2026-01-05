import path from 'path';
import webpack from 'webpack';
import ReactRefreshWebpackPlugin from '@pmmmwh/react-refresh-webpack-plugin';
import { VistaServerComponentPlugin } from './server-component-plugin';
import { VistaFlightPlugin } from '../build/webpack/plugins/vista-flight-plugin';

export interface WebpackConfigOptions {
    cwd: string;
    isDev: boolean;
}

export function createWebpackConfig(options: WebpackConfigOptions): webpack.Configuration {
    const { cwd, isDev } = options;
    const vistaDir = path.join(cwd, '.vista');
    const entryPoint = path.join(vistaDir, 'client.tsx');

    // Find React - check local node_modules first, then traverse up for monorepo hoisting
    const findModulePath = (moduleName: string): string => {
        const localPath = path.resolve(cwd, 'node_modules', moduleName);
        if (require('fs').existsSync(localPath)) {
            return localPath;
        }
        // Try to resolve from cwd (will traverse up)
        try {
            return path.dirname(require.resolve(`${moduleName}/package.json`, { paths: [cwd] }));
        } catch {
            // Fallback to framework's node_modules
            return path.dirname(require.resolve(`${moduleName}/package.json`));
        }
    };

    const reactPath = findModulePath('react');
    const reactDomPath = findModulePath('react-dom');

    return {
        mode: isDev ? 'development' : 'production',
        entry: isDev 
            ? [
                // HMR runtime - reload=true for full page reload on unaccepted modules
                // noInfo to reduce console noise, overlay=false to use Vista's error overlay
                'webpack-hot-middleware/client?path=/__webpack_hmr&timeout=20000&reload=true&noInfo=true&overlay=false',
                entryPoint
              ]
            : entryPoint,
        output: {
            path: vistaDir,
            filename: 'client.js',
            publicPath: '/',
            clean: false, // Don't clean .vista folder
        },
        // Webpack 5 Persistent Caching - dramatically faster rebuilds
        cache: isDev ? {
            type: 'filesystem',
            cacheDirectory: path.join(cwd, 'node_modules', '.cache', 'vista-webpack'),
            buildDependencies: {
                config: [__filename],
            },
        } : false,
        // Optimize module resolution for faster HMR
        snapshot: isDev ? {
            managedPaths: [path.resolve(cwd, 'node_modules')],
            immutablePaths: [],
        } : undefined,
        resolve: {
            extensions: ['.tsx', '.ts', '.jsx', '.js'],
            alias: {
                'react': reactPath,
                'react-dom': reactDomPath,
                'react/jsx-runtime': path.join(reactPath, 'jsx-runtime'),
                'react/jsx-dev-runtime': path.join(reactPath, 'jsx-dev-runtime'),
            },
            modules: [
                path.resolve(cwd, 'node_modules'),
                'node_modules'
            ]
        },
        module: {
            rules: [
                {
                    test: /\.[jt]sx?$/,
                    exclude: /node_modules/,
                    use: [
                        {
                            loader: require.resolve('swc-loader'),
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
                                            refresh: isDev, // Enable React Fast Refresh
                                        }
                                    },
                                    target: 'es2020',
                                },
                                module: {
                                    type: 'es6'
                                }
                            }
                        },
                        {
                            // Vista Flight Loader - marks modules with RSC info
                            // Runs FIRST (loaders execute bottom-to-top) to see original source
                            loader: require.resolve('../build/webpack/loaders/vista-flight-loader'),
                        },
                    ]
                },
                {
                    test: /\.css$/,
                    use: 'null-loader' // Ignore CSS in client bundle (handled by PostCSS)
                }
            ]
        },
        plugins: [
            // Server Component enforcement - runs on every compile
            new VistaServerComponentPlugin({ appDir: path.join(cwd, 'app') }),
            // Vista Flight Plugin - RSC bundle separation and manifest
            new VistaFlightPlugin({ appDir: path.join(cwd, 'app'), dev: isDev }),
            ...(isDev ? [
                new webpack.HotModuleReplacementPlugin(),
                new ReactRefreshWebpackPlugin({
                    overlay: false, // Disable built-in overlay, use Vista's error overlay
                }),
            ] : []),
            new webpack.DefinePlugin({
                'process.env.NODE_ENV': JSON.stringify(isDev ? 'development' : 'production'),
            }),
        ],
        devtool: isDev ? 'eval-cheap-module-source-map' : 'source-map',
        stats: 'minimal',
        infrastructureLogging: {
            level: 'warn',
        },
    };
}
