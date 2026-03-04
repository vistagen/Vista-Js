import path from 'path';
import fs from 'fs';
import { ImageConfig } from './image/image-config';

export type ValidationMode = 'strict' | 'warn';
export type ValidationLogLevel = 'compact' | 'verbose';
export type TypedApiSerialization = 'json' | 'superjson';

export interface StructureValidationConfig {
  /** Enable structure validation. Default: true */
  enabled?: boolean;
  /** Validation mode. 'strict' blocks dev/fails build on errors. 'warn' only logs. Default: 'strict' */
  mode?: ValidationMode;
  /** Show warnings in the dev overlay. Default: false */
  includeWarningsInOverlay?: boolean;
  /** Log output format. Default: 'compact' */
  logLevel?: ValidationLogLevel;
  /** Debounce interval for watch events in ms. Default: 120 */
  watchDebounceMs?: number;
}

export interface TypedApiExperimentalConfig {
  /** Enable typed API runtime. Default: false */
  enabled?: boolean;
  /** Request/response serialization mode. Default: 'json' */
  serialization?: TypedApiSerialization;
  /** Maximum request body size for typed API endpoints in bytes. Default: 1MB */
  bodySizeLimitBytes?: number;
}

export interface ExperimentalConfig {
  typedApi?: TypedApiExperimentalConfig;
}

export interface VistaConfig {
  images?: ImageConfig;
  // Add other future config options here suitable for user requests
  react?: any;
  server?: {
    port?: number;
  };
  validation?: {
    structure?: StructureValidationConfig;
  };
  experimental?: ExperimentalConfig;
}

export const defaultStructureValidationConfig: Required<StructureValidationConfig> = {
  enabled: true,
  mode: 'strict',
  includeWarningsInOverlay: false,
  logLevel: 'compact',
  watchDebounceMs: 120,
};

export const defaultTypedApiConfig: Required<TypedApiExperimentalConfig> = {
  enabled: false,
  serialization: 'json',
  bodySizeLimitBytes: 1024 * 1024,
};

export const defaultConfig: VistaConfig = {
  images: {},
  validation: {
    structure: { ...defaultStructureValidationConfig },
  },
  experimental: {
    typedApi: { ...defaultTypedApiConfig },
  },
};

/**
 * Resolve the effective structure validation config merging user overrides.
 */
export function resolveStructureValidationConfig(
  config: VistaConfig
): Required<StructureValidationConfig> {
  return {
    ...defaultStructureValidationConfig,
    ...(config.validation?.structure ?? {}),
  };
}

export type ResolvedTypedApiConfig = Required<TypedApiExperimentalConfig>;

/**
 * Resolve and sanitize experimental typed API config.
 */
export function resolveTypedApiConfig(config: VistaConfig): ResolvedTypedApiConfig {
  const merged = {
    ...defaultTypedApiConfig,
    ...(config.experimental?.typedApi ?? {}),
  };

  const serialization: TypedApiSerialization =
    merged.serialization === 'superjson' ? 'superjson' : 'json';
  const parsedLimit = Number(merged.bodySizeLimitBytes);
  const bodySizeLimitBytes =
    Number.isFinite(parsedLimit) && parsedLimit > 0
      ? Math.floor(parsedLimit)
      : defaultTypedApiConfig.bodySizeLimitBytes;

  return {
    enabled: Boolean(merged.enabled),
    serialization,
    bodySizeLimitBytes,
  };
}

function mergeConfig(userConfig: VistaConfig): VistaConfig {
  return {
    ...defaultConfig,
    ...userConfig,
    images: {
      ...(defaultConfig.images ?? {}),
      ...(userConfig.images ?? {}),
    },
    server: {
      ...(defaultConfig.server ?? {}),
      ...(userConfig.server ?? {}),
    },
    validation: {
      ...(defaultConfig.validation ?? {}),
      ...(userConfig.validation ?? {}),
      structure: {
        ...defaultStructureValidationConfig,
        ...(userConfig.validation?.structure ?? {}),
      },
    },
    experimental: {
      ...(defaultConfig.experimental ?? {}),
      ...(userConfig.experimental ?? {}),
      typedApi: {
        ...defaultTypedApiConfig,
        ...(userConfig.experimental?.typedApi ?? {}),
      },
    },
  };
}

export function loadConfig(cwd: string = process.cwd()): VistaConfig {
  const tsPath = path.join(cwd, 'vista.config.ts');
  const jsPath = path.join(cwd, 'vista.config.js');

  try {
    if (fs.existsSync(tsPath)) {
      // We assume ts-node is registered by engine or bin
      const mod = require(tsPath);
      return mergeConfig(mod.default || mod);
    } else if (fs.existsSync(jsPath)) {
      const mod = require(jsPath);
      return mergeConfig(mod.default || mod);
    }
  } catch (error) {
    console.error('Error loading vista.config:', error);
  }
  return mergeConfig({});
}
