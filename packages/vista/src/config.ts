import path from 'path';
import fs from 'fs';
import { ImageConfig } from './image/image-config';

export interface VistaConfig {
    images?: ImageConfig;
    // Add other future config options here suitable for user requests
    react?: any;
    server?: {
        port?: number;
    };
}

export const defaultConfig: VistaConfig = {
    images: {},
};

export function loadConfig(cwd: string = process.cwd()): VistaConfig {
    const tsPath = path.join(cwd, 'vista.config.ts');
    const jsPath = path.join(cwd, 'vista.config.js');

    try {
        if (fs.existsSync(tsPath)) {
            // We assume ts-node is registered by engine or bin
            const mod = require(tsPath);
            return { ...defaultConfig, ...(mod.default || mod) };
        } else if (fs.existsSync(jsPath)) {
            const mod = require(jsPath);
            return { ...defaultConfig, ...(mod.default || mod) };
        }
    } catch (error) {
        console.error("Error loading vista.config:", error);
    }
    return defaultConfig;
}
