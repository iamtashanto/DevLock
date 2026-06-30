import { DevLock } from '../core/client.js';
import type { DevLockConfig, MiddlewareOptions, ValidationResult } from '../types.js';

/**
 * NestJS module for DevLock license enforcement.
 *
 * @example
 * ```ts
 * // app.module.ts
 * import { DevLockModule } from '@devlock/node/nestjs';
 *
 * @Module({
 *   imports: [
 *     DevLockModule.forRoot({
 *       secretKey: process.env.DEVLOCK_SECRET_KEY!,
 *       projectId: process.env.DEVLOCK_PROJECT_ID!,
 *       excludePaths: ['/health'],
 *     }),
 *   ],
 * })
 * export class AppModule {}
 * ```
 *
 * ```ts
 * // In controllers, use the guard:
 * import { UseGuards } from '@nestjs/common';
 * import { DevLockGuard, License } from '@devlock/node/nestjs';
 *
 * @UseGuards(DevLockGuard)
 * @Controller('api')
 * export class ApiController {
 *   @Get('data')
 *   getData(@License() license: ValidationResult) {
 *     return { features: license.features };
 *   }
 * }
 * ```
 */

// ─── Module ───────────────────────────────────────────────────────────────────

export const DEVLOCK_OPTIONS = 'DEVLOCK_OPTIONS';
export const DEVLOCK_CLIENT = 'DEVLOCK_CLIENT';

export class DevLockModule {
  static forRoot(options: MiddlewareOptions) {
    return {
      module: DevLockModule,
      global: true,
      providers: [
        { provide: DEVLOCK_OPTIONS, useValue: options },
        {
          provide: DEVLOCK_CLIENT,
          useFactory: async () => {
            const client = new DevLock(options);
            await client.init();
            return client;
          },
        },
      ],
      exports: [DEVLOCK_CLIENT, DEVLOCK_OPTIONS],
    };
  }

  static forRootAsync(factory: { useFactory: (...args: unknown[]) => MiddlewareOptions | Promise<MiddlewareOptions>; inject?: unknown[] }) {
    return {
      module: DevLockModule,
      global: true,
      providers: [
        {
          provide: DEVLOCK_OPTIONS,
          useFactory: factory.useFactory,
          inject: factory.inject ?? [],
        },
        {
          provide: DEVLOCK_CLIENT,
          useFactory: async (options: MiddlewareOptions) => {
            const client = new DevLock(options);
            await client.init();
            return client;
          },
          inject: [DEVLOCK_OPTIONS],
        },
      ],
      exports: [DEVLOCK_CLIENT, DEVLOCK_OPTIONS],
    };
  }
}

// ─── Guard ────────────────────────────────────────────────────────────────────

/**
 * NestJS Guard that validates license on every request.
 * Inject DEVLOCK_CLIENT and use @UseGuards(DevLockGuard).
 */
export class DevLockGuard {
  private client: DevLock;
  private options: MiddlewareOptions;

  constructor(client: DevLock, options: MiddlewareOptions) {
    this.client = client;
    this.options = options;
  }

  async canActivate(context: any): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    // Kill switch
    if (this.client.isKillSwitchActive()) {
      response.status(503).json({ error: 'Service disabled' });
      return false;
    }

    // Maintenance
    if (this.client.isMaintenanceMode()) {
      response.status(503).json({ error: 'Service under maintenance' });
      return false;
    }

    // Extract license key
    const licenseKey = request.headers['x-license-key'] ?? request.query?.['license_key'];
    if (!licenseKey) {
      response.status(401).json({ error: 'License key required' });
      return false;
    }

    // Validate
    const result = await this.client.validateLicense(licenseKey, {
      ip: request.ip,
      domain: request.hostname,
    });

    if (!result.valid) {
      response.status(403).json({ error: 'Invalid license', status: result.status });
      return false;
    }

    // Attach to request
    request.devlock = {
      license: result,
      isFeatureEnabled: (flag: string) => this.client.isFeatureEnabled(flag),
      getConfig: <T>(key: string, def?: T) => this.client.getConfig(key, def),
    };

    return true;
  }
}

// ─── Decorator ────────────────────────────────────────────────────────────────

/**
 * Parameter decorator to inject license info into controller method.
 */
export function License() {
  return (_target: any, _propertyKey: string | symbol | undefined, _parameterIndex: number) => {
    // In real NestJS, use createParamDecorator from @nestjs/common
    // This is a placeholder that works without reflect-metadata
  };
}

// ─── Service (Injectable) ─────────────────────────────────────────────────────

/**
 * Injectable DevLock service for NestJS.
 * Use when you need programmatic access outside of the guard.
 */
export class DevLockService {
  constructor(private client: DevLock) {}

  async validateLicense(licenseKey: string, options?: { ip?: string; domain?: string }): Promise<ValidationResult> {
    return this.client.validateLicense(licenseKey, options);
  }

  isFeatureEnabled(flag: string): boolean {
    return this.client.isFeatureEnabled(flag);
  }

  isMaintenanceMode(): boolean {
    return this.client.isMaintenanceMode();
  }

  isKillSwitchActive(): boolean {
    return this.client.isKillSwitchActive();
  }

  getConfig<T = unknown>(key: string, defaultValue?: T): T {
    return this.client.getConfig(key, defaultValue);
  }

  track(event: string, metadata?: Record<string, unknown>): void {
    this.client.track({ type: event, timestamp: Date.now(), metadata });
  }
}

export { DevLock } from '../core/client.js';
export type { DevLockConfig, MiddlewareOptions, ValidationResult } from '../types.js';
