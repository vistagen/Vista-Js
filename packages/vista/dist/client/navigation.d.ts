/**
 * Vista Navigation Hooks
 *
 * Provides hooks for reading route information.
 * Similar to Next.js navigation hooks.
 */
/**
 * Returns the current pathname
 */
export declare function usePathname(): string;
/**
 * Returns the current search params
 */
export declare function useSearchParams(): URLSearchParams;
/**
 * Returns dynamic route parameters
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
