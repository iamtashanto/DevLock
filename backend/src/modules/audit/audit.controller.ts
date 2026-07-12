import type { Request, Response } from 'express';
import { AuditLogModel } from '@/database';

export class AuditController {
  async list(req: Request, res: Response): Promise<void> {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const skip = (page - 1) * limit;

    const query: any = { tenantId: req.auth!.orgId };

    if (req.query.projectId) {
      // If we want to filter by project, it might be in the metadata or resource
      query['resource.id'] = req.query.projectId;
    }

    const logs = await AuditLogModel.find(query)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await AuditLogModel.countDocuments(query);

    res.json({
      success: true,
      data: logs,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  }
}
