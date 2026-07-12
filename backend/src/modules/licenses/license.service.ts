import { createHash } from 'crypto';
import { LicenseModel, ProjectModel, ConfigModel } from '@/database';
import { generateLicenseKey, encrypt } from '@/encryption';
import { createLogger } from '@/logger';
import { NotFoundError, ForbiddenError, ConflictError } from '../../core/errors/index.js';
import { emitProjectEvent } from '../../core/events/index.js';

const logger = createLogger({ service: 'license-service' });

export interface CreateLicenseInput {
  type: 'perpetual' | 'subscription' | 'trial' | 'floating';
  maxActivations: number;
  expiresAt?: string;
  features: string[];
  customerEmail?: string;
  customerName?: string;
  metadata: Record<string, unknown>;
}

export interface ListLicensesQuery {
  page: number;
  limit: number;
  status?: string;
  type?: string;
  search?: string;
  sort: string;
  order: 'asc' | 'desc';
}

export class LicenseService {
  /**
   * Create a new license for a project.
   */
  async create(orgId: string, projectId: string, input: CreateLicenseInput) {
    // Verify project belongs to org
    const project = await ProjectModel.findOne({ _id: projectId, orgId });
    if (!project) throw new NotFoundError('Project not found');

    // Generate license key
    const key = generateLicenseKey();
    const keyHash = createHash('sha256').update(key).digest('hex');

    const license = await LicenseModel.create({
      orgId,
      projectId,
      key: encrypt(key, process.env['ENCRYPTION_KEY'] ?? ''),
      keyHash,
      status: input.type === 'trial' ? 'trial' : 'active',
      type: input.type,
      maxActivations: input.maxActivations,
      currentActivations: 0,
      features: input.features,
      metadata: input.metadata,
      customerEmail: input.customerEmail,
      customerName: input.customerName,
      expiresAt: input.expiresAt ? new Date(input.expiresAt) : undefined,
      totalValidations: 0,
    });

    logger.info({ licenseId: license._id, projectId }, 'License created');

    // Return with plaintext key (only shown once)
    return {
      id: license._id.toString(),
      key, // plaintext — only returned on creation
      status: license.status,
      type: license.type,
      maxActivations: license.maxActivations,
      features: license.features,
      metadata: license.metadata,
      customerEmail: license.customerEmail,
      customerName: license.customerName,
      expiresAt: license.expiresAt?.toISOString(),
      createdAt: license.createdAt.toISOString(),
    };
  }

  /**
   * List licenses for a project with pagination and filtering.
   */
  async list(orgId: string, projectId: string, query: ListLicensesQuery) {
    // Verify project access
    const project = await ProjectModel.findOne({ _id: projectId, orgId });
    if (!project) throw new NotFoundError('Project not found');

    const filter: Record<string, unknown> = { orgId, projectId };
    if (query.status) filter['status'] = query.status;
    if (query.type) filter['type'] = query.type;
    if (query.search) {
      filter['$or'] = [
        { customerEmail: { $regex: query.search, $options: 'i' } },
        { customerName: { $regex: query.search, $options: 'i' } },
      ];
    }

    const [licenses, total] = await Promise.all([
      LicenseModel.find(filter)
        .select('-key -keyHash')
        .sort({ [query.sort]: query.order === 'asc' ? 1 : -1 })
        .skip((query.page - 1) * query.limit)
        .limit(query.limit)
        .lean(),
      LicenseModel.countDocuments(filter),
    ]);

    return {
      data: licenses.map((l) => ({
        id: l._id.toString(),
        status: l.status,
        type: l.type,
        maxActivations: l.maxActivations,
        currentActivations: l.activations?.length ?? 0,
        features: l.features,
        customerEmail: l.customerEmail,
        customerName: l.customerName,
        expiresAt: l.expiresAt?.toISOString(),
        lastValidatedAt: l.lastValidatedAt?.toISOString(),
        createdAt: l.createdAt.toISOString(),
      })),
      meta: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }

  /**
   * Get a single license by ID.
   */
  async getById(orgId: string, projectId: string, licenseId: string) {
    const license = await LicenseModel.findOne({ _id: licenseId, orgId, projectId })
      .select('-key -keyHash')
      .lean();

    if (!license) throw new NotFoundError('License not found');

    return {
      id: license._id.toString(),
      status: license.status,
      type: license.type,
      maxActivations: license.maxActivations,
      currentActivations: license.activations?.length ?? 0,
      features: license.features,
      metadata: license.metadata,
      customerEmail: license.customerEmail,
      customerName: license.customerName,
      activations: license.activations ?? [],
      expiresAt: license.expiresAt?.toISOString(),
      suspendedAt: license.suspendedAt?.toISOString(),
      lastValidatedAt: license.lastValidatedAt?.toISOString(),
      totalValidations: license.totalValidations,
      createdAt: license.createdAt.toISOString(),
      updatedAt: license.updatedAt.toISOString(),
    };
  }

  /**
   * Suspend a license.
   */
  async suspend(orgId: string, projectId: string, licenseId: string, reason: string) {
    const license = await LicenseModel.findOne({ _id: licenseId, orgId, projectId });
    if (!license) throw new NotFoundError('License not found');
    if (license.status === 'revoked') throw new ConflictError('Cannot suspend a revoked license');
    if (license.status === 'suspended') throw new ConflictError('License is already suspended');

    license.status = 'suspended';
    license.suspendedAt = new Date();
    (license as any).suspendedReason = reason;
    await license.save();

    logger.info({ licenseId, reason }, 'License suspended');

    await emitProjectEvent('license:suspended', projectId, { licenseId, reason });

    return { id: licenseId, status: 'suspended', suspendedAt: license.suspendedAt.toISOString() };
  }

  /**
   * Revoke a license permanently.
   */
  async revoke(orgId: string, projectId: string, licenseId: string, reason: string) {
    const license = await LicenseModel.findOne({ _id: licenseId, orgId, projectId });
    if (!license) throw new NotFoundError('License not found');
    if (license.status === 'revoked') throw new ConflictError('License is already revoked');

    license.status = 'revoked';
    license.revokedAt = new Date();
    await license.save();

    logger.info({ licenseId, reason }, 'License revoked');

    await emitProjectEvent('license:revoked', projectId, { licenseId, reason });

    return { id: licenseId, status: 'revoked', revokedAt: license.revokedAt.toISOString() };
  }

  /**
   * Reactivate a suspended license.
   */
  async reactivate(orgId: string, projectId: string, licenseId: string) {
    const license = await LicenseModel.findOne({ _id: licenseId, orgId, projectId });
    if (!license) throw new NotFoundError('License not found');
    if (license.status !== 'suspended') throw new ConflictError('Only suspended licenses can be reactivated');

    license.status = 'active';
    license.suspendedAt = undefined;
    await license.save();

    logger.info({ licenseId }, 'License reactivated');

    await emitProjectEvent('license:renewed', projectId, { licenseId });

    return { id: licenseId, status: 'active' };
  }
}
