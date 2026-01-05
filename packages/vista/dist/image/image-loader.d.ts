export type ImageLoaderProps = {
    src: string;
    width: number;
    quality?: number;
};
export type ImageLoader = (p: ImageLoaderProps) => string;
export declare const defaultLoader: ImageLoader;
