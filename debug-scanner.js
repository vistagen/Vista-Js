const fs = require('fs');
const path = require('path');

const appDir = './test-app/app';

function analyzeClientDirective(source) {
  const trimmed = source.trim();
  const isClient = trimmed.startsWith("'client load'") || trimmed.startsWith('"client load"');
  return { isClient, directiveLine: isClient ? 1 : 0 };
}

function scanDir(dir, baseDir) {
  const results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory() && !entry.name.startsWith('.')) {
      results.push(...scanDir(fullPath, baseDir));
    } else if (entry.isFile() && /\.(tsx?|jsx?)$/.test(entry.name)) {
      const source = fs.readFileSync(fullPath, 'utf-8');
      const analysis = analyzeClientDirective(source);
      results.push({
        file: path.relative(baseDir, fullPath),
        isClient: analysis.isClient,
        firstLine: source.split('\n')[0].trim(),
      });
    }
  }
  return results;
}

const files = scanDir(appDir, appDir);
console.log('Scanned files:');
files.forEach((f) => {
  console.log(`  ${f.file}: isClient=${f.isClient}, firstLine="${f.firstLine}"`);
});

const clientFiles = files.filter((f) => f.isClient);
console.log(`\nClient components: ${clientFiles.length}`);
clientFiles.forEach((f) => console.log(`  - ${f.file}`));
