/**
 * Vista Error Overlay
 *
 * Standalone dev error UI with Next.js-style pagination and controls.
 */

import React from 'react';
import { SSE_ENDPOINT } from './constants';

// ============================================================================
// Types
// ============================================================================

export interface VistaError {
  type: 'build' | 'runtime' | 'hydration';
  message: string;
  stack?: string;
  file?: string;
  line?: number;
  column?: number;
  codeFrame?: string;
}

interface ErrorOverlayProps {
  errors: VistaError[];
}

// ============================================================================
// Styles + runtime helpers
// ============================================================================

const OVERLAY_STYLES = `
* { box-sizing: border-box; }
html, body {
  margin: 0;
  min-height: 100%;
  background: #0c0d10;
  color: #e8ebf1;
  font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
}
body {
  line-height: 1.45;
}
.vista-error-page-root {
  min-height: 100vh;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  overflow: hidden;
}
.vista-error-page-root[data-embedded='true'] {
  position: fixed;
  inset: 0;
  z-index: 2147483646;
}
.vista-error-backdrop {
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at top, rgba(255, 89, 60, 0.22), rgba(10, 11, 15, 0.94) 44%);
  backdrop-filter: blur(5px);
}
.vista-error-panel {
  position: relative;
  width: min(980px, 100%);
  max-height: min(86vh, 860px);
  display: flex;
  flex-direction: column;
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: linear-gradient(180deg, rgba(24, 27, 33, 0.97), rgba(9, 11, 15, 0.98));
  box-shadow: 0 34px 92px rgba(0, 0, 0, 0.54);
  animation: vista-overlay-in 170ms ease;
}
.vista-error-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 14px;
  padding: 15px 17px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.12);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0));
}
.vista-error-head-left {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.vista-error-top-row {
  display: flex;
  align-items: center;
  gap: 10px;
}
.vista-error-badge {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  height: 24px;
  padding: 0 10px;
  border-radius: 999px;
  border: 1px solid rgba(248, 113, 113, 0.48);
  background: rgba(248, 113, 113, 0.14);
  color: #fecaca;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  white-space: nowrap;
}
.vista-error-badge-dot {
  width: 7px;
  height: 7px;
  border-radius: 999px;
  background: #f87171;
  box-shadow: 0 0 0 3px rgba(248, 113, 113, 0.24);
}
.vista-error-pagination {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 2px 3px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  background: rgba(255, 255, 255, 0.04);
}
.vista-error-page-btn {
  width: 22px;
  height: 22px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.13);
  color: #f8fafc;
  font-size: 11px;
  line-height: 1;
  cursor: pointer;
}
.vista-error-page-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}
.vista-error-page-btn:not(:disabled):hover {
  background: rgba(255, 255, 255, 0.24);
}
.vista-error-page-count {
  min-width: 56px;
  text-align: center;
  font-size: 11px;
  font-weight: 630;
  color: rgba(241, 245, 249, 0.95);
  font-variant-numeric: tabular-nums;
}
.vista-error-title {
  margin: 0;
  font-size: 18px;
  line-height: 1.32;
  font-weight: 640;
  color: #f8fafc;
  letter-spacing: 0.01em;
  word-break: break-word;
}
.vista-error-meta {
  margin: 0;
  font-size: 12px;
  color: rgba(226, 232, 240, 0.72);
}
.vista-error-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}
.vista-error-btn {
  width: 30px;
  height: 30px;
  padding: 0;
  border-radius: 9px;
  border: 1px solid rgba(255, 255, 255, 0.22);
  background: rgba(255, 255, 255, 0.04);
  color: #e2e8f0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 120ms ease;
}
.vista-error-btn:hover {
  background: rgba(255, 255, 255, 0.12);
  border-color: rgba(255, 255, 255, 0.38);
}
.vista-error-btn svg {
  width: 14px;
  height: 14px;
  display: block;
}
.vista-error-btn:focus-visible,
.vista-error-page-btn:focus-visible,
.vista-error-location:focus-visible {
  outline: 2px solid rgba(255, 255, 255, 0.7);
  outline-offset: 2px;
}
.vista-error-body {
  padding: 16px 17px 17px;
  overflow: auto;
  display: grid;
  grid-template-columns: 1fr;
  gap: 11px;
}
.vista-error-card {
  border: 1px solid rgba(255, 255, 255, 0.11);
  border-radius: 11px;
  background: rgba(255, 255, 255, 0.03);
  padding: 12px;
}
.vista-error-card-title {
  margin: 0 0 8px;
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-weight: 700;
  color: rgba(226, 232, 240, 0.76);
}
.vista-error-pre {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
  font-size: 12.5px;
  line-height: 1.58;
  color: #f1f5f9;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
}
.vista-error-tok-error { color: #fca5a5; font-weight: 640; }
.vista-error-tok-path { color: #93c5fd; }
.vista-error-tok-string { color: #86efac; }
.vista-error-tok-stack { color: #cbd5e1; }
.vista-error-tok-line { color: #fbbf24; }
.vista-error-tok-caret { color: #f87171; font-weight: 700; }
.vista-error-location {
  width: 100%;
  display: inline-flex;
  align-items: center;
  justify-content: flex-start;
  border: 1px solid rgba(255, 255, 255, 0.16);
  background: rgba(255, 255, 255, 0.04);
  color: #93c5fd;
  border-radius: 8px;
  padding: 8px 10px;
  font-size: 12px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  cursor: pointer;
}
.vista-error-location:hover {
  background: rgba(255, 255, 255, 0.1);
}
.vista-error-page-root[data-minimized='true'] .vista-error-backdrop,
.vista-error-page-root[data-minimized='true'] .vista-error-panel {
  display: none;
}
.vista-error-minimized-trigger {
  position: fixed;
  left: 28px;
  bottom: 22px;
  z-index: 2147483647;
  height: 40px;
  border-radius: 999px;
  border: 1px solid rgba(248, 113, 113, 0.9);
  background: rgba(53, 11, 16, 0.95);
  color: #fecaca;
  box-shadow: 0 10px 24px rgba(248, 113, 113, 0.24);
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 0 10px;
  cursor: pointer;
}
.vista-error-minimized-trigger[hidden] {
  display: none;
}
.vista-error-minimized-logo {
  width: 14px;
  height: 14px;
  display: block;
}
.vista-error-minimized-close {
  font-size: 12px;
  line-height: 1;
  color: #fca5a5;
}
.vista-error-minimized-count {
  font-size: 11px;
  font-weight: 670;
  font-variant-numeric: tabular-nums;
}
@keyframes vista-overlay-in {
  from { opacity: 0; transform: translateY(6px) scale(0.99); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
@media (max-width: 860px) {
  .vista-error-page-root { padding: 12px; }
  .vista-error-header { flex-direction: column; }
  .vista-error-controls { width: 100%; justify-content: flex-end; }
  .vista-error-title { font-size: 16px; }
  .vista-error-minimized-trigger { left: 16px; bottom: 14px; }
}
`;

const OVERLAY_SCRIPT = `
function vistaReload() {
  window.location.reload();
}

function vistaOpenInEditor(file, line, column) {
  if (!file) return;
  var normalized = String(file).replace(/\\\\/g, '/');
  var lineNum = Number(line || 1);
  var colNum = Number(column || 1);
  window.location.href = 'vscode://file/' + normalized + ':' + lineNum + ':' + colNum;
}

function vistaCopyText(value) {
  var text = String(value || '');
  if (!text) return;
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).catch(function () {});
    return;
  }
  var textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  textarea.style.pointerEvents = 'none';
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  try {
    document.execCommand('copy');
  } catch (e) {}
  document.body.removeChild(textarea);
}
`;

// ============================================================================
// Helpers
// ============================================================================

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function escapeForInlineScript(text: string): string {
  return text.replace(/<\/script/gi, '<\\/script');
}

function colorizeLineHtml(line: string): string {
  let escaped = escapeHtml(line);

  if (/^\s*\^+/.test(line)) {
    return `<span class="vista-error-tok-caret">${escaped}</span>`;
  }
  if (/^\s*at\s+/.test(line)) {
    return `<span class="vista-error-tok-stack">${escaped}</span>`;
  }

  const numbered = escaped.match(/^(\s*\d+)(\s*\|)(.*)$/);
  if (numbered) {
    escaped = `<span class="vista-error-tok-line">${numbered[1]}</span>${numbered[2]}${numbered[3]}`;
  }

  escaped = escaped.replace(
    /((?:[A-Za-z]:)?[\\/\w.@%:-]+\.(?:tsx?|jsx?|mjs|cjs|css|json|mdx?)(?::\d+(?::\d+)?)?)/g,
    '<span class="vista-error-tok-path">$1</span>'
  );
  escaped = escaped.replace(
    /(&quot;[^&]+&quot;|&#039;[^&]+&#039;|`[^`]+`)/g,
    '<span class="vista-error-tok-string">$1</span>'
  );
  escaped = escaped.replace(
    /(TypeError:|ReferenceError:|SyntaxError:|Error:|Cannot find module|Module not found|Build Error|Runtime Error|Hydration Error)/g,
    '<span class="vista-error-tok-error">$1</span>'
  );

  return escaped;
}

function colorizeBlockHtml(value: string): string {
  return String(value || '')
    .split(/\r?\n/)
    .map((line) => colorizeLineHtml(line))
    .join('\n');
}

function parseStackTrace(stack: string): string[] {
  if (!stack) return [];
  return stack
    .split('\n')
    .map((line) => line.trimEnd())
    .filter((line) => line.trim().length > 0);
}

function normalizeError(error: VistaError | null | undefined): VistaError {
  return {
    type:
      error?.type === 'build' || error?.type === 'hydration' || error?.type === 'runtime'
        ? error.type
        : 'runtime',
    message: typeof error?.message === 'string' ? error.message : 'Unknown Error',
    stack: typeof error?.stack === 'string' ? error.stack : undefined,
    file: typeof error?.file === 'string' ? error.file : undefined,
    line: typeof error?.line === 'number' ? error.line : undefined,
    column: typeof error?.column === 'number' ? error.column : undefined,
    codeFrame: typeof error?.codeFrame === 'string' ? error.codeFrame : undefined,
  };
}

function normalizeErrors(errors: VistaError[]): VistaError[] {
  if (!Array.isArray(errors) || errors.length === 0) {
    return [
      {
        type: 'runtime',
        message: 'Unknown Error',
      },
    ];
  }

  return errors.map((error) => normalizeError(error));
}

function getErrorTypeLabel(type: VistaError['type']): string {
  if (type === 'build') return 'Build Error';
  if (type === 'hydration') return 'Hydration Error';
  return 'Runtime Error';
}

function getErrorTitle(message: string, fallback: string): string {
  const lines = message
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const title = lines[0] || fallback;
  return title.length > 140 ? `${title.slice(0, 137)}...` : title;
}

function formatLocation(error: VistaError): string {
  if (!error.file) return '';
  const normalized = error.file.replace(/\\/g, '/');
  if (!error.line) return normalized;
  return `${normalized}:${error.line}${error.column ? `:${error.column}` : ''}`;
}

function serializeErrorForCopy(error: VistaError): string {
  const label = getErrorTypeLabel(error.type);
  const parts = [label, '', error.message || 'Unknown Error'];

  if (error.file) {
    parts.push('');
    parts.push(`File: ${formatLocation(error)}`);
  }

  if (error.codeFrame) {
    parts.push('');
    parts.push('Code Frame:');
    parts.push(error.codeFrame);
  }

  if (error.stack) {
    parts.push('');
    parts.push('Stack Trace:');
    parts.push(error.stack);
  }

  return parts.join('\n');
}

function openInEditorFromBrowser(file?: string, line?: number, column?: number): void {
  if (typeof window === 'undefined' || !file) return;
  const normalized = file.replace(/\\/g, '/');
  const lineNum = line || 1;
  const colNum = column || 1;
  window.location.href = `vscode://file/${normalized}:${lineNum}:${colNum}`;
}

function copyTextInBrowser(value: string): void {
  if (typeof window === 'undefined') return;
  const text = String(value || '');
  if (!text) return;

  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(text).catch(() => {});
    return;
  }

  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  textarea.style.pointerEvents = 'none';
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  try {
    document.execCommand('copy');
  } catch {
    // no-op
  }
  document.body.removeChild(textarea);
}

// ============================================================================
// Full-page HTML renderer (used directly by engines)
// ============================================================================

/**
 * Render a full HTML error page.
 * Engines should send this directly: `res.status(500).send(renderErrorHTML(...))`.
 */
export function renderErrorHTML(errors: VistaError[]): string {
  const normalizedErrors = normalizeErrors(errors);
  const firstError = normalizedErrors[0];

  const firstLabel = getErrorTypeLabel(firstError.type);
  const firstTitle = getErrorTitle(firstError.message || 'Unknown Error', firstLabel);
  const firstLocation = formatLocation(firstError);
  const firstStack = parseStackTrace(firstError.stack || '').join('\n');
  const firstCode = firstError.codeFrame || '';
  const firstMessageHtml = colorizeBlockHtml(firstError.message || 'Unknown Error');
  const firstCodeHtml = colorizeBlockHtml(firstCode);
  const firstStackHtml = colorizeBlockHtml(firstStack);

  const serializedErrors = escapeForInlineScript(JSON.stringify(normalizedErrors));

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Error - Vista</title>
  <style>${OVERLAY_STYLES}</style>
  <script>${OVERLAY_SCRIPT}</script>
  <script>
    // Vista live-reload: auto-refresh error overlay when files change.
    (function() {
      function connect() {
        var es = new EventSource('${SSE_ENDPOINT}');
        es.onmessage = function(e) {
          if (e.data && e.data !== 'connected') {
            window.location.reload();
          }
        };
        es.onerror = function() {
          es.close();
          setTimeout(connect, 1500);
        };
      }
      connect();
    })();

    (function() {
      var errors = ${serializedErrors};
      if (!Array.isArray(errors) || errors.length === 0) {
        errors = [{ type: 'runtime', message: 'Unknown Error' }];
      }

      var state = { index: 0, errors: errors };
      var typeNode;
      var titleNode;
      var metaNode;
      var messageNode;
      var locationWrap;
      var locationText;
      var locationButton;
      var codeWrap;
      var codeNode;
      var stackWrap;
      var stackNode;
      var paginationNode;
      var countNode;
      var prevButton;
      var nextButton;
      var copyButton;
      var rootNode;
      var panelNode;
      var backdropNode;
      var minimizedTrigger;
      var minimizedCount;

      function getLabel(type) {
        if (type === 'build') return 'Build Error';
        if (type === 'hydration') return 'Hydration Error';
        return 'Runtime Error';
      }

      function getTitle(message, fallback) {
        var lines = String(message || '')
          .split(/\\r?\\n/)
          .map(function(line) { return line.trim(); })
          .filter(function(line) { return line.length > 0; });
        var title = lines.length ? lines[0] : fallback;
        return title.length > 140 ? title.slice(0, 137) + '...' : title;
      }

      function pad2(value) {
        return value < 10 ? '0' + value : String(value);
      }

      function formatTimeNow() {
        var now = new Date();
        return pad2(now.getHours()) + ':' + pad2(now.getMinutes()) + ':' + pad2(now.getSeconds());
      }

      function currentError() {
        if (!state.errors || state.errors.length === 0) return null;
        var idx = state.index;
        if (idx < 0) idx = 0;
        if (idx > state.errors.length - 1) idx = state.errors.length - 1;
        return state.errors[idx];
      }

      function formatLocation(error) {
        if (!error || !error.file) return '';
        var file = String(error.file).replace(/\\\\/g, '/');
        var line = Number(error.line || 0);
        var column = Number(error.column || 0);
        if (!line) return file;
        return file + ':' + line + (column ? ':' + column : '');
      }

      function escapeHtml(value) {
        return String(value || '')
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/\"/g, '&quot;')
          .replace(/'/g, '&#039;');
      }

      function colorizeLine(line) {
        var escaped = escapeHtml(line);

        if (/^\\s*\\^+/.test(line)) {
          return '<span class=\"vista-error-tok-caret\">' + escaped + '</span>';
        }
        if (/^\\s*at\\s+/.test(line)) {
          return '<span class=\"vista-error-tok-stack\">' + escaped + '</span>';
        }

        var numbered = escaped.match(/^(\\s*\\d+)(\\s*\\|)(.*)$/);
        if (numbered) {
          escaped =
            '<span class=\"vista-error-tok-line\">' + numbered[1] + '</span>' + numbered[2] + numbered[3];
        }

        escaped = escaped.replace(
          /((?:[A-Za-z]:)?[\\\\/\\w.@%:-]+\\.(?:tsx?|jsx?|mjs|cjs|css|json|mdx?)(?::\\d+(?::\\d+)?)?)/g,
          '<span class=\"vista-error-tok-path\">$1</span>'
        );
        escaped = escaped.replace(
          /(&quot;[^&]+&quot;|&#039;[^&]+&#039;)/g,
          '<span class=\"vista-error-tok-string\">$1</span>'
        );
        escaped = escaped.replace(
          /(TypeError:|ReferenceError:|SyntaxError:|Error:|Cannot find module|Module not found|Build Error|Runtime Error|Hydration Error)/g,
          '<span class=\"vista-error-tok-error\">$1</span>'
        );
        return escaped;
      }

      function colorizeBlock(value) {
        return String(value || '')
          .split(/\\r?\\n/)
          .map(function(line) {
            return colorizeLine(line);
          })
          .join('\\n');
      }

      function minimizeOverlay() {
        if (!rootNode) return;
        rootNode.setAttribute('data-minimized', 'true');
        if (minimizedTrigger) minimizedTrigger.hidden = false;
        var indicator = window.__VISTA_DEVTOOLS_INDICATOR__;
        if (indicator && typeof indicator.setError === 'function') {
          indicator.setError('runtime-error', state.errors.length);
        }
      }

      function restoreOverlay() {
        if (!rootNode) return;
        rootNode.removeAttribute('data-minimized');
        if (minimizedTrigger) minimizedTrigger.hidden = true;
        var indicator = window.__VISTA_DEVTOOLS_INDICATOR__;
        if (indicator && typeof indicator.clearError === 'function') {
          indicator.clearError();
        }
      }

      function render() {
        var error = currentError();
        if (!error) return;

        var label = getLabel(error.type);
        var message = typeof error.message === 'string' ? error.message : String(error.message || 'Unknown Error');
        var title = getTitle(message, label);
        var location = formatLocation(error);
        var codeFrame = typeof error.codeFrame === 'string' ? error.codeFrame : '';
        var stack = typeof error.stack === 'string' ? error.stack.trim() : '';

        if (typeNode) typeNode.textContent = label;
        if (titleNode) titleNode.textContent = title;
        if (metaNode) {
          metaNode.textContent =
            'Vista Dev Overlay | ' + formatTimeNow() + ' | ' + (state.index + 1) + ' of ' + state.errors.length;
        }
        if (messageNode) messageNode.innerHTML = colorizeBlock(message);

        if (locationWrap) locationWrap.hidden = location.length === 0;
        if (locationText) locationText.textContent = location;

        if (codeWrap) codeWrap.hidden = codeFrame.trim().length === 0;
        if (codeNode) codeNode.innerHTML = colorizeBlock(codeFrame);

        if (stackWrap) stackWrap.hidden = stack.length === 0;
        if (stackNode) stackNode.innerHTML = colorizeBlock(stack);

        if (paginationNode) paginationNode.hidden = state.errors.length <= 1;
        if (countNode) countNode.textContent = (state.index + 1) + ' / ' + state.errors.length;
        if (prevButton) prevButton.disabled = state.index <= 0;
        if (nextButton) nextButton.disabled = state.index >= state.errors.length - 1;
        if (minimizedCount) minimizedCount.textContent = String(state.errors.length);
      }

      function changeIndex(offset) {
        var next = state.index + offset;
        if (next < 0 || next > state.errors.length - 1) return;
        state.index = next;
        render();
      }

      function bind() {
        rootNode = document.querySelector('[data-vista-error-root]');
        panelNode = document.querySelector('[data-vista-error-panel]');
        backdropNode = document.querySelector('[data-vista-error-backdrop]');
        typeNode = document.querySelector('[data-vista-error-type]');
        titleNode = document.querySelector('[data-vista-error-title]');
        metaNode = document.querySelector('[data-vista-error-meta]');
        messageNode = document.querySelector('[data-vista-error-message]');
        locationWrap = document.querySelector('[data-vista-location-wrap]');
        locationText = document.querySelector('[data-vista-location-text]');
        locationButton = document.querySelector('[data-vista-location-trigger]');
        codeWrap = document.querySelector('[data-vista-code-wrap]');
        codeNode = document.querySelector('[data-vista-code]');
        stackWrap = document.querySelector('[data-vista-stack-wrap]');
        stackNode = document.querySelector('[data-vista-stack]');
        paginationNode = document.querySelector('[data-vista-pagination]');
        countNode = document.querySelector('[data-vista-count]');
        prevButton = document.querySelector('[data-vista-prev-btn]');
        nextButton = document.querySelector('[data-vista-next-btn]');
        copyButton = document.querySelector('[data-vista-copy-btn]');
        minimizedTrigger = document.querySelector('[data-vista-minimized-trigger]');
        minimizedCount = document.querySelector('[data-vista-minimized-count]');

        if (prevButton) {
          prevButton.addEventListener('click', function() { changeIndex(-1); });
        }

        if (nextButton) {
          nextButton.addEventListener('click', function() { changeIndex(1); });
        }

        if (copyButton) {
          copyButton.addEventListener('click', function() {
            var error = currentError();
            if (!error) return;
            var label = getLabel(error.type);
            var message = typeof error.message === 'string' ? error.message : String(error.message || 'Unknown Error');
            var text = label + '\\n\\n' + message;
            var location = formatLocation(error);
            if (location) text += '\\n\\nFile: ' + location;
            if (error.codeFrame) text += '\\n\\nCode Frame:\\n' + error.codeFrame;
            if (error.stack) text += '\\n\\nStack Trace:\\n' + error.stack;
            vistaCopyText(text);
          });
        }

        if (locationButton) {
          locationButton.addEventListener('click', function() {
            var error = currentError();
            if (!error || !error.file) return;
            vistaOpenInEditor(error.file, Number(error.line || 1), Number(error.column || 1));
          });
        }

        if (backdropNode) {
          backdropNode.addEventListener('click', function() {
            minimizeOverlay();
          });
        }

        if (panelNode) {
          panelNode.addEventListener('click', function(event) {
            event.stopPropagation();
          });
        }

        if (minimizedTrigger) {
          minimizedTrigger.addEventListener('click', function() {
            restoreOverlay();
          });
        }

        document.addEventListener('keydown', function(event) {
          if (event.key === 'ArrowLeft') {
            changeIndex(-1);
          } else if (event.key === 'ArrowRight') {
            changeIndex(1);
          } else if (event.key === 'Escape') {
            minimizeOverlay();
          }
        });
      }

      document.addEventListener('DOMContentLoaded', function() {
        bind();
        render();
      });
    })();
  </script>
</head>
<body>
  <div class="vista-error-page-root" data-vista-error-root>
    <div class="vista-error-backdrop" data-vista-error-backdrop></div>
    <section class="vista-error-panel" data-vista-error-panel role="dialog" aria-label="Vista Error Overlay" aria-modal="true">
      <header class="vista-error-header">
        <div class="vista-error-head-left">
          <div class="vista-error-top-row">
            <span class="vista-error-badge" data-vista-error-type>
              <span class="vista-error-badge-dot"></span>${escapeHtml(firstLabel)}
            </span>
            <div class="vista-error-pagination" data-vista-pagination${normalizedErrors.length <= 1 ? ' hidden' : ''}>
              <button type="button" class="vista-error-page-btn" data-vista-prev-btn aria-label="Previous error">&lt;</button>
              <span class="vista-error-page-count" data-vista-count>1 / ${normalizedErrors.length}</span>
              <button type="button" class="vista-error-page-btn" data-vista-next-btn aria-label="Next error">&gt;</button>
            </div>
          </div>
          <h2 class="vista-error-title" data-vista-error-title>${escapeHtml(firstTitle)}</h2>
          <p class="vista-error-meta" data-vista-error-meta>Vista Dev Overlay</p>
        </div>
        <div class="vista-error-controls">
          <button type="button" class="vista-error-btn" data-vista-copy-btn aria-label="Copy error">
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"><rect x="9" y="9" width="10" height="10" rx="2" stroke="currentColor" stroke-width="2"/><rect x="5" y="5" width="10" height="10" rx="2" stroke="currentColor" stroke-width="2"/></svg>
          </button>
          <button type="button" class="vista-error-btn" onclick="vistaReload()" aria-label="Reload page">
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"><path d="M20 12a8 8 0 1 1-2.34-5.66" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M20 4V10H14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </button>
        </div>
      </header>

      <div class="vista-error-body">
        <section class="vista-error-card" data-vista-location-wrap${firstLocation ? '' : ' hidden'}>
          <h3 class="vista-error-card-title">Location</h3>
          <button type="button" class="vista-error-location" data-vista-location-trigger>
            <span data-vista-location-text>${escapeHtml(firstLocation)}</span>
          </button>
        </section>

        <section class="vista-error-card">
          <h3 class="vista-error-card-title">Message</h3>
          <pre class="vista-error-pre" data-vista-error-message>${firstMessageHtml}</pre>
        </section>

        <section class="vista-error-card" data-vista-code-wrap${firstCode ? '' : ' hidden'}>
          <h3 class="vista-error-card-title">Code Frame</h3>
          <pre class="vista-error-pre" data-vista-code>${firstCodeHtml}</pre>
        </section>

        <section class="vista-error-card" data-vista-stack-wrap${firstStack ? '' : ' hidden'}>
          <h3 class="vista-error-card-title">Stack Trace</h3>
          <pre class="vista-error-pre" data-vista-stack>${firstStackHtml}</pre>
        </section>
      </div>
    </section>
    <button type="button" class="vista-error-minimized-trigger" data-vista-minimized-trigger hidden aria-label="Reopen error overlay">
      <svg class="vista-error-minimized-logo" viewBox="0 0 168 177" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M81.872 176.988L-2.01405e-06 -2.68173e-06H30.5816L83.5576 121.604L136.774 -2.68173e-06H167.115L85.484 176.988H81.872Z" fill="white"/></svg>
      <span class="vista-error-minimized-close">×</span>
      <span class="vista-error-minimized-count" data-vista-minimized-count>${normalizedErrors.length}</span>
    </button>
  </div>
</body>
</html>`;
}

// ============================================================================
// React Component (kept for DevErrorBoundary + backwards compat)
// ============================================================================

export function ErrorOverlay({ errors }: ErrorOverlayProps): React.ReactElement {
  const normalizedErrors = React.useMemo(() => normalizeErrors(errors), [errors]);
  const [activeIndex, setActiveIndex] = React.useState(0);
  const [isMinimized, setIsMinimized] = React.useState(false);

  React.useEffect(() => {
    if (activeIndex > normalizedErrors.length - 1) {
      setActiveIndex(0);
    }
  }, [activeIndex, normalizedErrors.length]);

  const currentIndex = Math.max(0, Math.min(activeIndex, normalizedErrors.length - 1));
  const error = normalizedErrors[currentIndex];

  if (!error) {
    return <div />;
  }

  const label = getErrorTypeLabel(error.type);
  const title = getErrorTitle(error.message || 'Unknown Error', label);
  const location = formatLocation(error);
  const stackText = parseStackTrace(error.stack || '').join('\n');
  const codeFrame = error.codeFrame || '';
  const messageHtml = colorizeBlockHtml(error.message || 'Unknown Error');
  const codeHtml = colorizeBlockHtml(codeFrame);
  const stackHtml = colorizeBlockHtml(stackText);

  const minimizeOverlay = React.useCallback(() => {
    setIsMinimized(true);
    if (typeof window !== 'undefined') {
      const indicator = (window as any).__VISTA_DEVTOOLS_INDICATOR__;
      if (indicator && typeof indicator.setError === 'function') {
        indicator.setError(title || 'Error', normalizedErrors.length);
      }
    }
  }, [normalizedErrors.length, title]);

  const restoreOverlay = React.useCallback(() => {
    setIsMinimized(false);
    if (typeof window !== 'undefined') {
      const indicator = (window as any).__VISTA_DEVTOOLS_INDICATOR__;
      if (indicator && typeof indicator.clearError === 'function') {
        indicator.clearError();
      }
    }
  }, []);

  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        minimizeOverlay();
      } else if (event.key === 'ArrowLeft') {
        setActiveIndex((idx) => Math.max(0, idx - 1));
      } else if (event.key === 'ArrowRight') {
        setActiveIndex((idx) => Math.min(normalizedErrors.length - 1, idx + 1));
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [minimizeOverlay, normalizedErrors.length]);

  return (
    <div className="vista-error-page-root" data-embedded="true" data-minimized={isMinimized ? 'true' : undefined}>
      <style>{OVERLAY_STYLES}</style>
      <div className="vista-error-backdrop" onClick={minimizeOverlay} />
      <section
        className="vista-error-panel"
        role="dialog"
        aria-label="Vista Error Overlay"
        aria-modal
        onClick={(event) => event.stopPropagation()}
      >
        <header className="vista-error-header">
          <div className="vista-error-head-left">
            <div className="vista-error-top-row">
              <span className="vista-error-badge">
                <span className="vista-error-badge-dot" />
                {label}
              </span>
              {normalizedErrors.length > 1 ? (
                <div className="vista-error-pagination">
                  <button
                    type="button"
                    className="vista-error-page-btn"
                    onClick={() => setActiveIndex((idx) => Math.max(0, idx - 1))}
                    disabled={currentIndex === 0}
                    aria-label="Previous error"
                  >
                    {'<'}
                  </button>
                  <span className="vista-error-page-count">
                    {currentIndex + 1} / {normalizedErrors.length}
                  </span>
                  <button
                    type="button"
                    className="vista-error-page-btn"
                    onClick={() => setActiveIndex((idx) => Math.min(normalizedErrors.length - 1, idx + 1))}
                    disabled={currentIndex >= normalizedErrors.length - 1}
                    aria-label="Next error"
                  >
                    {'>'}
                  </button>
                </div>
              ) : null}
            </div>
            <h2 className="vista-error-title">{title}</h2>
            <p className="vista-error-meta">Vista Dev Overlay</p>
          </div>
          <div className="vista-error-controls">
            <button
              type="button"
              className="vista-error-btn"
              onClick={() => copyTextInBrowser(serializeErrorForCopy(error))}
              aria-label="Copy error"
            >
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
                <rect x="9" y="9" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="2" />
                <rect x="5" y="5" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="2" />
              </svg>
            </button>
            <button
              type="button"
              className="vista-error-btn"
              onClick={() => {
                if (typeof window !== 'undefined') {
                  window.location.reload();
                }
              }}
              aria-label="Reload page"
            >
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 12a8 8 0 1 1-2.34-5.66" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <path d="M20 4V10H14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </header>

        <div className="vista-error-body">
          {location ? (
            <section className="vista-error-card">
              <h3 className="vista-error-card-title">Location</h3>
              <button
                type="button"
                className="vista-error-location"
                onClick={() => openInEditorFromBrowser(error.file, error.line, error.column)}
              >
                {location}
              </button>
            </section>
          ) : null}

          <section className="vista-error-card">
            <h3 className="vista-error-card-title">Message</h3>
            <pre className="vista-error-pre" dangerouslySetInnerHTML={{ __html: messageHtml }} />
          </section>

          {codeFrame ? (
            <section className="vista-error-card">
              <h3 className="vista-error-card-title">Code Frame</h3>
              <pre className="vista-error-pre" dangerouslySetInnerHTML={{ __html: codeHtml }} />
            </section>
          ) : null}

          {stackText ? (
            <section className="vista-error-card">
              <h3 className="vista-error-card-title">Stack Trace</h3>
              <pre className="vista-error-pre" dangerouslySetInnerHTML={{ __html: stackHtml }} />
            </section>
          ) : null}
        </div>
      </section>
      {isMinimized ? (
        <button
          type="button"
          className="vista-error-minimized-trigger"
          onClick={restoreOverlay}
          aria-label="Reopen error overlay"
        >
          <svg
            className="vista-error-minimized-logo"
            viewBox="0 0 168 177"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M81.872 176.988L-2.01405e-06 -2.68173e-06H30.5816L83.5576 121.604L136.774 -2.68173e-06H167.115L85.484 176.988H81.872Z"
              fill="white"
            />
          </svg>
          <span className="vista-error-minimized-close">×</span>
          <span className="vista-error-minimized-count">{normalizedErrors.length}</span>
        </button>
      ) : null}
    </div>
  );
}

// ============================================================================
// Error Boundary (client-side)
// ============================================================================

export class DevErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError && this.state.error) {
      return (
        <ErrorOverlay
          errors={[
            {
              type: 'runtime',
              message: this.state.error.message || 'Unknown Error',
              stack: this.state.error.stack,
            },
          ]}
        />
      );
    }
    return this.props.children;
  }
}

// Re-exports for backwards compatibility
export { ErrorOverlay as VistaErrorOverlay };
export { DevErrorBoundary as VistaDevErrorBoundary };
