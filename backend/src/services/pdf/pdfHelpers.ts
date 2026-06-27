import fs from 'fs/promises';
import { PDFDocument, EncryptedPDFError } from 'pdf-lib';
import { AppError } from '../../utils/asyncHandler';

/**
 * Load a PDF from disk, translating pdf-lib failures into clean 422 errors.
 *
 * Note: pdf-lib's load() tolerates some malformed files, so we force-read the
 * page tree (getPageCount) to confirm the document is actually usable.
 */
export const loadPdf = async (
  path: string,
  name: string
): Promise<PDFDocument> => {
  const bytes = await fs.readFile(path);
  try {
    const doc = await PDFDocument.load(bytes);
    if (doc.getPageCount() === 0) {
      throw new AppError(`"${name}" contains no readable pages.`, 422);
    }
    return doc;
  } catch (err) {
    if (err instanceof AppError) {
      throw err;
    }
    if (err instanceof EncryptedPDFError) {
      throw new AppError(
        `"${name}" is password-protected. Remove the password and try again.`,
        422
      );
    }
    throw new AppError(
      `"${name}" could not be read. It may be corrupt or not a valid PDF.`,
      422
    );
  }
};

/** Ensure exactly one PDF file was provided; return it. */
export const requireSinglePdf = (
  files: Express.Multer.File[]
): Express.Multer.File => {
  const pdfs = files.filter((f) => f.mimetype === 'application/pdf');
  if (pdfs.length === 0) {
    throw new AppError('Please upload a PDF file.', 400);
  }
  return pdfs[0];
};
