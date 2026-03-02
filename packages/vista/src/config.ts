import path from 'path';
import fs from 'fs';
import { ImageConfig } from './image/image-config';

export type ValidationMode = 'strict' | 'warn';
export type ValidationLogLevel = 'compact' | 'verbose';

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
}

export const defaultStructureValidationConfig: Required<StructureValidationConfig> = {
  enabled: true,
  mode: 'strict',
  includeWarningsInOverlay: false,
  logLevel: 'compact',
  watchDebounceMs: 120,
};

export const defaultConfig: VistaConfig = {
  images: {},
  validation: {
    structure: { ...defaultStructureValidationConfig },
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

export function loadConfig(cwd: string = process.cwd()): VistaConfig {
  const tsPath = path.join(cwd, 'vista.config.ts');
  const jsPath = path.join(cwd, 'vista.config.js');

  try {
    if (fs.existsSync(tsPath)) {
      // We assume ts-node is registered by engine or bin
      const mod = require(tsPath);
      return { ...defaultConfig, ...(mod.default || mod) };
    } else if (fs.existsSync(jsPath)) {
      const mod = require(jsPath);
      return { ...defaultConfig, ...(mod.default || mod) };
    }
  } catch (error) {
    console.error('Error loading vista.config:', error);
  }
  return defaultConfig;
}
