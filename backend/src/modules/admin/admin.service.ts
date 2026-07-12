import { ManualPaymentModel, TenantModel, ProjectModel, UserModel, LicenseModel } from '@/database';
import mongoose from 'mongoose';
import os from 'os';
import { randomUUID } from 'crypto';
import { emitTenantEvent } from '../../core/events/index.js';

function notify(tenantId: string, type: 'info' | 'success' | 'warning' | 'error', title: string, message: string) {
  return emitTenantEvent(tenantId, 'notification', {
    id: randomUUID(),
    title,
    message,
    type,
    read: false,
    createdAt: new Date().toISOString(),
  });
}

export class AdminService {
  async getDashboardStats() {
    const totalTenants = await TenantModel.countDocuments();
    const totalProjects = await ProjectModel.countDocuments();
    const totalUsers = await UserModel.countDocuments();
    const pendingPayments = await ManualPaymentModel.countDocuments({ status: 'pending' });
    const totalLicenses = await LicenseModel.countDocuments();
    const activeLicenses = await LicenseModel.countDocuments({ status: 'active' });

    return { totalTenants, totalProjects, totalUsers, pendingPayments, totalLicenses, activeLicenses };
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

    await notify(
      payment.tenantId.toString(),
      'success',
      'Payment approved',
      `Your payment was approved and your plan is now "${payment.planId}".`,
    );

    return payment;
  }

  async rejectPayment(paymentId: string) {
    const payment = await ManualPaymentModel.findById(paymentId);
    if (!payment) throw new Error('Payment not found');
    if (payment.status !== 'pending') throw new Error('Payment is already ' + payment.status);

    payment.status = 'rejected';
    await payment.save();

    await notify(
      payment.tenantId.toString(),
      'warning',
      'Payment rejected',
      `Your payment (txn ${payment.transactionId}) could not be verified. Please check the details and try again.`,
    );

    return payment;
  }

  async listTenants() {
    const tenants = await TenantModel.find()
      .populate('owner', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    const { PlanModel } = await import('@/database');
    const plans = await PlanModel.find().lean();
    const planMap = new Map(plans.map(p => [p.key, p.maxProjects]));

    const tenantsWithUsage = await Promise.all(
      tenants.map(async (tenant) => {
        const projectCount = await ProjectModel.countDocuments({ tenantId: tenant._id });
        const maxProjects = planMap.get(tenant.plan) ?? 5;
        return { ...tenant, projectCount, maxProjects };
      })
    );

    return tenantsWithUsage;
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

    const totalRam = os.totalmem();
    const freeRam = os.freemem();
    const usedRam = totalRam - freeRam;
    const ramPercentage = (usedRam / totalRam) * 100;
    
    // CPU usage based on 1 minute load average and number of logical CPUs
    const cpus = os.cpus().length;
    const loadAvg = os.loadavg()[0];
    const cpuPercentage = Math.min((loadAvg / cpus) * 100, 100);

    return {
      database: dbStatus,
      apiGateway: 'online',
      version: '1.0.0',
      uptime: process.uptime(),
      timestamp: new Date(),
      ramUsage: {
        total: totalRam,
        used: usedRam,
        percentage: ramPercentage
      },
      cpuUsage: cpuPercentage
    };
  }

  async backupDatabase() {
    const backup: Record<string, any[]> = {};
    const modelNames = mongoose.modelNames();
    
    for (const modelName of modelNames) {
      const model = mongoose.model(modelName);
      backup[modelName] = await model.find().lean();
    }
    
    return backup;
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
