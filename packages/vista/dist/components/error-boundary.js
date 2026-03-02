/**
 * Vista Route Error Boundary
 *
 * React class component that catches errors thrown by route segments.
 * Each layout segment gets its own ErrorBoundary so errors are isolated
 * to the nearest boundary (matching Next.js App Router behavior).
 *
 * The user's `error.tsx` receives:
 *   - error: Error — the thrown error
 *   - reset: () => void — callback to re-render the boundary
 */
'use client';
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RouteErrorBoundary = void 0;
exports.DefaultErrorFallback = DefaultErrorFallback;
const react_1 = __importDefault(require("react"));
class RouteErrorBoundary extends react_1.default.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }
    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }
    componentDidCatch(error, errorInfo) {
        console.error('[vista:error-boundary] Caught error:', error, errorInfo);
    }
    reset = () => {
        this.setState({ hasError: false, error: null });
    };
    render() {
        if (this.state.hasError && this.state.error) {
            const { fallbackComponent: FallbackComponent, fallback } = this.props;
            if (FallbackComponent) {
                return react_1.default.createElement(FallbackComponent, {
                    error: this.state.error,
                    reset: this.reset,
                });
            }
            if (fallback !== undefined) {
                return fallback;
            }
            // Default error UI
            return react_1.default.createElement('div', {
                style: {
                    padding: '2rem',
                    fontFamily: 'system-ui, sans-serif',
                    color: '#dc2626',
                },
            }, react_1.default.createElement('h2', null, 'Something went wrong'), react_1.default.createElement('p', { style: { color: '#666' } }, this.state.error.message), react_1.default.createElement('button', {
                onClick: this.reset,
                style: {
                    marginTop: '1rem',
                    padding: '0.5rem 1rem',
                    border: '1px solid #dc2626',
                    borderRadius: '0.375rem',
                    background: 'transparent',
                    color: '#dc2626',
                    cursor: 'pointer',
                },
            }, 'Try again'));
        }
        return this.props.children;
    }
}
exports.RouteErrorBoundary = RouteErrorBoundary;
/**
 * Default error component used when a route has no error.tsx
 */
function DefaultErrorFallback({ error, reset, }) {
    return react_1.default.createElement('div', {
        style: {
            padding: '2rem',
            fontFamily: 'system-ui, sans-serif',
        },
    }, react_1.default.createElement('h2', { style: { color: '#dc2626' } }, 'Application Error'), react_1.default.createElement('p', null, error.message), react_1.default.createElement('button', { onClick: reset, style: { marginTop: '0.5rem', cursor: 'pointer' } }, 'Retry'));
}
