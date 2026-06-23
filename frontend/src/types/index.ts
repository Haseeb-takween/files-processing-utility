export interface User {
  name: string;
  email: string;
}

export interface AuthMeResponse {
  user: User;
}

export type PdfTool =
  | 'merge'
  | 'split'
  | 'compress'
  | 'convert'
  | 'pages'
  | 'watermark';

export interface ToolInfo {
  name: string;
  slug: PdfTool;
  description: string;
  href: string;
}
