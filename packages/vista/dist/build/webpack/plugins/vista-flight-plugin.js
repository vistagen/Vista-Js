"use strict";
/**
 * Vista Flight Client Entry Plugin
 *
 * Generates lightweight client manifest artifacts for legacy mode.
 * This plugin intentionally stays isolated from Flight RSC mode.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VistaFlightPlugin = void 0;
const webpack_1 = __importDefault(require("webpack"));
const path_1 = __importDefault(require("path"));
const component_identity_1 = require("../../rsc/component-identity");
const constants_1 = require("../../../constants");
const PLUGIN_NAME = 'VistaFlightPlugin';
class VistaFlightPlugin {
    appDir;
    dev;
    constructor(options) {
        this.appDir = options.appDir;
        this.dev = options.dev;
    }
    apply(compiler) {
        compiler.hooks.compilation.tap(PLUGIN_NAME, (compilation) => {
            compilation.hooks.processAssets.tap({
                name: PLUGIN_NAME,
                stage: webpack_1.default.Compilation.PROCESS_ASSETS_STAGE_ADDITIONAL,
            }, () => {
                const moduleInfo = this.collectModuleInfo(compilation);
                this.emitClientManifest(compilation, moduleInfo.clientModules);
            });
        });
    }
    collectModuleInfo(compilation) {
        const clientModules = new Map();
        const serverModules = new Map();
        const normalizedAppDir = this.appDir.replace(/\\/g, '/').toLowerCase();
        for (const mod of compilation.modules) {
            const normalMod = mod;
            const resource = normalMod.resource;
            if (!resource)
                continue;
            if (!/\.(tsx?|jsx?)$/i.test(resource))
                continue;
            const normalizedResource = resource.replace(/\\/g, '/').toLowerCase();
            if (!normalizedResource.includes(normalizedAppDir))
                continue;
            const buildInfo = normalMod.buildInfo;
            const rscInfo = buildInfo?.rsc;
            if (!rscInfo)
                continue;
            const moduleId = compilation.chunkGraph.getModuleId(normalMod);
            const moduleInfo = {
                moduleId: moduleId ?? resource,
                absolutePath: resource,
                relativePath: path_1.default.relative(this.appDir, resource).replace(/\\/g, '/'),
                exports: ['default'],
            };
            if (rscInfo.isClientRef) {
                clientModules.set(resource, moduleInfo);
            }
            else {
                serverModules.set(resource, moduleInfo);
            }
        }
        if (this.dev && process.env.VISTA_DEBUG) {
            console.log(`[Vista Flight Plugin] Found ${clientModules.size} client, ${serverModules.size} server modules`);
        }
        return { clientModules, serverModules };
    }
    emitClientManifest(compilation, clientModules) {
        const manifest = {
            clientModules: {},
            pathToId: {},
        };
        const stableEntries = Array.from(clientModules.entries()).sort((a, b) => a[1].relativePath.localeCompare(b[1].relativePath));
        for (const [, info] of stableEntries) {
            const componentId = (0, component_identity_1.createComponentId)('client', info.relativePath);
            manifest.clientModules[componentId] = {
                id: info.moduleId,
                chunks: ['client.js'],
                name: 'default',
                path: info.relativePath,
            };
            manifest.pathToId[info.relativePath] = componentId;
        }
        const jsSource = `// Vista Client Reference Manifest
(function() {
  if (typeof window !== 'undefined') {
    window.${constants_1.CLIENT_MANIFEST_FLAG} = ${JSON.stringify(manifest, null, 2)};
  }
})();`;
        compilation.emitAsset('vista-client-manifest.js', new webpack_1.default.sources.RawSource(jsSource));
        if (this.dev) {
            compilation.emitAsset('vista-client-manifest.json', new webpack_1.default.sources.RawSource(JSON.stringify(manifest, null, 2)));
        }
    }
}
exports.VistaFlightPlugin = VistaFlightPlugin;
exports.default = VistaFlightPlugin;
