import fs from 'fs';
import fsp from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { env } from '../config/env';

/**
 * Create a unique per-request job directory under a base dir.
 * Each request gets its own UUID folder so concurrent requests never
 * collide on filenames.
 */
export const createJobDir = (base: string): { id: string; dir: string } => {
  const id = uuidv4();
  const dir = path.join(base, id);
  fs.mkdirSync(dir, { recursive: true });
  return { id, dir };
};

/** Recursively delete a directory; never throws. */
export const cleanupDir = async (dir?: string): Promise<void> => {
  if (!dir) return;
  try {
    await fsp.rm(dir, { recursive: true, force: true });
  } catch (err) {
    console.error(`Failed to clean up ${dir}:`, err);
  }
};

/** Ensure the upload/output base directories exist at startup. */
export const ensureBaseDirs = (): void => {
  fs.mkdirSync(env.UPLOAD_DIR, { recursive: true });
  fs.mkdirSync(env.OUTPUT_DIR, { recursive: true });
};

/** Build a safe output file path inside a job dir. */
export const outputPath = (dir: string, fileName: string): string =>
  path.join(dir, path.basename(fileName));
