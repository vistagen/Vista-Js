import type { DocsDocSource } from '../types';

export const projectFileStructureDoc: DocsDocSource = {
  category: 'reference',
  slug: 'project-file-structure',
  title: 'Project File Structure',
  summary:
    'Detailed map of important Vista folders and how runtime, routes, and docs content connect to each other.',
  order: 2,
  updatedAt: '2026-03-04',
  sections: [
    {
      type: 'heading',
      level: 2,
      text: 'Runtime-Facing Files',
    },
    {
      type: 'code',
      language: 'txt',
      code: `app/root.tsx                -> global shell
app/index.tsx               -> home route
app/docs/layout.tsx         -> docs shell (sidebar + TOC)
app/docs/[...slug]/page.tsx -> docs article resolver
app/api/*                   -> REST + typed API entry`,
    },
    {
      type: 'heading',
      level: 2,
      text: 'Docs Content Files',
    },
    {
      type: 'code',
      language: 'txt',
      code: `content/docs/categories.ts                 -> category registry
content/docs/**/<doc>.ts                   -> doc section data
content/docs/index.ts                      -> allDocs collector
lib/docs.ts                                -> slug resolver + navigation helpers`,
    },
    {
      type: 'heading',
      level: 2,
      text: 'Typed API Files',
    },
    {
      type: 'code',
      language: 'txt',
      code: `app/api/typed.ts                          -> typed router entry
app/api/routers/index.ts                   -> compose procedures
app/api/procedures/*.ts                    -> query/mutation handlers`,
    },
    {
      type: 'heading',
      level: 2,
      text: 'What to Keep Stable',
    },
    {
      type: 'list',
      items: [
        'Do not rename `/docs/<category>/<slug>` contract once public links exist.',
        'Keep docs category IDs stable; they are used in navigation generation.',
        'Prefer app-local utilities before extracting framework-level helpers.',
      ],
    },
    {
      type: 'links',
      title: 'See Also',
      links: [
        { label: 'Project Structure', href: '/docs/getting-started/project-structure' },
        { label: 'Dynamic Routes and Slugs', href: '/docs/core-concepts/dynamic-routes-and-slugs' },
      ],
    },
  ],
};
