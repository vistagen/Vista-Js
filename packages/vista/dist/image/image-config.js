"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VALID_LOADERS = exports.imageConfigDefault = void 0;
const constants_1 = require("../constants");
exports.imageConfigDefault = {
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    path: constants_1.IMAGE_ENDPOINT,
    loader: 'default',
    loaderFile: '',
    domains: [],
    disableStaticImages: false,
    minimumCacheTTL: 60,
    formats: ['image/webp'],
    dangerouslyAllowSVG: false,
    contentSecurityPolicy: "script-src 'none'; frame-src 'none'; sandbox;",
    contentDispositionType: 'inline',
    remotePatterns: [],
    unoptimized: false,
};
exports.VALID_LOADERS = ['default', 'imgix', 'cloudinary', 'akamai', 'custom'];
