import type { VStackInstance } from 'vista/stack';
import { helloProcedure } from '../procedures/hello';

export function createRootRouter(v: VStackInstance<any, any>) {
    return v.router({
        hello: helloProcedure(v),
    });
}
