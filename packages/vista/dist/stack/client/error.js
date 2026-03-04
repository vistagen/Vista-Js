"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VistaClientError = void 0;
class VistaClientError extends Error {
    status;
    path;
    method;
    url;
    response;
    details;
    constructor(init) {
        super(init.message);
        this.name = 'VistaClientError';
        this.status = init.status;
        this.path = init.path;
        this.method = init.method;
        this.url = init.url;
        this.response = init.response;
        this.details = init.details;
    }
}
exports.VistaClientError = VistaClientError;
