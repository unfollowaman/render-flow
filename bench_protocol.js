const { performance } = require('perf_hooks');

const iterations = 10000000;
const protocols = ['http:', 'https:', 'data:', 'file:'];

console.log('Measuring Array Allocation (.includes)...');
let start = performance.now();
let count1 = 0;
for (let i = 0; i < iterations; i++) {
  const protocol = protocols[i % 4];
  if (['http:', 'https:'].includes(protocol)) {
    count1++;
  }
}
let end = performance.now();
console.log(`Baseline (Array .includes): ${(end - start).toFixed(2)} ms`);

console.log('Measuring OR condition (===)...');
start = performance.now();
let count2 = 0;
for (let i = 0; i < iterations; i++) {
  const protocol = protocols[i % 4];
  if (protocol === 'http:' || protocol === 'https:') {
    count2++;
  }
}
end = performance.now();
console.log(`Optimized (OR condition): ${(end - start).toFixed(2)} ms`);
