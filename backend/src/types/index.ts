import { Request } from 'express';
import { JwtPayload } from 'jsonwebtoken';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
}

export interface AuthRequest extends Request {
  user?: AuthUser;
  /** Per-request upload job directory, set by the multer storage engine. */
  uploadDir?: string;
}

export interface JwtUserPayload extends JwtPayload {
  id: string;
  name: string;
  email: string;
}

export const PDF_TOOLS = [
  'merge',
  'split',
  'compress',
  'convert',
  'pages',
  'watermark',
] as const;

export type PdfTool = (typeof PDF_TOOLS)[number];

export const isPdfTool = (value: string): value is PdfTool =>
  (PDF_TOOLS as readonly string[]).includes(value);

/** Result returned by every PDF tool service. */
export interface PdfResult {
  buffer: Buffer;
  fileName: string;
  contentType: string;
  /** Optional extra response headers (e.g. compression stats). Use X- prefix. */
  extraHeaders?: Record<string, string>;
}

/** A tool handler receives the uploaded files and parsed body fields. */
export type ToolHandler = (
  files: Express.Multer.File[],
  body: Record<string, unknown>
) => Promise<PdfResult>;
