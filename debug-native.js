// Debug the actual file-scanner to see what's happening
const path = require('path');

// Mimic the file-scanner logic
let rustNative = null;
try {
  const possiblePaths = [
    path.resolve(__dirname, 'packages/vista/dist/../../../../crates/vista-napi'),
    path.resolve(__dirname, 'packages/vista/src/../../crates/vista-napi'),
    path.resolve(__dirname, 'crates/vista-napi'),
  ];

  for (const p of possiblePaths) {
    try {
      rustNative = require(p);
      console.log(`Loaded Rust native from: ${p}`);
      break;
    } catch (e) {
      console.log(`Failed to load from ${p}: ${e.message}`);
    }
  }
} catch (e) {
  console.log('All paths failed');
}

if (rustNative) {
  const fs = require('fs');
  const source = fs.readFileSync('./test-app/app/counter.tsx', 'utf-8');
  console.log('Testing isClientComponent:', rustNative.isClientComponent(source));
  console.log('Testing analyzeClientDirective:', rustNative.analyzeClientDirective(source));
} else {
  console.log('No rustNative loaded');
}
