"use strict";
/**
 * Vista ClientIsland Component
 *
 * Wraps client components to mark them for hydration.
 * Usage in server components:
 *
 * import { ClientIsland } from 'vista/client-island';
 * import Counter from './counter';
 *
 * <ClientIsland component="counter">
 *   <Counter />
 * </ClientIsland>
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
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClientIsland = ClientIsland;
const React = __importStar(require("react"));
/**
 * ClientIsland wraps client components with hydration markers.
 *
 * During SSR, it renders:
 * <div data-vista-client="counter" data-props="{}">
 *   {children from SSR}
 * </div>
 *
 * The client then hydrates only these marked islands.
 */
function ClientIsland({ component, props = {}, children }) {
    // Serialize props (exclude functions and React elements)
    const safeProps = {};
    for (const [key, value] of Object.entries(props)) {
        if (typeof value !== 'function' && !React.isValidElement(value)) {
            safeProps[key] = value;
        }
    }
    return React.createElement('div', {
        'data-vista-client': component,
        'data-props': JSON.stringify(safeProps),
        style: { display: 'contents' } // Don't affect layout
    }, children);
}
exports.default = ClientIsland;
