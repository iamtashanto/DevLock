/**
 * Next.js Edge Middleware helper for server-side license validation.
 * Runs at the edge before the page renders.
 *
 * @example
 * ```ts
 * // middleware.ts
 * import { createDevLockMiddleware } from '@devlock/sdk/next';
 *
 * export default createDevLockMiddleware({
 *   projectKey: process.env.DEVLOCK_PROJECT_KEY!,
 *   secretKey: process.env.DEVLOCK_SECRET_KEY!,
 *   protectedPaths: ['/dashboard', '/app'],
 *   onBlocked: (req) => new Response('License required', { status: 403 }),
 * });
 * ```
 */

interface MiddlewareConfig {
  projectKey: string;
  secretKey: string;
  apiUrl?: string;
  protectedPaths?: string[];
  onBlocked?: (request: Request) => Response | Promise<Response>;
}

export function createDevLockMiddleware(config: MiddlewareConfig) {
  const apiUrl = config.apiUrl ?? 'https://api.devlock.io';
  const protectedPaths = config.protectedPaths ?? ['/'];

  return async function middleware(request: Request): Promise<Response | undefined> {
    const url = new URL(request.url);

    // Check if path is protected
    const isProtected = protectedPaths.some((p) => url.pathname.startsWith(p));
    if (!isProtected) return undefined;

    // Get license key from cookie or header
    const cookies = parseCookies(request.headers.get('cookie') ?? '');
    const licenseKey = cookies['devlock_license'] ?? request.headers.get('x-license-key');

    if (!licenseKey) {
      return config.onBlocked?.(request) ?? new Response('License required', { status: 403 });
    }

    // Validate with DevLock API
    try {
      const res = await fetch(`${apiUrl}/v1/sdk/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-DevLock-Key': config.projectKey,
          'X-DevLock-Timestamp': Date.now().toString(),
          'X-DevLock-Signature': 'edge', // Simplified for edge
        },
        body: JSON.stringify({
          licenseKey,
          fingerprint: 'edge-middleware',
          domain: url.hostname,
          sdkVersion: '1.0.0',
          environment: 'production',
        }),
      });

      if (!res.ok) {
        return config.onBlocked?.(request) ?? new Response('License validation failed', { status: 403 });
      }

      const data = await res.json() as { data: { valid: boolean } };
      if (!data.data.valid) {
        return config.onBlocked?.(request) ?? new Response('Invalid license', { status: 403 });
      }

      // License valid — continue
      return undefined;
    } catch {
      // Network error — allow through (graceful degradation)
      return undefined;
    }
  };
}

function parseCookies(cookieHeader: string): Record<string, string> {
  const cookies: Record<string, string> = {};
  cookieHeader.split(';').forEach((cookie) => {
    const [key, value] = cookie.trim().split('=');
    if (key && value) cookies[key] = decodeURIComponent(value);
  });
  return cookies;
}
