import fs from 'fs';
import path from 'path';
import { env } from '../config/env';
import { ensureUploadDir, removeDir } from '../utils/fileHelpers';

export const cleanupExpiredFiles = (): void => {
  const uploadDir = ensureUploadDir();
  const ttlMs = env.TEMP_FILE_TTL_MINUTES * 60 * 1000;
  const now = Date.now();

  if (!fs.existsSync(uploadDir)) return;

  const userDirs = fs.readdirSync(uploadDir, { withFileTypes: true });

  for (const userDir of userDirs) {
    if (!userDir.isDirectory()) continue;

    const userPath = path.join(uploadDir, userDir.name);
    const jobDirs = fs.readdirSync(userPath, { withFileTypes: true });

    for (const jobDir of jobDirs) {
      if (!jobDir.isDirectory()) continue;

      const jobPath = path.join(userPath, jobDir.name);
      const stats = fs.statSync(jobPath);

      if (now - stats.mtimeMs > ttlMs) {
        removeDir(jobPath);
      }
    }

    const remaining = fs.readdirSync(userPath);
    if (remaining.length === 0) {
      removeDir(userPath);
    }
  }
};

export const startCleanupJob = (): void => {
  const intervalMs = 10 * 60 * 1000;

  cleanupExpiredFiles();
  setInterval(cleanupExpiredFiles, intervalMs);

  console.log(
    `Cleanup job started (TTL: ${env.TEMP_FILE_TTL_MINUTES} minutes, interval: 10 minutes)`
  );
};

export const cleanupJobDir = (jobDir: string): void => {
  removeDir(jobDir);
};
