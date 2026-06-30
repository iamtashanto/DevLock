import { DevLock } from '../core/client.js';
import type { MiddlewareOptions, ValidationResult } from '../types.js';

/**
 * Fastify plugin for DevLock license enforcement.
 *
 * @example
 * ```ts
 * import Fastify from 'fastify';
 * import { devlockPlugin } from '@devlock/node/fastify';
 *
 * const app = Fastify();
 *
 * app.register(devlockPlugin, {
 *   secretKey: process.env.DEVLOCK_SECRET_KEY!,
 *   projectId: process.env.DEVLOCK_PROJECT_ID!,
 *   excludePaths: ['/health'],
 * });
 *
 * app.get('/api/data', (req, reply) => {
 *   const { license, isFeatureEnabled } = req.devlock;
 *   reply.send({ features: license.features });
 * });
 * ```
 */
export async function devlockPlugin(fastify: any, options: MiddlewareOptions): Promise<void> {
  const client = new DevLock(options);
  await client.init();

  const excluded = options.excludePaths ?? [];

  // Decorate request
  fastify.decorateRequest('devlock', null);

  // Add hook
  fastify.addHook('onRequest', async (request: any, reply: any) => {
    // Skip excluded paths
    if (excluded.some((p: string) => request.url === p || request.url.startsWith(p + '/'))) {
      return;
    }

    // Kill switch
    if (client.isKillSwitchActive()) {
      reply.code(503).send({ error: 'Service disabled', reason: client.getState().killSwitch.reason });
      return;
    }

    // Maintenance
    if (client.isMaintenanceMode()) {
      reply.code(503).send({ error: 'Service under maintenance' });
      return;
    }

    // Extract license key
    const licenseKey = extractKey(request, options);
    if (!licenseKey) {
      reply.code(401).send({ error: 'License key required' });
      return;
    }

    // Validate
    const result = await client.validateLicense(licenseKey, {
      ip: request.ip,
      domain: request.hostname,
    });

    if (!result.valid) {
      reply.code(403).send({ error: 'Invalid license', status: result.status });
      return;
    }

    // Attach to request
    request.devlock = {
      license: result,
      isFeatureEnabled: (flag: string) => client.isFeatureEnabled(flag),
      getConfig: <T>(key: string, def?: T) => client.getConfig(key, def),
      track: (event: string, metadata?: Record<string, unknown>) =>
        client.track({ type: event, timestamp: Date.now(), metadata, licenseKey, ip: request.ip, path: request.url }),
    };
  });

  // Cleanup on close
  fastify.addHook('onClose', () => { client.destroy(); });
}

function extractKey(request: any, options: MiddlewareOptions): string | undefined {
  if (options.extractLicenseKey) return options.extractLicenseKey(request) as string | undefined;
  return (
    request.headers['x-license-key'] ??
    (request.headers['authorization']?.startsWith('License ') ? request.headers['authorization'].slice(8) : undefined) ??
    request.query?.['license_key'] ??
    undefined
  );
}

export { DevLock } from '../core/client.js';
export type { DevLockConfig, MiddlewareOptions, ValidationResult } from '../types.js';
