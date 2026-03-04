import type { DocsDocSource } from '../types';

export const routingOverviewDoc: DocsDocSource = {
  category: 'core-concepts',
  slug: 'routing-overview',
  title: 'Routing Overview',
  summary: 'Understand static, dynamic, and catch-all routes so app structure scales without rewrites.',
  order: 1,
  updatedAt: '2026-03-04',
  sections: [
    {
      type: 'heading',
      level: 2,
      text: 'Static Route',
    },
    {
      type: 'code',
      language: 'txt',
      code: 'app/docs/page.tsx -> /docs',
    },
    {
      type: 'heading',
      level: 2,
      text: 'Dynamic Segment',
    },
    {
      type: 'code',
      language: 'txt',
      code: 'app/blog/[slug]/page.tsx -> /blog/my-post',
    },
    {
      type: 'heading',
      level: 2,
      text: 'Catch-All Segment',
    },
    {
      type: 'code',
      language: 'txt',
      code: 'app/docs/[...slug]/page.tsx -> /docs/category/article',
    },
    {
      type: 'paragraph',
      text: 'Catch-all routes are useful for docs IA where category + article path comes from content data.',
    },
  ],
};
