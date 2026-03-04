interface RunGenerateOptions {
    cwd?: string;
    log?: (message: string) => void;
    error?: (message: string) => void;
}
export declare function runGenerateCommand(args: string[], options?: RunGenerateOptions): Promise<number>;
export {};
