"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDevErrorOverlayBootstrapSource = getDevErrorOverlayBootstrapSource;
/**
 * Returns a JS snippet that installs the Vista dev error overlay.
 * It supports Next.js-style error pagination and indicator restore.
 */
function getDevErrorOverlayBootstrapSource() {
    return String.raw `
(function installVistaDevErrorOverlay() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  if (window.__VISTA_DEV_ERROR_OVERLAY__) return;

  var STYLE_ID = '__vista-dev-error-overlay-style';
  var ROOT_ID = '__vista-dev-error-overlay';
  var root = null;
  var messageNode = null;
  var titleNode = null;
  var metaNode = null;
  var filesWrapNode = null;
  var filesNode = null;
  var hintsWrapNode = null;
  var hintsNode = null;
  var copyButton = null;
  var minimizeButton = null;
  var reloadButton = null;
  var paginationNode = null;
  var prevButton = null;
  var nextButton = null;
  var countNode = null;
  var listenersBound = false;
  var state = {
    open: false,
    minimized: false,
    entries: [],
    activeIndex: 0,
  };

  function getIndicator() {
    return window.__VISTA_DEVTOOLS_INDICATOR__;
  }

  function pad2(value) {
    return value < 10 ? '0' + value : String(value);
  }

  function formatTime(date) {
    return pad2(date.getHours()) + ':' + pad2(date.getMinutes()) + ':' + pad2(date.getSeconds());
  }

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function highlightLine(line) {
    var escaped = escapeHtml(line);
    if (/^\s*\^+/.test(line)) {
      return '<span class="vista-ov-tok-caret">' + escaped + '</span>';
    }
    if (/^\s*at\s+/.test(line)) {
      return '<span class="vista-ov-tok-stack">' + escaped + '</span>';
    }

    var numbered = escaped.match(/^(\s*\d+)(\s*\|)(.*)$/);
    if (numbered) {
      escaped =
        '<span class="vista-ov-tok-line">' + numbered[1] + '</span>' + numbered[2] + numbered[3];
    }

    escaped = escaped.replace(
      /((?:[A-Za-z]:)?[\\/\w.@%:-]+\.(?:tsx?|jsx?|mjs|cjs|css|json|mdx?)(?::\d+(?::\d+)?)?)/g,
      '<span class="vista-ov-tok-path">$1</span>'
    );
    escaped = escaped.replace(
      /(&quot;[^&]+&quot;|&#039;[^&]+&#039;)/g,
      '<span class="vista-ov-tok-string">$1</span>'
    );
    escaped = escaped.replace(
      /(TypeError:|ReferenceError:|SyntaxError:|Error:|Cannot find module|Module not found|Build Error|Runtime Error|Hydration Error)/g,
      '<span class="vista-ov-tok-error">$1</span>'
    );
    return escaped;
  }

  function colorizeBlock(value) {
    return String(value || '')
      .split(/\r?\n/)
      .map(function (line) {
        return highlightLine(line);
      })
      .join('\n');
  }

  function createStyle() {
    if (document.getElementById(STYLE_ID)) return;
    var style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = [
      '#' + ROOT_ID + '{position:fixed;inset:0;z-index:2147482500;display:flex;align-items:center;justify-content:center;padding:26px;}',
      '#' + ROOT_ID + '[hidden]{display:none;}',
      '#' + ROOT_ID + ' .vista-ov-backdrop{position:absolute;inset:0;background:radial-gradient(circle at top, rgba(255,90,60,0.22), rgba(7,8,11,0.93) 42%);backdrop-filter:blur(5px);}',
      '#' + ROOT_ID + ' .vista-ov-panel{position:relative;width:min(980px,100%);max-height:min(86vh,860px);display:flex;flex-direction:column;overflow:hidden;border-radius:15px;border:1px solid rgba(255,255,255,0.14);background:linear-gradient(180deg, rgba(25,27,32,0.97), rgba(10,12,15,0.98));box-shadow:0 32px 90px rgba(0,0,0,0.54);color:#e8ebf1;font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;animation:vista-ov-in 170ms ease;}',
      '#' + ROOT_ID + ' .vista-ov-header{display:flex;justify-content:space-between;gap:14px;align-items:flex-start;padding:15px 17px;border-bottom:1px solid rgba(255,255,255,0.12);background:linear-gradient(180deg, rgba(255,255,255,0.045), rgba(255,255,255,0));}',
      '#' + ROOT_ID + ' .vista-ov-head-left{min-width:0;display:flex;flex-direction:column;gap:8px;}',
      '#' + ROOT_ID + ' .vista-ov-top{display:flex;align-items:center;gap:10px;}',
      '#' + ROOT_ID + ' .vista-ov-badge{display:inline-flex;align-items:center;gap:7px;height:24px;padding:0 10px;border-radius:999px;border:1px solid rgba(248,113,113,0.5);background:rgba(248,113,113,0.14);font-size:11px;font-weight:700;letter-spacing:0.07em;text-transform:uppercase;color:#fecaca;white-space:nowrap;}',
      '#' + ROOT_ID + ' .vista-ov-badge-dot{width:7px;height:7px;border-radius:999px;background:#f87171;box-shadow:0 0 0 3px rgba(248,113,113,0.24);}',
      '#' + ROOT_ID + ' .vista-ov-pagination{display:inline-flex;align-items:center;gap:6px;padding:2px 3px;border-radius:999px;border:1px solid rgba(255,255,255,0.18);background:rgba(255,255,255,0.04);}',
      '#' + ROOT_ID + ' .vista-ov-page-btn{width:22px;height:22px;display:inline-flex;align-items:center;justify-content:center;border:none;border-radius:999px;background:rgba(255,255,255,0.13);color:#f8fafc;font-size:11px;line-height:1;cursor:pointer;}',
      '#' + ROOT_ID + ' .vista-ov-page-btn:disabled{opacity:0.35;cursor:not-allowed;}',
      '#' + ROOT_ID + ' .vista-ov-page-btn:not(:disabled):hover{background:rgba(255,255,255,0.22);}',
      '#' + ROOT_ID + ' .vista-ov-page-count{font-size:11px;font-weight:630;color:rgba(241,245,249,0.95);min-width:56px;text-align:center;font-variant-numeric:tabular-nums;}',
      '#' + ROOT_ID + ' .vista-ov-title{margin:0;font-size:18px;line-height:1.33;font-weight:640;letter-spacing:0.01em;color:#f8fafc;word-break:break-word;}',
      '#' + ROOT_ID + ' .vista-ov-meta{margin:0;font-size:12px;color:rgba(226,232,240,0.72);}',
      '#' + ROOT_ID + ' .vista-ov-controls{display:flex;gap:8px;align-items:center;}',
      '#' + ROOT_ID + ' .vista-ov-btn{width:30px;height:30px;padding:0;border-radius:9px;border:1px solid rgba(255,255,255,0.22);background:rgba(255,255,255,0.04);color:#e2e8f0;display:inline-flex;align-items:center;justify-content:center;cursor:pointer;transition:all 120ms ease;}',
      '#' + ROOT_ID + ' .vista-ov-btn:hover{background:rgba(255,255,255,0.12);border-color:rgba(255,255,255,0.38);}',
      '#' + ROOT_ID + ' .vista-ov-btn svg{width:14px;height:14px;display:block;}',
      '#' + ROOT_ID + ' .vista-ov-btn:focus-visible{outline:2px solid rgba(255,255,255,0.68);outline-offset:2px;}',
      '#' + ROOT_ID + ' .vista-ov-btn[data-variant="warn"]{border-color:rgba(248,113,113,0.48);color:#fecaca;background:rgba(248,113,113,0.1);}',
      '#' + ROOT_ID + ' .vista-ov-body{padding:16px 17px 17px;overflow:auto;display:grid;grid-template-columns:1fr;gap:11px;}',
      '#' + ROOT_ID + ' .vista-ov-section{border:1px solid rgba(255,255,255,0.11);border-radius:11px;background:rgba(255,255,255,0.03);padding:12px 12px;}',
      '#' + ROOT_ID + ' .vista-ov-section-title{margin:0 0 8px;font-size:11px;letter-spacing:0.08em;text-transform:uppercase;font-weight:700;color:rgba(226,232,240,0.76);}',
      '#' + ROOT_ID + ' .vista-ov-list{margin:0;padding-left:18px;display:grid;gap:6px;color:#e2e8f0;font-size:13px;line-height:1.44;}',
      '#' + ROOT_ID + ' .vista-ov-list code{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:12px;background:rgba(255,255,255,0.06);padding:1px 5px;border-radius:5px;border:1px solid rgba(255,255,255,0.16);}',
      '#' + ROOT_ID + ' .vista-ov-pre{margin:0;font-size:12.5px;line-height:1.58;color:#f1f5f9;white-space:pre-wrap;word-break:break-word;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;}',
      '#' + ROOT_ID + ' .vista-ov-tok-error{color:#fca5a5;font-weight:640;}',
      '#' + ROOT_ID + ' .vista-ov-tok-path{color:#93c5fd;}',
      '#' + ROOT_ID + ' .vista-ov-tok-string{color:#86efac;}',
      '#' + ROOT_ID + ' .vista-ov-tok-stack{color:#cbd5e1;}',
      '#' + ROOT_ID + ' .vista-ov-tok-line{color:#fbbf24;}',
      '#' + ROOT_ID + ' .vista-ov-tok-caret{color:#f87171;font-weight:700;}',
      '@keyframes vista-ov-in{from{opacity:0;transform:translateY(6px) scale(0.99);}to{opacity:1;transform:translateY(0) scale(1);}}',
      '@media (max-width: 860px){',
      '  #' + ROOT_ID + '{padding:12px;}',
      '  #' + ROOT_ID + ' .vista-ov-header{flex-direction:column;}',
      '  #' + ROOT_ID + ' .vista-ov-controls{width:100%;justify-content:flex-end;}',
      '  #' + ROOT_ID + ' .vista-ov-title{font-size:16px;}',
      '}',
    ].join('');
    document.head.appendChild(style);
  }

  function ensureMounted() {
    createStyle();
    if (!root) {
      root = document.getElementById(ROOT_ID);
    }
    if (!root) {
      root = document.createElement('div');
      root.id = ROOT_ID;
      root.hidden = true;
      root.innerHTML = [
        '<div class="vista-ov-backdrop"></div>',
        '<section class="vista-ov-panel" role="dialog" aria-modal="true" aria-label="Vista build error overlay">',
        '  <header class="vista-ov-header">',
        '    <div class="vista-ov-head-left">',
        '      <div class="vista-ov-top">',
        '        <span class="vista-ov-badge"><span class="vista-ov-badge-dot"></span>Build Error</span>',
        '        <div class="vista-ov-pagination" data-vista-pagination hidden>',
        '          <button type="button" class="vista-ov-page-btn" data-vista-prev aria-label="Previous error">&lt;</button>',
        '          <span class="vista-ov-page-count" data-vista-count>1 / 1</span>',
        '          <button type="button" class="vista-ov-page-btn" data-vista-next aria-label="Next error">&gt;</button>',
        '        </div>',
        '      </div>',
        '      <h2 class="vista-ov-title" data-vista-ov-title>Build Error</h2>',
        '      <p class="vista-ov-meta" data-vista-ov-meta></p>',
        '    </div>',
        '    <div class="vista-ov-controls">',
        '      <button type="button" class="vista-ov-btn" data-vista-copy aria-label="Copy error">',
        '        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"><rect x="9" y="9" width="10" height="10" rx="2" stroke="currentColor" stroke-width="2"/><rect x="5" y="5" width="10" height="10" rx="2" stroke="currentColor" stroke-width="2"/></svg>',
        '      </button>',
        '      <button type="button" class="vista-ov-btn" data-vista-minimize aria-label="Minimize">',
        '        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"><path d="M5 12H19" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
        '      </button>',
        '      <button type="button" class="vista-ov-btn" data-vista-reload aria-label="Reload">',
        '        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"><path d="M20 11A8 8 0 1 0 12 20" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M20 4V11H13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
        '      </button>',
        '    </div>',
        '  </header>',
        '  <div class="vista-ov-body">',
        '    <section class="vista-ov-section" data-vista-hints-wrap hidden>',
        '      <h3 class="vista-ov-section-title">Insights</h3>',
        '      <ul class="vista-ov-list" data-vista-hints></ul>',
        '    </section>',
        '    <section class="vista-ov-section" data-vista-files-wrap hidden>',
        '      <h3 class="vista-ov-section-title">Possible Files</h3>',
        '      <ul class="vista-ov-list" data-vista-files></ul>',
        '    </section>',
        '    <section class="vista-ov-section">',
        '      <h3 class="vista-ov-section-title">Message</h3>',
        '      <pre class="vista-ov-pre" data-vista-message></pre>',
        '    </section>',
        '  </div>',
        '</section>',
      ].join('');
      document.body.appendChild(root);
    } else if (!root.isConnected && document.body) {
      document.body.appendChild(root);
    }

    var backdrop = root.querySelector('.vista-ov-backdrop');
    messageNode = root.querySelector('[data-vista-message]');
    titleNode = root.querySelector('[data-vista-ov-title]');
    metaNode = root.querySelector('[data-vista-ov-meta]');
    filesWrapNode = root.querySelector('[data-vista-files-wrap]');
    filesNode = root.querySelector('[data-vista-files]');
    hintsWrapNode = root.querySelector('[data-vista-hints-wrap]');
    hintsNode = root.querySelector('[data-vista-hints]');
    copyButton = root.querySelector('[data-vista-copy]');
    minimizeButton = root.querySelector('[data-vista-minimize]');
    reloadButton = root.querySelector('[data-vista-reload]');
    paginationNode = root.querySelector('[data-vista-pagination]');
    prevButton = root.querySelector('[data-vista-prev]');
    nextButton = root.querySelector('[data-vista-next]');
    countNode = root.querySelector('[data-vista-count]');

    if (listenersBound) return;
    listenersBound = true;

    if (copyButton) {
      copyButton.addEventListener('click', function () {
        copyCurrentMessage();
      });
    }
    if (minimizeButton) {
      minimizeButton.addEventListener('click', function () {
        minimize();
      });
    }
    if (reloadButton) {
      reloadButton.addEventListener('click', function () {
        reloadPage();
      });
    }
    if (prevButton) {
      prevButton.addEventListener('click', function () {
        moveActiveIndex(-1);
      });
    }
    if (nextButton) {
      nextButton.addEventListener('click', function () {
        moveActiveIndex(1);
      });
    }
    if (backdrop) {
      backdrop.addEventListener('click', function () {
        minimize();
      });
    }
    if (root) {
      root.addEventListener('keydown', function (event) {
        if (event.key === 'ArrowLeft') {
          moveActiveIndex(-1);
        } else if (event.key === 'ArrowRight') {
          moveActiveIndex(1);
        } else if (event.key === 'Escape') {
          minimize();
        }
      });
    }
  }

  function normalizeMessages(input) {
    if (Array.isArray(input)) {
      return input
        .map(function (entry) {
          return typeof entry === 'string' ? entry : String(entry || '');
        })
        .filter(function (entry) {
          return entry.trim().length > 0;
        });
    }

    if (input && typeof input === 'object' && Array.isArray(input.errors)) {
      return normalizeMessages(input.errors);
    }

    var raw = typeof input === 'string' ? input : String(input || '');
    if (raw.trim().length === 0) {
      return [];
    }

    var splitByWebpack = raw.split(/\n(?=ERROR in\s)/g).filter(function (entry) {
      return entry.trim().length > 0;
    });
    if (splitByWebpack.length > 1) {
      return splitByWebpack;
    }
    return [raw];
  }

  function parseMessage(input) {
    var raw = typeof input === 'string' ? input : String(input || 'Unknown build error.');
    var lines = raw.split(/\r?\n/);
    var trimmedLines = [];
    for (var i = 0; i < lines.length; i += 1) {
      var entry = lines[i] ? lines[i].trim() : '';
      if (entry.length > 0) {
        trimmedLines.push(entry);
      }
    }

    var title = trimmedLines.length ? trimmedLines[0] : 'Build Error';
    if (title.length > 140) {
      title = title.slice(0, 137) + '...';
    }

    var files = [];
    var filePattern = /(?:[A-Za-z]:)?[\\/\w.@-]+\.(?:tsx?|jsx?|mjs|cjs|css|json|mdx?)(?::\d+(?::\d+)?)?/;
    for (var fileIdx = 0; fileIdx < lines.length; fileIdx += 1) {
      var maybeFile = lines[fileIdx].match(filePattern);
      if (!maybeFile) continue;
      var normalized = maybeFile[0].replace(/\\/g, '/');
      if (files.indexOf(normalized) === -1) {
        files.push(normalized);
      }
      if (files.length >= 5) break;
    }

    var hints = [];
    if (/['"]use client['"]/.test(raw)) {
      hints.push("Client hook detected in a Server Component. Add 'use client' to the top of that file.");
    }
    if (/Cannot find module/i.test(raw) || /Module not found/i.test(raw)) {
      hints.push('A module import failed to resolve. Check the import path or install the missing package.');
    }
    if (/Unexpected token/i.test(raw) || /SyntaxError/i.test(raw)) {
      hints.push('A syntax issue is blocking compilation. Start from the first highlighted file and fix parsing errors.');
    }
    if (/Type error/i.test(raw) || /TS\d{3,5}/i.test(raw)) {
      hints.push('TypeScript validation failed. Fix the first type error first to reduce cascading issues.');
    }
    if (/Structure Validation Failed/i.test(raw)) {
      hints.push('App structure rules failed. Verify route files, layout/page naming, and required conventions.');
    }
    if (hints.length === 0 && files.length > 0) {
      hints.push('Start with the first file above, then re-run after each fix.');
    }
    if (hints.length === 0) {
      hints.push('Resolve the top-most failure first, then reload to see remaining issues.');
    }

    return {
      raw: raw,
      title: title,
      files: files,
      hints: hints,
      timestamp: new Date(),
    };
  }

  function fillList(node, values, wrapNode) {
    if (!node || !wrapNode) return;
    while (node.firstChild) node.removeChild(node.firstChild);
    if (!values || values.length === 0) {
      wrapNode.hidden = true;
      return;
    }
    for (var i = 0; i < values.length; i += 1) {
      var item = document.createElement('li');
      var code = document.createElement('code');
      code.textContent = values[i];
      item.appendChild(code);
      node.appendChild(item);
    }
    wrapNode.hidden = false;
  }

  function fillHints(node, values, wrapNode) {
    if (!node || !wrapNode) return;
    while (node.firstChild) node.removeChild(node.firstChild);
    if (!values || values.length === 0) {
      wrapNode.hidden = true;
      return;
    }
    for (var i = 0; i < values.length; i += 1) {
      var item = document.createElement('li');
      item.textContent = values[i];
      node.appendChild(item);
    }
    wrapNode.hidden = false;
  }

  function currentEntry() {
    if (!state.entries || state.entries.length === 0) return null;
    var index = state.activeIndex;
    if (index < 0) index = 0;
    if (index > state.entries.length - 1) index = state.entries.length - 1;
    return state.entries[index];
  }

  function updatePagination() {
    var total = state.entries.length;
    var current = total === 0 ? 0 : state.activeIndex + 1;
    if (countNode) {
      countNode.textContent = current + ' / ' + (total || 1);
    }
    if (paginationNode) {
      paginationNode.hidden = total <= 1;
    }
    if (prevButton) {
      prevButton.disabled = state.activeIndex <= 0;
    }
    if (nextButton) {
      nextButton.disabled = state.activeIndex >= total - 1;
    }
  }

  function renderCurrent() {
    var parsed = currentEntry();
    if (!parsed || !root) return;
    if (titleNode) titleNode.textContent = parsed.title || 'Build Error';
    if (metaNode) {
      metaNode.textContent =
        'Vista Dev Overlay | ' +
        formatTime(parsed.timestamp) +
        ' | ' +
        (state.activeIndex + 1) +
        ' of ' +
        state.entries.length;
    }
    if (messageNode) messageNode.innerHTML = colorizeBlock(parsed.raw);
    fillList(filesNode, parsed.files, filesWrapNode);
    fillHints(hintsNode, parsed.hints, hintsWrapNode);
    updatePagination();
  }

  function moveActiveIndex(offset) {
    if (!state.entries || state.entries.length <= 1) return;
    var next = state.activeIndex + offset;
    if (next < 0 || next >= state.entries.length) return;
    state.activeIndex = next;
    renderCurrent();
  }

  function copyCurrentMessage() {
    var entry = currentEntry();
    if (!entry) return;
    var text = entry.raw;
    if (navigator && navigator.clipboard && navigator.clipboard.writeText) {
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

  function reloadPage() {
    if (typeof window === 'undefined') return;
    window.location.reload();
  }

  function openFromState() {
    ensureMounted();
    if (!state.entries || state.entries.length === 0) return false;
    state.open = true;
    state.minimized = false;
    renderCurrent();
    if (root) root.hidden = false;
    var indicator = getIndicator();
    if (indicator && typeof indicator.clearError === 'function') {
      indicator.clearError();
    }
    return true;
  }

  function show(input) {
    ensureMounted();
    var messages = normalizeMessages(input);
    if (messages.length === 0) {
      return;
    }
    state.entries = messages.map(function (message) {
      return parseMessage(message);
    });
    state.activeIndex = 0;
    openFromState();
  }

  function capture(input) {
    ensureMounted();
    var messages = normalizeMessages(input);
    if (messages.length === 0) {
      return;
    }
    state.entries = messages.map(function (message) {
      return parseMessage(message);
    });
    state.activeIndex = 0;
    state.open = false;
    state.minimized = true;
    if (root) root.hidden = true;
    var entry = currentEntry();
    var indicator = getIndicator();
    if (indicator && typeof indicator.setError === 'function') {
      indicator.setError(entry ? entry.title || 'Build error' : 'Build error', state.entries.length);
    }
  }

  function minimize() {
    var entry = currentEntry();
    if (!entry) return false;
    ensureMounted();
    state.open = false;
    state.minimized = true;
    if (root) root.hidden = true;
    var indicator = getIndicator();
    if (indicator && typeof indicator.setError === 'function') {
      indicator.setError(entry.title || 'Build error', state.entries.length);
    }
    return true;
  }

  function clear() {
    state.open = false;
    state.minimized = false;
    state.entries = [];
    state.activeIndex = 0;
    if (root) root.hidden = true;
    var indicator = getIndicator();
    if (indicator && typeof indicator.clearError === 'function') {
      indicator.clearError();
    }
  }

  function restoreFromIndicator() {
    if (!state.minimized || !state.entries || state.entries.length === 0) return false;
    return openFromState();
  }

  window.__VISTA_DEV_ERROR_OVERLAY__ = {
    show: show,
    capture: capture,
    minimize: minimize,
    clear: clear,
    restoreFromIndicator: restoreFromIndicator,
    isOpen: function () {
      return state.open;
    },
    hasError: function () {
      return state.entries && state.entries.length > 0;
    },
  };
})();
`;
}
