import { ManualPaymentModel, TenantModel, ProjectModel, UserModel } from '@devlock/database';
import mongoose from 'mongoose';

export class AdminService {
  async getDashboardStats() {
    const totalTenants = await TenantModel.countDocuments();
    const totalProjects = await ProjectModel.countDocuments();
    const totalUsers = await UserModel.countDocuments();
    const pendingPayments = await ManualPaymentModel.countDocuments({ status: 'pending' });

    return { totalTenants, totalProjects, totalUsers, pendingPayments };
  }

  async listManualPayments(status?: 'pending' | 'approved' | 'rejected') {
    const query = status ? { status } : {};
    return ManualPaymentModel.find(query)
      .populate('tenantId', 'name email')
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .lean();
  }

  async approvePayment(paymentId: string) {
    const payment = await ManualPaymentModel.findById(paymentId);
    if (!payment) throw new Error('Payment not found');
    if (payment.status !== 'pending') throw new Error('Payment is already ' + payment.status);

    // Approve the payment
    payment.status = 'approved';
    await payment.save();

    // Upgrade the tenant's plan
    await TenantModel.findByIdAndUpdate(payment.tenantId, {
      plan: payment.planId,
      'billing.paymentStatus': 'active'
    });

    return payment;
  }

  async rejectPayment(paymentId: string) {
    const payment = await ManualPaymentModel.findById(paymentId);
    if (!payment) throw new Error('Payment not found');
    if (payment.status !== 'pending') throw new Error('Payment is already ' + payment.status);

    payment.status = 'rejected';
    await payment.save();

    return payment;
  }

  async listTenants() {
    return TenantModel.find()
      .populate('owner', 'name email')
      .sort({ createdAt: -1 })
      .lean();
  }

  async updateTenantPlan(tenantId: string, plan: string) {
    const tenant = await TenantModel.findById(tenantId);
    if (!tenant) throw new Error('Tenant not found');

    tenant.plan = plan as any;
    tenant.billing = tenant.billing || {};
    tenant.billing.paymentStatus = 'active';
    await tenant.save();

    return tenant;
  }
}
