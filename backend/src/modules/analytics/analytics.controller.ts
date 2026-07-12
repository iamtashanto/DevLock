import type { Request, Response } from 'express';
import { AnalyticsService } from './analytics.service.js';

const analyticsService = new AnalyticsService();

export class AnalyticsController {
  async getOverview(req: Request, res: Response): Promise<void> {
    const data = await analyticsService.getOverview(req.auth!.orgId);
    res.json({ success: true, data });
  }

  async getLicenseStats(req: Request, res: Response): Promise<void> {
    const { projectId } = req.query;
    const data = await analyticsService.getLicenseStats(
      req.auth!.orgId,
      projectId as string | undefined
    );
    res.json({ success: true, data });
  }

  // Stubs for remaining endpoints - these can be populated later
  async getUsage(req: Request, res: Response): Promise<void> {
    res.json({ success: true, data: { validations: [], peakHour: 0, averageDaily: 0, topCountries: [], topDevices: [] } });
  }

  async getProjectAnalytics(req: Request, res: Response): Promise<void> {
    const data = await analyticsService.getProjectAnalytics(req.auth!.orgId, req.params['projectId']!);
    res.json({ success: true, data });
  }
}
