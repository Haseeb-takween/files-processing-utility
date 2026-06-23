import { Request } from 'express';
import { JwtPayload } from 'jsonwebtoken';

export interface AuthUser {
  id: string;
  email: string;
}

export interface AuthRequest extends Request {
  user?: AuthUser;
}

export interface JwtUserPayload extends JwtPayload {
  id: string;
  email: string;
}

export type PdfTool =
  | 'merge'
  | 'split'
  | 'compress'
  | 'convert'
  | 'pages'
  | 'watermark';

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
}
