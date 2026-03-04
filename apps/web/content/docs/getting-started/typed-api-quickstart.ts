import type { DocsDocSource } from '../types';

export const typedApiQuickstartDoc: DocsDocSource = {
  category: 'getting-started',
  slug: 'typed-api-quickstart',
  title: 'Typed API Quickstart',
  summary:
    'Enable the experimental typed API flag and wire your first router in minutes with strongly typed contracts.',
  order: 3,
  updatedAt: '2026-03-04',
  sections: [
    {
      type: 'heading',
      level: 2,
      text: 'Enable Typed API Runtime',
    },
    {
      type: 'code',
      language: 'ts',
      title: 'vista.config.ts',
      code: `const config = {
  experimental: {
    typedApi: {
      enabled: true,
      serialization: 'json',
      bodySizeLimitBytes: 1024 * 1024,
    },
  },
};

export default config;`,
    },
    {
      type: 'heading',
      level: 2,
      text: 'Create the Entry Router',
    },
    {
      type: 'code',
      language: 'ts',
      title: 'app/api/typed.ts',
      code: `import { vstack } from 'vista/stack';
import { createRootRouter } from './routers';

const v = vstack.init();
export const router = createRootRouter(v);`,
    },
    {
      type: 'heading',
      level: 2,
      text: 'Create a Procedure',
    },
    {
      type: 'code',
      language: 'ts',
      title: 'app/api/procedures/hello.ts',
      code: `import type { VStackInstance } from 'vista/stack';

export function helloProcedure(v: VStackInstance<any, any>) {
  return v.procedure.query(() => ({
    message: 'Hello from Vista Typed API',
  }));
}`,
    },
    {
      type: 'heading',
      level: 2,
      text: 'Call it from Client',
    },
    {
      type: 'code',
      language: 'ts',
      title: 'client usage',
      code: `import { createVistaClient } from 'vista/stack/client';
import { router } from '@/app/api/typed';

type AppRouter = typeof router;

const client = createVistaClient<AppRouter>({ baseUrl: 'http://localhost:3000/api' });
const response = await client.$get('/hello');`,
    },
    {
      type: 'links',
      title: 'Deep Dive',
      links: [
        { label: 'API Routes vs Typed API', href: '/docs/core-concepts/api-routes-vs-typed-api' },
        { label: 'Typed API Runtime Flow', href: '/docs/core-concepts/typed-api-runtime-flow' },
      ],
    },
  ],
};
