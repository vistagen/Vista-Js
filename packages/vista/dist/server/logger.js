"use strict";
/**
 * Vista Dev Server Logger
 *
 * Beautiful, clean terminal output — inspired by Next.js.
 * Shows ASCII banner, port/network info, request logs with timing,
 * and compilation status.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.printServerReady = printServerReady;
exports.logRequest = logRequest;
exports.logCompiling = logCompiling;
exports.logCompiled = logCompiled;
exports.logWarning = logWarning;
exports.logError = logError;
exports.logInfo = logInfo;
exports.logEvent = logEvent;
exports.requestLogger = requestLogger;
exports.markStartTime = markStartTime;
const os_1 = __importDefault(require("os"));
// ─── ANSI Colors ───────────────────────────────────────────────────────────
const bold = (s) => `\x1b[1m${s}\x1b[22m`;
const dim = (s) => `\x1b[2m${s}\x1b[22m`;
const green = (s) => `\x1b[32m${s}\x1b[39m`;
const cyan = (s) => `\x1b[36m${s}\x1b[39m`;
const yellow = (s) => `\x1b[33m${s}\x1b[39m`;
const red = (s) => `\x1b[31m${s}\x1b[39m`;
const magenta = (s) => `\x1b[35m${s}\x1b[39m`;
const gray = (s) => `\x1b[90m${s}\x1b[39m`;
const white = (s) => `\x1b[97m${s}\x1b[39m`;
const bgGreen = (s) => `\x1b[42m\x1b[30m${s}\x1b[49m\x1b[39m`;
const bgCyan = (s) => `\x1b[46m\x1b[30m${s}\x1b[49m\x1b[39m`;
// ─── ASCII Banner ──────────────────────────────────────────────────────────
const VISTA_BANNER = `
 ${bold(cyan('██╗   ██╗██╗███████╗████████╗ █████╗         ██╗███████╗'))}
 ${bold(cyan('██║   ██║██║██╔════╝╚══██╔══╝██╔══██╗        ██║██╔════╝'))}
 ${bold(cyan('██║   ██║██║███████╗   ██║   ███████║        ██║███████╗'))}
 ${bold(cyan('╚██╗ ██╔╝██║╚════██║   ██║   ██╔══██║   ██  ██║╚════██║'))}
 ${bold(cyan(' ╚████╔╝ ██║███████║   ██║   ██║  ██║██ ╚█████╔╝███████║'))}
 ${bold(cyan('  ╚═══╝  ╚═╝╚══════╝   ╚═╝   ╚═╝  ╚═╝╚═╝ ╚════╝ ╚══════╝'))}
`;
// ─── Network Utils ─────────────────────────────────────────────────────────
function getNetworkAddress() {
    const interfaces = os_1.default.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name] || []) {
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return null;
}
// ─── Timing Formatter ──────────────────────────────────────────────────────
function formatDuration(ms) {
    if (ms < 1)
        return `${(ms * 1000).toFixed(0)}µs`;
    if (ms < 1000)
        return `${Math.round(ms)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
}
function getMethodColor(method) {
    switch (method.toUpperCase()) {
        case 'GET':
            return green;
        case 'POST':
            return cyan;
        case 'PUT':
            return yellow;
        case 'PATCH':
            return yellow;
        case 'DELETE':
            return red;
        default:
            return white;
    }
}
function getStatusColor(status) {
    if (status >= 500)
        return red;
    if (status >= 400)
        return yellow;
    if (status >= 300)
        return cyan;
    if (status >= 200)
        return green;
    return white;
}
/**
 * Print the Vista ASCII banner + server info box.
 */
function printServerReady(info) {
    const { port, mode } = info;
    const networkAddr = getNetworkAddress();
    const localUrl = `http://localhost:${port}`;
    const networkUrl = networkAddr ? `http://${networkAddr}:${port}` : null;
    console.log(VISTA_BANNER);
    console.log(`  ${green('▼')} ${bold('Vista.Js')} ${dim(`v${getVistaVersion()}`)}`);
    console.log('');
    console.log(`  ${dim('┃')} ${bold('Local:')}        ${cyan(localUrl)}`);
    if (networkUrl) {
        console.log(`  ${dim('┃')} ${bold('Network:')}      ${cyan(networkUrl)}`);
    }
    console.log(`  ${dim('┃')} ${bold('Mode:')}         ${mode === 'rsc' ? magenta('RSC (React Server Components)') : green('SSR')}`);
    if (mode === 'rsc' && info.rscFlight !== undefined) {
        console.log(`  ${dim('┃')} ${bold('Flight SSR:')}   ${info.rscFlight ? green('Enabled (streaming)') : yellow('Disabled')}`);
    }
    console.log('');
    console.log(`  ${dim(`Ready in ${formatDuration(getStartupTime())}`)}`);
    console.log('');
}
/**
 * Log an HTTP request — called from the request logger middleware.
 */
function logRequest(method, url, statusCode, durationMs) {
    // Skip noisy internal requests
    if (isInternalRequest(url))
        return;
    const methodStr = getMethodColor(method)(method.padEnd(7));
    const statusStr = getStatusColor(statusCode)(String(statusCode));
    const urlStr = url.length > 60 ? url.substring(0, 57) + '...' : url;
    const timeStr = dim(formatDuration(durationMs));
    console.log(` ${methodStr} ${urlStr} ${statusStr} ${timeStr}`);
}
/**
 * Log a compilation event.
 */
function logCompiling(page) {
    const target = page ? ` ${page}` : '';
    process.stdout.write(` ${yellow('○')} Compiling${target} ...`);
}
/**
 * Log compilation complete.
 */
function logCompiled(durationMs, page) {
    const target = page ? ` ${page}` : '';
    // \r to overwrite the "Compiling..." line
    console.log(`\r ${green('✓')} Compiled${target} ${dim(`in ${formatDuration(durationMs)}`)}`);
}
/**
 * Log a compilation warning.
 */
function logWarning(message) {
    console.log(` ${yellow('⚠')} ${message}`);
}
/**
 * Log a compilation error.
 */
function logError(message) {
    console.log(` ${red('✗')} ${message}`);
}
/**
 * Log informational message (dimmed).
 */
function logInfo(message) {
    console.log(` ${dim('○')} ${dim(message)}`);
}
/**
 * Log a notable event (HMR reload, etc.)
 */
function logEvent(message) {
    console.log(` ${green('●')} ${message}`);
}
// ─── Express Middleware ────────────────────────────────────────────────────
/**
 * Express middleware that logs requests with timing.
 * Add this early in the middleware chain.
 */
function requestLogger() {
    return (req, res, next) => {
        const start = performance.now();
        // Hook into response finish
        const originalEnd = res.end;
        res.end = function (...args) {
            const duration = performance.now() - start;
            logRequest(req.method, req.originalUrl || req.url, res.statusCode, duration);
            return originalEnd.apply(this, args);
        };
        next();
    };
}
// ─── Internal Helpers ──────────────────────────────────────────────────────
// Track startup time
let _startTime = Date.now();
function markStartTime() {
    _startTime = Date.now();
}
function getStartupTime() {
    return Date.now() - _startTime;
}
function getVistaVersion() {
    try {
        const pkg = require('../../package.json');
        return pkg.version || '0.1.0';
    }
    catch {
        return '0.1.0';
    }
}
const INTERNAL_PREFIXES = [
    '/__webpack',
    '/__vista',
    '/_vista/static/',
    '/favicon.ico',
    '/_next',
    '/hot-update',
    '/.hot-update',
    '/rsc',
];
// Static asset extensions that should be suppressed from dev logs
const STATIC_EXTENSIONS = [
    '.js',
    '.css',
    '.map',
    '.svg',
    '.png',
    '.jpg',
    '.jpeg',
    '.gif',
    '.ico',
    '.woff',
    '.woff2',
    '.ttf',
    '.eot',
];
function isInternalRequest(url) {
    if (INTERNAL_PREFIXES.some((prefix) => url.startsWith(prefix)))
        return true;
    // Hide static asset requests (e.g. /styles.css, /vista.svg)
    const pathname = url.split('?')[0];
    return STATIC_EXTENSIONS.some((ext) => pathname.endsWith(ext));
}
