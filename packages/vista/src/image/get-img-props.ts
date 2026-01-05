
import { ImageConfigComplete, imageConfigDefault } from './image-config';
import { ImageLoader } from './image-loader';
import React from 'react';

export type PlaceholderValue = 'blur' | 'empty';

export type ImageProps = React.ImgHTMLAttributes<HTMLImageElement> & {
  src: string;
  alt: string;
  width?: number | string;
  height?: number | string;
  fill?: boolean;
  loader?: ImageLoader;
  quality?: number | string;
  priority?: boolean;
  unoptimized?: boolean;
  placeholder?: PlaceholderValue;
  blurDataURL?: string;
  onLoadingComplete?: (result: { naturalWidth: number; naturalHeight: number }) => void;
};

type ImgProps = React.ImgHTMLAttributes<HTMLImageElement> & {
  width?: number;
  height?: number;
  srcSet?: string;
};

// Helper: Generate srcSet
function generateSrcSet(
  src: string,
  width: number | undefined,
  loader: ImageLoader,
  config: ImageConfigComplete,
  unoptimized: boolean
): string | undefined {
  if (unoptimized) return undefined;

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

export function getImgProps(
  props: ImageProps,
  config: ImageConfigComplete = imageConfigDefault,
  defaultLoader: ImageLoader
): ImgProps {
  const {
    src,
    alt,
    width,
    height,
    fill,
    loader = defaultLoader,
    quality,
    priority,
    unoptimized,
    style,
    sizes,
    className,
    loading,
    placeholder,
    blurDataURL,
    onLoadingComplete,
    ...rest
  } = props;

  const imgStyle: React.CSSProperties = { ...style };
  
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
