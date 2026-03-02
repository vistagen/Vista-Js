export type ImageLoaderProps = {
    src: string;
    width: number;
    quality?: number;
};
export type ImageLoader = (p: ImageLoaderProps) => string;
/**
 * Default Vista image loader.
 *
 * Generates URLs that point to the `/_vista/image` optimization endpoint.
 * The endpoint handles resizing, format conversion, and caching.
 *
 * For absolute URLs (remote images), the src is URL-encoded.
 * For relative URLs (local images), they're resolved against the public dir.
 */
export declare const defaultLoader: ImageLoader;
