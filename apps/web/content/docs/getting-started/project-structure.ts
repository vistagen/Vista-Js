import type { DocsDocSource } from '../types';

export const projectStructureDoc: DocsDocSource = {
  category: 'getting-started',
  slug: 'project-structure',
  title: 'Project Structure',
  summary:
    'Understand what each folder does so you can add routes, APIs, and shared logic without creating chaos.',
  order: 2,
  updatedAt: '2026-03-04',
  sections: [
    {
      type: 'heading',
      level: 2,
      text: 'Baseline Structure',
    },
    {
      type: 'code',
      language: 'txt',
      title: 'Typical Vista app tree',
      code: `my-app/
  app/
    root.tsx
    index.tsx
    docs/
      page.tsx
      [...slug]/page.tsx
    api/
      health/route.ts
      typed.ts
  components/
  lib/
  data/
  public/
  vista.config.ts`,
    },
    {
      type: 'heading',
      level: 2,
      text: 'Folder Responsibilities',
    },
    {
      type: 'list',
      items: [
        '`app/` contains routes and route-local UI.',
        '`components/` contains reusable UI building blocks.',
        '`lib/` contains pure helpers and adapters.',
        '`data/` contains local data maps like docs catalogs or feature lists.',
        '`app/api/` is for HTTP APIs, legacy route handlers, and typed API entrypoint.',
      ],
    },
    {
      type: 'heading',
      level: 2,
      text: 'Recommended Team Rule',
    },
    {
      type: 'quote',
      text: 'Put code where you would expect to find it in 3 months, not where it was quickest today.',
    },
    {
      type: 'links',
      title: 'Next',
      links: [
        { label: 'Typed API Quickstart', href: '/docs/getting-started/typed-api-quickstart' },
        { label: 'Project File Structure Reference', href: '/docs/reference/project-file-structure' },
      ],
    },
  ],
};
