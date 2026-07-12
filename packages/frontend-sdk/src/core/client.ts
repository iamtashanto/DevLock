import type {
  DevLockConfig, DevLockState, DevLockEvent, ValidationResponse,
  LicenseInfo, RemoteNotification, PopupConfig, DevLockCallbacks,
} from '../types.js';
import { DevLockError } from '../types.js';
import { EventEmitter } from './event-emitter.js';
import { CacheManager } from './cache.js';
import { WebSocketManager } from './websocket.js';
import { TamperDetector } from './tamper.js';
import { WatermarkManager } from './watermark.js';
import { OverlayManager } from './overlay.js';
import { generateFingerprint } from './fingerprint.js';

const SDK_VERSION = '1.0.0';
const DEFAULT_API = 'https://dl-api.tashanto.com';
const DEFAULT_WS = 'wss://dl-ws.tashanto.com';
const DEFAULT_HEARTBEAT = 30_000;
const DEFAULT_GRACE_HOURS = 72;

/**
 * DevLock SDK Client — the main entry point.
 *
 * @example
 * ```ts
 * import { DevLock } from '@devlock/sdk';
 *
 * const devlock = new DevLock({
 *   projectKey: 'pk_live_xxx',
 *   licenseKey: 'DLCK-XXXX-XXXX-XXXX-XXXX',
 *   on: {
 *     onKillSwitch: (reason) => showBlockedUI(reason),
 *     onMaintenanceMode: (config) => showMaintenance(config.message),
 *   },
 * });
 *
 * await devlock.init();
 *
 * if (devlock.isFeatureEnabled('premium')) {
 *   // show premium feature
 * }
 * ```
 */
export class DevLock {
  private config: Required<DevLockConfig>;
  private state: DevLockState;
  private emitter: EventEmitter;
  private cache: CacheManager;
  private ws: WebSocketManager;
  private tamper: TamperDetector;
  private watermark: WatermarkManager;
  private overlay: OverlayManager;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private fingerprint: string = '';
  private telemetryBuffer: Array<{ type: string; timestamp: number; metadata?: Record<string, unknown> }> = [];

  constructor(config: DevLockConfig) {
    if (!config.projectKey) {
      throw new DevLockError('projectKey is required', 'MISSING_KEY', false);
    }

    this.config = {
      projectKey: config.projectKey,
      licenseKey: config.licenseKey ?? '',
      apiUrl: config.apiUrl ?? DEFAULT_API,
      wsUrl: config.wsUrl ?? (config.apiUrl ? config.apiUrl.replace(/^http/, 'ws') : DEFAULT_WS),
      environment: config.environment ?? 'production',
      debug: config.debug ?? false,
      offlineGraceHours: config.offlineGraceHours ?? DEFAULT_GRACE_HOURS,
      heartbeatInterval: config.heartbeatInterval ?? DEFAULT_HEARTBEAT,
      tamperDetection: config.tamperDetection ?? true,
      watermark: config.watermark ?? false,
      watermarkText: config.watermarkText ?? 'UNLICENSED',
      failBehavior: config.failBehavior ?? 'open',
      on: config.on ?? {},
    };

    this.state = {
      initialized: false,
      connected: false,
      license: { valid: false, status: 'none', features: [] },
      maintenance: { enabled: false },
      killSwitch: { enabled: false },
      notifications: [],
      featureFlags: {},
      config: { version: 0, data: {} },
      popup: null,
      offline: false,
      lastSyncAt: 0,
    };

    this.emitter = new EventEmitter();
    this.cache = new CacheManager();
    this.ws = new WebSocketManager(this.emitter, this.config.wsUrl, this.config.projectKey);
    this.tamper = new TamperDetector(this.emitter);
    this.watermark = new WatermarkManager();
    this.overlay = new OverlayManager();

    this.bindCallbacks(this.config.on);
    this.bindInternalEvents();
  }

  // ─── Public API ─────────────────────────────────────────────────────────────

  /**
   * Initialize the SDK. Validates license, connects WebSocket, starts heartbeat.
   */
  async init(): Promise<DevLockState> {
    try {
      this.fingerprint = await generateFingerprint();
      this.cache.saveFingerprint(this.fingerprint);

      // Verify domain
      this.verifyDomain();

      // Validate license (online or offline fallback)
      await this.validate();

      // Connect WebSocket for real-time updates
      this.ws.connect();

      // Start heartbeat
      this.startHeartbeat();

      // Start tamper detection
      if (this.config.tamperDetection) {
        this.tamper.start();
      }

      this.state.initialized = true;
      this.emitter.emit('ready', this.state);
      this.log('Initialized successfully');

      return this.state;
    } catch (err) {
      // Try offline fallback
      if (this.tryOfflineFallback()) {
        this.state.initialized = true;
        this.state.offline = true;
        this.emitter.emit('ready', this.state);
        return this.state;
      }

      const error = err instanceof DevLockError ? err : new DevLockError(
        (err as Error).message, 'INIT_FAILED', true
      );
      this.emitter.emit('error', error);

      // Fail-open (default): DevLock being unreachable must never break the host
      // application. We mark the SDK initialized in a permissive offline state so
      // the client's website keeps running smoothly. The developer can opt into
      // hard-failing with `failBehavior: 'closed'`.
      if (this.config.failBehavior === 'closed') {
        throw error;
      }

      this.state.initialized = true;
      this.state.offline = true;
      this.log('Init failed — continuing in fail-open mode (host app unaffected)');
      this.emitter.emit('ready', this.state);
      return this.state;
    }
  }

  /**
   * Check if a feature flag is enabled.
   */
  isFeatureEnabled(flag: string): boolean {
    return this.state.featureFlags[flag] ?? false;
  }

  /**
   * Get current SDK state (read-only copy).
   */
  getState(): Readonly<DevLockState> {
    return { ...this.state };
  }

  /**
   * Get license info.
   */
  getLicense(): Readonly<LicenseInfo> {
    return { ...this.state.license };
  }

  /**
   * Check if license is valid.
   */
  isLicenseValid(): boolean {
    return this.state.license.valid;
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
   * Get remote config value.
   */
  getConfig<T = unknown>(key: string, defaultValue?: T): T {
    return (this.state.config.data[key] as T) ?? defaultValue!;
  }

  /**
   * Subscribe to SDK events.
   */
  on(event: DevLockEvent, listener: (...args: unknown[]) => void): () => void {
    return this.emitter.on(event, listener);
  }

  /**
   * Track a custom telemetry event.
   */
  track(type: string, metadata?: Record<string, unknown>): void {
    this.telemetryBuffer.push({ type, timestamp: Date.now(), metadata });

    // Flush when buffer reaches 50 events
    if (this.telemetryBuffer.length >= 50) {
      this.flushTelemetry();
    }
  }

  /**
   * Force re-validation of the license.
   */
  async revalidate(): Promise<DevLockState> {
    await this.validate();
    return this.state;
  }

  /**
   * Destroy the SDK instance. Cleans up all resources.
   */
  destroy(): void {
    this.heartbeatTimer && clearInterval(this.heartbeatTimer);
    this.ws.disconnect();
    this.tamper.stop();
    this.watermark.hide();
    this.emitter.removeAllListeners();
    this.telemetryBuffer = [];
    this.state.initialized = false;
    this.log('Destroyed');
  }

  // ─── Private ────────────────────────────────────────────────────────────────

  private async validate(): Promise<void> {
    const body: Record<string, unknown> = {
      projectId: this.config.projectKey,
      fingerprint: this.fingerprint,
      domain: typeof window !== 'undefined' ? window.location.hostname : undefined,
      sdkVersion: SDK_VERSION,
      environment: this.config.environment,
    };

    if (this.config.licenseKey) {
      body['licenseKey'] = this.config.licenseKey;
    }

    const timestamp = Date.now().toString();
    const signature = await this.sign(timestamp + JSON.stringify(body));

    const response = await fetch(`${this.config.apiUrl}/v1/sdk/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-DevLock-Key': this.config.projectKey,
        'X-DevLock-Timestamp': timestamp,
        'X-DevLock-Signature': signature,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new DevLockError(`Validation failed: HTTP ${response.status}`, 'VALIDATION_HTTP_ERROR');
    }

    const result = (await response.json()) as { success?: boolean; data?: ValidationResponse };

    // Treat a malformed / unsuccessful body as a *transient* failure (→ fail-open),
    // never as a definitive "invalid license". Only a well-formed success response
    // is allowed to change lock/license state.
    if (!result || result.success !== true || !result.data) {
      throw new DevLockError('Malformed validation response', 'VALIDATION_BAD_SHAPE');
    }

    this.applyValidation(result.data);

    // Cache for offline use
    this.cache.saveValidation(result.data);
    if (result.data.offlineToken) {
      this.cache.saveOfflineToken(result.data.offlineToken);
    }

    this.state.lastSyncAt = Date.now();
    this.state.offline = false;
  }

  private applyValidation(data: ValidationResponse): void {
    // SAFETY: every field is read defensively. A missing/partial/malformed
    // response must never crash the host app, and — critically — must never put
    // the app into a locked state. A lock (kill-switch / maintenance) is applied
    // ONLY when the server explicitly sends `enabled === true`. Anything else
    // (undefined, garbage, error) resolves to "unlocked".
    const license = data?.license ?? ({} as ValidationResponse['license']);
    const cfg = data?.config ?? ({} as ValidationResponse['config']);

    // License
    this.state.license = {
      valid: data?.valid === true,
      status: (license.status as LicenseInfo['status']) ?? 'none',
      features: Array.isArray(license.features) ? license.features : [],
      expiresAt: license.expiresAt,
    };

    // Config — locks require an explicit boolean `true`
    this.state.maintenance = cfg.maintenance?.enabled === true
      ? cfg.maintenance
      : { enabled: false };
    this.state.killSwitch = cfg.killSwitch?.enabled === true
      ? cfg.killSwitch
      : { enabled: false };
    const incomingNotifs = Array.isArray(cfg.notifications) ? cfg.notifications : [];
    
    // Emit new notifications
    incomingNotifs.forEach((notif) => {
      const exists = this.state.notifications.some(n => n.id === notif.id);
      if (!exists) {
        this.emitter.emit('notification:push', notif);
      }
    });

    // Clean up removed notifications silently
    this.state.notifications = this.state.notifications.filter(existing => 
      incomingNotifs.some(n => n.id === existing.id)
    );

    this.state.featureFlags = (cfg.featureFlags && typeof cfg.featureFlags === 'object')
      ? cfg.featureFlags
      : {};

    // Popup
    if (data?.popup) {
      this.state.popup = data.popup;
      this.emitter.emit('popup:show', data.popup);
    }

    // Watermark
    if (this.config.watermark && !this.state.license.valid) {
      this.watermark.show(this.config.watermarkText);
    } else {
      this.watermark.hide();
    }

    // Emit events based on the (already sanitised) state
    if (this.state.license.valid) {
      this.emitter.emit('license:valid', this.state.license);
    } else {
      this.emitter.emit('license:invalid', this.state.license.status);
    }

    if (this.state.maintenance.enabled) {
      this.emitter.emit('maintenance:enabled', this.state.maintenance);
    }

    if (this.state.killSwitch.enabled) {
      this.emitter.emit('killswitch:activated', this.state.killSwitch);
    }
  }

  private tryOfflineFallback(): boolean {
    if (!this.cache.isWithinGrace(this.config.offlineGraceHours)) {
      return false;
    }

    const cached = this.cache.getValidation();
    if (!cached) return false;

    this.applyValidation(cached.response);
    this.state.offline = true;

    // Calculate grace remaining
    const elapsed = Date.now() - cached.timestamp;
    const graceMs = this.config.offlineGraceHours * 60 * 60 * 1000;
    this.state.license.graceRemaining = Math.max(0, Math.floor((graceMs - elapsed) / 3_600_000));

    this.log('Using offline cache (grace period)');
    return true;
  }

  private verifyDomain(): void {
    if (typeof window === 'undefined') return;
    // Domain verification happens server-side during validation
    // Client just reports its domain
    this.log(`Domain: ${window.location.hostname}`);
  }

  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      this.ws.heartbeat({
        sdkVersion: SDK_VERSION,
        configVersion: this.state.config.version,
        uptime: Date.now(),
      });

      // Flush telemetry on heartbeat
      this.flushTelemetry();
    }, this.config.heartbeatInterval);
  }

  private flushTelemetry(): void {
    if (this.telemetryBuffer.length === 0) return;
    const events = [...this.telemetryBuffer];
    this.telemetryBuffer = [];
    this.ws.sendTelemetry(events);
  }

  private bindCallbacks(callbacks: DevLockCallbacks): void {
    if (callbacks.onReady) this.emitter.on('ready', callbacks.onReady);
    if (callbacks.onLicenseValid) this.emitter.on('license:valid', callbacks.onLicenseValid as any);
    if (callbacks.onLicenseInvalid) this.emitter.on('license:invalid', callbacks.onLicenseInvalid as any);
    if (callbacks.onLicenseSuspended) this.emitter.on('license:suspended', callbacks.onLicenseSuspended as any);
    if (callbacks.onLicenseExpired) this.emitter.on('license:expired', callbacks.onLicenseExpired as any);
    if (callbacks.onMaintenanceMode) this.emitter.on('maintenance:enabled', callbacks.onMaintenanceMode as any);
    if (callbacks.onMaintenanceEnd) this.emitter.on('maintenance:disabled', callbacks.onMaintenanceEnd as any);
    if (callbacks.onKillSwitch) this.emitter.on('killswitch:activated', callbacks.onKillSwitch as any);
    if (callbacks.onKillSwitchEnd) this.emitter.on('killswitch:deactivated', callbacks.onKillSwitchEnd as any);
    if (callbacks.onNotification) this.emitter.on('notification:push', callbacks.onNotification as any);
    if (callbacks.onFeatureToggle) this.emitter.on('feature:toggled', callbacks.onFeatureToggle as any);
    if (callbacks.onConfigUpdate) this.emitter.on('config:updated', callbacks.onConfigUpdate as any);
    if (callbacks.onDomainBlocked) this.emitter.on('domain:blocked', callbacks.onDomainBlocked as any);
    if (callbacks.onTamperDetected) this.emitter.on('tamper:detected', callbacks.onTamperDetected as any);
    if (callbacks.onError) this.emitter.on('error', callbacks.onError as any);
    if (callbacks.onConnectionChange) this.emitter.on('connection:change', callbacks.onConnectionChange as any);
    if (callbacks.onPopup) this.emitter.on('popup:show', callbacks.onPopup as any);
  }

  private bindInternalEvents(): void {
    this.emitter.on('connection:change', (connected) => {
      this.state.connected = connected as boolean;
    });

    this.emitter.on('license:suspended', () => {
      this.state.license.valid = false;
      this.state.license.status = 'suspended';
      if (this.config.watermark) this.watermark.show(this.config.watermarkText);
    });

    this.emitter.on('maintenance:enabled', (data) => {
      this.state.maintenance = data as any;
      const msg = (data as any)?.message || 'We are currently performing maintenance. Please check back later.';
      this.overlay.show('Maintenance Mode', msg, false);
    });

    this.emitter.on('maintenance:disabled', () => {
      this.state.maintenance = { enabled: false };
      this.overlay.hide();
    });

    this.emitter.on('killswitch:activated', (data) => {
      this.state.killSwitch = { enabled: true, reason: (data as any)?.reason };
      const msg = (data as any)?.reason || 'Access to this application has been restricted.';
      this.overlay.show('Access Blocked', msg, false);
    });

    this.emitter.on('killswitch:deactivated', () => {
      this.state.killSwitch = { enabled: false };
      this.overlay.hide();
    });

    this.emitter.on('feature:toggled', (flag, enabled) => {
      this.state.featureFlags[flag as string] = enabled as boolean;
    });

    this.emitter.on('notification:push', (notif) => {
      const n = notif as RemoteNotification;
      this.state.notifications.push(n);
      
      // Auto-show high severity or payment notifications via blocking overlay
      if (n.severity === 'high' || n.type === 'payment') {
        const title = n.type === 'payment' ? 'Payment Required' : 'Important Notice';
        this.overlay.show(title, n.message, n.dismissible);
      }
    });
  }

  private async sign(data: string): Promise<string> {
    // Client-side HMAC using Web Crypto API
    // In production, the secret is the project's secret key
    // For frontend SDK, we use a simplified signature (server validates the public key)
    const encoder = new TextEncoder();
    const keyData = encoder.encode(this.config.projectKey);
    const key = await crypto.subtle.importKey('raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(data));
    return Array.from(new Uint8Array(signature)).map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  private log(message: string, ...args: unknown[]): void {
    if (this.config.debug) {
      console.log(`[DevLock] ${message}`, ...args);
    }
  }
}
