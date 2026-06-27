import { Response } from 'express';
import { AuthRequest } from '../types';
import { asyncHandler } from '../utils/asyncHandler';
import { getUserUsageSummary } from '../services/usage.service';

export const me = asyncHandler(async (req: AuthRequest, res: Response) => {
  const summary = await getUserUsageSummary(req.user!.id);
  res.json(summary);
});
