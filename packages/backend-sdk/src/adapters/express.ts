import type { Request, Response, NextFunction, RequestHandler } from 'express';
import { DevLock } from '../core/client.js';
import type { MiddlewareOptions, ValidationResult } from '../types.js';

declare global {
  namespace Express {
    interface Request {
      devlock?: {
        license: ValidationResult;
        isFeatureEnabled: (flag: string) => boolean;
        getConfig: <T = unknown>(key: string, defaultValue?: T) => T;
        track: (event: string, metadata?: Record<string, unknown>) => void;
      };
    }
  }
}

/**
 * Express middleware for DevLock license enforcement.
 *
 * @example
 * ```ts
 * import { createMiddleware } from '@devlock/node/express';
 *
 * const devlock = createMiddleware({
 *   secretKey: process.env.DEVLOCK_SECRET_KEY!,
 *   projectId: process.env.DEVLOCK_PROJECT_ID!,
 *   excludePaths: ['/health', '/public'],
 * });
 *
 * app.use(devlock);
 *
 * app.get('/api/data', (req, res) => {
 *   if (req.devlock!.isFeatureEnabled('premium')) {
 *     // premium logic
 *   }
 *   res.json({ features: req.devlock!.license.features });
 * });
 * ```
 */
export function createMiddleware(options: MiddlewareOptions): RequestHandler {
  const client = new DevLock(options);
  let ready = false;

  // Initialize asynchronously
  client.init().then(() => { ready = true; }).catch((err) => {
    console.error('[DevLock] Middleware init failed:', err.message);
  });

  const extractKey = options.extractLicenseKey ?? defaultExtractKey;
  const excluded = options.excludePaths ?? [];

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Skip excluded paths
    if (excluded.some((p) => req.path === p || req.path.startsWith(p + '/'))) {
      next();
      return;
    }

    // Graceful degradation during init
    if (!ready) {
      next();
      return;
    }

    // Kill switch
    if (client.isKillSwitchActive()) {
      if (options.onKillSwitch) {
        options.onKillSwitch(req, res, client.getState().killSwitch.reason);
      } else {
        res.status(503).json({ error: 'Service disabled', reason: client.getState().killSwitch.reason });
      }
      return;
    }

    // Maintenance mode
    if (client.isMaintenanceMode()) {
      if (options.onMaintenance) {
        options.onMaintenance(req, res, client.getState().maintenance.message);
      } else {
        res.status(503).json({ error: 'Service under maintenance', message: client.getState().maintenance.message });
      }
      return;
    }

    // API suspension
    if (client.isApiSuspended()) {
      if (options.onApiSuspended) {
        options.onApiSuspended(req, res, client.getState().apiSuspension.reason);
      } else {
        res.status(503).json({ error: 'API suspended', reason: client.getState().apiSuspension.reason });
      }
      return;
    }

    // Extract license key
    const licenseKey = extractKey(req);
    if (!licenseKey) {
      if (options.onUnauthorized) {
        options.onUnauthorized(req, res, { valid: false, status: 'unknown', features: [], error: 'No license key' });
      } else {
        res.status(401).json({ error: 'License key required' });
      }
      return;
    }

    // Validate license
    const result = await client.validateLicense(licenseKey, {
      ip: req.ip ?? req.socket.remoteAddress,
      domain: req.hostname,
    });

    if (!result.valid) {
      if (options.onUnauthorized) {
        options.onUnauthorized(req, res, result);
      } else {
        res.status(403).json({ error: 'Invalid license', status: result.status, message: result.error });
      }
      return;
    }

    // Attach DevLock context to request
    req.devlock = {
      license: result,
      isFeatureEnabled: (flag) => client.isFeatureEnabled(flag),
      getConfig: (key, def) => client.getConfig(key, def),
      track: (event, metadata) => client.track({ type: event, timestamp: Date.now(), metadata, licenseKey, ip: req.ip, path: req.path }),
    };

    next();
  };
}

/**
 * Create a DevLock client instance for manual usage (without middleware).
 */
export function createClient(options: MiddlewareOptions): DevLock {
  return new DevLock(options);
}

function defaultExtractKey(req: Request): string | undefined {
  return (
    (req.headers['x-license-key'] as string) ??
    (req.headers['authorization']?.startsWith('License ') ? req.headers['authorization'].slice(8) : undefined) ??
    (req.query['license_key'] as string) ??
    undefined
  );
}

export { DevLock } from '../core/client.js';
export type { DevLockConfig, MiddlewareOptions, ValidationResult, SDKState } from '../types.js';
