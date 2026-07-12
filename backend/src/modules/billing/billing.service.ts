import mongoose from 'mongoose';
import { ManualPaymentModel } from '@/database';

export interface SubmitPaymentInput {
  method: 'bkash' | 'nagad' | 'crypto';
  transactionId: string;
  amount: number;
  currency: string;
  /** Plan key (references a dynamic Plan.key, e.g. 'starter', 'business') */
  planId: string;
  notes?: string;
}

export class BillingService {
  async submitManualPayment(tenantId: string, userId: string, input: SubmitPaymentInput) {
    // Check if there is already a pending payment for this transaction ID
    const existing = await ManualPaymentModel.findOne({ transactionId: input.transactionId }).lean();
    if (existing) {
      throw new Error('Transaction ID already submitted');
    }

    const payment = await ManualPaymentModel.create({
      tenantId: new mongoose.Types.ObjectId(tenantId),
      userId: new mongoose.Types.ObjectId(userId),
      method: input.method,
      transactionId: input.transactionId,
      amount: input.amount,
      currency: input.currency || 'BDT',
      planId: input.planId,
      notes: input.notes,
    });

    return payment;
  }
}
