import type { Request, Response } from 'express';
import { AdminService } from './admin.service.js';

const adminService = new AdminService();

export class AdminController {
  async getDashboardStats(req: Request, res: Response): Promise<void> {
    const data = await adminService.getDashboardStats();
    res.json({ success: true, data });
  }

  async listManualPayments(req: Request, res: Response): Promise<void> {
    const status = req.query['status'] as 'pending' | 'approved' | 'rejected' | undefined;
    const data = await adminService.listManualPayments(status);
    res.json({ success: true, data });
  }

  async approvePayment(req: Request, res: Response): Promise<void> {
    const data = await adminService.approvePayment(req.params['paymentId']!);
    res.json({ success: true, data });
  }

  async rejectPayment(req: Request, res: Response): Promise<void> {
    const data = await adminService.rejectPayment(req.params['paymentId']!);
    res.json({ success: true, data });
  }

  async listTenants(req: Request, res: Response): Promise<void> {
    const data = await adminService.listTenants();
    res.json({ success: true, data });
  }

  async updateTenantPlan(req: Request, res: Response): Promise<void> {
    const data = await adminService.updateTenantPlan(req.params['tenantId']!, req.body.plan);
    res.json({ success: true, data });
  }

  async getSystemStatus(req: Request, res: Response): Promise<void> {
    const data = await adminService.getSystemStatus();
    res.json({ success: true, data });
  }

  async getPlans(req: Request, res: Response): Promise<void> {
    const data = await adminService.getPlans();
    res.json({ success: true, data });
  }

  async createPlan(req: Request, res: Response): Promise<void> {
    const data = await adminService.createPlan(req.body);
    res.json({ success: true, data });
  }

  async updatePlan(req: Request, res: Response): Promise<void> {
    const data = await adminService.updatePlan(req.params['id']!, req.body);
    res.json({ success: true, data });
  }

  async deletePlan(req: Request, res: Response): Promise<void> {
    const data = await adminService.deletePlan(req.params['id']!);
    res.json(data);
  }
}
