import * as React from 'react';
export interface ImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
    src: string;
    alt: string;
    width?: number | string;
    height?: number | string;
    className?: string;
    priority?: boolean;
}
export default function Image({ src, alt, width, height, className, priority, ...props }: ImageProps): import("react/jsx-runtime").JSX.Element;
