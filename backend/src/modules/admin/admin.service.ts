import { ManualPaymentModel, TenantModel, ProjectModel, UserModel } from '@/database';
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

  async getSystemStatus() {
    const dbState = mongoose.connection.readyState;
    let dbStatus = 'disconnected';
    if (dbState === 1) dbStatus = 'connected';
    else if (dbState === 2) dbStatus = 'connecting';
    else if (dbState === 3) dbStatus = 'disconnecting';

    return {
      database: dbStatus,
      apiGateway: 'online',
      version: '1.0.0',
      uptime: process.uptime(),
      timestamp: new Date()
    };
  }

  async getPlans() {
    // dynamically import PlanModel to avoid circular deps if any, or just import it at top
    const { PlanModel } = await import('@/database');
    return PlanModel.find().sort({ price: 1 }).lean();
  }

  async createPlan(data: any) {
    const { PlanModel } = await import('@/database');
    const plan = new PlanModel(data);
    await plan.save();
    return plan;
  }

  async updatePlan(id: string, data: any) {
    const { PlanModel } = await import('@/database');
    const plan = await PlanModel.findByIdAndUpdate(id, data, { new: true });
    if (!plan) throw new Error('Plan not found');
    return plan;
  }

  async deletePlan(id: string) {
    const { PlanModel } = await import('@/database');
    const plan = await PlanModel.findByIdAndDelete(id);
    if (!plan) throw new Error('Plan not found');
    return { success: true };
  }
}
