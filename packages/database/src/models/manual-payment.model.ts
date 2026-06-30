import mongoose, { Schema, type Document } from 'mongoose';

export interface IManualPaymentDocument extends Document {
  tenantId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  method: 'bkash' | 'nagad' | 'crypto';
  transactionId: string;
  amount: number;
  currency: string;
  planId: 'pro' | 'business' | 'enterprise';
  status: 'pending' | 'approved' | 'rejected';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const manualPaymentSchema = new Schema<IManualPaymentDocument>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    method: { type: String, enum: ['bkash', 'nagad', 'crypto'], required: true },
    transactionId: { type: String, required: true, trim: true },
    amount: { type: Number, required: true },
    currency: { type: String, required: true, default: 'BDT' },
    planId: { type: String, enum: ['pro', 'business', 'enterprise'], required: true },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

manualPaymentSchema.index({ tenantId: 1 });
manualPaymentSchema.index({ status: 1 });
manualPaymentSchema.index({ transactionId: 1 });

export const ManualPaymentModel = mongoose.model<IManualPaymentDocument>('ManualPayment', manualPaymentSchema);
