import type { DocsDocSource } from '../types';

export const createAndGenerateDoc: DocsDocSource = {
  category: 'cli-workflow',
  slug: 'create-and-generate',
  title: 'Create and Generate',
  summary:
    'Use `create-vista-app` for fast project bootstrap, then add new modules with a repeatable CLI-driven workflow.',
  order: 1,
  updatedAt: '2026-03-04',
  sections: [
    {
      type: 'heading',
      level: 2,
      text: 'Bootstrap App',
    },
    {
      type: 'code',
      language: 'bash',
      code: `npx create-vista-app@latest
cd my-vista-app
npm run dev`,
    },
    {
      type: 'heading',
      level: 2,
      text: 'Typed Starter',
    },
    {
      type: 'paragraph',
      text: 'Typed starter scaffolds `app/api/typed.ts`, `app/api/routers`, and `app/api/procedures` so your API contract starts strongly typed from day one.',
    },
    {
      type: 'heading',
      level: 2,
      text: 'Suggested Team Workflow',
    },
    {
      type: 'list',
      items: [
        'Create feature route in `app/<feature>/` first.',
        'Extract shared UI into `components/` only after second reuse.',
        'Add server logic in `app/api/procedures/` and expose from router.',
        'Keep release scripts in `package.json` so CI and local run identical commands.',
      ],
    },
    {
      type: 'links',
      title: 'Related',
      links: [
        { label: 'Project Structure', href: '/docs/getting-started/project-structure' },
        { label: 'Package Publishing', href: '/docs/deployment/package-publishing' },
      ],
    },
  ],
};
