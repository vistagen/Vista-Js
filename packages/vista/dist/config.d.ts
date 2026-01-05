import { ImageConfig } from './image/image-config';
export interface VistaConfig {
    images?: ImageConfig;
    react?: any;
    server?: {
        port?: number;
    };
}
export declare const defaultConfig: VistaConfig;
export declare function loadConfig(cwd?: string): VistaConfig;
