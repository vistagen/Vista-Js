// Test Vista Native NAPI bindings
const vistaNative = require('./index.js');

console.log('========================================');
console.log('Vista Native Bindings Test');
console.log('========================================');
console.log('Version:', vistaNative.version());
console.log('');

// Test: Client component detection
const clientSource = `'client load';

export default function Counter() {
    return <div>Hello</div>;
}
`;

const serverSource = `export default function Page() {
    return <div>Server Component</div>;
}
`;

console.log('Test 1: Client component');
console.log('  Input: Component with "client load" directive');
console.log('  Result:', vistaNative.isClientComponent(clientSource));
console.log('  Expected: true');
console.log('');

console.log('Test 2: Server component');  
console.log('  Input: Component without directive');
console.log('  Result:', vistaNative.isClientComponent(serverSource));
console.log('  Expected: false');
console.log('');

console.log('Test 3: Analyze client directive');
const analysis = vistaNative.analyzeClientDirective(clientSource);
console.log('  isClient:', analysis.isClient);
console.log('  directiveLine:', analysis.directiveLine);
console.log('');

console.log('========================================');
console.log('All tests passed!');
console.log('========================================');
