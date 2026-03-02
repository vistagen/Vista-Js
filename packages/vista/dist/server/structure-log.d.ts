/**
 * Vista Structure Validation Logger
 *
 * Standardized terminal output for validation lifecycle with
 * [vista:validate] prefix. Supports compact and verbose modes.
 */
import type { StructureValidationResult } from './structure-validator';
import type { ValidationLogLevel } from '../config';
/**
 * Log a full validation result to the console.
 */
export declare function logValidationResult(result: StructureValidationResult, logLevel?: ValidationLogLevel): void;
/**
 * Log a dev-mode blocking message.
 */
export declare function logDevBlocked(): void;
/**
 * Log when the dev server unblocks after recovery.
 */
export declare function logDevUnblocked(): void;
/**
 * Log watcher start.
 */
export declare function logWatcherStart(): void;
/**
 * Format issues as a plain-text block for SSE / overlay transport.
 */
export declare function formatIssuesForOverlay(result: StructureValidationResult, includeWarnings?: boolean): string;
/**
 * Format a compact build-fail table for CI/terminal output.
 */
export declare function formatBuildFailTable(result: StructureValidationResult): string;
