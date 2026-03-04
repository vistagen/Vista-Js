export interface VistaClientErrorInit {
    status: number;
    message: string;
    path: string;
    method: 'GET' | 'POST';
    url: string;
    response?: Response;
    details?: unknown;
}
export declare class VistaClientError extends Error {
    status: number;
    path: string;
    method: 'GET' | 'POST';
    url: string;
    response?: Response;
    details?: unknown;
    constructor(init: VistaClientErrorInit);
}
