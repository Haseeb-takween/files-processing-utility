import { Types } from 'mongoose';
import { UsageLog } from '../models/UsageLog';
import { PdfTool } from '../types';

/**
 * Record a successful tool run. Logging must never break the response,
 * so failures here are swallowed (and logged to the console).
 */
export const logUsage = async (
  userId: string,
  tool: PdfTool,
  originalFileName: string,
  fileCount = 1
): Promise<void> => {
  try {
    await UsageLog.create({ userId, tool, originalFileName, fileCount });
  } catch (err) {
    console.error('Failed to write usage log:', err);
  }
};

/** Most recent usage logs for a single user. */
export const getUserUsage = (userId: string, limit = 50) =>
  UsageLog.find({ userId }).sort({ createdAt: -1 }).limit(limit).lean();

/** Recent logs plus total count and per-tool breakdown for a user. */
export const getUserUsageSummary = async (userId: string, limit = 50) => {
  const [logs, total, byToolRaw] = await Promise.all([
    getUserUsage(userId, limit),
    UsageLog.countDocuments({ userId }),
    UsageLog.aggregate<{ _id: string; count: number }>([
      { $match: { userId: new Types.ObjectId(userId) } },
      { $group: { _id: '$tool', count: { $sum: 1 } } },
    ]),
  ]);

  const byTool = byToolRaw.reduce<Record<string, number>>((acc, row) => {
    acc[row._id] = row.count;
    return acc;
  }, {});

  return { total, byTool, logs };
};
