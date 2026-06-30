/**
 * Load test for the File Processing Utility merge endpoint.
 *
 * Fires N total requests through a pool of C concurrent workers and reports
 * success/failure counts AND an honest latency picture: a single-request
 * baseline, the full percentile spread under load, a latency histogram, and a
 * count of "slow" requests. A request that returns 200 but takes 12s is a
 * degraded result, not a clean pass — this report makes that explicit.
 *
 * Uses only Node built-ins (global fetch/FormData/Blob) plus pdf-lib.
 *
 * Usage:
 *   node scripts/load-test.mjs
 *   node scripts/load-test.mjs --url https://your-backend --requests 100 --concurrency 50 --slow-ms 3000
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
// Requests slower than this (ms) are flagged as degraded, even if they succeed.
const SLOW_MS = parseInt(arg('slow-ms', '3000'), 10);

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

/** ASCII histogram of latency buckets so the spread is visible at a glance. */
function printHistogram(latencies) {
  const buckets = [
    ['<1s', 0, 1000],
    ['1-3s', 1000, 3000],
    ['3-5s', 3000, 5000],
    ['5-10s', 5000, 10000],
    ['10-30s', 10000, 30000],
    ['>30s', 30000, Infinity],
  ];
  const counts = buckets.map(([, lo, hi]) => latencies.filter((m) => m >= lo && m < hi).length);
  const max = Math.max(1, ...counts);
  console.log('Latency distribution');
  buckets.forEach(([label], i) => {
    const n = counts[i];
    const bar = '█'.repeat(Math.round((n / max) * 40));
    const pct = ((n / latencies.length) * 100).toFixed(0);
    console.log(`  ${label.padEnd(6)} | ${bar} ${n} (${pct}%)`);
  });
}

async function timeOneRequest(token, a, b) {
  const fd = new FormData();
  fd.append('files', new Blob([a], { type: 'application/pdf' }), 'a.pdf');
  fd.append('files', new Blob([b], { type: 'application/pdf' }), 'b.pdf');

  const start = performance.now();
  const res = await fetch(`${BASE_URL}/api/pdf/merge`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: fd,
  });
  await res.arrayBuffer(); // drain so timing covers the full response
  return { ms: performance.now() - start, status: res.status, ok: res.ok };
}

async function main() {
  console.log(`Load test → ${BASE_URL}`);
  console.log(`Requests: ${TOTAL}  |  Concurrency: ${CONCURRENCY}  |  Slow threshold: ${SLOW_MS} ms\n`);

  const token = await getToken();
  const [a, b] = await Promise.all([makeSamplePdf(2), makeSamplePdf(1)]);

  // Baseline: one request with nothing else in flight. This is the "best case"
  // we compare the under-load numbers against, so slowdown is unambiguous.
  let baselineMs = NaN;
  try {
    const warm = await timeOneRequest(token, a, b); // warm-up (cold start / JIT)
    const base = await timeOneRequest(token, a, b);
    baselineMs = base.ms;
    void warm;
  } catch {
    /* baseline is best-effort */
  }

  const latencies = [];
  const statusCounts = {};
  let success = 0;
  let failure = 0;
  let next = 0;

  async function oneRequest() {
    const start = performance.now();
    try {
      const { ms, status, ok } = await timeOneRequest(token, a, b);
      latencies.push(ms);
      statusCounts[status] = (statusCounts[status] || 0) + 1;
      if (ok) success++;
      else failure++;
    } catch {
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
  const avg = sum / latencies.length;
  const p95 = percentile(latencies, 95);
  const slowCount = latencies.filter((m) => m > SLOW_MS).length;
  const slowPct = (slowCount / latencies.length) * 100;

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
  console.log(`  baseline (idle) : ${Number.isFinite(baselineMs) ? baselineMs.toFixed(0) : 'n/a'}`);
  console.log(`  min             : ${latencies[0]?.toFixed(0)}`);
  console.log(`  avg             : ${avg.toFixed(0)}`);
  console.log(`  p50             : ${percentile(latencies, 50).toFixed(0)}`);
  console.log(`  p95             : ${p95.toFixed(0)}`);
  console.log(`  p99             : ${percentile(latencies, 99).toFixed(0)}`);
  console.log(`  max             : ${latencies[latencies.length - 1]?.toFixed(0)}`);
  console.log('');
  printHistogram(latencies);
  console.log('');

  // Honest verdict — success count alone is not a pass.
  console.log('Honest assessment');
  console.log('───────────────────────────────');
  console.log(`Slow requests (> ${SLOW_MS} ms): ${slowCount} of ${TOTAL} (${slowPct.toFixed(0)}%)`);
  if (Number.isFinite(baselineMs) && baselineMs > 0) {
    const factor = (avg / baselineMs).toFixed(1);
    console.log(`Avg latency under load is ${factor}× the idle baseline (${baselineMs.toFixed(0)} ms → ${avg.toFixed(0)} ms).`);
  }
  if (failure > 0) {
    console.log(`⚠ ${failure} request(s) FAILED outright.`);
  }
  if (slowPct >= 10 || (Number.isFinite(baselineMs) && avg > baselineMs * 3)) {
    console.log(
      '⚠ DEGRADED UNDER CONCURRENCY: requests succeed but are significantly slower.'
    );
    console.log(
      '  Root cause: PDF processing runs synchronously on a single event loop with no',
    );
    console.log(
      '  job queue/worker threads, so concurrent requests queue behind each other.',
    );
    console.log(
      '  Mitigations: offload processing to worker threads or a job queue, cap',
    );
    console.log(
      '  concurrency, and scale instances. Report these numbers as-is — do not',
    );
    console.log('  present a 100% success rate without the latency context.');
  } else {
    console.log('✓ No significant slowdown detected at this concurrency level.');
  }

  // Exit non-zero on failures OR widespread slowness, so CI/recordings can't
  // quietly report a green run that was actually degraded.
  const degraded = failure > 0 || slowPct >= 10;
  process.exit(degraded ? 1 : 0);
}

main().catch((err) => {
  console.error('Load test failed:', err);
  process.exit(1);
});
