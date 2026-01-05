/**
 * Vista Error Overlay
 * 
 * A standalone error overlay that works without React hydration.
 * Uses inline styles and vanilla JS for interactivity.
 */

import React from 'react';

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
// Inline CSS (no external dependencies)
// ============================================================================

const INLINE_STYLES = `
<style>
* { box-sizing: border-box; margin: 0; padding: 0; }
body { 
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    background: #0a0a0a; 
    color: #ededed;
    min-height: 100vh;
}
.vista-error-container {
    min-height: 100vh;
    display: flex;
    align-items: flex-start;
    justify-content: center;
    padding: 40px 20px;
}
.vista-error-dialog {
    width: 100%;
    max-width: 800px;
    background: #0a0a0a;
    border: 1px solid #333;
    border-radius: 12px;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
    overflow: hidden;
}
.vista-error-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    background: #111;
    border-bottom: 1px solid #333;
}
.vista-error-badge {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 6px 12px;
    background: rgba(255, 76, 76, 0.15);
    color: #ff4c4c;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}
.vista-error-badge::before {
    content: '';
    width: 8px;
    height: 8px;
    background: #ff4c4c;
    border-radius: 50%;
    animation: pulse 2s infinite;
}
@keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
}
.vista-error-content {
    padding: 24px;
}
.vista-error-message {
    font-size: 20px;
    font-weight: 600;
    line-height: 1.5;
    margin-bottom: 20px;
    color: #fff;
}
.vista-error-location {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 16px;
    background: #111;
    border: 1px solid #333;
    border-radius: 8px;
    margin-bottom: 20px;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 13px;
}
.vista-error-location-file {
    color: #0070f3;
}
.vista-error-location-line {
    color: #888;
}
.vista-error-stack {
    background: #0d0d0d;
    border: 1px solid #333;
    border-radius: 8px;
    padding: 16px;
    overflow-x: auto;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 12px;
    line-height: 1.6;
    white-space: pre-wrap;
    word-break: break-word;
    color: #999;
    max-height: 400px;
    overflow-y: auto;
}
.vista-error-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    background: #111;
    border-top: 1px solid #333;
}
.vista-error-footer-text {
    font-size: 12px;
    color: #666;
}
.vista-error-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 10px 16px;
    background: #0070f3;
    border: none;
    border-radius: 8px;
    color: #fff;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s ease;
}
.vista-error-btn:hover {
    filter: brightness(1.1);
}
.vista-error-nav {
    display: flex;
    gap: 8px;
    align-items: center;
}
.vista-error-nav-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    background: transparent;
    border: 1px solid #333;
    border-radius: 8px;
    color: #888;
    cursor: pointer;
    transition: all 0.15s ease;
}
.vista-error-nav-btn:hover:not(:disabled) {
    background: #1a1a1a;
    color: #fff;
}
.vista-error-nav-btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
}
.vista-error-count {
    font-size: 13px;
    color: #666;
    min-width: 60px;
    text-align: center;
}
.vista-error-stack-title {
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: #666;
    margin-bottom: 12px;
}
</style>
`;

// ============================================================================
// Inline JS for interactivity (no React required)
// ============================================================================

const INLINE_SCRIPT = `
<script>
    function reloadPage() {
        window.location.reload();
    }
    function openInEditor(file, line, column) {
        const url = 'vscode://file' + file + ':' + (line || 1) + ':' + (column || 1);
        window.open(url, '_blank');
    }
</script>
`;

// ============================================================================
// Stack Trace Parser
// ============================================================================

function parseStackTrace(stack: string): string[] {
    if (!stack) return [];
    return stack.split('\n').filter(line => line.trim());
}

// ============================================================================
// Error Overlay Component (SSR only - no hydration)
// ============================================================================

export function ErrorOverlay({ errors }: ErrorOverlayProps): React.ReactElement {
    const error = errors[0];
    if (!error) return <div />;

    const stackLines = parseStackTrace(error.stack || '');
    const errorTypeLabel = error.type === 'build' ? 'Build Error' :
        error.type === 'hydration' ? 'Hydration Error' : 'Runtime Error';

    const fileName = error.file?.split(/[/\\]/).pop() || '';

    return (
        <div dangerouslySetInnerHTML={{
            __html: `
${INLINE_STYLES}
${INLINE_SCRIPT}
<div class="vista-error-container">
    <div class="vista-error-dialog" role="dialog">
        <div class="vista-error-header">
            <span class="vista-error-badge">${errorTypeLabel}</span>
            ${errors.length > 1 ? `
            <div class="vista-error-nav">
                <span class="vista-error-count">1 of ${errors.length}</span>
            </div>
            ` : ''}
        </div>
        
        <div class="vista-error-content">
            <div class="vista-error-message">${escapeHtml(error.message)}</div>
            
            ${error.file ? `
            <div class="vista-error-location" onclick="openInEditor('${escapeAttr(error.file)}', ${error.line || 1}, ${error.column || 1})" style="cursor: pointer">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: #888">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"></path>
                    <polyline points="14,2 14,8 20,8"></polyline>
                </svg>
                <span class="vista-error-location-file">${escapeHtml(error.file)}</span>
                ${error.line ? `<span class="vista-error-location-line">:${error.line}${error.column ? `:${error.column}` : ''}</span>` : ''}
            </div>
            ` : ''}
            
            ${stackLines.length > 0 ? `
            <div class="vista-error-stack-title">Stack Trace</div>
            <div class="vista-error-stack">${escapeHtml(stackLines.join('\n'))}</div>
            ` : ''}
        </div>
        
        <div class="vista-error-footer">
            <span class="vista-error-footer-text">Vista Development Mode</span>
            <button class="vista-error-btn" onclick="reloadPage()">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="23,4 23,10 17,10"></polyline>
                    <path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"></path>
                </svg>
                Reload Page
            </button>
        </div>
    </div>
</div>
            `
        }} />
    );
}

// Helper functions
function escapeHtml(text: string): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function escapeAttr(text: string): string {
    return text.replace(/'/g, "\\'").replace(/"/g, '\\"');
}

// ============================================================================
// Legacy exports for compatibility
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
                    errors={[{
                        type: 'runtime',
                        message: this.state.error.message || 'Unknown Error',
                        stack: this.state.error.stack
                    }]}
                />
            );
        }
        return this.props.children;
    }
}

// Re-exports for backwards compatibility
export { ErrorOverlay as VistaErrorOverlay };
export { DevErrorBoundary as VistaDevErrorBoundary };

