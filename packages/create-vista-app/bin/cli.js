#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const prompts = require('prompts');

const usageCommand = 'npx create-vista-app@latest <project-name>';

// Detect which package manager invoked us (npm, pnpm, yarn, bun)
function detectPackageManager() {
  const ua = process.env.npm_config_user_agent || '';
  if (ua.startsWith('pnpm')) return 'pnpm';
  if (ua.startsWith('yarn')) return 'yarn';
  if (ua.startsWith('bun')) return 'bun';
  return 'npm';
}

const pkgManager = detectPackageManager();
const rawArgs = process.argv.slice(2);
const useTypedApiStarter = rawArgs.includes('--typed-api') || rawArgs.includes('--typed');
const skipInstall = rawArgs.includes('--skip-install');
const skipGit = rawArgs.includes('--no-git');
const assumeYes = rawArgs.includes('--yes') || rawArgs.includes('-y');
const canPrompt = !!(process.stdin.isTTY && process.stdout.isTTY);

if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
Usage:
  ${usageCommand} [--typed-api] [--skip-install] [--no-git] [--yes]

Example:
  npx create-vista-app@latest my-vista-app
  npx create-vista-app@latest
  npx create-vista-app@latest my-vista-app --typed-api
`);
  process.exit(0);
}

async function resolveProjectName() {
  const args = rawArgs.filter((arg) => !arg.startsWith('-'));
  if (args[0]) return args[0];

  if (!canPrompt) {
    return 'my-vista-app';
  }

  const response = await prompts({
    type: 'text',
    name: 'projectName',
    message: 'Project name?',
    initial: 'my-vista-app',
    validate: (value) => {
      const trimmed = String(value || '').trim();
      if (!trimmed) return 'Project name is required.';
      if (/[<>:"/\\|?*\x00-\x1F]/.test(trimmed)) return 'Use a valid folder name.';
      return true;
    },
  });

  const value = String(response.projectName || '').trim();
  if (!value) {
    console.log('Aborted.');
    process.exit(0);
  }
  return value;
}
async function confirmProceed(projectName, projectDir) {
  if (assumeYes || !canPrompt) return true;
  const response = await prompts({
    type: 'confirm',
    name: 'proceed',
    message: `Create Vista app "${projectName}" in ${projectDir}?`,
    initial: true,
  });
  return response.proceed !== false;
}

function copyRecursiveSync(src, dest) {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();
  if (isDirectory) {
    fs.mkdirSync(dest, { recursive: true });
    fs.readdirSync(src).forEach((childItemName) => {
      copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

async function main() {
  const useLocal = rawArgs.includes('--local');
  const currentDir = process.cwd();
  const projectName = await resolveProjectName();
  const projectDir = path.join(currentDir, projectName);

  const proceed = await confirmProceed(projectName, projectDir);
  if (!proceed) {
    console.log('Aborted.');
    process.exit(0);
  }

  console.log(`Creating a new Vista app in ${projectDir}...`);

  // 1. Create Directory
  if (fs.existsSync(projectDir)) {
    console.error(`Error: Directory ${projectName} already exists.`);
    process.exit(1);
  }
  fs.mkdirSync(projectDir);

  // 2. Copy Template
  const templateDir = path.join(__dirname, '../template');
  copyRecursiveSync(templateDir, projectDir);

  if (useTypedApiStarter) {
    const typedTemplateDir = path.join(__dirname, '../template-typed');
    copyRecursiveSync(typedTemplateDir, projectDir);
    console.log('Added typed API starter files.');
  }

  console.log('Scaffolding complete.');

  // 3. Setup Dependencies (production-ready)
  const packageJson = {
    name: projectName,
    version: '0.1.0',
    scripts: {
      dev: 'vista dev',
      build: 'vista build',
      start: 'vista start',
    },
    dependencies: {
      // Runtime dependencies
      react: '^19.0.0',
      'react-dom': '^19.0.0',
      'react-server-dom-webpack': '^19.0.0',
      vista: useLocal ? 'file:../packages/vista' : 'npm:@vistagenic/vista@latest',
      // CSS build (needed in production for vista build)
      postcss: '^8.0.0',
      'postcss-cli': '^11.0.0',
      tailwindcss: '^4.0.0',
      '@tailwindcss/postcss': '^4.0.0',
      // Node 20+ SSR compatibility
      '@swc-node/register': '^1.9.0',
      '@swc/core': '^1.4.0',
      tsx: '^4.7.0',
    },
    devDependencies: {
      typescript: '^5.0.0',
      '@types/react': '^19.0.0',
      '@types/react-dom': '^19.0.0',
    },
  };

  fs.writeFileSync(path.join(projectDir, 'package.json'), JSON.stringify(packageJson, null, 2));

  // 4. Create .gitignore
  const gitignoreContent = `# Dependencies
node_modules/
.pnpm-store/

# Build outputs
dist/
.vista/
.next/
out/

# Rust artifacts
target/
*.node

# IDE
.idea/
.vscode/
*.swp
*.swo

# Environment
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*

# OS files
.DS_Store
Thumbs.db

# TypeScript
*.tsbuildinfo

# Testing
coverage/

# Misc
*.log
`;

  fs.writeFileSync(path.join(projectDir, '.gitignore'), gitignoreContent);

  console.log('Created .gitignore');

  // 5. Initialize Git Repository
  if (!skipGit) {
    try {
      execSync('git init', { cwd: projectDir, stdio: 'pipe' });
      execSync('git add .', { cwd: projectDir, stdio: 'pipe' });
      execSync('git commit -m "Initial commit from create-vista-app"', {
        cwd: projectDir,
        stdio: 'pipe',
        env: {
          ...process.env,
          GIT_AUTHOR_NAME: 'Vista',
          GIT_AUTHOR_EMAIL: 'vista@example.com',
          GIT_COMMITTER_NAME: 'Vista',
          GIT_COMMITTER_EMAIL: 'vista@example.com',
        },
      });
      console.log('Initialized git repository with initial commit');
    } catch (e) {
      // Git might not be installed, that's okay
      console.log('Note: Could not initialize git repository. You can do this manually with: git init');
    }
  } else {
    console.log('Skipped git initialization (--no-git).');
  }

  // 6. Install Dependencies
  const installCmd = pkgManager === 'yarn' ? 'yarn' : `${pkgManager} install`;
  if (!skipInstall) {
    console.log(`\nInstalling dependencies with ${pkgManager}... This may take a moment.\n`);
    try {
      execSync(installCmd, { cwd: projectDir, stdio: 'inherit' });
      console.log(`\n✓ Dependencies installed successfully!`);
    } catch (e) {
      console.log(
        `\nNote: Could not install dependencies automatically. Run "${installCmd}" manually.`
      );
    }
  } else {
    console.log('\nSkipped dependency installation (--skip-install).');
  }

  const runCmd = pkgManager === 'npm' ? 'npm run' : pkgManager;
  const createCmd =
    pkgManager === 'pnpm'
      ? 'pnpm create vista-app'
      : pkgManager === 'yarn'
        ? 'yarn create vista-app'
        : pkgManager === 'bun'
          ? 'bun create vista-app'
          : 'npx create-vista-app@latest';

  console.log(`
✨ Success! Created ${projectName} at ${projectDir}

Get started by running:

  cd ${projectName}
  ${runCmd} dev

Create another app anytime with:
  ${createCmd} <project-name>

Happy Hacking! 🚀
`);
}

main().catch((error) => {
  console.error('create-vista-app failed:', error);
  process.exit(1);
});
