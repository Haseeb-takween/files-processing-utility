import { Response } from 'express';
import { AuthRequest } from '../types';
import { asyncHandler } from '../utils/asyncHandler';
import { pdfService } from '../services/pdf.service';

export const getTools = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const health = await pdfService.healthCheck();
  res.json({ success: true, data: health });
});

export const merge = asyncHandler(async (_req: AuthRequest, res: Response) => {
  res.status(501).json({
    success: false,
    message: 'Merge endpoint ready — PDF processing to be implemented',
  });
});

export const split = asyncHandler(async (_req: AuthRequest, res: Response) => {
  res.status(501).json({
    success: false,
    message: 'Split endpoint ready — PDF processing to be implemented',
  });
});

export const compress = asyncHandler(async (_req: AuthRequest, res: Response) => {
  res.status(501).json({
    success: false,
    message: 'Compress endpoint ready — PDF processing to be implemented',
  });
});

export const convert = asyncHandler(async (_req: AuthRequest, res: Response) => {
  res.status(501).json({
    success: false,
    message: 'Convert endpoint ready — PDF processing to be implemented',
  });
});

export const pages = asyncHandler(async (_req: AuthRequest, res: Response) => {
  res.status(501).json({
    success: false,
    message: 'Add/remove pages endpoint ready — PDF processing to be implemented',
  });
});

export const watermark = asyncHandler(async (_req: AuthRequest, res: Response) => {
  res.status(501).json({
    success: false,
    message: 'Watermark endpoint ready — PDF processing to be implemented',
  });
});
