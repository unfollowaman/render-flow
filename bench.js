const { performance } = require('perf_hooks');

function measureOld() {
  const start = performance.now();
  let dummy = 0;
  for (let i = 0; i < 1000000; i++) {
    const arr = Array.from({ length: 64 }).map((_, j) => ({ type: 'div', key: j }));
    dummy += arr.length;
  }
  const end = performance.now();
  console.log(`Baseline (Inline Array.from): ${end - start} ms`);
}

const PRE_COMPUTED = Array.from({ length: 64 }).map((_, i) => ({ type: 'div', key: i }));

function measureNew() {
  const start = performance.now();
  let dummy = 0;
  for (let i = 0; i < 1000000; i++) {
    const arr = PRE_COMPUTED;
    dummy += arr.length;
  }
  const end = performance.now();
  console.log(`Optimized (Pre-computed Array): ${end - start} ms`);
}

measureOld();
measureNew();
