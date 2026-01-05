/**
 * Vista Server Component Webpack Plugin
 * 
 * Checks for server component violations on every webpack compilation.
 * Fails the build if client hooks are used without 'client load' directive.
 */

import * as fs from 'fs';
import * as path from 'path';
import type { Compiler, Compilation } from 'webpack';

// Client-only hooks and APIs that require 'client load' directive
const CLIENT_HOOKS = [
    'useState', 'useEffect', 'useLayoutEffect', 'useReducer', 'useRef',
    'useImperativeHandle', 'useCallback', 'useMemo', 'useContext',
    'useDebugValue', 'useDeferredValue', 'useTransition', 'useId',
    'useSyncExternalStore', 'useInsertionEffect',
];

interface ServerComponentError {
    file: string;
    hooks: string[];
}

function hasClientDirective(source: string): boolean {
    const trimmed = source.trim();
    return trimmed.startsWith("'client load'") || trimmed.startsWith('"client load"');
}

function detectClientHooks(source: string): string[] {
    const usedHooks: string[] = [];
    
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

export class VistaServerComponentPlugin {
    private appDir: string;
    
    constructor(options: { appDir: string }) {
        this.appDir = options.appDir;
    }
    
    apply(compiler: Compiler) {
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
                    const err = new WebpackError(
                        `Server Component Error: ${error.file}\n` +
                        `You're using ${error.hooks.join(', ')} in a Server Component.\n` +
                        `Add 'client load' at the top of your file to make it a Client Component.`
                    );
                    err.file = error.file;
                    compilation.errors.push(err);
                }
            }
        });
    }
    
    private checkServerComponents(): ServerComponentError[] {
        const errors: ServerComponentError[] = [];
        this.scanDirectory(this.appDir, errors);
        return errors;
    }
    
    private scanDirectory(dir: string, errors: ServerComponentError[]) {
        if (!fs.existsSync(dir)) return;
        
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        
        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            
            if (entry.isDirectory()) {
                if (!entry.name.startsWith('.') && entry.name !== 'node_modules') {
                    this.scanDirectory(fullPath, errors);
                }
            } else if (entry.isFile() && /\.(tsx?|jsx?)$/.test(entry.name)) {
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

export default VistaServerComponentPlugin;
