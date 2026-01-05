import webpack from 'webpack';
export interface WebpackConfigOptions {
    cwd: string;
    isDev: boolean;
}
export declare function createWebpackConfig(options: WebpackConfigOptions): webpack.Configuration;
