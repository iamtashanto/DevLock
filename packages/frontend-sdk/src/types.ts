// ─── Configuration ────────────────────────────────────────────────────────────

export interface DevLockConfig {
  /** Project public key (pk_live_xxx) */
  projectKey: string;
  /** License key to validate (DLCK-XXXX-XXXX-XXXX-XXXX) */
  licenseKey?: string;
  /** API base URL (default: https://api.devlock.io) */
  apiUrl?: string;
  /** WebSocket URL (default: wss://ws.devlock.io) */
  wsUrl?: string;
  /** Environment (default: production) */
  environment?: 'production' | 'staging' | 'development';
  /** Enable debug logging (default: false) */
  debug?: boolean;
  /** Offline grace period in hours (default: 72) */
  offlineGraceHours?: number;
  /** Heartbeat interval in ms (default: 30000) */
  heartbeatInterval?: number;
  /** Enable tamper detection (default: true) */
  tamperDetection?: boolean;
  /** Enable watermark when license invalid (default: false) */
  watermark?: boolean;
  /** Custom watermark text */
  watermarkText?: string;
  /** Event callbacks */
  on?: DevLockCallbacks;
}

// ─── Callbacks ────────────────────────────────────────────────────────────────

export interface DevLockCallbacks {
  onReady?: (state: DevLockState) => void;
  onLicenseValid?: (license: LicenseInfo) => void;
  onLicenseInvalid?: (reason: string) => void;
  onLicenseSuspended?: (reason: string) => void;
  onLicenseExpired?: () => void;
  onMaintenanceMode?: (config: MaintenanceConfig) => void;
  onMaintenanceEnd?: () => void;
  onKillSwitch?: (reason: string) => void;
  onKillSwitchEnd?: () => void;
  onNotification?: (notification: RemoteNotification) => void;
  onFeatureToggle?: (flag: string, enabled: boolean) => void;
  onConfigUpdate?: (config: RemoteConfig) => void;
  onDomainBlocked?: (domain: string) => void;
  onTamperDetected?: (type: string) => void;
  onError?: (error: DevLockError) => void;
  onConnectionChange?: (connected: boolean) => void;
  onPopup?: (popup: PopupConfig) => void;
}

// ─── State ────────────────────────────────────────────────────────────────────

export interface DevLockState {
  initialized: boolean;
  connected: boolean;
  license: LicenseInfo;
  maintenance: MaintenanceConfig;
  killSwitch: KillSwitchConfig;
  notifications: RemoteNotification[];
  featureFlags: Record<string, boolean>;
  config: RemoteConfig;
  popup: PopupConfig | null;
  offline: boolean;
  lastSyncAt: number;
}

export interface LicenseInfo {
  valid: boolean;
  status: 'active' | 'suspended' | 'expired' | 'revoked' | 'trial' | 'invalid' | 'none';
  features: string[];
  expiresAt?: string;
  graceRemaining?: number; // hours remaining in offline grace
}

export interface MaintenanceConfig {
  enabled: boolean;
  message?: string;
  estimatedEnd?: string;
}

export interface KillSwitchConfig {
  enabled: boolean;
  reason?: string;
}

export interface RemoteNotification {
  id: string;
  type: 'info' | 'warning' | 'error' | 'payment';
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  dismissible: boolean;
}

export interface RemoteConfig {
  version: number;
  data: Record<string, unknown>;
}

export interface PopupConfig {
  id: string;
  type: 'modal' | 'banner' | 'toast' | 'fullscreen';
  title?: string;
  message: string;
  style?: 'info' | 'warning' | 'error' | 'success';
  dismissible: boolean;
  actions?: PopupAction[];
  position?: 'top' | 'bottom' | 'center';
}

export interface PopupAction {
  label: string;
  url?: string;
  style?: 'primary' | 'secondary' | 'destructive';
}

// ─── Events ───────────────────────────────────────────────────────────────────

export type DevLockEvent =
  | 'ready'
  | 'license:valid'
  | 'license:invalid'
  | 'license:suspended'
  | 'license:expired'
  | 'maintenance:enabled'
  | 'maintenance:disabled'
  | 'killswitch:activated'
  | 'killswitch:deactivated'
  | 'notification:push'
  | 'feature:toggled'
  | 'config:updated'
  | 'domain:blocked'
  | 'tamper:detected'
  | 'popup:show'
  | 'popup:dismiss'
  | 'connection:change'
  | 'error';

// ─── Errors ───────────────────────────────────────────────────────────────────

export class DevLockError extends Error {
  constructor(
    message: string,
    public code: string,
    public recoverable: boolean = true,
  ) {
    super(message);
    this.name = 'DevLockError';
  }
}

// ─── Internal ─────────────────────────────────────────────────────────────────

export interface ValidationResponse {
  valid: boolean;
  license: { status: string; features: string[]; expiresAt?: string };
  config: {
    maintenance: MaintenanceConfig;
    killSwitch: KillSwitchConfig;
    notifications: RemoteNotification[];
    featureFlags: Record<string, boolean>;
  };
  popup?: PopupConfig;
  offlineToken?: string;
  serverTime: number;
}

export interface OfflineToken {
  lid: string;
  pid: string;
  sts: string;
  fts: string[];
  exp: number;
  grc: number;
  iat: number;
  nxt: number;
  fp: string;
  dom: string[];
  ver: number;
}
