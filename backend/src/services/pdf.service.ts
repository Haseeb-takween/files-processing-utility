import { AppError } from '../utils/asyncHandler';

export const pdfService = {
  async healthCheck(): Promise<{ status: string; tools: string[] }> {
    return {
      status: 'ready',
      tools: ['merge', 'split', 'compress', 'convert', 'pages', 'watermark'],
    };
  },

  async merge(_filePaths: string[]): Promise<Buffer> {
    throw new AppError('Merge not implemented yet', 501);
  },

  async split(_filePath: string, _ranges: string): Promise<Buffer> {
    throw new AppError('Split not implemented yet', 501);
  },

  async compress(_filePath: string): Promise<Buffer> {
    throw new AppError('Compress not implemented yet', 501);
  },

  async convert(_filePath: string, _direction: string): Promise<Buffer> {
    throw new AppError('Convert not implemented yet', 501);
  },

  async modifyPages(_filePath: string, _action: string, _pageIndex: number): Promise<Buffer> {
    throw new AppError('Add/remove pages not implemented yet', 501);
  },

  async watermark(_filePath: string, _text: string, _options: Record<string, unknown>): Promise<Buffer> {
    throw new AppError('Watermark not implemented yet', 501);
  },
};
