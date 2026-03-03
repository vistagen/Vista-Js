#!/usr/bin/env node

/**
 * Vista Test Runner
 *
 * Deps:     https://github.com/jestjs/jest (npm: jest)
 *           https://github.com/isaacs/node-glob (npm: glob)
 * Install:  pnpm add -Dw jest glob
 * Run:      pnpm test:runner | pnpm test:unit | pnpm test:e2e
 *
 * Advanced test orchestrator with concurrency, retry, grouping,
 * and CI integration — inspired by the Next.js test runner.
 *
 * Usage:
 *   node run-tests.js                    # Run all tests
 *   node run-tests.js --type unit        # Run unit tests only
 *   node run-tests.js --type e2e         # Run e2e tests only
 *   node run-tests.js --concurrency 4    # Parallel test execution
 *   node run-tests.js --retries 2        # Retry failed tests
 *   node run-tests.js --group 1/4        # Run group 1 of 4 (CI splitting)
 *   node run-tests.js --filter "image"   # Filter by test name
 *   node run-tests.js --dry              # Show test list without running
 */

const path = require('path');
const { execSync, spawn } = require('child_process');
const fs = require('fs');
const glob = require('glob');

// ============================================================================
// CLI Arguments
// ============================================================================

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = {
    type: null, // unit | e2e | integration | regression | hardening
    concurrency: 1,
    retries: 0,
    group: null, // "1/4" format
    filter: null,
    dry: false,
    verbose: false,
    junit: !!process.env.VISTA_JUNIT_REPORT,
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--type':
        opts.type = args[++i];
        break;
      case '--concurrency':
        opts.concurrency = parseInt(args[++i], 10);
        break;
      case '--retries':
        opts.retries = parseInt(args[++i], 10);
        break;
      case '--group':
        opts.group = args[++i]; // "1/4"
        break;
      case '--filter':
        opts.filter = args[++i];
        break;
      case '--dry':
        opts.dry = true;
        break;
      case '--verbose':
        opts.verbose = true;
        break;
      default:
        break;
    }
  }

  return opts;
}

// ============================================================================
// Test Discovery
// ============================================================================

const TEST_PATTERNS = {
  unit: ['packages/*/src/**/*.test.{ts,tsx,js}', 'packages/*/test/**/*.test.{ts,tsx,js}'],
  e2e: ['test-app/**/*.test.{ts,tsx,js}', 'test/e2e/**/*.test.{ts,tsx,js}'],
  integration: ['test/integration/**/*.test.{ts,tsx,js}'],
  regression: ['scripts/test-regression.cjs'],
  hardening: ['scripts/test-vista-hardening.cjs'],
};

function discoverTests(opts) {
  let patterns = [];

  if (opts.type && TEST_PATTERNS[opts.type]) {
    patterns = TEST_PATTERNS[opts.type];
  } else {
    // All test types
    patterns = Object.values(TEST_PATTERNS).flat();
  }

  let testFiles = [];
  for (const pattern of patterns) {
    const matches = glob.sync(pattern, { cwd: process.cwd(), absolute: true });
    testFiles.push(...matches);
  }

  // Deduplicate
  testFiles = [...new Set(testFiles)];

  // Filter by name
  if (opts.filter) {
    const lowerFilter = opts.filter.toLowerCase();
    testFiles = testFiles.filter((f) => path.basename(f).toLowerCase().includes(lowerFilter));
  }

  // Sort alphabetically for deterministic ordering
  testFiles.sort();

  return testFiles;
}

// ============================================================================
// Group Splitting (CI)
// ============================================================================

function applyGrouping(testFiles, groupStr) {
  if (!groupStr) return testFiles;

  const [groupNum, totalGroups] = groupStr.split('/').map(Number);
  if (!groupNum || !totalGroups || groupNum > totalGroups) {
    console.error(`Invalid --group format: "${groupStr}" (expected "N/M")`);
    process.exit(1);
  }

  const perGroup = Math.ceil(testFiles.length / totalGroups);
  const start = (groupNum - 1) * perGroup;
  const end = Math.min(start + perGroup, testFiles.length);

  console.log(
    `  Group ${groupNum}/${totalGroups}: tests ${start + 1}-${end} of ${testFiles.length}`
  );

  return testFiles.slice(start, end);
}

// ============================================================================
// Test Execution
// ============================================================================

function runTest(testFile, retries, verbose) {
  const ext = path.extname(testFile);
  const isScript = ext === '.cjs' || ext === '.mjs';

  let command;
  if (isScript) {
    command = `node "${testFile}"`;
  } else {
    command = `npx jest --no-cache --runInBand "${testFile}"`;
  }

  for (let attempt = 0; attempt <= retries; attempt++) {
    if (attempt > 0) {
      console.log(`  ↻ Retry ${attempt}/${retries}: ${path.basename(testFile)}`);
    }

    try {
      execSync(command, {
        stdio: verbose ? 'inherit' : 'pipe',
        cwd: process.cwd(),
        timeout: 120_000, // 2 minute timeout per test
        env: {
          ...process.env,
          NODE_ENV: 'test',
        },
      });
      return { file: testFile, status: 'pass', attempts: attempt + 1 };
    } catch (error) {
      if (attempt === retries) {
        return {
          file: testFile,
          status: 'fail',
          attempts: attempt + 1,
          error: error.stderr?.toString()?.slice(0, 500) || error.message,
        };
      }
    }
  }
}

async function runTestsConcurrently(testFiles, concurrency, retries, verbose) {
  const results = [];
  const queue = [...testFiles];
  const running = [];

  while (queue.length > 0 || running.length > 0) {
    // Fill up to concurrency limit
    while (queue.length > 0 && running.length < concurrency) {
      const testFile = queue.shift();
      const promise = new Promise((resolve) => {
        // Run synchronously in a "slot" but wrap in promise for tracking
        const result = runTest(testFile, retries, verbose);
        resolve(result);
      });
      running.push(promise);
    }

    // Wait for at least one to complete
    if (running.length > 0) {
      const result = await Promise.race(running);
      results.push(result);
      running.splice(running.indexOf(Promise.resolve(result)), 1);
    }
  }

  // Wait for remaining
  const remaining = await Promise.all(running);
  results.push(...remaining);

  return results;
}

// ============================================================================
// Reporting
// ============================================================================

function printResults(results, startTime) {
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  const passed = results.filter((r) => r.status === 'pass');
  const failed = results.filter((r) => r.status === 'fail');

  console.log('');
  console.log('═══════════════════════════════════════════════');
  console.log(`  Tests: ${passed.length} passed, ${failed.length} failed, ${results.length} total`);
  console.log(`  Time:  ${elapsed}s`);
  console.log('═══════════════════════════════════════════════');

  if (failed.length > 0) {
    console.log('');
    console.log('Failed tests:');
    for (const f of failed) {
      console.log(`  ✗ ${path.relative(process.cwd(), f.file)}`);
      if (f.error) {
        console.log(`    ${f.error.split('\n')[0]}`);
      }
    }
  }

  return failed.length === 0 ? 0 : 1;
}

function writeJUnitReport(results) {
  const testSuites = results.map((r) => {
    const name = path.relative(process.cwd(), r.file);
    const time = '0'; // Simplified
    const failure =
      r.status === 'fail' ? `<failure message="${escapeXml(r.error || 'Test failed')}" />` : '';
    return `  <testcase classname="vista" name="${escapeXml(name)}" time="${time}">${failure}</testcase>`;
  });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<testsuites name="Vista Tests" tests="${results.length}" failures="${results.filter((r) => r.status === 'fail').length}">
  <testsuite name="vista" tests="${results.length}">
${testSuites.join('\n')}
  </testsuite>
</testsuites>`;

  const reportPath = path.join(process.cwd(), 'test-results.xml');
  fs.writeFileSync(reportPath, xml);
  console.log(`  JUnit report: ${reportPath}`);
}

function escapeXml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ============================================================================
// Main
// ============================================================================

async function main() {
  const opts = parseArgs();
  const startTime = Date.now();

  console.log('');
  console.log('  Vista Test Runner');
  console.log('  ─────────────────');

  // Discover tests
  let testFiles = discoverTests(opts);

  if (testFiles.length === 0) {
    console.log('  No tests found.');
    process.exit(0);
  }

  // Apply grouping
  testFiles = applyGrouping(testFiles, opts.group);

  console.log(`  Found ${testFiles.length} test file(s)`);
  if (opts.type) console.log(`  Type: ${opts.type}`);
  if (opts.concurrency > 1) console.log(`  Concurrency: ${opts.concurrency}`);
  if (opts.retries > 0) console.log(`  Retries: ${opts.retries}`);
  console.log('');

  // Dry run
  if (opts.dry) {
    console.log('  Test files (dry run):');
    testFiles.forEach((f) => {
      console.log(`    • ${path.relative(process.cwd(), f)}`);
    });
    process.exit(0);
  }

  // Run tests
  let results;
  if (opts.concurrency > 1) {
    results = await runTestsConcurrently(testFiles, opts.concurrency, opts.retries, opts.verbose);
  } else {
    results = [];
    for (const testFile of testFiles) {
      const baseName = path.relative(process.cwd(), testFile);
      process.stdout.write(`  ○ ${baseName}...`);
      const result = runTest(testFile, opts.retries, opts.verbose);
      results.push(result);
      console.log(result.status === 'pass' ? ` ✓` : ` ✗`);
    }
  }

  // Report
  const exitCode = printResults(results, startTime);

  if (opts.junit) {
    writeJUnitReport(results);
  }

  process.exit(exitCode);
}

main().catch((err) => {
  console.error('Test runner error:', err);
  process.exit(1);
});
