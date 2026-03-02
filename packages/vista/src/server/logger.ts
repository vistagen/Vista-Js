/**
 * Vista Dev Server Logger
 *
 * Beautiful, clean terminal output — inspired by Next.js.
 * Shows ASCII banner, port/network info, request logs with timing,
 * and compilation status.
 */

import os from 'os';

// ─── ANSI Colors ───────────────────────────────────────────────────────────

const bold = (s: string) => `\x1b[1m${s}\x1b[22m`;
const dim = (s: string) => `\x1b[2m${s}\x1b[22m`;
const green = (s: string) => `\x1b[32m${s}\x1b[39m`;
const cyan = (s: string) => `\x1b[36m${s}\x1b[39m`;
const yellow = (s: string) => `\x1b[33m${s}\x1b[39m`;
const red = (s: string) => `\x1b[31m${s}\x1b[39m`;
const magenta = (s: string) => `\x1b[35m${s}\x1b[39m`;
const gray = (s: string) => `\x1b[90m${s}\x1b[39m`;
const white = (s: string) => `\x1b[97m${s}\x1b[39m`;
const bgGreen = (s: string) => `\x1b[42m\x1b[30m${s}\x1b[49m\x1b[39m`;
const bgCyan = (s: string) => `\x1b[46m\x1b[30m${s}\x1b[49m\x1b[39m`;

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

function getNetworkAddress(): string | null {
  const interfaces = os.networkInterfaces();
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

function formatDuration(ms: number): string {
  if (ms < 1) return `${(ms * 1000).toFixed(0)}µs`;
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

function getMethodColor(method: string): (s: string) => string {
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

function getStatusColor(status: number): (s: string) => string {
  if (status >= 500) return red;
  if (status >= 400) return yellow;
  if (status >= 300) return cyan;
  if (status >= 200) return green;
  return white;
}

// ─── Public API ────────────────────────────────────────────────────────────

export interface ServerReadyInfo {
  port: number;
  mode: 'legacy' | 'rsc';
  rscFlight?: boolean;
}

/**
 * Print the Vista ASCII banner + server info box.
 */
export function printServerReady(info: ServerReadyInfo): void {
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
  console.log(
    `  ${dim('┃')} ${bold('Mode:')}         ${mode === 'rsc' ? magenta('RSC (React Server Components)') : green('SSR')}`
  );
  if (mode === 'rsc' && info.rscFlight !== undefined) {
    console.log(
      `  ${dim('┃')} ${bold('Flight SSR:')}   ${info.rscFlight ? green('Enabled (streaming)') : yellow('Disabled')}`
    );
  }
  console.log('');
  console.log(`  ${dim(`Ready in ${formatDuration(getStartupTime())}`)}`);
  console.log('');
}

/**
 * Log an HTTP request — called from the request logger middleware.
 */
export function logRequest(
  method: string,
  url: string,
  statusCode: number,
  durationMs: number
): void {
  // Skip noisy internal requests
  if (isInternalRequest(url)) return;

  const methodStr = getMethodColor(method)(method.padEnd(7));
  const statusStr = getStatusColor(statusCode)(String(statusCode));
  const urlStr = url.length > 60 ? url.substring(0, 57) + '...' : url;
  const timeStr = dim(formatDuration(durationMs));

  console.log(` ${methodStr} ${urlStr} ${statusStr} ${timeStr}`);
}

/**
 * Log a compilation event.
 */
export function logCompiling(page?: string): void {
  const target = page ? ` ${page}` : '';
  process.stdout.write(` ${yellow('○')} Compiling${target} ...`);
}

/**
 * Log compilation complete.
 */
export function logCompiled(durationMs: number, page?: string): void {
  const target = page ? ` ${page}` : '';
  // \r to overwrite the "Compiling..." line
  console.log(`\r ${green('✓')} Compiled${target} ${dim(`in ${formatDuration(durationMs)}`)}`);
}

/**
 * Log a compilation warning.
 */
export function logWarning(message: string): void {
  console.log(` ${yellow('⚠')} ${message}`);
}

/**
 * Log a compilation error.
 */
export function logError(message: string): void {
  console.log(` ${red('✗')} ${message}`);
}

/**
 * Log informational message (dimmed).
 */
export function logInfo(message: string): void {
  console.log(` ${dim('○')} ${dim(message)}`);
}

/**
 * Log a notable event (HMR reload, etc.)
 */
export function logEvent(message: string): void {
  console.log(` ${green('●')} ${message}`);
}

// ─── Express Middleware ────────────────────────────────────────────────────

/**
 * Express middleware that logs requests with timing.
 * Add this early in the middleware chain.
 */
export function requestLogger() {
  return (req: any, res: any, next: any) => {
    const start = performance.now();

    // Hook into response finish
    const originalEnd = res.end;
    res.end = function (...args: any[]) {
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
export function markStartTime(): void {
  _startTime = Date.now();
}

function getStartupTime(): number {
  return Date.now() - _startTime;
}

function getVistaVersion(): string {
  try {
    const pkg = require('../../package.json');
    return pkg.version || '0.1.0';
  } catch {
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

function isInternalRequest(url: string): boolean {
  if (INTERNAL_PREFIXES.some((prefix) => url.startsWith(prefix))) return true;
  // Hide static asset requests (e.g. /styles.css, /vista.svg)
  const pathname = url.split('?')[0];
  return STATIC_EXTENSIONS.some((ext) => pathname.endsWith(ext));
}
