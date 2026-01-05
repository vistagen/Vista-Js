
export const imageConfigDefault = {
  deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
  imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  path: '/_next/image',
  loader: 'default' as const,
  loaderFile: '',
  domains: [] as string[],
  disableStaticImages: false,
  minimumCacheTTL: 60,
  formats: ['image/webp'] as const,
  dangerouslyAllowSVG: false,
  contentSecurityPolicy: "script-src 'none'; frame-src 'none'; sandbox;",
  contentDispositionType: 'inline' as const,
  remotePatterns: [],
  unoptimized: false,
}

export type ImageConfigComplete = typeof imageConfigDefault
export type ImageConfig = Partial<ImageConfigComplete>
export const VALID_LOADERS = ['default', 'imgix', 'cloudinary', 'akamai', 'custom'] as const
export type LoaderValue = typeof VALID_LOADERS[number]
