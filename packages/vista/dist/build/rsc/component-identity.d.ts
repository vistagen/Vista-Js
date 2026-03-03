export declare function normalizeComponentPath(input: string): string;
export declare function stripComponentExtension(input: string): string;
export declare function relativeComponentPath(baseDir: string, absolutePath: string): string;
export declare function createComponentIdentity(relativePath: string): string;
export declare function createComponentId(scope: 'client' | 'server', relativePath: string, exportName?: string): string;
export declare function createChunkName(relativePath: string): string;
