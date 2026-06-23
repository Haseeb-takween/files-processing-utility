import { Response } from 'express';
import { AuthRequest } from '../types';
import { asyncHandler } from '../utils/asyncHandler';
import * as usageService from '../services/usage.service';

export const getUsage = asyncHandler(async (req: AuthRequest, res: Response) => {
  const logs = await usageService.getUserUsage(req.user!.id);
  res.json({ success: true, data: logs });
});
