// ─── Configuration ────────────────────────────────────────────────────────────

export interface DevLockConfig {
  /** Project secret key (sk_live_xxx) */
  secretKey: string;
  /** Project ID */
  projectId: string;
  /** API base URL (default: https://api.devlock.io) */
  apiUrl?: string;
  /** WebSocket URL (default: wss://ws.devlock.io) */
  wsUrl?: string;
  /** Environment */
  environment?: 'production' | 'staging' | 'development';
  /** Config sync interval in ms (default: 300000 = 5min) */
  syncInterval?: number;
  /** License cache TTL in ms (default: 300000 = 5min) */
  cacheTtl?: number;
  /** Offline grace period in hours (default: 72) */
  offlineGraceHours?: number;
  /** Enable WebSocket for real-time updates (default: true) */
  realtime?: boolean;
  /** Redis client for distributed caching (optional) */
  redis?: RedisLike;
  /** Custom logger (default: console) */
  logger?: Logger;
  /** Callbacks */
  on?: DevLockCallbacks;
}

export interface DevLockCallbacks {
  onReady?: () => void;
  onKillSwitch?: (reason: string) => void;
  onKillSwitchEnd?: () => void;
  onMaintenance?: (enabled: boolean, message?: string) => void;
  onConfigUpdate?: (config: RemoteConfig) => void;
  onError?: (error: Error) => void;
  onConnectionChange?: (connected: boolean) => void;
}

// ─── State ────────────────────────────────────────────────────────────────────

export interface SDKState {
  initialized: boolean;
  connected: boolean;
  lastSync: number;
  maintenance: { enabled: boolean; message?: string };
  killSwitch: { enabled: boolean; reason?: string };
  apiSuspension: { enabled: boolean; reason?: string };
  featureFlags: Record<string, boolean>;
  config: RemoteConfig;
}

export interface RemoteConfig {
  version: number;
  data: Record<string, unknown>;
}

// ─── License Validation ───────────────────────────────────────────────────────

export interface ValidationResult {
  valid: boolean;
  status: 'active' | 'suspended' | 'expired' | 'revoked' | 'trial' | 'unknown';
  features: string[];
  expiresAt?: string;
  error?: string;
  cached?: boolean;
}

export interface ValidationOptions {
  /** Skip cache and force fresh validation */
  force?: boolean;
  /** Custom fingerprint (default: auto-generated) */
  fingerprint?: string;
  /** Request IP (auto-detected from req if not provided) */
  ip?: string;
  /** Request domain (auto-detected from req if not provided) */
  domain?: string;
}

// ─── Middleware Options ───────────────────────────────────────────────────────

export interface MiddlewareOptions extends DevLockConfig {
  /** Function to extract license key from request */
  extractLicenseKey?: (req: unknown) => string | undefined;
  /** Paths to exclude from license validation */
  excludePaths?: string[];
  /** Custom response when license is invalid */
  onUnauthorized?: (req: unknown, res: unknown, result: ValidationResult) => void;
  /** Custom response when in maintenance mode */
  onMaintenance?: (req: unknown, res: unknown, message?: string) => void;
  /** Custom response when kill switch is active */
  onKillSwitch?: (req: unknown, res: unknown, reason?: string) => void;
  /** Custom response when API is suspended */
  onApiSuspended?: (req: unknown, res: unknown, reason?: string) => void;
}

// ─── Telemetry ────────────────────────────────────────────────────────────────

export interface TelemetryEvent {
  type: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
  licenseKey?: string;
  ip?: string;
  path?: string;
}

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface RedisLike {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ...args: unknown[]): Promise<unknown>;
  del(key: string): Promise<unknown>;
}

export interface Logger {
  info(message: string, ...args: unknown[]): void;
  warn(message: string, ...args: unknown[]): void;
  error(message: string, ...args: unknown[]): void;
  debug(message: string, ...args: unknown[]): void;
}

// ─── Errors ───────────────────────────────────────────────────────────────────

export class DevLockError extends Error {
  constructor(
    message: string,
    public code: string,
    public recoverable = true,
  ) {
    super(message);
    this.name = 'DevLockError';
  }
}
