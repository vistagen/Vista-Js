/**
 * Vista Structure Watch Service
 *
 * Watches app/, components/, and vista.config.* for file changes
 * and re-validates the structure on each batch of events.
 *
 * Emits normalized validation results that can be consumed by
 * the dev server SSE channel and build pipeline.
 */
import { EventEmitter } from 'events';
import { type StructureValidationResult } from './structure-validator';
export interface StructureWatchEvent {
    state: 'ok' | 'error';
    issues: StructureValidationResult['issues'];
    changedPaths: string[];
    timestamp: number;
}
export interface StructureWatchOptions {
    cwd: string;
    debounceMs?: number;
    notFoundRoute?: string;
}
export declare class StructureWatcher extends EventEmitter {
    private cwd;
    private debounceMs;
    private notFoundRoute;
    private watcher;
    private debounceTimer;
    private pendingChanges;
    private currentState;
    constructor(options: StructureWatchOptions);
    /**
     * Start watching. Performs an initial validation immediately.
     */
    start(): Promise<StructureValidationResult>;
    /**
     * Stop the watcher and clean up resources.
     */
    stop(): void;
    /**
     * Get the most recent validation result.
     */
    getState(): StructureValidationResult | null;
    /**
     * Update the notFoundRoute from a newly resolved root.
     */
    setNotFoundRoute(route: string | undefined): void;
    /**
     * Run validation manually (e.g. after build config change).
     */
    runValidation(): StructureValidationResult;
    private scheduleBatch;
    private flushBatch;
    private validate;
}
/**
 * Convenience factory to create and start a watcher.
 */
export declare function createStructureWatcher(options: StructureWatchOptions): Promise<{
    watcher: StructureWatcher;
    initialResult: StructureValidationResult;
}>;
