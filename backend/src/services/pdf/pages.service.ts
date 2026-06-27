import { ToolHandler } from '../../types';
import { AppError } from '../../utils/asyncHandler';
import { loadPdf, requireSinglePdf } from './pdfHelpers';

/**
 * Add a blank page or remove an existing page (1-based).
 *  - add:    inserts a blank page AFTER the given page number
 *            (use 0 to insert at the very beginning).
 *  - remove: deletes the given page number.
 */
export const pages: ToolHandler = async (files, body) => {
  const file = requireSinglePdf(files);
  const action = typeof body.action === 'string' ? body.action : '';
  const rawPage = typeof body.pageNumber === 'string' ? body.pageNumber : '';

  if (action !== 'add' && action !== 'remove') {
    throw new AppError('Choose whether to add or remove a page.', 400);
  }

  if (!/^\d+$/.test(rawPage)) {
    throw new AppError('Enter a valid page number.', 400);
  }
  const pageNumber = parseInt(rawPage, 10);

  const doc = await loadPdf(file.path, file.originalname);
  const count = doc.getPageCount();

  if (action === 'add') {
    // 0..count: insert at index = pageNumber (i.e. after that page).
    if (pageNumber < 0 || pageNumber > count) {
      throw new AppError(
        `Page number must be between 0 and ${count}.`,
        400
      );
    }
    const refIndex = pageNumber > 0 ? pageNumber - 1 : 0;
    const { width, height } = doc.getPage(refIndex).getSize();
    doc.insertPage(pageNumber, [width, height]);
  } else {
    if (pageNumber < 1 || pageNumber > count) {
      throw new AppError(
        `Page ${pageNumber} is out of range. The PDF has ${count} page(s).`,
        400
      );
    }
    if (count === 1) {
      throw new AppError('Cannot remove the only page in the PDF.', 400);
    }
    doc.removePage(pageNumber - 1);
  }

  const bytes = await doc.save();

  return {
    buffer: Buffer.from(bytes),
    fileName: action === 'add' ? 'with-page.pdf' : 'pages-removed.pdf',
    contentType: 'application/pdf',
  };
};
