import { randomBytes } from 'crypto';
import { ProjectModel, TenantModel, PlanModel, LicenseModel, type IProjectDocument } from '@/database';
import mongoose from 'mongoose';
import { NotFoundError } from '../../core/errors/index.js';

export interface CreateProjectInput {
  name: string;
  description?: string;
  allowedDomains?: string[];
}

export interface UpdateProjectInput {
  name?: string;
  description?: string;
  allowedDomains?: string[];
  settings?: any;
}

export class ProjectService {
  async list(tenantId: string) {
    const projects = await ProjectModel.find({ tenantId: new mongoose.Types.ObjectId(tenantId) })
      .select('-secretKey')
      .sort({ createdAt: -1 })
      .lean();

    // Attach license counts per project in a single aggregation.
    const ids = projects.map((p) => p._id);
    const counts = ids.length
      ? await LicenseModel.aggregate([
          { $match: { projectId: { $in: ids } } },
          {
            $group: {
              _id: '$projectId',
              total: { $sum: 1 },
              active: { $sum: { $cond: [{ $in: ['$status', ['active', 'trial']] }, 1, 0] } },
            },
          },
        ])
      : [];
    const byId = new Map(counts.map((c: any) => [c._id.toString(), c]));

    return projects.map((p) => {
      const c = byId.get(p._id.toString());
      return { ...this.mapProject(p), totalLicenses: c?.total ?? 0, activeLicenses: c?.active ?? 0 };
    });
  }

  async getById(tenantId: string, projectId: string) {
    const project = await ProjectModel.findOne({
      _id: new mongoose.Types.ObjectId(projectId),
      tenantId: new mongoose.Types.ObjectId(tenantId)
    }).lean();

    if (!project) throw new NotFoundError('Project not found');
    return this.mapProject(project);
  }

  async create(tenantId: string, input: CreateProjectInput) {
    // Check dynamic project limit
    const tenant = await TenantModel.findById(tenantId).lean();
    if (!tenant) throw new NotFoundError('Tenant not found');

    const plan = await PlanModel.findOne({ key: tenant.plan }).lean();
    const maxProjects = plan?.maxProjects ?? 5; // Default to 5 if plan not found

    const currentProjectCount = await ProjectModel.countDocuments({ tenantId: new mongoose.Types.ObjectId(tenantId) });

    if (currentProjectCount >= maxProjects) {
      throw new Error(`Project limit reached. Your current plan (${tenant.plan}) allows up to ${maxProjects} projects.`);
    }

    const publicKey = `pk_live_${randomBytes(16).toString('hex')}`;
    const secretKey = `sk_live_${randomBytes(24).toString('hex')}`;

    const project = await ProjectModel.create({
      tenantId: new mongoose.Types.ObjectId(tenantId),
      name: input.name,
      description: input.description,
      allowedDomains: input.allowedDomains ?? [],
      publicKey,
      secretKey,
    });

    const projectData = await ProjectModel.findById(project._id).lean();
    return { ...this.mapProject(projectData), secretKey: projectData?.secretKey };
  }

  async update(tenantId: string, projectId: string, input: UpdateProjectInput) {
    const project = await ProjectModel.findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(projectId), tenantId: new mongoose.Types.ObjectId(tenantId) },
      { $set: input },
      { new: true }
    ).lean();

    if (!project) throw new NotFoundError('Project not found');
    return this.mapProject(project);
  }

  async rotateKeys(tenantId: string, projectId: string): Promise<{ apiKey: string; secretKey: string }> {
    const publicKey = `pk_live_${randomBytes(16).toString('hex')}`;
    const secretKey = `sk_live_${randomBytes(24).toString('hex')}`;

    const project = await ProjectModel.findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(projectId), tenantId: new mongoose.Types.ObjectId(tenantId) },
      { $set: { publicKey, secretKey } },
      { new: true },
    ).lean();

    if (!project) throw new NotFoundError('Project not found');
    return { apiKey: publicKey, secretKey };
  }

  async listDomains(tenantId: string, projectId: string): Promise<string[]> {
    const project = await this.getById(tenantId, projectId);
    return project.allowedDomains ?? [];
  }

  async addDomain(tenantId: string, projectId: string, domain: string): Promise<string[]> {
    const normalized = normalizeDomain(domain);
    if (!normalized) throw new NotFoundError('A valid domain is required');

    const project = await ProjectModel.findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(projectId), tenantId: new mongoose.Types.ObjectId(tenantId) },
      { $addToSet: { allowedDomains: normalized } },
      { new: true },
    ).lean();

    if (!project) throw new NotFoundError('Project not found');
    return project.allowedDomains ?? [];
  }

  async removeDomain(tenantId: string, projectId: string, domain: string): Promise<string[]> {
    const project = await ProjectModel.findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(projectId), tenantId: new mongoose.Types.ObjectId(tenantId) },
      { $pull: { allowedDomains: normalizeDomain(domain) } },
      { new: true },
    ).lean();

    if (!project) throw new NotFoundError('Project not found');
    return project.allowedDomains ?? [];
  }

  async delete(tenantId: string, projectId: string) {
    const project = await ProjectModel.findOneAndDelete({
      _id: new mongoose.Types.ObjectId(projectId),
      tenantId: new mongoose.Types.ObjectId(tenantId)
    });

    if (!project) throw new NotFoundError('Project not found');
    return { id: project._id.toString() };
  }

  private mapProject(doc: any) {
    return {
      id: doc._id.toString(),
      name: doc.name,
      description: doc.description,
      apiKey: doc.publicKey,
      secretKey: doc.secretKey,
      allowedDomains: doc.allowedDomains,
      settings: doc.settings,
      isActive: doc.isActive,
      createdAt: doc.createdAt?.toISOString(),
      updatedAt: doc.updatedAt?.toISOString(),
    };
  }
}

/**
 * Normalise a user-supplied domain: strip protocol, path, port and whitespace,
 * lowercase it. Returns '' if nothing usable remains.
 */
function normalizeDomain(input: string): string {
  if (!input || typeof input !== 'string') return '';
  return input
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/\/.*$/, '')
    .replace(/:\d+$/, '')
    .trim();
}
