import fs from 'fs/promises';
import path from 'path';
import { env } from '../config/env';

const TTL_MS = env.FILE_TTL_MINUTES * 60 * 1000;
const RUN_EVERY_MS = Math.min(TTL_MS, 5 * 60 * 1000); // at least every 5 min

/** Delete job folders older than the TTL inside a base dir. */
const sweepDir = async (base: string, now: number): Promise<number> => {
  let removed = 0;
  let entries;
  try {
    entries = await fs.readdir(base, { withFileTypes: true });
  } catch {
    return 0; // base dir may not exist yet
  }

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const full = path.join(base, entry.name);
    try {
      const stat = await fs.stat(full);
      if (now - stat.mtimeMs > TTL_MS) {
        await fs.rm(full, { recursive: true, force: true });
        removed += 1;
      }
    } catch (err) {
      console.error(`Cleanup failed for ${full}:`, err);
    }
  }
  return removed;
};

const runSweep = async (): Promise<void> => {
  const now = Date.now();
  const [u, o] = await Promise.all([
    sweepDir(env.UPLOAD_DIR, now),
    sweepDir(env.OUTPUT_DIR, now),
  ]);
  if (u + o > 0) {
    console.log(`[cleanup] removed ${u} upload + ${o} output job folder(s)`);
  }
};

/** Start the periodic cleanup sweep. Returns the interval handle. */
export const startCleanupJob = (): NodeJS.Timeout => {
  // Run once at startup to clear orphans from previous runs.
  void runSweep();
  const handle = setInterval(() => void runSweep(), RUN_EVERY_MS);
  handle.unref(); // don't keep the process alive just for cleanup
  console.log(
    `[cleanup] scheduled every ${Math.round(RUN_EVERY_MS / 60000)} min, TTL ${env.FILE_TTL_MINUTES} min`
  );
  return handle;
};
