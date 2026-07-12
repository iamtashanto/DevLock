import type { Request, Response, NextFunction } from 'express';
import { createHmac, timingSafeEqual } from 'crypto';
import { AuthenticationError } from '../core/errors/index.js';
import { ProjectModel } from '@/database';

declare global {
  namespace Express {
    interface Request {
      project?: {
        id: string;
        orgId: string;
        publicKey: string;
        secretKey: string;
        allowedDomains: string[];
        domainPolicy: string;
        settings: Record<string, unknown>;
      };
    }
  }
}

const MAX_TIMESTAMP_DRIFT_MS = 300_000; // 5 minutes

/**
 * Authenticate SDK requests using project API key + HMAC signature.
 *
 * Required headers:
 * - X-DevLock-Key: project public key
 * - X-DevLock-Timestamp: unix timestamp (ms)
 * - X-DevLock-Signature: HMAC-SHA256(timestamp + body, secretKey)
 */
export async function sdkAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const apiKey = req.headers['x-devlock-key'] as string | undefined;
  const timestamp = req.headers['x-devlock-timestamp'] as string | undefined;
  const signature = req.headers['x-devlock-signature'] as string | undefined;

  if (!apiKey || !timestamp || !signature) {
    throw new AuthenticationError('Missing SDK authentication headers (X-DevLock-Key, X-DevLock-Timestamp, X-DevLock-Signature)');
  }

  // Validate timestamp (anti-replay)
  const requestTime = parseInt(timestamp, 10);
  if (isNaN(requestTime) || Math.abs(Date.now() - requestTime) > MAX_TIMESTAMP_DRIFT_MS) {
    throw new AuthenticationError('Request timestamp expired or invalid');
  }

  // Look up project by public key
  const project = await ProjectModel.findOne({ publicKey: apiKey, isActive: true })
    .select('+secretKey')
    .lean();

  if (!project) {
    throw new AuthenticationError('Invalid API key');
  }

  // Verify HMAC signature
  // Frontend SDK signs with publicKey, backend SDK signs with secretKey.
  // Try frontend (publicKey) first, fall back to backend (secretKey).
  const payload = timestamp + JSON.stringify(req.body ?? {});

  const expectedFrontend = createHmac('sha256', project.publicKey)
    .update(payload)
    .digest('hex');

  const expectedBackend = createHmac('sha256', project.secretKey)
    .update(payload)
    .digest('hex');

  const sigBuffer = Buffer.from(signature, 'hex');

  const matchFrontend =
    sigBuffer.length === Buffer.from(expectedFrontend, 'hex').length &&
    timingSafeEqual(sigBuffer, Buffer.from(expectedFrontend, 'hex'));

  const matchBackend =
    sigBuffer.length === Buffer.from(expectedBackend, 'hex').length &&
    timingSafeEqual(sigBuffer, Buffer.from(expectedBackend, 'hex'));

  if (!matchFrontend && !matchBackend) {
    throw new AuthenticationError('Invalid request signature');
  }

  // Attach project context
  req.project = {
    id: project._id.toString(),
    orgId: (project as any).orgId?.toString() ?? project.tenantId.toString(),
    publicKey: project.publicKey,
    secretKey: project.secretKey,
    allowedDomains: project.allowedDomains,
    domainPolicy: (project as any).domainPolicy ?? 'warn',
    settings: project.settings ?? {},
  };

  next();
}
