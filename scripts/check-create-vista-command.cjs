#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const { CREATE_APP_PACKAGE } = require('./test-constants.cjs');

const repoRoot = process.cwd();

const scanTargets = [
  'README.md',
  'apps/web/components',
  'apps/web/data',
  'apps/components',
  `packages/${CREATE_APP_PACKAGE}/bin/cli.js`,
];

const allowedExtensions = new Set(['.md', '.tsx', '.ts', '.js', '.cjs', '.mjs']);

const checks = [
  {
    id: 'missing-latest',
    message: `npx ${CREATE_APP_PACKAGE} must include @latest`,
    regex: new RegExp(`\\bnpx\\s+${CREATE_APP_PACKAGE}(?!@latest\\b)`),
  },
  {
    id: 'legacy-install',
    message: `use npx ${CREATE_APP_PACKAGE}@latest instead of npm install ${CREATE_APP_PACKAGE}`,
    regex: new RegExp(`\\bnpm\\s+install\\s+${CREATE_APP_PACKAGE}(?!@latest\\b)`),
  },
];

const violations = [];

function shouldScanFile(filePath) {
  return allowedExtensions.has(path.extname(filePath));
}

function scanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split(/\r?\n/);

  lines.forEach((line, index) => {
    checks.forEach((check) => {
      if (check.regex.test(line)) {
        violations.push({
          filePath,
          line: index + 1,
          checkId: check.id,
          message: check.message,
          source: line.trim(),
        });
      }
    });
  });
}

function scanTarget(target) {
  const fullPath = path.join(repoRoot, target);
  if (!fs.existsSync(fullPath)) {
    return;
  }

  const stat = fs.statSync(fullPath);
  if (stat.isFile()) {
    if (shouldScanFile(fullPath)) {
      scanFile(fullPath);
    }
    return;
  }

  const entries = fs.readdirSync(fullPath, { withFileTypes: true });
  entries.forEach((entry) => {
    const entryPath = path.join(fullPath, entry.name);
    if (entry.isDirectory()) {
      scanTarget(path.relative(repoRoot, entryPath));
      return;
    }
    if (shouldScanFile(entryPath)) {
      scanFile(entryPath);
    }
  });
}

scanTargets.forEach(scanTarget);

if (violations.length > 0) {
  console.error('[guard:create-vista-command] Found command usage violations:');
  violations.forEach((violation) => {
    const relativePath = path.relative(repoRoot, violation.filePath);
    console.error(
      `- ${relativePath}:${violation.line} [${violation.checkId}] ${violation.message}`
    );
    console.error(`  ${violation.source}`);
  });
  process.exit(1);
}

console.log('[guard:create-vista-command] OK');
