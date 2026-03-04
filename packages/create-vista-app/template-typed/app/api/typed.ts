import { vstack } from 'vista/stack';
import { createRootRouter } from './routers';

const v = vstack.init();

export const router = createRootRouter(v);
