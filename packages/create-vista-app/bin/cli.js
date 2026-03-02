#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

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

if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
Usage:
  ${usageCommand}

Example:
  npx create-vista-app@latest my-vista-app
`);
  process.exit(0);
}

// Simple args: npx create-vista-app@latest <project-name>
const args = process.argv.slice(2).filter((arg) => !arg.startsWith('-'));
const projectName = args[0] || 'my-vista-app';
const useLocal = process.argv.includes('--local');
const currentDir = process.cwd();
const projectDir = path.join(currentDir, projectName);

console.log(`Creating a new Vista app in ${projectDir}...`);

// 1. Create Directory
if (fs.existsSync(projectDir)) {
  console.error(`Error: Directory ${projectName} already exists.`);
  process.exit(1);
}
fs.mkdirSync(projectDir);

// 2. Copy Template
const templateDir = path.join(__dirname, '../template');

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

copyRecursiveSync(templateDir, projectDir);

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

// 6. Install Dependencies
const installCmd = pkgManager === 'yarn' ? 'yarn' : `${pkgManager} install`;
console.log(`\nInstalling dependencies with ${pkgManager}... This may take a moment.\n`);
try {
  execSync(installCmd, { cwd: projectDir, stdio: 'inherit' });
  console.log(`\n✓ Dependencies installed successfully!`);
} catch (e) {
  console.log(
    `\nNote: Could not install dependencies automatically. Run "${installCmd}" manually.`
  );
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
