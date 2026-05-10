import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  email: string;
  name: string;
  organization: string;
  department: string;
  supervisorName?: string;
  itDurationWeeks: number;
  startDate: Date;
  endDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema(
  {
    email: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    organization: { type: String, required: true },
    department: { type: String, required: true },
    supervisorName: { type: String },
    itDurationWeeks: { type: Number, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
  },
  { timestamps: true }
);

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
