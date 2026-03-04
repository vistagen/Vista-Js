import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import express from 'express';

import { loadConfig, resolveTypedApiConfig } from '../../src/config';
import { resolveLegacyApiRoutePath, runTypedApiRoute } from '../../src/server/typed-api-runtime';

function makeTempProject(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'vista-phase2-'));
}

test('resolveTypedApiConfig returns sanitized defaults and overrides', () => {
  const defaults = resolveTypedApiConfig({});
  assert.deepEqual(defaults, {
    enabled: false,
    serialization: 'json',
    bodySizeLimitBytes: 1024 * 1024,
  });

  const overridden = resolveTypedApiConfig({
    experimental: {
      typedApi: {
        enabled: true,
        serialization: 'superjson',
        bodySizeLimitBytes: 2048,
      },
    },
  });

  assert.deepEqual(overridden, {
    enabled: true,
    serialization: 'superjson',
    bodySizeLimitBytes: 2048,
  });

  const invalid = resolveTypedApiConfig({
    experimental: {
      typedApi: {
        enabled: true,
        serialization: 'invalid-mode' as any,
        bodySizeLimitBytes: -12,
      },
    },
  });
  assert.equal(invalid.serialization, 'json');
  assert.equal(invalid.bodySizeLimitBytes, 1024 * 1024);
});

test('loadConfig deep-merges experimental typedApi and validation defaults', () => {
  const cwd = makeTempProject();
  try {
    fs.writeFileSync(
      path.join(cwd, 'vista.config.js'),
      [
        'module.exports = {',
        '  experimental: { typedApi: { enabled: true, bodySizeLimitBytes: 5120 } },',
        "  validation: { structure: { mode: 'warn' } },",
        '};',
        '',
      ].join('\n'),
      'utf8'
    );

    const config = loadConfig(cwd);
    const typedApi = resolveTypedApiConfig(config);

    assert.deepEqual(typedApi, {
      enabled: true,
      serialization: 'json',
      bodySizeLimitBytes: 5120,
    });
    assert.equal(config.validation?.structure?.mode, 'warn');
    assert.equal(config.validation?.structure?.watchDebounceMs, 120);
  } finally {
    fs.rmSync(cwd, { recursive: true, force: true });
  }
});

test('resolveLegacyApiRoutePath keeps route.ts precedence over legacy file', () => {
  const cwd = makeTempProject();

  try {
    const routeTs = path.join(cwd, 'app', 'api', 'posts', 'route.ts');
    const legacyTs = path.join(cwd, 'app', 'api', 'posts.ts');
    fs.mkdirSync(path.dirname(routeTs), { recursive: true });
    fs.writeFileSync(routeTs, 'export const GET = () => ({ ok: true });', 'utf8');
    fs.mkdirSync(path.dirname(legacyTs), { recursive: true });
    fs.writeFileSync(legacyTs, 'export default function handler() {}', 'utf8');

    const resolved = resolveLegacyApiRoutePath(cwd, '/api/posts');
    assert.equal(resolved, routeTs);

    const missing = resolveLegacyApiRoutePath(cwd, '/api/unknown');
    assert.equal(missing, null);
  } finally {
    fs.rmSync(cwd, { recursive: true, force: true });
  }
});

test('runTypedApiRoute serves typed endpoints only when experimental flag is enabled', async () => {
  const cwd = makeTempProject();
  const stackEntry = path.resolve(__dirname, '../../src/stack/index.ts').replace(/\\/g, '\\\\');
  const typedEntrypoint = path.join(cwd, 'app', 'api', 'typed.ts');

  try {
    fs.mkdirSync(path.dirname(typedEntrypoint), { recursive: true });
    fs.writeFileSync(
      typedEntrypoint,
      [
        `const { vstack } = require('${stackEntry}');`,
        'const v = vstack.init();',
        'const payloadSchema = { parse(value) { return value; } };',
        'const router = v.router({',
        "  ping: v.procedure.query(() => ({ ok: true })),",
        '  echo: v.procedure.input(payloadSchema).mutation(({ input }) => input),',
        '});',
        'module.exports = { router };',
        '',
      ].join('\n'),
      'utf8'
    );

    const app = express();
    app.use(async (req, res) => {
      const handled = await runTypedApiRoute({
        req,
        res,
        cwd,
        isDev: true,
        config: {
          enabled: true,
          serialization: 'json',
          bodySizeLimitBytes: 4096,
        },
      });

      if (!handled) {
        res.status(404).json({ error: 'API Route Not Found' });
      }
    });

    const server = await new Promise<import('node:http').Server>((resolve) => {
      const instance = app.listen(0, () => resolve(instance));
    });

    try {
      const address = server.address();
      const port = typeof address === 'object' && address ? address.port : 0;
      const baseUrl = `http://127.0.0.1:${port}`;

      const getResponse = await fetch(`${baseUrl}/api/ping`);
      assert.equal(getResponse.status, 200);
      assert.deepEqual(await getResponse.json(), { ok: true });

      const postResponse = await fetch(`${baseUrl}/api/echo`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ echoed: 'yes' }),
      });
      assert.equal(postResponse.status, 200);
      assert.deepEqual(await postResponse.json(), { echoed: 'yes' });
    } finally {
      await new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      });
    }
  } finally {
    fs.rmSync(cwd, { recursive: true, force: true });
  }
});

test('runTypedApiRoute does not handle requests when typed API is disabled', async () => {
  const cwd = makeTempProject();
  const stackEntry = path.resolve(__dirname, '../../src/stack/index.ts').replace(/\\/g, '\\\\');
  const typedEntrypoint = path.join(cwd, 'app', 'api', 'typed.ts');

  try {
    fs.mkdirSync(path.dirname(typedEntrypoint), { recursive: true });
    fs.writeFileSync(
      typedEntrypoint,
      [
        `const { vstack } = require('${stackEntry}');`,
        'const v = vstack.init();',
        "const router = v.router({ ping: v.procedure.query(() => ({ ok: true })) });",
        'module.exports = { router };',
        '',
      ].join('\n'),
      'utf8'
    );

    const app = express();
    app.use(async (req, res) => {
      const handled = await runTypedApiRoute({
        req,
        res,
        cwd,
        isDev: true,
        config: {
          enabled: false,
          serialization: 'json',
          bodySizeLimitBytes: 4096,
        },
      });

      if (!handled) {
        res.status(404).json({ error: 'API Route Not Found' });
      }
    });

    const server = await new Promise<import('node:http').Server>((resolve) => {
      const instance = app.listen(0, () => resolve(instance));
    });

    try {
      const address = server.address();
      const port = typeof address === 'object' && address ? address.port : 0;
      const baseUrl = `http://127.0.0.1:${port}`;

      const response = await fetch(`${baseUrl}/api/ping`);
      assert.equal(response.status, 404);
      assert.deepEqual(await response.json(), { error: 'API Route Not Found' });
    } finally {
      await new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      });
    }
  } finally {
    fs.rmSync(cwd, { recursive: true, force: true });
  }
});
