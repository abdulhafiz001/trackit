import mongoose, { Schema, Document } from 'mongoose';

export interface IPublicHoliday extends Document {
  date: Date;
  name: string;
  year: number;
}

const PublicHolidaySchema: Schema = new Schema({
  date: { type: Date, required: true, unique: true },
  name: { type: String, required: true },
  year: { type: Number, required: true },
});

export default mongoose.models.PublicHoliday || mongoose.model<IPublicHoliday>('PublicHoliday', PublicHolidaySchema);
