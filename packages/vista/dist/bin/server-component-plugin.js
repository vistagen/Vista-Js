"use strict";
/**
 * Vista Server Component Webpack Plugin
 *
 * Checks for server component violations on every webpack compilation.
 * Fails the build if client hooks are used without 'client load' directive.
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
exports.VistaServerComponentPlugin = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
// Client-only hooks and APIs that require 'client load' directive
const CLIENT_HOOKS = [
    'useState', 'useEffect', 'useLayoutEffect', 'useReducer', 'useRef',
    'useImperativeHandle', 'useCallback', 'useMemo', 'useContext',
    'useDebugValue', 'useDeferredValue', 'useTransition', 'useId',
    'useSyncExternalStore', 'useInsertionEffect',
];
function hasClientDirective(source) {
    const trimmed = source.trim();
    return trimmed.startsWith("'client load'") || trimmed.startsWith('"client load"');
}
function detectClientHooks(source) {
    const usedHooks = [];
    for (const hook of CLIENT_HOOKS) {
        const regex = new RegExp(`\\b${hook}\\s*[(<]`, 'g');
        if (regex.test(source)) {
            usedHooks.push(hook);
        }
    }
    // Check for event handlers
    if (/\bon[A-Z][a-zA-Z]*\s*=/g.test(source)) {
        usedHooks.push('event handlers');
    }
    return [...new Set(usedHooks)];
}
class VistaServerComponentPlugin {
    appDir;
    constructor(options) {
        this.appDir = options.appDir;
    }
    apply(compiler) {
        // Use afterCompile hook so we can add errors to compilation
        compiler.hooks.afterCompile.tap('VistaServerComponentPlugin', (compilation) => {
            const errors = this.checkServerComponents();
            if (errors.length > 0) {
                console.log('');
                console.log('\x1b[41m\x1b[37m ERROR \x1b[0m \x1b[31mServer Component Error\x1b[0m');
                console.log('');
                for (const error of errors) {
                    console.log(`\x1b[31m✗\x1b[0m ${error.file}`);
                    console.log(`  You're using \x1b[33m${error.hooks.join(', ')}\x1b[0m in a Server Component.`);
                    console.log('');
                    console.log(`  \x1b[36mTo fix:\x1b[0m Add \x1b[33m'client load'\x1b[0m at the top of your file:`);
                    console.log('');
                    console.log(`    \x1b[32m'client load';\x1b[0m`);
                    console.log('');
                    // Add webpack error so it shows in overlay
                    const WebpackError = require('webpack').WebpackError;
                    const err = new WebpackError(`Server Component Error: ${error.file}\n` +
                        `You're using ${error.hooks.join(', ')} in a Server Component.\n` +
                        `Add 'client load' at the top of your file to make it a Client Component.`);
                    err.file = error.file;
                    compilation.errors.push(err);
                }
            }
        });
    }
    checkServerComponents() {
        const errors = [];
        this.scanDirectory(this.appDir, errors);
        return errors;
    }
    scanDirectory(dir, errors) {
        if (!fs.existsSync(dir))
            return;
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                if (!entry.name.startsWith('.') && entry.name !== 'node_modules') {
                    this.scanDirectory(fullPath, errors);
                }
            }
            else if (entry.isFile() && /\.(tsx?|jsx?)$/.test(entry.name)) {
                const source = fs.readFileSync(fullPath, 'utf-8');
                const isClient = hasClientDirective(source);
                const clientHooks = detectClientHooks(source);
                if (!isClient && clientHooks.length > 0) {
                    errors.push({
                        file: path.relative(this.appDir, fullPath),
                        hooks: clientHooks
                    });
                }
            }
        }
    }
}
exports.VistaServerComponentPlugin = VistaServerComponentPlugin;
exports.default = VistaServerComponentPlugin;
