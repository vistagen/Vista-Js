/**
 * Vista Head Component
 *
 * Allows injection of elements into the document <head>.
 * Similar to Next.js Head component.
 */
import * as React from 'react';
import type { Metadata as AppMetadata } from '../metadata/types';
interface HeadProps {
    children: React.ReactNode;
}
/**
 * Head component - injects children into document head
 */
export declare function Head({ children }: HeadProps): null;
export type Metadata = AppMetadata;
/**
 * Generate head elements from metadata object
 */
export declare function generateMetadataHead(metadata: Metadata): React.ReactElement;
export default Head;
