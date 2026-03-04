import type { DocsDocSource } from '../types';

export const packagePublishingDoc: DocsDocSource = {
  category: 'deployment',
  slug: 'package-publishing',
  title: 'Package Publishing',
  summary:
    'Publish both framework and CLI packages safely in a monorepo setup with version checks and npm 2FA handling.',
  order: 1,
  updatedAt: '2026-03-04',
  sections: [
    {
      type: 'heading',
      level: 2,
      text: 'Before Publish',
    },
    {
      type: 'list',
      items: [
        'Ensure versions in package manifests are bumped.',
        'Commit all changes; Lerna blocks publish on dirty tree.',
        'Run local build for affected packages.',
        'Verify npm owner and access for scoped packages.',
      ],
    },
    {
      type: 'heading',
      level: 2,
      text: 'Monorepo Publish Command',
    },
    {
      type: 'code',
      language: 'bash',
      title: 'From repo root',
      code: `npx lerna publish from-git --yes`,
    },
    {
      type: 'heading',
      level: 2,
      text: 'If OTP / 2FA Blocks You',
    },
    {
      type: 'list',
      items: [
        'Use a fresh authenticator code; old codes expire quickly.',
        'Recovery code can be used once, then rotate remaining codes.',
        'For package-specific retry, run `npm publish --access public --otp=<fresh_code>` inside that package directory.',
      ],
    },
    {
      type: 'heading',
      level: 2,
      text: 'Post Publish Verification',
    },
    {
      type: 'code',
      language: 'bash',
      code: `npm view @vistagenic/vista version
npm view create-vista-app version`,
    },
    {
      type: 'links',
      title: 'Continue',
      links: [{ label: 'Vista Config Reference', href: '/docs/reference/vista-config-reference' }],
    },
  ],
};
