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
}
