import type { DocsDocSource } from '../types';

export const theBeginningOfVistaDoc: DocsDocSource = {
  category: 'introduction',
  slug: 'the-beginning-of-vista',
  title: 'The Beginning of Vista',
  summary:
    'Vista started from one idea: keep the power of modern frameworks, cut the noise, and let developers ship with less code.',
  order: 1,
  updatedAt: '2026-03-04',
  signatureQuote:
    'Vista was started to remove repeated setup friction from product teams. The vision is simple: fewer files to think about, less boilerplate to maintain, and a runtime that still gives you full control when your app grows.',
  sections: [
    {
      type: 'paragraph',
      text: "Vista is currently in its alpha stage. It is a framework born from a desire for simplicity without sacrificing power.",
    },
    {
      type: 'paragraph',
      text: "If you have used Next.js, Vista will feel familiar by design. It follows practical conventions while keeping the runtime lightweight.",
    },
    {
      type: 'heading',
      level: 2,
      text: 'Core Promise',
    },
    {
      type: 'list',
      items: [
        'Write less code for common product workflows.',
        'Keep server-first performance defaults.',
        'Retain flexibility when apps grow beyond starter templates.',
      ],
    },
    {
      type: 'heading',
      level: 2,
      text: 'Current Stage',
    },
    {
      type: 'paragraph',
      text: 'Vista is moving fast. APIs that reduce boilerplate are prioritized first, then ecosystem depth follows.',
    },
    {
      type: 'links',
      title: 'Next',
      links: [
        {
          label: 'The Architecture of Simplicity',
          href: '/docs/introduction/architecture-of-simplicity',
        },
        {
          label: 'First Steps',
          href: '/docs/getting-started/first-steps',
        },
      ],
    },
  ],
};
