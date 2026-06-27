import { Response } from 'express';
import { AuthRequest, ToolHandler, isPdfTool, PdfTool } from '../types';
import { asyncHandler, AppError } from '../utils/asyncHandler';
import { cleanupDir } from '../utils/fileHelpers';
import { logUsage } from '../services/usage.service';
import { merge } from '../services/pdf/merge.service';
import { split } from '../services/pdf/split.service';
import { compress } from '../services/pdf/compress.service';
import { convert } from '../services/pdf/convert.service';
import { pages } from '../services/pdf/pages.service';
import { watermark } from '../services/pdf/watermark.service';

/**
 * Registry of implemented tool handlers. Tools are added here as each
 * phase lands; anything missing returns 501 (not implemented).
 */
const toolHandlers: Partial<Record<PdfTool, ToolHandler>> = {
  merge,
  split,
  compress,
  convert,
  pages,
  watermark,
};

export const process = asyncHandler(async (req: AuthRequest, res: Response) => {
  const tool = String(req.params.tool);

  if (!isPdfTool(tool)) {
    throw new AppError(`Unknown tool "${tool}".`, 404);
  }

  const files = (req.files as Express.Multer.File[] | undefined) ?? [];

  try {
    const handler = toolHandlers[tool];
    if (!handler) {
      throw new AppError(`The "${tool}" tool is not implemented yet.`, 501);
    }

    if (files.length === 0) {
      throw new AppError('No files were uploaded.', 400);
    }

    const result = await handler(files, req.body ?? {});

    // Log usage only after successful processing.
    await logUsage(
      req.user!.id,
      tool,
      files.map((f) => f.originalname).join(', '),
      files.length
    );

    res.setHeader('Content-Type', result.contentType);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${result.fileName}"`
    );
    if (result.extraHeaders) {
      for (const [key, value] of Object.entries(result.extraHeaders)) {
        res.setHeader(key, value);
      }
    }
    res.send(result.buffer);
  } finally {
    // Always remove the per-request upload dir, success or failure.
    await cleanupDir(req.uploadDir);
  }
});
