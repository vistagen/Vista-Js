import type { DocsDocSource } from '../types';

export const firstStepsDoc: DocsDocSource = {
  category: 'getting-started',
  slug: 'first-steps',
  title: 'First Steps',
  summary: 'Bootstrap a new app, run local dev, and understand the minimum project structure in minutes.',
  order: 1,
  updatedAt: '2026-03-04',
  sections: [
    {
      type: 'heading',
      level: 2,
      text: 'Create an App',
    },
    {
      type: 'code',
      language: 'bash',
      title: 'Terminal',
      code: 'npx create-vista-app@latest\ncd my-vista-app\nnpm run dev',
    },
    {
      type: 'heading',
      level: 2,
      text: 'Project Shape',
    },
    {
      type: 'list',
      items: [
        '`app/` contains pages and layouts.',
        '`components/` stores reusable UI.',
        '`data/` and `lib/` keep content + helpers clean.',
      ],
    },
    {
      type: 'heading',
      level: 2,
      text: 'What to Build First',
    },
    {
      type: 'paragraph',
      text: 'Start with one route, one layout, and one data source. Keep scope tight until your core loop is stable.',
    },
    {
      type: 'links',
      title: 'Continue',
      links: [
        {
          label: 'Routing Overview',
          href: '/docs/core-concepts/routing-overview',
        },
      ],
    },
  ],
};
