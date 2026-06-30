import mongoose, { Schema, type Document } from 'mongoose';

export interface IPlanDocument extends Document {
  key: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  features: string[];
  isPopular: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const planSchema = new Schema<IPlanDocument>(
  {
    key: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: '' },
    price: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'USD', uppercase: true },
    features: [{ type: String }],
    isPopular: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

planSchema.index({ key: 1 }, { unique: true });

export const PlanModel = mongoose.model<IPlanDocument>('Plan', planSchema);
