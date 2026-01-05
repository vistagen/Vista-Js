"use strict";
/**
 * Vista Server Utilities
 *
 * Next.js-compatible server-only functions for use in Server Components and API routes.
 * These functions only work on the server side.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.NextResponse = exports.NotFoundError = exports.RedirectError = void 0;
exports.cookies = cookies;
exports.headers = headers;
exports.redirect = redirect;
exports.permanentRedirect = permanentRedirect;
exports.notFound = notFound;
exports.json = json;
/**
 * Access cookies in Server Components and API routes.
 * Note: This is a simplified implementation - in production, integrate with actual request.
 */
function cookies() {
    // Server-side cookie access would be implemented here
    // For now, return a mock implementation
    const cookieMap = new Map();
    // Check if we're in a server context
    if (typeof window !== 'undefined') {
        console.warn('cookies() should only be called on the server');
    }
    return {
        get(name) {
            const value = cookieMap.get(name);
            return value ? { name, value } : undefined;
        },
        getAll() {
            return Array.from(cookieMap.entries()).map(([name, value]) => ({ name, value }));
        },
        has(name) {
            return cookieMap.has(name);
        },
        set(name, value, options) {
            cookieMap.set(name, value);
            // In real implementation, set the Set-Cookie header
        },
        delete(name) {
            cookieMap.delete(name);
            // In real implementation, set the Set-Cookie header with expired date
        },
    };
}
/**
 * Access request headers in Server Components.
 * Note: This is a simplified implementation - in production, integrate with actual request.
 */
function headers() {
    // Server-side header access would be implemented here
    const headerMap = new Map();
    if (typeof window !== 'undefined') {
        console.warn('headers() should only be called on the server');
    }
    return {
        get(name) {
            return headerMap.get(name.toLowerCase()) ?? null;
        },
        has(name) {
            return headerMap.has(name.toLowerCase());
        },
        entries() {
            return headerMap.entries();
        },
        keys() {
            return headerMap.keys();
        },
        values() {
            return headerMap.values();
        },
        forEach(callback) {
            headerMap.forEach((value, key) => callback(value, key));
        },
    };
}
class RedirectError extends Error {
    url;
    type;
    constructor(url, type = 'replace') {
        super(`Redirect to ${url}`);
        this.name = 'RedirectError';
        this.url = url;
        this.type = type;
    }
}
exports.RedirectError = RedirectError;
/**
 * Redirect to another URL from a Server Component or API route.
 * @param url - The URL to redirect to
 * @param type - The type of redirect ('push' or 'replace')
 * @throws RedirectError - Always throws to interrupt rendering
 */
function redirect(url, type = 'replace') {
    throw new RedirectError(url, type);
}
/**
 * Permanent redirect (HTTP 308) to another URL.
 * @param url - The URL to redirect to
 * @throws RedirectError - Always throws to interrupt rendering
 */
function permanentRedirect(url) {
    throw new RedirectError(url, 'replace');
}
// ============================================================================
// Not Found
// ============================================================================
class NotFoundError extends Error {
    constructor() {
        super('Not Found');
        this.name = 'NotFoundError';
    }
}
exports.NotFoundError = NotFoundError;
/**
 * Trigger a 404 Not Found response from a Server Component.
 * @throws NotFoundError - Always throws to interrupt rendering
 */
function notFound() {
    throw new NotFoundError();
}
// ============================================================================
// Response Helpers
// ============================================================================
/**
 * Create a JSON response (for API routes).
 */
function json(data, init) {
    return new Response(JSON.stringify(data), {
        ...init,
        headers: {
            'Content-Type': 'application/json',
            ...init?.headers,
        },
    });
}
/**
 * Create a NextResponse-compatible response object.
 */
class NextResponse extends Response {
    static json(data, init) {
        return new NextResponse(JSON.stringify(data), {
            ...init,
            headers: {
                'Content-Type': 'application/json',
                ...init?.headers,
            },
        });
    }
    static redirect(url, status = 307) {
        return new NextResponse(null, {
            status,
            headers: {
                Location: url.toString(),
            },
        });
    }
    static rewrite(url) {
        // Rewrite implementation would go here
        return new NextResponse(null, {
            headers: {
                'x-middleware-rewrite': url.toString(),
            },
        });
    }
    static next() {
        return new NextResponse(null, {
            headers: {
                'x-middleware-next': '1',
            },
        });
    }
}
exports.NextResponse = NextResponse;
