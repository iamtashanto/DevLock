import type { Request, Response } from 'express';
import { BillingService } from './billing.service.js';

const billingService = new BillingService();

export class BillingController {
  async submitManualPayment(req: Request, res: Response): Promise<void> {
    const payment = await billingService.submitManualPayment(
      req.auth!.orgId,
      req.auth!.sub,
      req.body
    );
    res.status(201).json({ success: true, data: payment });
  }
}
