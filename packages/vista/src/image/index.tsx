'use client';

import React, { forwardRef, useState, useCallback } from 'react';
import { getImgProps, ImageProps, PlaceholderValue } from './get-img-props';
import { imageConfigDefault } from './image-config';
import { defaultLoader } from './image-loader';

// Blur placeholder styles
const blurStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    filter: 'blur(20px)',
    transform: 'scale(1.1)',
    transition: 'opacity 0.3s ease-in-out',
};

const wrapperStyle: React.CSSProperties = {
    position: 'relative',
    overflow: 'hidden',
};

export interface EnhancedImageProps extends ImageProps {
    // All props from ImageProps
}

export const Image = forwardRef<HTMLImageElement, EnhancedImageProps>((props, ref) => {
    const {
        placeholder,
        blurDataURL,
        onLoadingComplete,
        priority,
        ...restProps
    } = props;

    const [isLoaded, setIsLoaded] = useState(false);

    // Combine refs
    const setRefs = useCallback((node: HTMLImageElement | null) => {
        if (node && node.complete && node.naturalWidth > 0) {
            setIsLoaded(true);
        }
        if (typeof ref === 'function') {
            ref(node);
        } else if (ref) {
            (ref as React.MutableRefObject<HTMLImageElement | null>).current = node;
        }
    }, [ref]);

    // Handle image load complete
    const handleLoad = useCallback((event: React.SyntheticEvent<HTMLImageElement>) => {
        const img = event.currentTarget;
        setIsLoaded(true);

        if (onLoadingComplete) {
            onLoadingComplete({
                naturalWidth: img.naturalWidth,
                naturalHeight: img.naturalHeight,
            });
        }
    }, [onLoadingComplete]);

    // Get processed img props
    const imgProps = getImgProps(
        { ...restProps, priority },
        imageConfigDefault,
        defaultLoader
    );

    // Determine if we should show blur placeholder
    const showBlur = placeholder === 'blur' && blurDataURL && !isLoaded;
    const needsWrapper = showBlur;

    // Render image element
    const imageElement = (
        <img
            {...imgProps}
            ref={setRefs}
            onLoad={handleLoad}
            style={{
                ...imgProps.style,
                ...(showBlur ? {
                    opacity: isLoaded ? 1 : 0,
                    transition: 'opacity 0.5s ease-in-out'
                } : {}),
            }}
            src={imgProps.src}
            srcSet={imgProps.srcSet}
            decoding={priority ? 'sync' : 'async'}
            fetchPriority={priority ? 'high' : undefined}
        />
    );

    // Wrap with blur placeholder if needed
    if (needsWrapper) {
        return (
            <span
                style={{
                    ...wrapperStyle,
                    display: imgProps.style?.display || 'inline-block',
                    width: imgProps.width,
                    height: imgProps.height,
                }}
            >
                {/* Blur placeholder */}
                <span
                    style={{
                        ...blurStyle,
                        backgroundImage: `url("${blurDataURL}")`,
                        opacity: isLoaded ? 0 : 1,
                    }}
                    aria-hidden="true"
                />
                {imageElement}
            </span>
        );
    }

    return imageElement;
});

Image.displayName = 'Image';

export default Image;
