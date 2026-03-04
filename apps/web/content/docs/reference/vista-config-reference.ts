import type { DocsDocSource } from '../types';

export const vistaConfigReferenceDoc: DocsDocSource = {
  category: 'reference',
  slug: 'vista-config-reference',
  title: 'Vista Config Reference',
  summary:
    'Reference for `vista.config.ts` including server settings, image config, and experimental typed API flags.',
  order: 1,
  updatedAt: '2026-03-04',
  sections: [
    {
      type: 'heading',
      level: 2,
      text: 'Minimal Config',
    },
    {
      type: 'code',
      language: 'ts',
      code: `const config = {};
export default config;`,
    },
    {
      type: 'heading',
      level: 2,
      text: 'Typed API Config',
    },
    {
      type: 'code',
      language: 'ts',
      code: `const config = {
  experimental: {
    typedApi: {
      enabled: true,
      serialization: 'json', // 'json' | 'superjson'
      bodySizeLimitBytes: 1024 * 1024,
    },
  },
};

export default config;`,
    },
    {
      type: 'heading',
      level: 2,
      text: 'Server Port',
    },
    {
      type: 'code',
      language: 'ts',
      code: `const config = {
  server: {
    port: 3000,
  },
};

export default config;`,
    },
    {
      type: 'heading',
      level: 2,
      text: 'Image Domains',
    },
    {
      type: 'code',
      language: 'ts',
      code: `const config = {
  images: {
    domains: ['example.com', 'cdn.myapp.com'],
  },
};

export default config;`,
    },
    {
      type: 'links',
      title: 'Related',
      links: [
        { label: 'Typed API Runtime Flow', href: '/docs/core-concepts/typed-api-runtime-flow' },
        { label: 'Project File Structure', href: '/docs/reference/project-file-structure' },
      ],
    },
  ],
};
