/** @type {import('lint-staged').Config} */
export default {
  // TypeScript/JavaScript files
  '*.{ts,tsx,js,jsx,mjs}': [
    'eslint --fix',
    'prettier --write',
  ],
  
  // JSON files
  '*.json': [
    'prettier --write',
  ],
  
  // Markdown files
  '*.md': [
    'prettier --write',
  ],
  
  // CSS files
  '*.{css,scss}': [
    'prettier --write',
  ],
  
  // Rust files
  '*.rs': [
    'cargo fmt --',
  ],
};
