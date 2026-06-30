import type { Request, Response } from 'express';
import { ProjectService } from './project.service.js';

const projectService = new ProjectService();

export class ProjectController {
  async list(req: Request, res: Response): Promise<void> {
    const projects = await projectService.list(req.auth!.orgId);
    res.json({ success: true, data: projects, meta: { total: projects.length } });
  }

  async getById(req: Request, res: Response): Promise<void> {
    const project = await projectService.getById(req.auth!.orgId, req.params['projectId']!);
    res.json({ success: true, data: project });
  }

  async create(req: Request, res: Response): Promise<void> {
    const project = await projectService.create(req.auth!.orgId, req.body);
    res.status(201).json({ success: true, data: project });
  }

  async update(req: Request, res: Response): Promise<void> {
    const project = await projectService.update(req.auth!.orgId, req.params['projectId']!, req.body);
    res.json({ success: true, data: project });
  }

  async delete(req: Request, res: Response): Promise<void> {
    const result = await projectService.delete(req.auth!.orgId, req.params['projectId']!);
    res.json({ success: true, data: result });
  }
}
