/**
 * Load test for the File Processing Utility merge endpoint.
 *
 * Fires N total requests through a pool of C concurrent workers and reports
 * success/failure counts and latency percentiles. Uses only Node built-ins
 * (global fetch/FormData/Blob) plus pdf-lib to build sample PDFs.
 *
 * Usage:
 *   node scripts/load-test.mjs
 *   node scripts/load-test.mjs --url https://your-backend --requests 100 --concurrency 50
 *
 * Against a deployed server, make sure RATE_LIMIT_MAX is high enough.
 */
import { PDFDocument } from 'pdf-lib';

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

const BASE_URL = arg('url', process.env.LOAD_TEST_URL || 'http://localhost:5000');
const TOTAL = parseInt(arg('requests', '100'), 10);
const CONCURRENCY = parseInt(arg('concurrency', '50'), 10);

async function makeSamplePdf(pages) {
  const doc = await PDFDocument.create();
  for (let i = 0; i < pages; i++) {
    const p = doc.addPage([300, 300]);
    p.drawText(`sample page ${i + 1}`, { x: 40, y: 150 });
  }
  return doc.save();
}

async function getToken() {
  const email = `loadtest_${Date.now()}@test.com`;
  const body = JSON.stringify({
    name: 'Load Test',
    email,
    password: 'secret123',
    confirmPassword: 'secret123',
  });
  await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
  });
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'secret123' }),
  });
  if (!res.ok) throw new Error(`Login failed: ${res.status}`);
  const data = await res.json();
  return data.token;
}

function percentile(sorted, p) {
  if (sorted.length === 0) return 0;
  const idx = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[idx];
}

async function main() {
  console.log(`Load test → ${BASE_URL}`);
  console.log(`Requests: ${TOTAL}  |  Concurrency: ${CONCURRENCY}\n`);

  const token = await getToken();
  const [a, b] = await Promise.all([makeSamplePdf(2), makeSamplePdf(1)]);

  const latencies = [];
  const statusCounts = {};
  let success = 0;
  let failure = 0;
  let next = 0;

  async function oneRequest() {
    const fd = new FormData();
    fd.append('files', new Blob([a], { type: 'application/pdf' }), 'a.pdf');
    fd.append('files', new Blob([b], { type: 'application/pdf' }), 'b.pdf');

    const start = performance.now();
    try {
      const res = await fetch(`${BASE_URL}/api/pdf/merge`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      // Drain the body so the connection is fully complete before timing.
      await res.arrayBuffer();
      const ms = performance.now() - start;
      latencies.push(ms);
      statusCounts[res.status] = (statusCounts[res.status] || 0) + 1;
      if (res.ok) success++;
      else failure++;
    } catch (err) {
      failure++;
      statusCounts['ERR'] = (statusCounts['ERR'] || 0) + 1;
      latencies.push(performance.now() - start);
    }
  }

  async function worker() {
    while (next < TOTAL) {
      const mine = next++;
      if (mine >= TOTAL) break;
      await oneRequest();
    }
  }

  const wallStart = performance.now();
  await Promise.all(
    Array.from({ length: Math.min(CONCURRENCY, TOTAL) }, () => worker())
  );
  const wallMs = performance.now() - wallStart;

  latencies.sort((x, y) => x - y);
  const sum = latencies.reduce((acc, n) => acc + n, 0);

  console.log('Results');
  console.log('───────────────────────────────');
  console.log(`Total requests : ${TOTAL}`);
  console.log(`Success (2xx)  : ${success}`);
  console.log(`Failures       : ${failure}`);
  console.log(`Status codes   : ${JSON.stringify(statusCounts)}`);
  console.log(`Wall time      : ${(wallMs / 1000).toFixed(2)} s`);
  console.log(`Throughput     : ${(TOTAL / (wallMs / 1000)).toFixed(1)} req/s`);
  console.log('');
  console.log('Latency (ms)');
  console.log(`  min   : ${latencies[0]?.toFixed(0)}`);
  console.log(`  avg   : ${(sum / latencies.length).toFixed(0)}`);
  console.log(`  p50   : ${percentile(latencies, 50).toFixed(0)}`);
  console.log(`  p95   : ${percentile(latencies, 95).toFixed(0)}`);
  console.log(`  p99   : ${percentile(latencies, 99).toFixed(0)}`);
  console.log(`  max   : ${latencies[latencies.length - 1]?.toFixed(0)}`);

  process.exit(failure > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error('Load test failed:', err);
  process.exit(1);
});
