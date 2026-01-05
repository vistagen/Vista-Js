"use strict";
/**
 * Vista RSC (React Server Components) Build System
 *
 * This module implements the True RSC Architecture:
 * 1. Server components render on the server and contribute 0kb to client bundle
 * 2. Client components are marked with 'client load' and hydrate on the browser
 * 3. Strict separation ensures server secrets never leak to client
 *
 * Performance: Uses Rust-powered native scanning when available
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
__exportStar(require("./compiler"), exports);
__exportStar(require("./client-manifest"), exports);
__exportStar(require("./server-manifest"), exports);
__exportStar(require("./rsc-renderer"), exports);
__exportStar(require("./client-reference-plugin"), exports);
__exportStar(require("./native-scanner"), exports);
