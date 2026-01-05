/**
 * Vista Flight Loader
 *
 * Rust-powered webpack loader that detects 'client load' directive
 * and marks modules with RSC info for proper bundle separation.
 *
 * This is similar to Next.js's flight-loader but uses Vista's Rust scanner.
 */
import type { LoaderContext } from 'webpack';
/**
 * Vista Flight Loader
 *
 * Marks modules with RSC info based on 'client load' directive.
 * Uses Rust for detection when available, falls back to TypeScript.
 */
export default function vistaFlightLoader(this: LoaderContext<{}>, source: string): string;
export declare const raw = false;
