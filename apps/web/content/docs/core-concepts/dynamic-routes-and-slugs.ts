import type { DocsDocSource } from '../types';

export const dynamicRoutesAndSlugsDoc: DocsDocSource = {
  category: 'core-concepts',
  slug: 'dynamic-routes-and-slugs',
  title: 'Dynamic Routes and Slugs',
  summary:
    'Use dynamic segments and catch-all routes to build scalable URL systems for docs, blogs, and dashboards.',
  order: 2,
  updatedAt: '2026-03-04',
  sections: [
    {
      type: 'heading',
      level: 2,
      text: 'Dynamic Segment',
    },
    {
      type: 'code',
      language: 'txt',
      code: 'app/blog/[slug]/page.tsx -> /blog/ship-log',
    },
    {
      type: 'heading',
      level: 2,
      text: 'Catch-All Segment',
    },
    {
      type: 'code',
      language: 'txt',
      code: 'app/docs/[...slug]/page.tsx -> /docs/introduction/the-beginning-of-vista',
    },
    {
      type: 'heading',
      level: 2,
      text: 'Param Normalization Pattern',
    },
    {
      type: 'code',
      language: 'ts',
      code: `type RouteParams = Record<string, string | string[] | undefined | null>;

function normalizeDocRouteSlug(params: RouteParams): string[] {
  const raw = params.slug;
  if (Array.isArray(raw)) return raw.flatMap((entry) => entry.split('/')).filter(Boolean);
  if (typeof raw === 'string') return raw.split('/').filter(Boolean);
  return [];
}`,
    },
    {
      type: 'paragraph',
      text: 'This normalization keeps behavior consistent when runtime adapters provide catch-all params in slightly different shapes.',
    },
    {
      type: 'links',
      title: 'Related',
      links: [
        { label: 'Routing Overview', href: '/docs/core-concepts/routing-overview' },
        { label: 'Project File Structure', href: '/docs/reference/project-file-structure' },
      ],
    },
  ],
};
