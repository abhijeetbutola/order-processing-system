const http = require('http');

const TOTAL_ORDERS = 1000;
const CONCURRENCY = 50; // requests in-flight at once
const API_URL = 'http://localhost:3000/orders';

const PAYLOAD = JSON.stringify({
  customerId: 'load-test-user',
  items: [{ productId: 'p1', quantity: 2, price: 50 }],
});

let completed = 0;
let failed = 0;
const responseTimes = [];
const startTime = Date.now();

function sendOrder() {
  return new Promise((resolve) => {
    const reqStart = Date.now();
    const req = http.request(
      API_URL,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(PAYLOAD),
        },
      },
      (res) => {
        res.resume();
        res.on('end', () => {
          const elapsed = Date.now() - reqStart;
          responseTimes.push(elapsed);
          if (res.statusCode === 202) {
            completed++;
          } else {
            failed++;
          }
          resolve();
        });
      }
    );
    req.on('error', () => {
      failed++;
      resolve();
    });
    req.write(PAYLOAD);
    req.end();
  });
}

async function runBatch(size) {
  const batch = [];
  for (let i = 0; i < size; i++) {
    batch.push(sendOrder());
  }
  await Promise.all(batch);
}

async function run() {
  console.log(`Starting load test: ${TOTAL_ORDERS} orders, concurrency ${CONCURRENCY}`);
  console.log('---');

  const batches = Math.ceil(TOTAL_ORDERS / CONCURRENCY);
  for (let i = 0; i < batches; i++) {
    const batchSize = Math.min(CONCURRENCY, TOTAL_ORDERS - i * CONCURRENCY);
    await runBatch(batchSize);
    process.stdout.write(`\rProgress: ${Math.min((i + 1) * CONCURRENCY, TOTAL_ORDERS)}/${TOTAL_ORDERS}`);
  }

  const totalTime = (Date.now() - startTime) / 1000;
  const sorted = [...responseTimes].sort((a, b) => a - b);
  const avg = responseTimes.reduce((s, v) => s + v, 0) / responseTimes.length;
  const p50 = sorted[Math.floor(sorted.length * 0.5)];
  const p95 = sorted[Math.floor(sorted.length * 0.95)];
  const p99 = sorted[Math.floor(sorted.length * 0.99)];

  console.log('\n\n--- Results ---');
  console.log(`Total orders sent : ${TOTAL_ORDERS}`);
  console.log(`Successful (202)  : ${completed}`);
  console.log(`Failed            : ${failed}`);
  console.log(`Total time        : ${totalTime.toFixed(2)}s`);
  console.log(`Throughput        : ${(TOTAL_ORDERS / totalTime).toFixed(1)} req/s`);
  console.log(`\nResponse times (API only, not worker):`);
  console.log(`  Min : ${sorted[0]}ms`);
  console.log(`  Avg : ${avg.toFixed(0)}ms`);
  console.log(`  p50 : ${p50}ms`);
  console.log(`  p95 : ${p95}ms`);
  console.log(`  p99 : ${p99}ms`);
  console.log(`  Max : ${sorted[sorted.length - 1]}ms`);
}

run().catch(console.error);
