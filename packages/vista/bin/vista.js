#!/usr/bin/env node

const command = process.argv[2];
const flags = process.argv.slice(3);

// Check for RSC mode flag
const useRSC = flags.includes('--rsc') || process.env.VISTA_RSC === 'true';

if (command === 'dev') {
  if (useRSC) {
    // RSC Mode - True React Server Components Architecture
    console.log('');
    console.log('🚀 Starting Vista in RSC mode (React Server Components)');
    console.log('');

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
    // Legacy Mode
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
    // RSC Production Build
    const { buildRSC } = require('../dist/bin/build-rsc');

    buildRSC(false)
      .then(() => {
        console.log('');
        console.log('✅ RSC Production build complete!');
      })
      .catch((err) => {
        console.error('RSC Build failed:', err);
        process.exit(1);
      });
  } else {
    // Legacy Build
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
  console.log('Vista Framework CLI');
  console.log('');
  console.log('Usage: vista <command> [options]');
  console.log('');
  console.log('Commands:');
  console.log('  dev     Start development server with HMR');
  console.log('  build   Create production build');
  console.log('  start   Start production server');
  console.log('');
  console.log('Options:');
  console.log('  --rsc   Enable React Server Components mode');
  console.log('');
  console.log('Examples:');
  console.log('  vista dev          # Start dev server (legacy mode)');
  console.log('  vista dev --rsc    # Start dev server with RSC');
  console.log('  vista build --rsc  # Production build with RSC');
  console.log('');
}
