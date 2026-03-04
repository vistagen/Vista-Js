import type { DocsDocSource } from '../types';

export const typedClientReferenceDoc: DocsDocSource = {
  category: 'reference',
  slug: 'typed-client-reference',
  title: 'Typed Client Reference',
  summary:
    'Use `createVistaClient<AppRouter>()` with `$get`, `$post`, and `$url` helpers for typed request contracts.',
  order: 3,
  updatedAt: '2026-03-04',
  sections: [
    {
      type: 'heading',
      level: 2,
      text: 'Client Initialization',
    },
    {
      type: 'code',
      language: 'ts',
      code: `import { createVistaClient } from 'vista/stack/client';
import { router } from '@/app/api/typed';

type AppRouter = typeof router;

const client = createVistaClient<AppRouter>({
  baseUrl: '/api',
  serialization: 'json',
});`,
    },
    {
      type: 'heading',
      level: 2,
      text: 'Request Helpers',
    },
    {
      type: 'list',
      items: [
        '`client.$get(path, input?)` for read operations.',
        '`client.$post(path, input?)` for write operations.',
        '`client.$url(path, input?)` when you need a fully built URL.',
      ],
    },
    {
      type: 'heading',
      level: 2,
      text: 'Error Shape',
    },
    {
      type: 'paragraph',
      text: 'Failed requests throw `VistaClientError` with status, message, path, method, url, and optional details payload.',
    },
    {
      type: 'code',
      language: 'ts',
      code: `try {
  await client.$post('/users/create', { email: 'hello@vista.dev' });
} catch (error) {
  if (error instanceof Error) {
    console.error(error.message);
  }
}`,
    },
    {
      type: 'links',
      title: 'Related',
      links: [
        { label: 'Typed API Quickstart', href: '/docs/getting-started/typed-api-quickstart' },
        { label: 'API Routes vs Typed API', href: '/docs/core-concepts/api-routes-vs-typed-api' },
      ],
    },
  ],
};
