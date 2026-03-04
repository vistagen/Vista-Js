import type { DocsDocSource } from '../types';

export const apiRoutesVsTypedApiDoc: DocsDocSource = {
  category: 'core-concepts',
  slug: 'api-routes-vs-typed-api',
  title: 'API Routes vs Typed API',
  summary:
    'Vista supports both classic route handlers and the new typed API runtime so teams can migrate incrementally.',
  order: 3,
  updatedAt: '2026-03-04',
  sections: [
    {
      type: 'heading',
      level: 2,
      text: 'Legacy Route Handlers',
    },
    {
      type: 'paragraph',
      text: 'Keep using `app/api/*/route.ts` for traditional endpoint files. Existing projects continue to work without any changes.',
    },
    {
      type: 'code',
      language: 'ts',
      title: 'app/api/health/route.ts',
      code: `export async function GET() {
  return Response.json({ ok: true, uptime: process.uptime() });
}`,
    },
    {
      type: 'heading',
      level: 2,
      text: 'Typed API Runtime',
    },
    {
      type: 'paragraph',
      text: 'Typed API routes are enabled only when `experimental.typedApi.enabled` is true. Runtime matches methods, validates input, executes middleware, and serializes output.',
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
      text: 'How Request Resolution Works',
    },
    {
      type: 'list',
      items: [
        'If a concrete `app/api/*` route file exists, legacy handler path stays valid.',
        'Typed runtime checks exported router from `app/api/typed.ts` entrypoint.',
        'Unknown typed route returns not-found and allows legacy fallback.',
        'Method mismatch returns 405 with typed error payload.',
      ],
    },
    {
      type: 'links',
      title: 'Next',
      links: [
        { label: 'Typed API Runtime Flow', href: '/docs/core-concepts/typed-api-runtime-flow' },
        { label: 'Vista Config Reference', href: '/docs/reference/vista-config-reference' },
      ],
    },
  ],
};
