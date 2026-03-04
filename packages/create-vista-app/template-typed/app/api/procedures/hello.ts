import type { VStackInstance } from 'vista/stack';

export function helloProcedure(v: VStackInstance<any, any>) {
    return v.procedure.query(() => ({
        message: 'Hello from Vista Typed API',
    }));
}
