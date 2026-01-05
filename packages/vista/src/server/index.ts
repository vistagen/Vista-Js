/**
 * Vista Server Utilities
 * 
 * Next.js-compatible server-only functions for use in Server Components and API routes.
 * These functions only work on the server side.
 */

// ============================================================================
// Cookies
// ============================================================================

export interface CookieOptions {
    maxAge?: number;
    expires?: Date;
    path?: string;
    domain?: string;
    secure?: boolean;
    httpOnly?: boolean;
    sameSite?: 'strict' | 'lax' | 'none';
    priority?: 'low' | 'medium' | 'high';
}

export interface ReadonlyCookie {
    name: string;
    value: string;
}

export interface CookieStore {
    get(name: string): ReadonlyCookie | undefined;
    getAll(): ReadonlyCookie[];
    has(name: string): boolean;
    set(name: string, value: string, options?: CookieOptions): void;
    delete(name: string): void;
}

/**
 * Access cookies in Server Components and API routes.
 * Note: This is a simplified implementation - in production, integrate with actual request.
 */
export function cookies(): CookieStore {
    // Server-side cookie access would be implemented here
    // For now, return a mock implementation
    const cookieMap = new Map<string, string>();
    
    // Check if we're in a server context
    if (typeof window !== 'undefined') {
        console.warn('cookies() should only be called on the server');
    }
    
    return {
        get(name: string): ReadonlyCookie | undefined {
            const value = cookieMap.get(name);
            return value ? { name, value } : undefined;
        },
        getAll(): ReadonlyCookie[] {
            return Array.from(cookieMap.entries()).map(([name, value]) => ({ name, value }));
        },
        has(name: string): boolean {
            return cookieMap.has(name);
        },
        set(name: string, value: string, options?: CookieOptions): void {
            cookieMap.set(name, value);
            // In real implementation, set the Set-Cookie header
        },
        delete(name: string): void {
            cookieMap.delete(name);
            // In real implementation, set the Set-Cookie header with expired date
        },
    };
}

// ============================================================================
// Headers
// ============================================================================

export interface ReadonlyHeaders {
    get(name: string): string | null;
    has(name: string): boolean;
    entries(): IterableIterator<[string, string]>;
    keys(): IterableIterator<string>;
    values(): IterableIterator<string>;
    forEach(callback: (value: string, key: string) => void): void;
}

/**
 * Access request headers in Server Components.
 * Note: This is a simplified implementation - in production, integrate with actual request.
 */
export function headers(): ReadonlyHeaders {
    // Server-side header access would be implemented here
    const headerMap = new Map<string, string>();
    
    if (typeof window !== 'undefined') {
        console.warn('headers() should only be called on the server');
    }
    
    return {
        get(name: string): string | null {
            return headerMap.get(name.toLowerCase()) ?? null;
        },
        has(name: string): boolean {
            return headerMap.has(name.toLowerCase());
        },
        entries(): IterableIterator<[string, string]> {
            return headerMap.entries();
        },
        keys(): IterableIterator<string> {
            return headerMap.keys();
        },
        values(): IterableIterator<string> {
            return headerMap.values();
        },
        forEach(callback: (value: string, key: string) => void): void {
            headerMap.forEach((value, key) => callback(value, key));
        },
    };
}

// ============================================================================
// Redirect
// ============================================================================

export type RedirectType = 'push' | 'replace';

export class RedirectError extends Error {
    public readonly url: string;
    public readonly type: RedirectType;

    constructor(url: string, type: RedirectType = 'replace') {
        super(`Redirect to ${url}`);
        this.name = 'RedirectError';
        this.url = url;
        this.type = type;
    }
}

/**
 * Redirect to another URL from a Server Component or API route.
 * @param url - The URL to redirect to
 * @param type - The type of redirect ('push' or 'replace')
 * @throws RedirectError - Always throws to interrupt rendering
 */
export function redirect(url: string, type: RedirectType = 'replace'): never {
    throw new RedirectError(url, type);
}

/**
 * Permanent redirect (HTTP 308) to another URL.
 * @param url - The URL to redirect to
 * @throws RedirectError - Always throws to interrupt rendering
 */
export function permanentRedirect(url: string): never {
    throw new RedirectError(url, 'replace');
}

// ============================================================================
// Not Found
// ============================================================================

export class NotFoundError extends Error {
    constructor() {
        super('Not Found');
        this.name = 'NotFoundError';
    }
}

/**
 * Trigger a 404 Not Found response from a Server Component.
 * @throws NotFoundError - Always throws to interrupt rendering
 */
export function notFound(): never {
    throw new NotFoundError();
}

// ============================================================================
// Response Helpers
// ============================================================================

/**
 * Create a JSON response (for API routes).
 */
export function json<T>(data: T, init?: ResponseInit): Response {
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
export class NextResponse extends Response {
    static json<T>(data: T, init?: ResponseInit): NextResponse {
        return new NextResponse(JSON.stringify(data), {
            ...init,
            headers: {
                'Content-Type': 'application/json',
                ...init?.headers,
            },
        });
    }

    static redirect(url: string | URL, status: number = 307): NextResponse {
        return new NextResponse(null, {
            status,
            headers: {
                Location: url.toString(),
            },
        });
    }

    static rewrite(url: string | URL): NextResponse {
        // Rewrite implementation would go here
        return new NextResponse(null, {
            headers: {
                'x-middleware-rewrite': url.toString(),
            },
        });
    }

    static next(): NextResponse {
        return new NextResponse(null, {
            headers: {
                'x-middleware-next': '1',
            },
        });
    }
}

// ============================================================================
// Request Helpers
// ============================================================================

export interface NextRequest extends Request {
    nextUrl: {
        pathname: string;
        searchParams: URLSearchParams;
        href: string;
        origin: string;
    };
    cookies: CookieStore;
    headers: Headers;
}
