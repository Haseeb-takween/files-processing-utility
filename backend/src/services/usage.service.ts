import { UsageLog } from '../models/UsageLog';
import { PdfTool } from '../types';

export const logUsage = async (
  userId: string,
  tool: PdfTool,
  originalFileName?: string
): Promise<void> => {
  await UsageLog.create({
    userId,
    tool,
    originalFileName,
  });
};

export const getUserUsage = async (userId: string) => {
  return UsageLog.find({ userId }).sort({ createdAt: -1 }).limit(50);
};
