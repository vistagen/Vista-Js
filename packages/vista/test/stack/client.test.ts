import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import express from 'express';

import { createVistaClient, VistaClientError } from '../../src/stack/client';
import type { GetOperation, PostOperation } from '../../src/stack/server';
import { runTypedApiRoute } from '../../src/server/typed-api-runtime';

interface TestRouteMap {
  '/ping': GetOperation<void, { ok: true }, {}, unknown>;
  '/echo': PostOperation<{ text: string }, { text: string }, {}, unknown>;
  '/time': PostOperation<{ at: Date }, { at: Date; now: Date }, {}, unknown>;
}

function makeTempProject(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'vista-client-phase3-'));
}

async function withTypedApiServer(
  cwd: string,
  options: { serialization: 'json' | 'superjson'; enabled?: boolean },
  fn: (baseUrl: string) => Promise<void>
): Promise<void> {
  const app = express();
  app.use(async (req, res) => {
    const handled = await runTypedApiRoute({
      req,
      res,
      cwd,
      isDev: true,
      config: {
        enabled: options.enabled ?? true,
        serialization: options.serialization,
        bodySizeLimitBytes: 1024 * 1024,
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
    await fn(`http://127.0.0.1:${port}/api`);
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

function writeTypedApiEntrypoint(cwd: string): void {
  const stackEntry = path.resolve(__dirname, '../../src/stack/index.ts').replace(/\\/g, '\\\\');
  const typedEntrypoint = path.join(cwd, 'app', 'api', 'typed.ts');

  fs.mkdirSync(path.dirname(typedEntrypoint), { recursive: true });
  fs.writeFileSync(
    typedEntrypoint,
    [
      `const { vstack } = require('${stackEntry}');`,
      'const v = vstack.init();',
      'const timeInputSchema = {',
      '  parse(value) {',
      "    if (!value || !(value.at instanceof Date)) throw new Error('at must be Date');",
      '    return value;',
      '  },',
      '};',
      'const router = v.router({',
      "  ping: v.procedure.query(() => ({ ok: true })),",
      '  echo: v.procedure.input({ parse: (value) => value }).mutation(({ input }) => input),',
      '  time: v.procedure.input(timeInputSchema).mutation(({ input }) => ({',
      '    at: input.at,',
      "    now: new Date('2026-01-01T00:00:00.000Z'),",
      '  })),',
      '});',
      'module.exports = { router };',
      '',
    ].join('\n'),
    'utf8'
  );
}

test('createVistaClient supports $url/$get/$post in json mode', async () => {
  const cwd = makeTempProject();
  try {
    writeTypedApiEntrypoint(cwd);

    await withTypedApiServer(cwd, { serialization: 'json' }, async (baseUrl) => {
      const client = createVistaClient<TestRouteMap>({
        baseUrl,
        serialization: 'json',
      });

      const url = client.$url('/ping', undefined);
      assert.equal(url, `${baseUrl}/ping`);

      const queryUrl = client.$url('/echo', { text: 'hello world' });
      assert.equal(queryUrl, `${baseUrl}/echo?text=hello+world`);

      const ping = await client.$get('/ping');
      assert.deepEqual(ping, { ok: true });

      const echoed = await client.$post('/echo', { text: 'vista' });
      assert.deepEqual(echoed, { text: 'vista' });
    });
  } finally {
    fs.rmSync(cwd, { recursive: true, force: true });
  }
});

test('createVistaClient supports optional superjson serialization', async () => {
  const cwd = makeTempProject();
  try {
    writeTypedApiEntrypoint(cwd);

    await withTypedApiServer(cwd, { serialization: 'superjson' }, async (baseUrl) => {
      const client = createVistaClient<TestRouteMap>({
        baseUrl,
        serialization: 'superjson',
      });

      const at = new Date('2025-07-10T12:00:00.000Z');
      const result = await client.$post('/time', { at });

      assert.equal(result.at instanceof Date, true);
      assert.equal(result.now instanceof Date, true);
      assert.equal(result.at.toISOString(), at.toISOString());
      assert.equal(result.now.toISOString(), '2026-01-01T00:00:00.000Z');
    });
  } finally {
    fs.rmSync(cwd, { recursive: true, force: true });
  }
});

test('VistaClientError exposes status and message for failed requests', async () => {
  const cwd = makeTempProject();
  try {
    writeTypedApiEntrypoint(cwd);

    await withTypedApiServer(cwd, { serialization: 'json', enabled: false }, async (baseUrl) => {
      const client = createVistaClient<TestRouteMap>({
        baseUrl,
        serialization: 'json',
      });

      await assert.rejects(
        () => client.$get('/ping'),
        (error: unknown) =>
          error instanceof VistaClientError &&
          error.status === 404 &&
          typeof error.message === 'string' &&
          error.message.includes('API Route Not Found')
      );
    });
  } finally {
    fs.rmSync(cwd, { recursive: true, force: true });
  }
});
