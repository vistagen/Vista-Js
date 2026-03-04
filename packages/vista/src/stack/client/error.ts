export interface VistaClientErrorInit {
  status: number;
  message: string;
  path: string;
  method: 'GET' | 'POST';
  url: string;
  response?: Response;
  details?: unknown;
}

export class VistaClientError extends Error {
  status: number;
  path: string;
  method: 'GET' | 'POST';
  url: string;
  response?: Response;
  details?: unknown;

  constructor(init: VistaClientErrorInit) {
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
