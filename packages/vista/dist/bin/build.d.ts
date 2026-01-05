import webpack from 'webpack';
declare let compiler: webpack.Compiler | null;
export declare function buildClient(watch?: boolean, onRebuild?: () => void): Promise<webpack.Compiler | null>;
export { compiler };
