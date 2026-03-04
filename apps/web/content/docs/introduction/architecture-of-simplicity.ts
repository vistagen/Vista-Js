import type { DocsDocSource } from '../types';

export const architectureOfSimplicityDoc: DocsDocSource = {
  category: 'introduction',
  slug: 'architecture-of-simplicity',
  title: 'The Architecture of Simplicity',
  summary:
    'Under the hood Vista is optimized for fast iteration, server rendering, and predictable routing behavior.',
  order: 2,
  updatedAt: '2026-03-04',
  sections: [
    {
      type: 'heading',
      level: 2,
      text: 'Server-First by Default',
    },
    {
      type: 'paragraph',
      text: 'When a request comes in, Vista renders your React tree as a stream and starts sending UI early instead of waiting for a full HTML string.',
    },
    {
      type: 'heading',
      level: 2,
      text: 'Routing Model',
    },
    {
      type: 'paragraph',
      text: 'File-system routes, nested layouts, and catch-all segments are built in so application structure stays predictable.',
    },
    {
      type: 'heading',
      level: 2,
      text: 'DX Philosophy',
    },
    {
      type: 'quote',
      text: 'Power should feel obvious, not hidden behind ceremony.',
    },
    {
      type: 'links',
      title: 'Related',
      links: [
        {
          label: 'Routing Overview',
          href: '/docs/core-concepts/routing-overview',
        },
      ],
    },
  ],
};
