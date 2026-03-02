/**
 * Vista Structure Validation Logger
 *
 * Standardized terminal output for validation lifecycle with
 * [vista:validate] prefix. Supports compact and verbose modes.
 */

import type { StructureIssue, StructureValidationResult } from './structure-validator';
import type { ValidationLogLevel } from '../config';

// ============================================================================
// ANSI Helpers
// ============================================================================

const RESET = '\x1b[0m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const GREEN = '\x1b[32m';
const CYAN = '\x1b[36m';
const DIM = '\x1b[2m';
const BOLD = '\x1b[1m';
const BG_RED = '\x1b[41m';
const BG_YELLOW = '\x1b[43m';
const WHITE = '\x1b[37m';
const BLACK = '\x1b[30m';

const PREFIX = '[vista:validate]';

// ============================================================================
// Formatting
// ============================================================================

function formatIssue(issue: StructureIssue, verbose: boolean): string {
  const icon = issue.severity === 'error' ? `${RED}✗${RESET}` : `${YELLOW}⚠${RESET}`;
  const codeTag =
    issue.severity === 'error' ? `${RED}${issue.code}${RESET}` : `${YELLOW}${issue.code}${RESET}`;

  let line = `  ${icon} ${codeTag}  ${issue.message}`;

  if (issue.filePath) {
    line += `\n    ${DIM}→ ${issue.filePath}${RESET}`;
  }

  if (issue.fix && verbose) {
    line += `\n    ${CYAN}fix:${RESET} ${issue.fix}`;
  }

  return line;
}

function formatSummary(result: StructureValidationResult): string {
  const errors = result.issues.filter((i) => i.severity === 'error');
  const warnings = result.issues.filter((i) => i.severity === 'warning');

  if (errors.length === 0 && warnings.length === 0) {
    return `${PREFIX} ${GREEN}✓ Structure valid${RESET}`;
  }

  const parts: string[] = [];
  if (errors.length > 0) parts.push(`${RED}${errors.length} error(s)${RESET}`);
  if (warnings.length > 0) parts.push(`${YELLOW}${warnings.length} warning(s)${RESET}`);

  return `${PREFIX} ${parts.join(', ')}`;
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Log a full validation result to the console.
 */
export function logValidationResult(
  result: StructureValidationResult,
  logLevel: ValidationLogLevel = 'compact'
): void {
  const verbose = logLevel === 'verbose' || !!process.env.VISTA_DEBUG_VALIDATE;

  // Summary line — only show when there are issues (or in debug mode)
  if (result.issues.length === 0) {
    if (process.env.VISTA_DEBUG) console.log(formatSummary(result));
    return;
  }
  console.log(formatSummary(result));

  // Issue lines
  const errors = result.issues.filter((i) => i.severity === 'error');
  const warnings = result.issues.filter((i) => i.severity === 'warning');

  if (errors.length > 0) {
    console.log('');
    console.log(`  ${BG_RED}${WHITE} ERRORS ${RESET}`);
    for (const issue of errors) {
      console.log(formatIssue(issue, verbose));
    }
  }

  if (warnings.length > 0) {
    console.log('');
    console.log(`  ${BG_YELLOW}${BLACK} WARNINGS ${RESET}`);
    for (const issue of warnings) {
      console.log(formatIssue(issue, verbose));
    }
  }

  console.log('');
}

/**
 * Log a dev-mode blocking message.
 */
export function logDevBlocked(): void {
  console.log(
    `${PREFIX} ${RED}${BOLD}Dev server blocked.${RESET} Fix structure errors to continue.`
  );
}

/**
 * Log when the dev server unblocks after recovery.
 */
export function logDevUnblocked(): void {
  console.log(`${PREFIX} ${GREEN}Structure errors resolved. Dev server unblocked.${RESET}`);
}

/**
 * Log watcher start.
 */
export function logWatcherStart(): void {
  if (process.env.VISTA_DEBUG) {
    console.log(`${PREFIX} ${DIM}Watching app/ for structure changes...${RESET}`);
  }
}

/**
 * Format issues as a plain-text block for SSE / overlay transport.
 */
export function formatIssuesForOverlay(
  result: StructureValidationResult,
  includeWarnings: boolean = false
): string {
  const filtered = includeWarnings
    ? result.issues
    : result.issues.filter((i) => i.severity === 'error');

  if (filtered.length === 0) return '';

  const lines = filtered.map((issue) => {
    let line = `[${issue.code}] ${issue.message}`;
    if (issue.filePath) line += `\n  → ${issue.filePath}`;
    if (issue.fix) line += `\n  fix: ${issue.fix}`;
    return line;
  });

  return lines.join('\n\n');
}

/**
 * Format a compact build-fail table for CI/terminal output.
 */
export function formatBuildFailTable(result: StructureValidationResult): string {
  const errors = result.issues.filter((i) => i.severity === 'error');
  if (errors.length === 0) return '';

  const header = `${BG_RED}${WHITE} STRUCTURE VALIDATION FAILED ${RESET}\n`;
  const rows = errors.map((e) => `  ${RED}✗${RESET} ${e.code.padEnd(35)} ${e.message}`);
  return header + rows.join('\n') + '\n';
}
