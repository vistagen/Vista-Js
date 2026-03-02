#!/usr/bin/env node

const command = process.argv[2];
const flags = process.argv.slice(3);

// RSC is the default mode (like Next.js App Router)
// Use --legacy to fall back to traditional SSR mode
const useLegacy = flags.includes('--legacy') || process.env.VISTA_LEGACY === 'true';
const useRSC = !useLegacy;

// Mark startup time for "Ready in Xms" display
const { markStartTime } = require('../dist/server/logger');
markStartTime();

if (command === 'dev') {
  if (useRSC) {
    // RSC Mode (default) - True React Server Components Architecture
    const { buildRSC } = require('../dist/bin/build-rsc');
    const { startRSCServer } = require('../dist/server/rsc-engine');

    buildRSC(true)
      .then(({ clientCompiler }) => {
        startRSCServer({
          port: process.env.PORT || 3003,
          compiler: clientCompiler,
        });
      })
      .catch((err) => {
        console.error('RSC Build failed:', err);
        process.exit(1);
      });
  } else {
    // Legacy SSR Mode (--legacy)
    const { startServer } = require('../dist/server/engine');
    const { buildClient } = require('../dist/bin/build');

    buildClient(true)
      .then((compiler) => {
        startServer(process.env.PORT || 3003, compiler);
      })
      .catch((err) => {
        console.error('Build failed:', err);
        process.exit(1);
      });
  }
} else if (command === 'build') {
  if (useRSC) {
    // RSC Production Build (default)
    const { buildRSC } = require('../dist/bin/build-rsc');

    buildRSC(false)
      .then(() => {
        console.log('');
        console.log('Production build complete!');
      })
      .catch((err) => {
        console.error('RSC Build failed:', err);
        process.exit(1);
      });
  } else {
    // Legacy Build (--legacy)
    const { buildClient } = require('../dist/bin/build');

    buildClient(false)
      .then(() => {
        console.log('Production build complete!');
      })
      .catch((err) => {
        console.error('Build failed:', err);
        process.exit(1);
      });
  }
} else if (command === 'start') {
  if (useRSC) {
    const { startRSCServer } = require('../dist/server/rsc-engine');
    startRSCServer({ port: process.env.PORT || 3003 });
  } else {
    const { startServer } = require('../dist/server/engine');
    startServer(process.env.PORT || 3003);
  }
} else {
  console.log('');
  console.log('Vista JS Framework CLI');
  console.log('');
  console.log('Usage: vista <command> [options]');
  console.log('');
  console.log('Commands:');
  console.log('  dev     Start development server with HMR');
  console.log('  build   Create production build');
  console.log('  start   Start production server');
  console.log('');
  console.log('Options:');
  console.log('  --legacy   Use traditional SSR mode (instead of RSC)');
  console.log('');
  console.log('Examples:');
  console.log('  vista dev            # Start dev server (RSC mode)');
  console.log('  vista dev --legacy   # Start dev server with legacy SSR');
  console.log('  vista build          # Production build with RSC');
  console.log('');
}
