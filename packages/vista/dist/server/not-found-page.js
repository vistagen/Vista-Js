"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStyledNotFoundHTML = getStyledNotFoundHTML;
/**
 * Styled 404 fallback page — used when no custom not-found component exists.
 * Vista's own design: dark background with a subtle animated gradient accent.
 */
function getStyledNotFoundHTML() {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>404 — Vista</title>
  <style>
    *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
    html, body {
      height: 100%;
      overflow: hidden;
      border: none;
    }
    body {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: #0a0a0a;
      color: #ededed;
    }
    .vista-404 {
      text-align: center;
      user-select: none;
    }
    .vista-404-code {
      font-size: 6rem;
      font-weight: 800;
      letter-spacing: -0.04em;
      line-height: 1;
      background: linear-gradient(135deg, #7c3aed, #2563eb, #06b6d4);
      background-size: 200% 200%;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      animation: gradient-shift 4s ease infinite;
    }
    .vista-404-msg {
      margin-top: 0.75rem;
      font-size: 0.95rem;
      font-weight: 400;
      color: #555;
      letter-spacing: 0.02em;
    }
    .vista-404-home {
      display: inline-block;
      margin-top: 1.5rem;
      padding: 0.5rem 1.25rem;
      font-size: 0.8rem;
      font-weight: 500;
      color: #ededed;
      background: #1a1a1a;
      border: 1px solid #2a2a2a;
      border-radius: 6px;
      text-decoration: none;
      transition: background 0.2s, border-color 0.2s;
    }
    .vista-404-home:hover {
      background: #252525;
      border-color: #444;
    }
    @keyframes gradient-shift {
      0%, 100% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
    }
  </style>
</head>
<body>
  <div class="vista-404">
    <div class="vista-404-code">404</div>
    <p class="vista-404-msg">There's nothing here.</p>
    <a href="/" class="vista-404-home">Go Home</a>
  </div>
</body>
</html>`;
}
