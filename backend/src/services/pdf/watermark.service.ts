import { rgb, degrees, StandardFonts } from 'pdf-lib';
import { ToolHandler } from '../../types';
import { AppError } from '../../utils/asyncHandler';
import { loadPdf, requireSinglePdf } from './pdfHelpers';

const MAX_TEXT_LENGTH = 100;

/** Draw a text watermark across every page of a PDF. */
export const watermark: ToolHandler = async (files, body) => {
  const file = requireSinglePdf(files);

  const text = (typeof body.text === 'string' ? body.text : '').trim();
  if (!text) {
    throw new AppError('Enter the watermark text.', 400);
  }
  if (text.length > MAX_TEXT_LENGTH) {
    throw new AppError(
      `Watermark text must be ${MAX_TEXT_LENGTH} characters or fewer.`,
      400
    );
  }

  const position = body.position === 'center' ? 'center' : 'diagonal';

  let opacity = parseFloat(typeof body.opacity === 'string' ? body.opacity : '');
  if (Number.isNaN(opacity)) opacity = 0.3;
  opacity = Math.min(1, Math.max(0.05, opacity));

  const doc = await loadPdf(file.path, file.originalname);
  const font = await doc.embedFont(StandardFonts.HelveticaBold);
  const widthPerUnit = font.widthOfTextAtSize(text, 1) || 1;

  for (const page of doc.getPages()) {
    const { width, height } = page.getSize();
    const targetWidth =
      position === 'diagonal'
        ? Math.hypot(width, height) * 0.6
        : width * 0.8;

    // Font size scales linearly with text width; clamp so it never overflows.
    let fontSize = targetWidth / widthPerUnit;
    fontSize = Math.min(fontSize, height * 0.5);
    fontSize = Math.max(fontSize, 8);

    const textWidth = font.widthOfTextAtSize(text, fontSize);
    const color = rgb(0.5, 0.5, 0.5);

    if (position === 'diagonal') {
      const angle = (45 * Math.PI) / 180;
      page.drawText(text, {
        x: width / 2 - (textWidth / 2) * Math.cos(angle),
        y: height / 2 - (textWidth / 2) * Math.sin(angle),
        size: fontSize,
        font,
        color,
        opacity,
        rotate: degrees(45),
      });
    } else {
      page.drawText(text, {
        x: (width - textWidth) / 2,
        y: height / 2 - fontSize / 2,
        size: fontSize,
        font,
        color,
        opacity,
      });
    }
  }

  const bytes = await doc.save();

  return {
    buffer: Buffer.from(bytes),
    fileName: 'watermarked.pdf',
    contentType: 'application/pdf',
  };
};
