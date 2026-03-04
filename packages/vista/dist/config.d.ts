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
    react?: any;
    server?: {
        port?: number;
    };
    validation?: {
        structure?: StructureValidationConfig;
    };
    experimental?: ExperimentalConfig;
}
export declare const defaultStructureValidationConfig: Required<StructureValidationConfig>;
export declare const defaultTypedApiConfig: Required<TypedApiExperimentalConfig>;
export declare const defaultConfig: VistaConfig;
/**
 * Resolve the effective structure validation config merging user overrides.
 */
export declare function resolveStructureValidationConfig(config: VistaConfig): Required<StructureValidationConfig>;
export type ResolvedTypedApiConfig = Required<TypedApiExperimentalConfig>;
/**
 * Resolve and sanitize experimental typed API config.
 */
export declare function resolveTypedApiConfig(config: VistaConfig): ResolvedTypedApiConfig;
export declare function loadConfig(cwd?: string): VistaConfig;
