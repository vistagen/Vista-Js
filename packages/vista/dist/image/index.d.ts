import React from 'react';
import { ImageProps } from './get-img-props';
export interface EnhancedImageProps extends ImageProps {
}
export declare const Image: React.ForwardRefExoticComponent<EnhancedImageProps & React.RefAttributes<HTMLImageElement>>;
export default Image;
