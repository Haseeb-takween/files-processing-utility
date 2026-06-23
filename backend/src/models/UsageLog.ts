import mongoose, { Document, Schema } from 'mongoose';
import { PdfTool } from '../types';

export interface IUsageLog extends Document {
  userId: mongoose.Types.ObjectId;
  tool: PdfTool;
  originalFileName?: string;
  createdAt: Date;
}

const usageLogSchema = new Schema<IUsageLog>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    tool: {
      type: String,
      required: true,
      enum: ['merge', 'split', 'compress', 'convert', 'pages', 'watermark'],
    },
    originalFileName: {
      type: String,
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

usageLogSchema.index({ userId: 1, createdAt: -1 });

export const UsageLog = mongoose.model<IUsageLog>('UsageLog', usageLogSchema);
