import fs from 'fs/promises';
import { ToolHandler } from '../../types';
import { loadPdf, requireSinglePdf } from './pdfHelpers';

/**
 * Compress by re-saving the PDF with object streams enabled, which drops
 * redundant/orphaned objects left behind by incremental saves. This is a
 * lossless structural optimisation — it does NOT recompress embedded images
 * (that would need a system tool like Ghostscript), so gains vary a lot by
 * file. We never return a file larger than the original.
 */
export const compress: ToolHandler = async (files) => {
  const file = requireSinglePdf(files);
  const src = await loadPdf(file.path, file.originalname);

  const originalSize = file.size;
  const resaved = Buffer.from(await src.save({ useObjectStreams: true }));

  // If re-saving didn't help, hand back the original bytes untouched.
  const useOriginal = resaved.length >= originalSize;
  const buffer = useOriginal ? await fs.readFile(file.path) : resaved;

  return {
    buffer,
    fileName: 'compressed.pdf',
    contentType: 'application/pdf',
    extraHeaders: {
      'X-Original-Size': String(originalSize),
      'X-Compressed-Size': String(buffer.length),
    },
  };
};
