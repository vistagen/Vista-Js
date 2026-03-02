/**
 * Vista Image Types — Global Augmentations
 *
 * Provides TypeScript type declarations for static image imports.
 * When referenced in vista-env.d.ts, this allows:
 *
 *   import logo from './logo.png'
 *   // logo: { src: string; height: number; width: number; blurDataURL?: string }
 *
 * Also provides basic module declarations for image formats
 * that may be imported in components.
 */

interface StaticImageData {
  src: string;
  height: number;
  width: number;
  blurDataURL?: string;
  blurWidth?: number;
  blurHeight?: number;
}

declare module '*.png' {
  const content: StaticImageData;
  export default content;
}

declare module '*.jpg' {
  const content: StaticImageData;
  export default content;
}

declare module '*.jpeg' {
  const content: StaticImageData;
  export default content;
}

declare module '*.gif' {
  const content: StaticImageData;
  export default content;
}

declare module '*.webp' {
  const content: StaticImageData;
  export default content;
}

declare module '*.avif' {
  const content: StaticImageData;
  export default content;
}

declare module '*.ico' {
  const content: StaticImageData;
  export default content;
}

declare module '*.bmp' {
  const content: StaticImageData;
  export default content;
}

declare module '*.svg' {
  /**
   * SVG imports return a plain string (URL) by default.
   * Use an SVG loader plugin for component-based imports.
   */
  const content: string;
  export default content;
}
