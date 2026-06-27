import { PDFDocument } from 'pdf-lib';
import { AppError } from '../../utils/asyncHandler';
import { ToolHandler } from '../../types';
import { loadPdf } from './pdfHelpers';

export const merge: ToolHandler = async (files) => {
  const pdfs = files.filter((f) => f.mimetype === 'application/pdf');

  if (pdfs.length < 2) {
    throw new AppError('Merge requires at least 2 PDF files.', 400);
  }

  const merged = await PDFDocument.create();

  for (const file of pdfs) {
    const src = await loadPdf(file.path, file.originalname);
    const pages = await merged.copyPages(src, src.getPageIndices());
    pages.forEach((page) => merged.addPage(page));
  }

  const bytes = await merged.save();

  return {
    buffer: Buffer.from(bytes),
    fileName: 'merged.pdf',
    contentType: 'application/pdf',
  };
};
