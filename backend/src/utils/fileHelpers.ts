import { env } from '../config/env';
import fs from 'fs';
import path from 'path';

export const ensureUploadDir = (): string => {
  const uploadDir = path.resolve(env.UPLOAD_DIR);
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  return uploadDir;
};

export const createJobDir = (userId: string, jobId: string): string => {
  const jobDir = path.join(ensureUploadDir(), userId, jobId);
  fs.mkdirSync(jobDir, { recursive: true });
  return jobDir;
};

export const removeDir = (dirPath: string): void => {
  if (fs.existsSync(dirPath)) {
    fs.rmSync(dirPath, { recursive: true, force: true });
  }
};

export const getJobDir = (userId: string, jobId: string): string => {
  return path.join(ensureUploadDir(), userId, jobId);
};
