import { createHash } from 'crypto';
import { LicenseModel, ConfigModel } from '@/database';
import { signLicenseToken } from '@/encryption';
import { createLogger } from '@/logger';
import { AuthenticationError, NotFoundError } from '../../core/errors/index.js';

const logger = createLogger({ service: 'sdk-service' });

export interface ValidateLicenseInput {
  licenseKey: string;
  fingerprint: string;
  domain?: string;
  sdkVersion: string;
  environment: string;
}

export interface ValidationResult {
  valid: boolean;
  license: {
    status: string;
    features: string[];
    expiresAt?: string;
  };
  config: {
    maintenance: { enabled: boolean; message?: string };
    killSwitch: { enabled: boolean; reason?: string };
    notifications: Array<{ id: string; type: string; message: string; severity: string; dismissible: boolean }>;
    featureFlags: Record<string, boolean>;
  };
  offlineToken?: string;
  serverTime: number;
}

export class SDKService {
  /**
   * Validate a license key — the core SDK endpoint.
   */
  async validateLicense(projectId: string, input: ValidateLicenseInput): Promise<ValidationResult> {
    // Hash the license key for lookup
    const keyHash = createHash('sha256').update(input.licenseKey).digest('hex');

    // Find license
    const license = await LicenseModel.findOne({ keyHash, projectId }).lean();
    if (!license) {
      return this.invalidResult(projectId, 'License not found');
    }

    // Check status
    if (license.status !== 'active' && license.status !== 'trial') {
      return this.invalidResult(projectId, `License is ${license.status}`, license.status);
    }

    // Check expiry
    if (license.expiresAt && new Date(license.expiresAt) < new Date()) {
      // Mark as expired
      await LicenseModel.updateOne({ _id: license._id }, { status: 'expired' });
      return this.invalidResult(projectId, 'License expired', 'expired');
    }

    // Register or update activation (device limit check disabled)
    const existingActivation = license.activations?.find(
      (a: any) => a.fingerprint === input.fingerprint,
    );

    if (!existingActivation) {
      await LicenseModel.updateOne(
        { _id: license._id },
        {
          $push: {
            activations: {
              fingerprint: input.fingerprint,
              domain: input.domain,
              ip: 'unknown', // Set by middleware in production
              sdkVersion: input.sdkVersion,
              activatedAt: new Date(),
              lastSeenAt: new Date(),
            },
          },
        },
      );
    } else {
      // Update last seen
      await LicenseModel.updateOne(
        { _id: license._id, 'activations.fingerprint': input.fingerprint },
        { $set: { 'activations.$.lastSeenAt': new Date() } },
      );
    }

    // Update validation timestamp
    await LicenseModel.updateOne(
      { _id: license._id },
      { lastValidatedAt: new Date(), $inc: { totalValidations: 1 } },
    );

    // Fetch project config
    const config = await ConfigModel.findOne({ projectId }).lean();

    // Build feature flags map
    const featureFlags: Record<string, boolean> = {};
    if (config?.featureFlags) {
      for (const [key, flag] of Object.entries(config.featureFlags as any)) {
        featureFlags[key] = (flag as any).enabled ?? false;
      }
    }

    // Generate offline token
    let offlineToken: string | undefined;
    const privateKey = process.env['LICENSE_PRIVATE_KEY'];
    if (privateKey) {
      offlineToken = signLicenseToken(
        {
          lid: license._id.toString(),
          pid: projectId,
          sts: license.status,
          fts: license.features,
          exp: license.expiresAt ? Math.floor(new Date(license.expiresAt).getTime() / 1000) : 0,
          grc: 72, // 72 hours offline grace
          iat: Math.floor(Date.now() / 1000),
          nxt: Math.floor(Date.now() / 1000) + 300, // next check-in in 5 min
          fp: input.fingerprint,
          dom: input.domain ? [input.domain] : [],
        },
        privateKey,
      );
    }

    return {
      valid: true,
      license: {
        status: license.status,
        features: license.features,
        expiresAt: license.expiresAt?.toISOString(),
      },
      config: {
        maintenance: config?.maintenance ?? { enabled: false },
        killSwitch: config?.killSwitch ?? { enabled: false },
        notifications: (config?.notifications ?? [])
          .filter((n: any) => n.active)
          .map((n: any) => ({
            id: n.id,
            type: n.type,
            message: n.message,
            severity: n.severity,
            dismissible: n.dismissible,
          })),
        featureFlags,
      },
      offlineToken,
      serverTime: Date.now(),
    };
  }

  // ── Private ──────────────────────────────────────────────────────────

  private async invalidResult(projectId: string, reason: string, status = 'invalid'): Promise<ValidationResult> {
    // Still return config even for invalid licenses (maintenance mode, etc.)
    const config = await ConfigModel.findOne({ projectId }).lean();

    return {
      valid: false,
      license: { status, features: [] },
      config: {
        maintenance: config?.maintenance ?? { enabled: false },
        killSwitch: config?.killSwitch ?? { enabled: false },
        notifications: [],
        featureFlags: {},
      },
      serverTime: Date.now(),
    };
  }
}
