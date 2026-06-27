import fs from 'fs/promises';
import path from 'path';
import { pathToFileURL } from 'url';
import { PDFDocument, PDFImage } from 'pdf-lib';
import JSZip from 'jszip';
import { Document, Packer, Paragraph, TextRun, PageBreak } from 'docx';
import { AppError } from '../../utils/asyncHandler';
import { requireSinglePdf } from './pdfHelpers';
import { ToolHandler, PdfResult } from '../../types';

const IMAGE_MIMES = new Set(['image/jpeg', 'image/jpg', 'image/png']);

/**
 * pdfjs-dist and pdf-to-img are ESM-only. This project compiles to CommonJS,
 * where `tsc` would rewrite a normal dynamic import() into require() and break
 * loading. The Function shim preserves a true runtime import().
 */
const dynamicImport = new Function('s', 'return import(s)') as (
  s: string
) => Promise<any>;

/**
 * Directory of pdfjs' bundled fallback fonts, passed to the renderer so the
 * base-14 fonts resolve. (pdfjs still logs a cosmetic warning if it can't fetch
 * them in Node, but rendering falls back to built-in glyphs either way.)
 */
const STANDARD_FONTS_URL =
  pathToFileURL(
    path.join(
      path.dirname(require.resolve('pdfjs-dist/legacy/build/pdf.mjs')),
      '..',
      '..',
      'standard_fonts'
    )
  ).href + '/';

const DEFAULT_DPI = 150;
const MIN_DPI = 72;
const MAX_DPI = 300;

/**
 * Convert one or more images (JPEG/PNG) into a single PDF, one image per page,
 * with each page sized to its image.
 */
const imagesToPdf = async (files: Express.Multer.File[]): Promise<PdfResult> => {
  const images = files.filter((f) => IMAGE_MIMES.has(f.mimetype));
  if (images.length === 0) {
    throw new AppError('Please upload at least one JPEG or PNG image.', 400);
  }

  const pdf = await PDFDocument.create();

  for (const file of images) {
    const bytes = await fs.readFile(file.path);
    let image: PDFImage;
    try {
      image =
        file.mimetype === 'image/png'
          ? await pdf.embedPng(bytes)
          : await pdf.embedJpg(bytes);
    } catch {
      throw new AppError(
        `"${file.originalname}" could not be read. It may be corrupt or not a valid image.`,
        422
      );
    }

    const page = pdf.addPage([image.width, image.height]);
    page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });
  }

  const bytes = await pdf.save();

  return {
    buffer: Buffer.from(bytes),
    fileName: 'converted.pdf',
    contentType: 'application/pdf',
  };
};

/**
 * Render each page of a PDF to a PNG and bundle them into a single ZIP.
 * Quality is controlled by `dpi` (72-300, default 150); pdf-to-img's scale is
 * relative to 72 DPI.
 */
const pdfToImages = async (
  files: Express.Multer.File[],
  body: Record<string, unknown>
): Promise<PdfResult> => {
  const file = requireSinglePdf(files);

  const requestedDpi = Number.parseInt(String(body.dpi ?? ''), 10);
  const dpi = Number.isFinite(requestedDpi)
    ? Math.min(MAX_DPI, Math.max(MIN_DPI, requestedDpi))
    : DEFAULT_DPI;
  const scale = dpi / 72;

  const data = new Uint8Array(await fs.readFile(file.path));

  const { pdf } = await dynamicImport('pdf-to-img');
  let document: AsyncIterable<Buffer> & { length: number };
  try {
    document = await pdf(data, {
      scale,
      docInitParams: { standardFontDataUrl: STANDARD_FONTS_URL },
    });
  } catch {
    throw new AppError(
      `"${file.originalname}" could not be read. It may be corrupt, password-protected, or not a valid PDF.`,
      422
    );
  }

  const zip = new JSZip();
  let count = 0;
  for await (const image of document) {
    count += 1;
    zip.file(`page-${String(count).padStart(3, '0')}.png`, image);
  }

  if (count === 0) {
    throw new AppError(`"${file.originalname}" contains no readable pages.`, 422);
  }

  const buffer = await zip.generateAsync({ type: 'nodebuffer' });

  return {
    buffer,
    fileName: 'pdf-images.zip',
    contentType: 'application/zip',
    extraHeaders: { 'X-Page-Count': String(count) },
  };
};

/** Group pdfjs text items into visual lines by their Y position. */
const extractLines = (items: any[]): string[] => {
  const pieces = items
    .filter((it) => typeof it.str === 'string' && it.str.length > 0)
    .map((it) => ({
      x: it.transform[4] as number,
      y: it.transform[5] as number,
      str: it.str as string,
    }));
  if (pieces.length === 0) return [];

  // Top-to-bottom, then left-to-right. Items within ~3pt of each other in Y
  // are treated as the same line.
  pieces.sort((a, b) => (Math.abs(a.y - b.y) > 3 ? b.y - a.y : a.x - b.x));

  const lines: string[] = [];
  let buf: string[] = [];
  let lastY = pieces[0].y;
  for (const p of pieces) {
    if (Math.abs(p.y - lastY) > 3 && buf.length) {
      lines.push(buf.join(''));
      buf = [];
    }
    buf.push(p.str);
    lastY = p.y;
  }
  if (buf.length) lines.push(buf.join(''));

  return lines.map((l) => l.replace(/\s+$/g, '')).filter((l) => l.length > 0);
};

/**
 * Extract the text layer of a PDF into an editable .docx.
 *
 * Honest limitation: this preserves text and line breaks only. Original layout,
 * columns, tables, fonts, and images are NOT reproduced. Scanned/image-only
 * PDFs have no text layer and are rejected (they would need OCR).
 */
const pdfToWord = async (files: Express.Multer.File[]): Promise<PdfResult> => {
  const file = requireSinglePdf(files);
  const data = new Uint8Array(await fs.readFile(file.path));

  const pdfjs = await dynamicImport('pdfjs-dist/legacy/build/pdf.mjs');
  let doc: any;
  try {
    doc = await pdfjs.getDocument({
      data,
      standardFontDataUrl: STANDARD_FONTS_URL,
    }).promise;
  } catch {
    throw new AppError(
      `"${file.originalname}" could not be read. It may be corrupt, password-protected, or not a valid PDF.`,
      422
    );
  }

  const paragraphs: Paragraph[] = [];
  let totalChars = 0;

  for (let pageNum = 1; pageNum <= doc.numPages; pageNum += 1) {
    const page = await doc.getPage(pageNum);
    const content = await page.getTextContent();
    const lines = extractLines(content.items);

    for (const line of lines) {
      totalChars += line.replace(/\s/g, '').length;
      paragraphs.push(new Paragraph({ children: [new TextRun(line)] }));
    }

    // Page break between pages (not after the last one).
    if (pageNum < doc.numPages) {
      paragraphs.push(new Paragraph({ children: [new PageBreak()] }));
    }
  }

  if (totalChars === 0) {
    throw new AppError(
      `"${file.originalname}" has no extractable text — it looks like a scanned or image-only PDF. ` +
        'Converting it to Word would require OCR, which this tool does not support.',
      422
    );
  }

  const out = new Document({ sections: [{ children: paragraphs }] });
  const buffer = await Packer.toBuffer(out);

  return {
    buffer,
    fileName: 'converted.docx',
    contentType:
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  };
};

/**
 * Convert dispatcher. Supported directions:
 *   - images-to-pdf  (JPEG/PNG -> single PDF)
 *   - pdf-to-images  (PDF -> ZIP of PNGs)
 *   - pdf-to-word    (PDF text layer -> .docx; layout not preserved)
 */
export const convert: ToolHandler = async (files, body) => {
  const direction =
    typeof body.direction === 'string' ? body.direction : 'images-to-pdf';

  switch (direction) {
    case 'images-to-pdf':
      return imagesToPdf(files);
    case 'pdf-to-images':
      return pdfToImages(files, body);
    case 'pdf-to-word':
      return pdfToWord(files);
    default:
      throw new AppError(`Unknown conversion direction "${direction}".`, 400);
  }
};
