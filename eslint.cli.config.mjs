/**
 * Vista Strict ESLint Config (CI-only)
 *
 * Official: https://github.com/typescript-eslint/typescript-eslint
 * Docs:     https://typescript-eslint.io/getting-started/typed-linting
 * Run:      pnpm lint:strict
 *
 * Extends the base eslint.config.mjs with type-checked rules that
 * are too slow for real-time editor use but valuable in CI.
 *
 * Usage:
 *   pnpm lint:strict
 *   eslint --config eslint.cli.config.mjs .
 */

import tseslint from 'typescript-eslint';
import baseConfig from './eslint.config.mjs';

export default tseslint.config(
  // Inherit all base rules
  ...baseConfig,

  // Add strict type-checked rules for TS/TSX only
  {
    files: ['packages/**/*.ts', 'packages/**/*.tsx'],
    ignores: ['**/node_modules/**', '**/*.d.ts', 'test-app/**', 'apps/**'],
    languageOptions: {
      parserOptions: {
        project: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // Catch unhandled promises — common source of silent bugs
      '@typescript-eslint/no-floating-promises': 'error',

      // Ensure all switch cases are exhaustive
      '@typescript-eslint/switch-exhaustiveness-check': 'error',

      // Prevent unsafe any usage in critical paths
      '@typescript-eslint/no-unsafe-assignment': 'warn',
      '@typescript-eslint/no-unsafe-call': 'warn',
    },
  }
);
