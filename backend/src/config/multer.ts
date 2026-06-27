import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { env } from './env';
import { AuthRequest } from '../types';

const ALLOWED_MIME = new Set([
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
]);

const storage = multer.diskStorage({
  destination: (req: AuthRequest, _file, cb) => {
    // One job dir per request, shared across all files in that request.
    if (!req.uploadDir) {
      req.uploadDir = path.join(env.UPLOAD_DIR, uuidv4());
      fs.mkdirSync(req.uploadDir, { recursive: true });
    }
    cb(null, req.uploadDir);
  },
  filename: (_req, file, cb) => {
    // Store under a unique name; original name is preserved on file.originalname.
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});

const fileFilter: multer.Options['fileFilter'] = (_req, file, cb) => {
  if (ALLOWED_MIME.has(file.mimetype)) {
    cb(null, true);
    return;
  }
  cb(new Error('UNSUPPORTED_FILE_TYPE'));
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: env.MAX_FILE_SIZE_BYTES,
    files: 10,
  },
});
