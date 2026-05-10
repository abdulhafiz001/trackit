import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ILogEntry extends Document {
  userId: Types.ObjectId;
  date: Date;
  weekNumber: number;
  dayOfWeek: string;
  tasks: string;
  challenges?: string;
  learnings?: string;
  aiGenerated: boolean;
  status: 'draft' | 'saved' | 'holiday';
  createdAt: Date;
  updatedAt: Date;
}

const LogEntrySchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: Date, required: true },
    weekNumber: { type: Number, required: true },
    dayOfWeek: { type: String, required: true },
    tasks: { type: String, required: true },
    challenges: { type: String },
    learnings: { type: String },
    aiGenerated: { type: Boolean, default: false },
    status: { type: String, enum: ['draft', 'saved', 'holiday'], default: 'saved' },
  },
  { timestamps: true }
);

// Compound index to ensure one log entry per user per date
LogEntrySchema.index({ userId: 1, date: 1 }, { unique: true });

export default mongoose.models.LogEntry || mongoose.model<ILogEntry>('LogEntry', LogEntrySchema);
