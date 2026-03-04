import type { DocsDocSource } from '../types';

export const vercelDeploymentDoc: DocsDocSource = {
  category: 'deployment',
  slug: 'vercel-deployment',
  title: 'Vercel Deployment (Experimental)',
  summary:
    'Vercel setup is available, but should be treated as experimental right now for Vista apps.',
  order: 3,
  updatedAt: '2026-03-04',
  sections: [
    {
      type: 'quote',
      text: 'Caution: Vercel support is not fully stable yet. Use Render for production-critical deployments.',
    },
    {
      type: 'paragraph',
      text: 'You can deploy Vista on Vercel, but treat it as beta. Keep fallback plan ready and validate every release with preview builds.',
    },
    {
      type: 'heading',
      level: 2,
      text: 'vercel.json Setup',
    },
    {
      type: 'code',
      language: 'json',
      title: 'vercel.json',
      code: `{
  "version": 2,
  "buildCommand": "npm run build",
  "outputDirectory": ".vista",
  "framework": null,
  "installCommand": "npm install --legacy-peer-deps --no-audit --no-fund",
  "devCommand": "npm run dev"
}`,
    },
    {
      type: 'heading',
      level: 2,
      text: 'Known Risks',
    },
    {
      type: 'list',
      items: [
        'Dependency resolution can vary between builds.',
        'React/RSC + custom runtime integration may behave differently than standard Next.js pipelines.',
        'Large runtime changes in Vista may require deploy config updates.',
      ],
    },
    {
      type: 'heading',
      level: 2,
      text: 'Recommendation',
    },
    {
      type: 'paragraph',
      text: 'For client projects and production SLAs, deploy on Render first. Use Vercel for preview/testing until Vista Vercel support is marked stable.',
    },
    {
      type: 'links',
      title: 'Related',
      links: [
        { label: 'Render Deployment (Recommended)', href: '/docs/deployment/render-deployment' },
        { label: 'Vista Config Reference', href: '/docs/reference/vista-config-reference' },
      ],
    },
  ],
};
