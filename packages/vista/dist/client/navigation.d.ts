/**
 * Vista Navigation Hooks
 *
 * Provides hooks for reading route information.
 * Similar to Next.js navigation hooks.
 *
 * When inside an RSCRouter these hooks read from the shared RSC
 * navigation context. Otherwise they fall back to popstate listeners
 * (legacy mode).
 */
/**
 * Returns the current pathname.
 * Uses the RSC router context when available, otherwise listens
 * to popstate events.
 */
export declare function usePathname(): string;
/**
 * Returns the current search params.
 * Uses the RSC router context when available.
 */
export declare function useSearchParams(): URLSearchParams;
/**
 * Returns dynamic route parameters.
 * For route /users/[id]/posts/[postId], returns { id: '123', postId: '456' }
 */
export declare function useParams<T extends Record<string, string> = Record<string, string>>(): T;
/**
 * Returns the currently active segment of the layout
 */
export declare function useSelectedLayoutSegment(): string | null;
/**
 * Returns all active segments of the layout
 */
export declare function useSelectedLayoutSegments(): string[];
export { useRouter } from './router';
