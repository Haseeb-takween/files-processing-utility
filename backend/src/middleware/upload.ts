import { Response, NextFunction } from 'express';
import multer from 'multer';
import { upload } from '../config/multer';
import { env } from '../config/env';
import { AuthRequest } from '../types';
import { AppError } from '../utils/asyncHandler';
import { cleanupDir } from '../utils/fileHelpers';

const uploadArray = upload.array('files', 10);

/**
 * Runs multer and translates its errors into clean AppErrors with the
 * right status codes. Cleans up any partially-written upload dir on error.
 */
export const uploadFiles = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  uploadArray(req, res, (err: unknown) => {
    if (!err) {
      next();
      return;
    }

    // Best-effort cleanup of anything multer wrote before failing.
    void cleanupDir(req.uploadDir);

    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        next(
          new AppError(
            `File too large. Maximum allowed size is ${env.MAX_FILE_SIZE_MB} MB.`,
            413
          )
        );
        return;
      }
      if (err.code === 'LIMIT_FILE_COUNT' || err.code === 'LIMIT_UNEXPECTED_FILE') {
        next(new AppError('Too many files in this request.', 400));
        return;
      }
      next(new AppError(`Upload error: ${err.message}`, 400));
      return;
    }

    if (err instanceof Error && err.message === 'UNSUPPORTED_FILE_TYPE') {
      next(
        new AppError(
          'Unsupported file type. Only PDF and image files (JPEG, PNG) are allowed.',
          400
        )
      );
      return;
    }

    next(new AppError('File upload failed.', 400));
  });
};
