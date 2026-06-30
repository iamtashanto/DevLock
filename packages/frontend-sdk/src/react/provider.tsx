import { createContext, useContext, useEffect, useState, useCallback, useRef, type ReactNode } from 'react';
import { DevLock } from '../core/client.js';
import type { DevLockConfig, DevLockState, DevLockEvent, LicenseInfo } from '../types.js';

// ─── Context ──────────────────────────────────────────────────────────────────

interface DevLockContextValue {
  state: DevLockState;
  client: DevLock | null;
  isReady: boolean;
  isLoading: boolean;
  error: Error | null;
  isFeatureEnabled: (flag: string) => boolean;
  getConfig: <T = unknown>(key: string, defaultValue?: T) => T;
  track: (event: string, metadata?: Record<string, unknown>) => void;
  revalidate: () => Promise<void>;
}

const DevLockContext = createContext<DevLockContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

interface DevLockProviderProps {
  config: DevLockConfig;
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error) => void;
}

/**
 * React provider for DevLock SDK.
 *
 * @example
 * ```tsx
 * import { DevLockProvider } from '@devlock/sdk/react';
 *
 * function App() {
 *   return (
 *     <DevLockProvider config={{ projectKey: 'pk_live_xxx', licenseKey: 'DLCK-...' }}>
 *       <MyApp />
 *     </DevLockProvider>
 *   );
 * }
 * ```
 */
export function DevLockProvider({ config, children, fallback, onError }: DevLockProviderProps) {
  const [state, setState] = useState<DevLockState>({
    initialized: false, connected: false,
    license: { valid: false, status: 'none', features: [] },
    maintenance: { enabled: false }, killSwitch: { enabled: false },
    notifications: [], featureFlags: {}, config: { version: 0, data: {} },
    popup: null, offline: false, lastSyncAt: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const clientRef = useRef<DevLock | null>(null);

  useEffect(() => {
    const client = new DevLock({
      ...config,
      on: {
        ...config.on,
        onReady: (s) => { setState(s); setIsLoading(false); config.on?.onReady?.(s); },
        onError: (err) => { setError(err); onError?.(err); config.on?.onError?.(err); },
        onLicenseValid: (l) => { setState((s) => ({ ...s, license: l })); config.on?.onLicenseValid?.(l); },
        onLicenseSuspended: (r) => { setState((s) => ({ ...s, license: { ...s.license, valid: false, status: 'suspended' } })); config.on?.onLicenseSuspended?.(r); },
        onMaintenanceMode: (c) => { setState((s) => ({ ...s, maintenance: c })); config.on?.onMaintenanceMode?.(c); },
        onMaintenanceEnd: () => { setState((s) => ({ ...s, maintenance: { enabled: false } })); config.on?.onMaintenanceEnd?.(); },
        onKillSwitch: (r) => { setState((s) => ({ ...s, killSwitch: { enabled: true, reason: r } })); config.on?.onKillSwitch?.(r); },
        onKillSwitchEnd: () => { setState((s) => ({ ...s, killSwitch: { enabled: false } })); config.on?.onKillSwitchEnd?.(); },
        onFeatureToggle: (f, e) => { setState((s) => ({ ...s, featureFlags: { ...s.featureFlags, [f]: e } })); config.on?.onFeatureToggle?.(f, e); },
        onConnectionChange: (c) => { setState((s) => ({ ...s, connected: c })); config.on?.onConnectionChange?.(c); },
      },
    });

    clientRef.current = client;
    client.init().catch((err) => { setError(err); setIsLoading(false); onError?.(err); });

    return () => { client.destroy(); clientRef.current = null; };
  }, [config.projectKey, config.licenseKey]); // Re-init only if keys change

  const isFeatureEnabled = useCallback((flag: string) => state.featureFlags[flag] ?? false, [state.featureFlags]);
  const getConfig = useCallback(<T,>(key: string, def?: T) => (state.config.data[key] as T) ?? def!, [state.config]);
  const track = useCallback((event: string, meta?: Record<string, unknown>) => clientRef.current?.track(event, meta), []);
  const revalidate = useCallback(async () => { await clientRef.current?.revalidate(); }, []);

  const value: DevLockContextValue = {
    state, client: clientRef.current, isReady: state.initialized,
    isLoading, error, isFeatureEnabled, getConfig, track, revalidate,
  };

  if (isLoading && fallback) return <>{fallback}</>;

  return <DevLockContext.Provider value={value}>{children}</DevLockContext.Provider>;
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

/**
 * Access the full DevLock context.
 */
export function useDevLock(): DevLockContextValue {
  const ctx = useContext(DevLockContext);
  if (!ctx) throw new Error('useDevLock must be used within <DevLockProvider>');
  return ctx;
}

/**
 * Check if a feature flag is enabled.
 *
 * @example
 * ```tsx
 * const isPremium = useFeatureFlag('premium-export');
 * ```
 */
export function useFeatureFlag(flag: string): boolean {
  const { isFeatureEnabled } = useDevLock();
  return isFeatureEnabled(flag);
}

/**
 * Get license information.
 */
export function useLicense(): LicenseInfo {
  const { state } = useDevLock();
  return state.license;
}

/**
 * Subscribe to a DevLock event.
 *
 * @example
 * ```tsx
 * useDevLockEvent('killswitch:activated', (reason) => {
 *   showBlockedUI(reason);
 * });
 * ```
 */
export function useDevLockEvent(event: DevLockEvent, handler: (...args: unknown[]) => void): void {
  const { client } = useDevLock();

  useEffect(() => {
    if (!client) return;
    const unsub = client.on(event, handler);
    return unsub;
  }, [client, event, handler]);
}
