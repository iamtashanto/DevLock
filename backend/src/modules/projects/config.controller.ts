import type { Request, Response } from 'express';
import { ConfigModel } from '@/database';
import { NotFoundError } from '../../core/errors/index.js';
import { emitProjectEvent } from '../../core/events/index.js';

export class ConfigController {
  async getConfig(req: Request, res: Response): Promise<void> {
    const { projectId } = req.params;
    let config = await ConfigModel.findOne({ projectId }).lean();
    if (!config) {
      // Create default config if not exists
      const newConfig = await ConfigModel.create({
        tenantId: req.auth!.orgId,
        projectId,
        version: 1,
        maintenance: { enabled: false },
        killSwitch: { enabled: false },
        notifications: [],
      });
      config = newConfig.toObject() as any;
    }
    
    res.json({ success: true, data: config });
  }

  async updateConfig(req: Request, res: Response): Promise<void> {
    const { projectId } = req.params;
    const updateData = req.body;
    
    let config = await ConfigModel.findOne({ projectId });
    if (!config) {
      throw new NotFoundError('Config not found');
    }

    if (updateData.notifications !== undefined) {
      config.notifications = updateData.notifications;
    }
    if (updateData.domainLock !== undefined) {
      config.domainLock = updateData.domainLock;
    }

    await config.save();
    res.json({ success: true, data: config });
  }

  async activateKillSwitch(req: Request, res: Response): Promise<void> {
    const { projectId } = req.params;
    const { reason } = req.body;

    const config = await ConfigModel.findOne({ projectId });
    if (!config) throw new NotFoundError('Config not found');

    config.killSwitch = {
      enabled: true,
      reason: reason || 'Emergency shutdown',
      activatedAt: new Date() as any, // Type assertion for schema
    };

    await config.save();

    // Real-time push so connected client sites lock immediately (best-effort).
    await emitProjectEvent('killswitch:activated', projectId!, { reason: config.killSwitch.reason });

    res.json({ success: true, data: config });
  }

  async deactivateKillSwitch(req: Request, res: Response): Promise<void> {
    const { projectId } = req.params;

    const config = await ConfigModel.findOne({ projectId });
    if (!config) throw new NotFoundError('Config not found');

    config.killSwitch = {
      enabled: false,
    };

    await config.save();

    await emitProjectEvent('killswitch:deactivated', projectId!, {});

    res.json({ success: true, data: config });
  }

  async toggleMaintenance(req: Request, res: Response): Promise<void> {
    const { projectId } = req.params;
    const { enabled, message } = req.body;

    const config = await ConfigModel.findOne({ projectId });
    if (!config) throw new NotFoundError('Config not found');

    config.maintenance = {
      enabled,
      message: message || (enabled ? 'Undergoing maintenance' : undefined),
    };

    await config.save();

    if (enabled) {
      await emitProjectEvent('maintenance:enabled', projectId!, { message: config.maintenance.message });
    } else {
      await emitProjectEvent('maintenance:disabled', projectId!, {});
    }

    res.json({ success: true, data: config });
  }

  // ── Feature Flags ─────────────────────────────────────────────────────

  async listFlags(req: Request, res: Response): Promise<void> {
    const { projectId } = req.params;
    const config = await ConfigModel.findOne({ projectId }).lean();
    const flags = flagsToArray(projectId!, (config?.featureFlags as Record<string, FlagValue>) ?? {});
    res.json({ success: true, data: flags });
  }

  async createFlag(req: Request, res: Response): Promise<void> {
    const { projectId } = req.params;
    const { key, name, description, enabled } = req.body as {
      key: string; name?: string; description?: string; enabled?: boolean;
    };
    if (!key || typeof key !== 'string') throw new NotFoundError('Flag key is required');

    const config = await this.getOrCreateConfig(projectId!, req.auth!.orgId);
    const now = new Date().toISOString();
    const value: FlagValue = {
      enabled: enabled === true,
      name: name || key,
      description: description ?? '',
      createdAt: now,
      updatedAt: now,
    };
    config.featureFlags.set(key, value as any);
    config.markModified('featureFlags');
    await config.save();

    res.status(201).json({ success: true, data: toFlag(projectId!, key, value) });
  }

  async toggleFlag(req: Request, res: Response): Promise<void> {
    const { projectId, flagId } = req.params;
    const { enabled } = req.body as { enabled?: boolean };

    const config = await ConfigModel.findOne({ projectId });
    if (!config) throw new NotFoundError('Config not found');

    const existing = config.featureFlags.get(flagId!) as FlagValue | undefined;
    if (!existing) throw new NotFoundError('Feature flag not found');

    const value: FlagValue = { ...existing, enabled: enabled === true, updatedAt: new Date().toISOString() };
    config.featureFlags.set(flagId!, value as any);
    config.markModified('featureFlags');
    await config.save();

    await emitProjectEvent('feature:toggled', projectId!, { flag: flagId, enabled: value.enabled });

    res.json({ success: true, data: toFlag(projectId!, flagId!, value) });
  }

  async deleteFlag(req: Request, res: Response): Promise<void> {
    const { projectId, flagId } = req.params;

    const config = await ConfigModel.findOne({ projectId });
    if (!config) throw new NotFoundError('Config not found');

    config.featureFlags.delete(flagId!);
    config.markModified('featureFlags');
    await config.save();

    res.json({ success: true, data: { id: flagId } });
  }

  private async getOrCreateConfig(projectId: string, tenantId: string) {
    let config = await ConfigModel.findOne({ projectId });
    if (!config) {
      config = await ConfigModel.create({
        tenantId,
        projectId,
        version: 1,
        maintenance: { enabled: false },
        killSwitch: { enabled: false },
        notifications: [],
      });
    }
    return config;
  }
}

interface FlagValue {
  enabled: boolean;
  name?: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

function toFlag(projectId: string, key: string, v: FlagValue) {
  return {
    id: key,
    key,
    name: v.name || key,
    description: v.description ?? '',
    enabled: v.enabled === true,
    projectId,
    createdAt: v.createdAt ?? new Date().toISOString(),
    updatedAt: v.updatedAt ?? new Date().toISOString(),
  };
}

function flagsToArray(projectId: string, flags: Record<string, FlagValue>) {
  return Object.entries(flags).map(([key, v]) => toFlag(projectId, key, v));
}
