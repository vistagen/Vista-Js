import * as React from 'react';
import type { Metadata as AppMetadata } from '../metadata/types';
interface HeadProps {
    children?: React.ReactNode;
}
/**
 * React-server safe Head component.
 *
 * In RSC execution context, browser-side document mutations are unavailable.
 * This component is intentionally a no-op to keep server rendering stable.
 */
export declare function Head(_props: HeadProps): null;
export type Metadata = AppMetadata;
export declare function generateMetadataHead(_metadata: Metadata): React.ReactElement;
export default Head;
