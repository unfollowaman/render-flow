const dns = require('dns/promises');
const { performance } = require('perf_hooks');

const originalLookup = dns.lookup;
dns.lookup = async (hostname) => {
  // simulate delay of typical DNS lookup
  await new Promise(resolve => setTimeout(resolve, 10));
  return { address: '93.184.216.34', family: 4 };
};

async function safeDnsLookupOld(hostname, timeoutMs = 5000) {
  let timeoutId;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error('DNS lookup timeout')), timeoutMs);
  });
  try {
    const result = await Promise.race([
      dns.lookup(hostname),
      timeoutPromise
    ]);
    return result;
  } finally {
    clearTimeout(timeoutId);
  }
}

const dnsCache = new Map();
const DNS_CACHE_MAX_SIZE = 1000;

async function safeDnsLookupNew(hostname, timeoutMs = 5000) {
  if (dnsCache.has(hostname)) {
    return dnsCache.get(hostname);
  }
  let timeoutId;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error('DNS lookup timeout')), timeoutMs);
  });
  try {
    const result = await Promise.race([
      dns.lookup(hostname),
      timeoutPromise
    ]);
    if (dnsCache.size >= DNS_CACHE_MAX_SIZE) {
      const firstKey = dnsCache.keys().next().value;
      dnsCache.delete(firstKey);
    }
    dnsCache.set(hostname, result);
    return result;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function runBench() {
  const iterations = 500;

  console.log('Measuring Old (No Cache)...');
  const startOld = performance.now();
  for (let i = 0; i < iterations; i++) {
    await safeDnsLookupOld('example.com');
  }
  const endOld = performance.now();
  console.log(`Baseline (No Cache): ${(endOld - startOld).toFixed(2)} ms`);

  console.log('Measuring New (With Cache)...');
  const startNew = performance.now();
  for (let i = 0; i < iterations; i++) {
    await safeDnsLookupNew('example.com');
  }
  const endNew = performance.now();
  console.log(`Optimized (Cached): ${(endNew - startNew).toFixed(2)} ms`);
}

runBench();
