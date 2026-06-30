import mongoose, { Schema, type Document } from 'mongoose';

export interface ITenantDocument extends Document {
  name: string;
  slug: string;
  plan: 'free' | 'starter' | 'pro' | 'business' | 'enterprise';
  owner: mongoose.Types.ObjectId;
  settings: {
    customDomain?: string;
    branding?: { logo?: string; primaryColor?: string; companyName?: string };
  };
  billing: {
    stripeCustomerId?: string;
    subscriptionId?: string;
    currentPeriodEnd?: Date;
    paymentStatus?: 'active' | 'past_due' | 'canceled';
  };
  createdAt: Date;
  updatedAt: Date;
}

const tenantSchema = new Schema<ITenantDocument>(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    plan: { type: String, enum: ['free', 'starter', 'pro', 'business', 'enterprise'], default: 'free' },
    owner: { type: Schema.Types.ObjectId, ref: 'User' },
    settings: {
      customDomain: String,
      branding: { logo: String, primaryColor: String, companyName: String },
    },
    billing: {
      stripeCustomerId: String,
      subscriptionId: String,
      currentPeriodEnd: Date,
      paymentStatus: { type: String, enum: ['active', 'past_due', 'canceled'] },
    },
  },
  { timestamps: true },
);

tenantSchema.index({ slug: 1 }, { unique: true });
tenantSchema.index({ owner: 1 });
tenantSchema.index({ 'billing.stripeCustomerId': 1 }, { sparse: true });

export const TenantModel = mongoose.model<ITenantDocument>('Tenant', tenantSchema);
