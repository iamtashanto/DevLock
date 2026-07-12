import { createHash } from 'crypto';
import type {
  DevLockConfig, SDKState, ValidationResult, ValidationOptions,
  TelemetryEvent, Logger, RemoteConfig,
} from '../types.js';
import { DevLockError } from '../types.js';
import { HttpClient } from './http.js';
import { CacheManager } from './cache.js';
import { WebSocketManager } from './websocket.js';

const DEFAULT_API = 'https://dl-api.tashanto.com';
const DEFAULT_WS = 'wss://dl-ws.tashanto.com';
const DEFAULT_SYNC_INTERVAL = 300_000;
const DEFAULT_CACHE_TTL = 300_000;
const DEFAULT_GRACE_HOURS = 72;
const SDK_VERSION = '1.0.0';

/**
 * DevLock Backend SDK Client.
 *
 * @example
 * ```ts
 * import { DevLock } from '@devlock/node';
 *
 * const devlock = new DevLock({
 *   secretKey: process.env.DEVLOCK_SECRET_KEY!,
 *   projectId: process.env.DEVLOCK_PROJECT_ID!,
 *   on: {
 *     onKillSwitch: (reason) => {
 *       logger.error('Kill switch activated:', reason);
 *     },
 *   },
 * });
 *
 * await devlock.init();
 *
 * // Validate a license
 * const result = await devlock.validateLicense('DLCK-XXXX-XXXX-XXXX-XXXX');
 * ```
 */
export class DevLock {
  private config: Required<Omit<DevLockConfig, 'redis' | 'logger' | 'on'>> & Pick<DevLockConfig, 'redis' | 'on'>;
  private state: SDKState;
  private http: HttpClient;
  private cache: CacheManager;
  private ws: WebSocketManager;
  private logger: Logger;
  private syncTimer: ReturnType<typeof setInterval> | null = null;
  private telemetryBuffer: TelemetryEvent[] = [];
  private lastSyncState: SDKState | null = null;

  constructor(config: DevLockConfig) {
    if (!config.secretKey) throw new DevLockError('secretKey is required', 'MISSING_KEY', false);
    if (!config.projectId) throw new DevLockError('projectId is required', 'MISSING_PROJECT', false);

    this.logger = config.logger ?? console;

    this.config = {
      secretKey: config.secretKey,
      projectId: config.projectId,
      apiUrl: config.apiUrl ?? DEFAULT_API,
      wsUrl: config.wsUrl ?? DEFAULT_WS,
      environment: config.environment ?? 'production',
      syncInterval: config.syncInterval ?? DEFAULT_SYNC_INTERVAL,
      cacheTtl: config.cacheTtl ?? DEFAULT_CACHE_TTL,
      offlineGraceHours: config.offlineGraceHours ?? DEFAULT_GRACE_HOURS,
      realtime: config.realtime ?? true,
      failBehavior: config.failBehavior ?? 'open',
      redis: config.redis,
      on: config.on,
    };

    this.state = {
      initialized: false,
      connected: false,
      lastSync: 0,
      maintenance: { enabled: false },
      killSwitch: { enabled: false },
      apiSuspension: { enabled: false },
      featureFlags: {},
      config: { version: 0, data: {} },
    };

    this.http = new HttpClient(this.config.apiUrl, this.config.secretKey, this.config.projectId);
    this.cache = new CacheManager(config.redis ?? null, this.config.cacheTtl);
    this.ws = new WebSocketManager(this.config.wsUrl, this.config.secretKey, this.config.projectId, this.logger);
  }

  // ─── Public API ─────────────────────────────────────────────────────────────

  /**
   * Initialize the SDK. Syncs config and connects WebSocket.
   */
  async init(): Promise<void> {
    try {
      await this.syncConfig();
      if (this.config.realtime) {
        this.connectWebSocket();
      }
      this.startSyncTimer();
      this.state.initialized = true;
      this.config.on?.onReady?.();
      this.logger.info('[DevLock] SDK initialized');
    } catch (err) {
      this.config.on?.onError?.(err as Error);
      // Try to restore from cache
      const cached = await this.cache.getState();
      if (cached) {
        this.state = cached;
        this.state.initialized = true;
        this.logger.warn('[DevLock] Initialized from cache (offline mode)');
        return;
      }

      // Fail-open (default): DevLock being unreachable must never break the host
      // service. Initialize in a permissive state so the client's application
      // keeps serving traffic. Opt into hard-failing with `failBehavior: 'closed'`.
      if (this.config.failBehavior === 'closed') {
        throw err;
      }

      this.state.initialized = true;
      this.logger.warn('[DevLock] Init failed — continuing in fail-open mode (host service unaffected)');
    }
  }

  /**
   * Validate a license key. Results are cached.
   */
  async validateLicense(licenseKey: string, options?: ValidationOptions): Promise<ValidationResult> {
    // Check kill switch
    if (this.state.killSwitch.enabled) {
      return { valid: false, status: 'revoked', features: [], error: 'Service disabled by kill switch' };
    }

    // Check API suspension
    if (this.state.apiSuspension.enabled) {
      return { valid: false, status: 'unknown', features: [], error: 'API suspended' };
    }

    const keyHash = createHash('sha256').update(licenseKey).digest('hex');

    // Check cache (unless force refresh)
    if (!options?.force) {
      const cached = await this.cache.getLicenseValidation(keyHash);
      if (cached) return { ...cached, cached: true };
    }

    // Online validation
    try {
      const response = await this.http.post<{ success: boolean; data: { valid: boolean; license: { status: string; features: string[]; expiresAt?: string } } }>('/v1/sdk/validate', {
        licenseKey,
        fingerprint: options?.fingerprint ?? this.getServerFingerprint(),
        domain: options?.domain,
        ip: options?.ip,
        sdkVersion: SDK_VERSION,
        environment: this.config.environment,
        projectId: this.config.projectId,
      });

      const result: ValidationResult = {
        valid: response.data.valid,
        status: response.data.license.status as ValidationResult['status'],
        features: response.data.license.features,
        expiresAt: response.data.license.expiresAt,
      };

      // Cache the result
      await this.cache.setLicenseValidation(keyHash, result);
      return result;
    } catch (err) {
      // On network failure, return cached result if available
      const cached = await this.cache.getLicenseValidation(keyHash);
      if (cached) return { ...cached, cached: true };

      return {
        valid: false,
        status: 'unknown',
        features: [],
        error: (err as Error).message,
      };
    }
  }

  /**
   * Check if a feature flag is enabled.
   */
  isFeatureEnabled(flag: string): boolean {
    return this.state.featureFlags[flag] ?? false;
  }

  /**
   * Check if in maintenance mode.
   */
  isMaintenanceMode(): boolean {
    return this.state.maintenance.enabled;
  }

  /**
   * Check if kill switch is active.
   */
  isKillSwitchActive(): boolean {
    return this.state.killSwitch.enabled;
  }

  /**
   * Check if API is suspended.
   */
  isApiSuspended(): boolean {
    return this.state.apiSuspension.enabled;
  }

  /**
   * Get remote config value.
   */
  getConfig<T = unknown>(key: string, defaultValue?: T): T {
    return (this.state.config.data[key] as T) ?? defaultValue!;
  }

  /**
   * Get full SDK state.
   */
  getState(): Readonly<SDKState> {
    return { ...this.state };
  }

  /**
   * Track a telemetry event (batched, sent on next heartbeat).
   */
  track(event: TelemetryEvent): void {
    this.telemetryBuffer.push({ ...event, timestamp: event.timestamp ?? Date.now() });
    if (this.telemetryBuffer.length >= 100) this.flushTelemetry();
  }

  /**
   * Force config re-sync.
   */
  async sync(): Promise<void> {
    await this.syncConfig();
  }

  /**
   * Invalidate a cached license validation.
   */
  async invalidateLicense(licenseKey: string): Promise<void> {
    const keyHash = createHash('sha256').update(licenseKey).digest('hex');
    await this.cache.invalidateLicense(keyHash);
  }

  /**
   * Destroy the SDK. Cleans up timers, connections, buffers.
   */
  destroy(): void {
    if (this.syncTimer) clearInterval(this.syncTimer);
    this.ws.disconnect();
    this.flushTelemetry();
    this.telemetryBuffer = [];
    this.state.initialized = false;
    this.logger.info('[DevLock] SDK destroyed');
  }

  // ─── Private ────────────────────────────────────────────────────────────────

  private async syncConfig(): Promise<void> {
    try {
      const response = await this.http.get<{ success: boolean; data: { config: any } }>('/v1/sdk/config');
      const data = response.data.config;

      this.state.maintenance = data.maintenance ?? this.state.maintenance;
      this.state.killSwitch = data.killSwitch ?? this.state.killSwitch;
      this.state.apiSuspension = data.apiSuspension ?? this.state.apiSuspension;
      this.state.featureFlags = data.featureFlags ?? this.state.featureFlags;
      if (data.version) {
        this.state.config = { version: data.version, data: data.customData ?? {} };
      }
      this.state.lastSync = Date.now();

      // Persist state for offline fallback
      await this.cache.setState(this.state);

      // Detect changes and fire callbacks
      this.detectChanges();
    } catch (err) {
      this.logger.warn('[DevLock] Config sync failed:', (err as Error).message);
    }
  }

  private connectWebSocket(): void {
    this.ws.connect();

    this.ws.on('connection:change', (connected) => {
      this.state.connected = connected as boolean;
      this.config.on?.onConnectionChange?.(connected as boolean);
    });

    this.ws.on('killswitch:activated', (data: any) => {
      this.state.killSwitch = { enabled: true, reason: data?.reason };
      this.cache.invalidateAll();
      this.config.on?.onKillSwitch?.(data?.reason ?? 'Kill switch activated');
    });

    this.ws.on('killswitch:deactivated', () => {
      this.state.killSwitch = { enabled: false };
      this.config.on?.onKillSwitchEnd?.();
    });

    this.ws.on('maintenance:enabled', (data: any) => {
      this.state.maintenance = { enabled: true, message: data?.message };
      this.config.on?.onMaintenance?.(true, data?.message);
    });

    this.ws.on('maintenance:disabled', () => {
      this.state.maintenance = { enabled: false };
      this.config.on?.onMaintenance?.(false);
    });

    this.ws.on('api:suspended', (data: any) => {
      this.state.apiSuspension = { enabled: true, reason: data?.reason };
    });

    this.ws.on('api:resumed', () => {
      this.state.apiSuspension = { enabled: false };
    });

    this.ws.on('feature:toggled', (data: any) => {
      if (data?.flag) this.state.featureFlags[data.flag] = data.enabled ?? false;
    });

    this.ws.on('config:updated', (data: any) => {
      if (data) {
        this.state.config = { version: data.version ?? 0, data: data.data ?? {} };
        this.config.on?.onConfigUpdate?.(this.state.config);
      }
    });

    this.ws.on('license:suspended', () => {
      this.cache.invalidateAll();
    });
  }

  private startSyncTimer(): void {
    this.syncTimer = setInterval(() => {
      this.syncConfig().catch(() => {});
      this.flushTelemetry();
      this.ws.sendHeartbeat({
        sdkVersion: SDK_VERSION,
        configVersion: this.state.config.version,
        uptime: process.uptime(),
      });
    }, this.config.syncInterval);
  }

  private flushTelemetry(): void {
    if (this.telemetryBuffer.length === 0) return;
    const events = [...this.telemetryBuffer];
    this.telemetryBuffer = [];
    this.ws.sendTelemetry(events);
  }

  private detectChanges(): void {
    if (!this.lastSyncState) {
      this.lastSyncState = { ...this.state };
      return;
    }

    if (this.state.killSwitch.enabled && !this.lastSyncState.killSwitch.enabled) {
      this.config.on?.onKillSwitch?.(this.state.killSwitch.reason ?? '');
    }
    if (!this.state.killSwitch.enabled && this.lastSyncState.killSwitch.enabled) {
      this.config.on?.onKillSwitchEnd?.();
    }
    if (this.state.maintenance.enabled !== this.lastSyncState.maintenance.enabled) {
      this.config.on?.onMaintenance?.(this.state.maintenance.enabled, this.state.maintenance.message);
    }

    this.lastSyncState = { ...this.state };
  }

  private getServerFingerprint(): string {
    const os = process.platform;
    const hostname = require('os').hostname?.() ?? 'unknown';
    return createHash('sha256').update(`${os}:${hostname}:${process.pid}`).digest('hex').slice(0, 32);
  }
}
