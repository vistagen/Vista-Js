import fs from 'fs';
import path from 'path';

type ArtifactMode = 'legacy' | 'rsc';

const BASE_REQUIRED_FILES = [
  'BUILD_ID',
  'artifact-manifest.json',
  'build-manifest.json',
  'routes-manifest.json',
  'app-path-routes-manifest.json',
  'prerender-manifest.json',
  'required-server-files.json',
  'react-client-manifest.json',
  'react-server-manifest.json',
];

const RSC_REQUIRED_FILES = [
  ...BASE_REQUIRED_FILES,
  path.join('server', 'server-manifest.json'),
];

const LEGACY_REQUIRED_FILES = [
  ...BASE_REQUIRED_FILES,
  'client.js',
];

function readJsonSafe<T>(absolutePath: string): T | null {
  try {
    return JSON.parse(fs.readFileSync(absolutePath, 'utf-8')) as T;
  } catch {
    return null;
  }
}

export function validateVistaArtifacts(cwd: string, mode: ArtifactMode): string[] {
  const vistaDir = path.join(cwd, '.vista');
  const missing: string[] = [];
  const requiredFiles = mode === 'rsc' ? RSC_REQUIRED_FILES : LEGACY_REQUIRED_FILES;

  if (!fs.existsSync(vistaDir)) {
    return ['.vista directory is missing'];
  }

  for (const relativePath of requiredFiles) {
    const absolutePath = path.join(vistaDir, relativePath);
    if (!fs.existsSync(absolutePath)) {
      missing.push(relativePath);
    }
  }

  const artifactPath = path.join(vistaDir, 'artifact-manifest.json');
  const artifactManifest = readJsonSafe<{ schemaVersion?: number }>(artifactPath);
  if (fs.existsSync(artifactPath) && (!artifactManifest || artifactManifest.schemaVersion !== 1)) {
    missing.push('artifact-manifest.json (invalid schemaVersion)');
  }

  return missing;
}

export function assertVistaArtifacts(cwd: string, mode: ArtifactMode): void {
  const missing = validateVistaArtifacts(cwd, mode);
  if (missing.length === 0) return;

  const missingList = missing.map((entry) => `- ${entry}`).join('\n');
  throw new Error(
    `[vista:server] Missing or invalid .vista artifacts for ${mode} mode.\n${missingList}\nRun "vista build${mode === 'rsc' ? ' --rsc' : ''}" first.`
  );
}

