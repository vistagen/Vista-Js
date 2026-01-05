/**
 * Vista Error Overlay
 *
 * A standalone error overlay that works without React hydration.
 * Uses inline styles and vanilla JS for interactivity.
 */
import React from 'react';
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
export declare function ErrorOverlay({ errors }: ErrorOverlayProps): React.ReactElement;
export declare class DevErrorBoundary extends React.Component<{
    children: React.ReactNode;
}, {
    hasError: boolean;
    error: Error | null;
}> {
    constructor(props: any);
    static getDerivedStateFromError(error: Error): {
        hasError: boolean;
        error: Error;
    };
    render(): string | number | bigint | boolean | import("react/jsx-runtime").JSX.Element | Iterable<React.ReactNode> | Promise<string | number | bigint | boolean | React.ReactPortal | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode>>;
}
export { ErrorOverlay as VistaErrorOverlay };
export { DevErrorBoundary as VistaDevErrorBoundary };
