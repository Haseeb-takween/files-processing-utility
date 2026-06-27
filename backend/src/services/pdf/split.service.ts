import { PDFDocument } from 'pdf-lib';
import { AppError } from '../../utils/asyncHandler';
import { ToolHandler } from '../../types';
import { loadPdf, requireSinglePdf } from './pdfHelpers';

/**
 * Parse a 1-based page selection like "1-3, 5, 8-10" into 0-based indices,
 * preserving the requested order. Throws a 400 on any invalid token.
 */
export const parseRanges = (input: string, pageCount: number): number[] => {
  const tokens = input
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);

  if (tokens.length === 0) {
    throw new AppError('Specify which pages to extract, e.g. "1-3, 5".', 400);
  }

  const indices: number[] = [];

  for (const token of tokens) {
    const rangeMatch = token.match(/^(\d+)\s*-\s*(\d+)$/);
    const singleMatch = token.match(/^(\d+)$/);

    if (rangeMatch) {
      const start = parseInt(rangeMatch[1], 10);
      const end = parseInt(rangeMatch[2], 10);
      if (start < 1 || end < 1 || start > end) {
        throw new AppError(`Invalid page range "${token}".`, 400);
      }
      if (end > pageCount) {
        throw new AppError(
          `Page ${end} is out of range. The PDF has ${pageCount} page(s).`,
          400
        );
      }
      for (let p = start; p <= end; p++) indices.push(p - 1);
    } else if (singleMatch) {
      const page = parseInt(singleMatch[1], 10);
      if (page < 1 || page > pageCount) {
        throw new AppError(
          `Page ${page} is out of range. The PDF has ${pageCount} page(s).`,
          400
        );
      }
      indices.push(page - 1);
    } else {
      throw new AppError(`Could not understand "${token}".`, 400);
    }
  }

  return indices;
};

export const split: ToolHandler = async (files, body) => {
  const file = requireSinglePdf(files);
  const ranges = typeof body.ranges === 'string' ? body.ranges : '';

  const src = await loadPdf(file.path, file.originalname);
  const indices = parseRanges(ranges, src.getPageCount());

  const out = await PDFDocument.create();
  const pages = await out.copyPages(src, indices);
  pages.forEach((page) => out.addPage(page));

  const bytes = await out.save();

  return {
    buffer: Buffer.from(bytes),
    fileName: 'split.pdf',
    contentType: 'application/pdf',
  };
};
