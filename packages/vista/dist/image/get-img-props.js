"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getImgProps = getImgProps;
const image_config_1 = require("./image-config");
// Helper: Generate srcSet
function generateSrcSet(src, width, loader, config, unoptimized) {
    if (unoptimized)
        return undefined;
    const { deviceSizes, imageSizes } = config;
    const sizes = [...deviceSizes, ...imageSizes].sort((a, b) => a - b);
    // If width is known, only generate sizes up to that width (plus maybe 2x/3x for density)
    // For simplicity MVP, we'll generate device sizes.
    return sizes
        .map((size) => {
        const url = loader({ src, width: size });
        return `${url} ${size}w`;
    })
        .join(', ');
}
function getImgProps(props, config = image_config_1.imageConfigDefault, defaultLoader) {
    const { src, alt, width, height, fill, loader = defaultLoader, quality, priority, unoptimized, style, sizes, className, loading, placeholder, blurDataURL, onLoadingComplete, ...rest } = props;
    const imgStyle = { ...style };
    // Handle Fill Mode
    if (fill) {
        imgStyle.position = 'absolute';
        imgStyle.height = '100%';
        imgStyle.width = '100%';
        imgStyle.inset = 0;
        imgStyle.objectFit = 'cover'; // Default to cover for bg images
    }
    // Handle Dimensions
    let widthInt = width ? Number(width) : undefined;
    let heightInt = height ? Number(height) : undefined;
    // Generate SrcSet
    const srcSet = generateSrcSet(src, widthInt, loader, config, !!unoptimized);
    return {
        ...rest,
        src,
        alt,
        width: widthInt,
        height: heightInt,
        loading: priority ? 'eager' : (loading || 'lazy'),
        // fetchPriority: priority ? 'high' : undefined, // React types might strict on this
        style: imgStyle,
        sizes: sizes || (fill ? '100vw' : undefined),
        srcSet,
        className,
    };
}
