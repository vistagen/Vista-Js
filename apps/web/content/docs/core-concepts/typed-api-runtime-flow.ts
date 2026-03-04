import type { DocsDocSource } from '../types';

export const typedApiRuntimeFlowDoc: DocsDocSource = {
  category: 'core-concepts',
  slug: 'typed-api-runtime-flow',
  title: 'Typed API Runtime Flow',
  summary:
    'Follow the exact request lifecycle from incoming `/api/*` call to router execution and serialized response.',
  order: 4,
  updatedAt: '2026-03-04',
  sections: [
    {
      type: 'heading',
      level: 2,
      text: 'Entrypoint Discovery',
    },
    {
      type: 'paragraph',
      text: 'Runtime scans for `app/api/typed.ts` (and JS/TSX variants). If file is missing, typed API handling is skipped.',
    },
    {
      type: 'heading',
      level: 2,
      text: 'Path + Method Resolution',
    },
    {
      type: 'list',
      items: [
        'Request path candidates include both raw path and `/api`-stripped path.',
        'Router checks matching procedure by normalized method (`get`/`post`).',
        'No method match with existing route map returns 405.',
        'No route match returns not-found and allows fallback.',
      ],
    },
    {
      type: 'heading',
      level: 2,
      text: 'Body Parsing Rules',
    },
    {
      type: 'list',
      items: [
        '`application/json` and `+json` parse into objects.',
        '`application/x-www-form-urlencoded` parses via `URLSearchParams`.',
        '`text/*` returns UTF-8 string.',
        'Other content types return Buffer payload.',
      ],
    },
    {
      type: 'heading',
      level: 2,
      text: 'Context and Environment Factories',
    },
    {
      type: 'code',
      language: 'ts',
      title: 'typed entrypoint optional exports',
      code: `export async function createContext({ req, res }) {
  return { userId: req.headers['x-user-id'] ?? null };
}

export function createEnv() {
  return { mode: process.env.NODE_ENV ?? 'development' };
}`,
    },
    {
      type: 'heading',
      level: 2,
      text: 'Error Mapping',
    },
    {
      type: 'list',
      items: [
        'Validation and method errors map to 4xx responses with message.',
        'Body size violations map to 413.',
        'Unhandled runtime errors map to 500.',
        'Router-level error handler can return custom `Response` for central handling.',
      ],
    },
    {
      type: 'links',
      title: 'Continue',
      links: [
        { label: 'Typed API Quickstart', href: '/docs/getting-started/typed-api-quickstart' },
        { label: 'API Routes vs Typed API', href: '/docs/core-concepts/api-routes-vs-typed-api' },
      ],
    },
  ],
};
