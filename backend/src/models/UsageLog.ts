import mongoose, { Document, Schema, Types } from 'mongoose';
import { PDF_TOOLS, PdfTool } from '../types';

export interface IUsageLog extends Document {
  userId: Types.ObjectId;
  tool: PdfTool;
  originalFileName: string;
  fileCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const usageLogSchema = new Schema<IUsageLog>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    tool: {
      type: String,
      enum: PDF_TOOLS,
      required: true,
    },
    originalFileName: {
      type: String,
      required: true,
    },
    fileCount: {
      type: Number,
      default: 1,
    },
  },
  { timestamps: true }
);

export const UsageLog = mongoose.model<IUsageLog>('UsageLog', usageLogSchema);
