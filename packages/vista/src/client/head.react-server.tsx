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
export function Head(_props: HeadProps): null {
  return null;
}

export type Metadata = AppMetadata;

export function generateMetadataHead(_metadata: Metadata): React.ReactElement {
  return React.createElement(React.Fragment, null);
}

export default Head;
