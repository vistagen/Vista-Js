/**
 * Vista Dev Server Logger
 *
 * Beautiful, clean terminal output — inspired by Next.js.
 * Shows ASCII banner, port/network info, request logs with timing,
 * and compilation status.
 */
export interface ServerReadyInfo {
    port: number;
    mode: 'legacy' | 'rsc';
    rscFlight?: boolean;
}
/**
 * Print the Vista ASCII banner + server info box.
 */
export declare function printServerReady(info: ServerReadyInfo): void;
/**
 * Log an HTTP request — called from the request logger middleware.
 */
export declare function logRequest(method: string, url: string, statusCode: number, durationMs: number): void;
/**
 * Log a compilation event.
 */
export declare function logCompiling(page?: string): void;
/**
 * Log compilation complete.
 */
export declare function logCompiled(durationMs: number, page?: string): void;
/**
 * Log a compilation warning.
 */
export declare function logWarning(message: string): void;
/**
 * Log a compilation error.
 */
export declare function logError(message: string): void;
/**
 * Log informational message (dimmed).
 */
export declare function logInfo(message: string): void;
/**
 * Log a notable event (HMR reload, etc.)
 */
export declare function logEvent(message: string): void;
/**
 * Express middleware that logs requests with timing.
 * Add this early in the middleware chain.
 */
export declare function requestLogger(): (req: any, res: any, next: any) => void;
export declare function markStartTime(): void;
