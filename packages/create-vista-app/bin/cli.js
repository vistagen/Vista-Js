#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Simple args: npx create-vista-app <project-name>
const projectName = process.argv[2] || 'my-vista-app';
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
        fs.readdirSync(src).forEach(childItemName => {
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
    "dev": "vista dev",
    "build": "vista build",
    "start": "vista start"
  },
  dependencies: {
    // Runtime dependencies
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "@vistagenic/vista": "^0.1.0-alpha.3",
    // CSS build (needed in production for vista build)
    "postcss": "^8.0.0",
    "postcss-cli": "^11.0.0",
    "tailwindcss": "^4.0.0-alpha.0",
    "@tailwindcss/postcss": "^4.0.0-alpha.0",
    // Node 20+ SSR compatibility
    "@swc-node/register": "^1.9.0",
    "@swc/core": "^1.4.0",
    "tsx": "^4.7.0"
  },
  devDependencies: {
    "typescript": "^5.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0"
  }
};

fs.writeFileSync(
  path.join(projectDir, 'package.json'),
  JSON.stringify(packageJson, null, 2)
);

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

fs.writeFileSync(
  path.join(projectDir, '.gitignore'),
  gitignoreContent
);

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
            GIT_COMMITTER_EMAIL: 'vista@example.com' 
        }
    });
    console.log('Initialized git repository with initial commit');
} catch (e) {
    // Git might not be installed, that's okay
    console.log('Note: Could not initialize git repository. You can do this manually with: git init');
}

console.log(`
Success! Created ${projectName} at ${projectDir}
Inside that directory, you can run:

  npm install
  npm run dev

Happy Hacking!
`);
