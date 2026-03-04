import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import express from 'express';

import {
  resolveLegacyApiRoutePath,
  runLegacyApiRoute,
  runTypedApiRoute,
} from '../../src/server/typed-api-runtime';

type EngineMode = 'legacy' | 'rsc';

function makeTempProject(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'vista-engine-typed-'));
}

function writeFixtureProject(cwd: string): void {
  const stackEntry = path.resolve(__dirname, '../../src/stack/index.ts').replace(/\\/g, '\\\\');
  const typedEntrypoint = path.join(cwd, 'app', 'api', 'typed.ts');
  const legacyPingRoute = path.join(cwd, 'app', 'api', 'ping', 'route.ts');

  fs.mkdirSync(path.dirname(typedEntrypoint), { recursive: true });
  fs.writeFileSync(
    typedEntrypoint,
    [
      `const { vstack } = require('${stackEntry}');`,
      'const v = vstack.init();',
      'const router = v.router({',
      "  ping: v.procedure.query(() => ({ source: 'typed' })),",
      "  typedOnly: v.procedure.query(() => ({ source: 'typed-only' })),",
      '});',
      'module.exports = { router };',
      '',
    ].join('\n'),
    'utf8'
  );

  fs.mkdirSync(path.dirname(legacyPingRoute), { recursive: true });
  fs.writeFileSync(
    legacyPingRoute,
    [
      'exports.GET = async function GET() {',
      "  return Response.json({ source: 'legacy' }, { status: 200 });",
      '};',
      '',
    ].join('\n'),
    'utf8'
  );
}

async function withEngineLikeServer(
  cwd: string,
  mode: EngineMode,
  typedApiEnabled: boolean,
  run: (origin: string) => Promise<void>
): Promise<void> {
  const app = express();

  app.use(async (req, res) => {
    if (!req.path.startsWith('/api/')) {
      res.status(404).json({ error: 'Not Found' });
      return;
    }

    const legacyApiPath = resolveLegacyApiRoutePath(cwd, req.path);
    if (legacyApiPath) {
      await runLegacyApiRoute({
        req,
        res,
        apiPath: legacyApiPath,
        isDev: true,
      });
      return;
    }

    const typedHandled = await runTypedApiRoute({
      req,
      res,
      cwd,
      isDev: true,
      config: {
        enabled: typedApiEnabled,
        serialization: 'json',
        bodySizeLimitBytes: 1024 * 1024,
      },
    });
    if (typedHandled) {
      return;
    }

    res.status(404).json({ error: `${mode.toUpperCase()} API Route Not Found` });
  });

  const server = await new Promise<import('node:http').Server>((resolve) => {
    const instance = app.listen(0, () => resolve(instance));
  });

  try {
    const address = server.address();
    const port = typeof address === 'object' && address ? address.port : 0;
    await run(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

for (const mode of ['legacy', 'rsc'] as const) {
  test(`${mode} engine flow keeps legacy API precedence over typed route`, async () => {
    const cwd = makeTempProject();
    try {
      writeFixtureProject(cwd);

      await withEngineLikeServer(cwd, mode, true, async (origin) => {
        const ping = await fetch(`${origin}/api/ping`);
        assert.equal(ping.status, 200);
        assert.deepEqual(await ping.json(), { source: 'legacy' });
      });
    } finally {
      fs.rmSync(cwd, { recursive: true, force: true });
    }
  });

  test(`${mode} engine flow uses typed route fallback when legacy file is missing`, async () => {
    const cwd = makeTempProject();
    try {
      writeFixtureProject(cwd);

      await withEngineLikeServer(cwd, mode, true, async (origin) => {
        const typedOnly = await fetch(`${origin}/api/typedOnly`);
        assert.equal(typedOnly.status, 200);
        assert.deepEqual(await typedOnly.json(), { source: 'typed-only' });
      });
    } finally {
      fs.rmSync(cwd, { recursive: true, force: true });
    }
  });

  test(`${mode} engine flow can rollback typed API with config flag`, async () => {
    const cwd = makeTempProject();
    try {
      writeFixtureProject(cwd);

      await withEngineLikeServer(cwd, mode, false, async (origin) => {
        const typedOnly = await fetch(`${origin}/api/typedOnly`);
        assert.equal(typedOnly.status, 404);
        assert.deepEqual(await typedOnly.json(), { error: `${mode.toUpperCase()} API Route Not Found` });

        const ping = await fetch(`${origin}/api/ping`);
        assert.equal(ping.status, 200);
        assert.deepEqual(await ping.json(), { source: 'legacy' });
      });
    } finally {
      fs.rmSync(cwd, { recursive: true, force: true });
    }
  });
}
