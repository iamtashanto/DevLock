import { ref, computed, onMounted, onUnmounted, inject, provide, type Ref, type InjectionKey, type Plugin } from 'vue';
import { DevLock } from '../core/client.js';
import type { DevLockConfig, DevLockState, DevLockEvent, LicenseInfo } from '../types.js';

// ─── Injection Key ────────────────────────────────────────────────────────────

const DEVLOCK_KEY: InjectionKey<{
  state: Ref<DevLockState>;
  client: Ref<DevLock | null>;
  isReady: Ref<boolean>;
  isLoading: Ref<boolean>;
  error: Ref<Error | null>;
}> = Symbol('devlock');

// ─── Plugin ───────────────────────────────────────────────────────────────────

/**
 * Vue plugin for DevLock SDK.
 *
 * @example
 * ```ts
 * import { createApp } from 'vue';
 * import { DevLockPlugin } from '@devlock/sdk/vue';
 *
 * const app = createApp(App);
 * app.use(DevLockPlugin, {
 *   projectKey: 'pk_live_xxx',
 *   licenseKey: 'DLCK-XXXX-XXXX-XXXX-XXXX',
 * });
 * ```
 */
export const DevLockPlugin: Plugin = {
  install(app, config: DevLockConfig) {
    const state = ref<DevLockState>({
      initialized: false, connected: false,
      license: { valid: false, status: 'none', features: [] },
      maintenance: { enabled: false }, killSwitch: { enabled: false },
      notifications: [], featureFlags: {}, config: { version: 0, data: {} },
      popup: null, offline: false, lastSyncAt: 0,
    });
    const client = ref<DevLock | null>(null);
    const isReady = ref(false);
    const isLoading = ref(true);
    const error = ref<Error | null>(null);

    const devlock = new DevLock({
      ...config,
      on: {
        ...config.on,
        onReady: (s) => { state.value = s; isReady.value = true; isLoading.value = false; },
        onError: (err) => { error.value = err; },
        onFeatureToggle: (f, e) => { state.value.featureFlags[f] = e; },
        onConnectionChange: (c) => { state.value.connected = c; },
        onMaintenanceMode: (c) => { state.value.maintenance = c; },
        onKillSwitch: (r) => { state.value.killSwitch = { enabled: true, reason: r }; },
      },
    });

    client.value = devlock;
    devlock.init().catch((err) => { error.value = err; isLoading.value = false; });

    app.provide(DEVLOCK_KEY, { state: state as any, client: client as any, isReady, isLoading, error });

    // Cleanup on app unmount
    app.config.globalProperties.$devlock = devlock;
  },
};

// ─── Composables ──────────────────────────────────────────────────────────────

/**
 * Access the DevLock SDK in a Vue component.
 */
export function useDevLock() {
  const ctx = inject(DEVLOCK_KEY);
  if (!ctx) throw new Error('useDevLock() requires DevLockPlugin to be installed');

  const isFeatureEnabled = (flag: string) => ctx.state.value.featureFlags[flag] ?? false;
  const getConfig = <T = unknown>(key: string, def?: T): T => (ctx.state.value.config.data[key] as T) ?? def!;
  const track = (event: string, meta?: Record<string, unknown>) => ctx.client.value?.track(event, meta);

  return {
    state: ctx.state,
    client: ctx.client,
    isReady: ctx.isReady,
    isLoading: ctx.isLoading,
    error: ctx.error,
    isFeatureEnabled,
    getConfig,
    track,
  };
}

/**
 * Reactive feature flag check.
 */
export function useFeatureFlag(flag: string) {
  const { state } = useDevLock();
  return computed(() => state.value.featureFlags[flag] ?? false);
}

/**
 * Reactive license info.
 */
export function useLicense() {
  const { state } = useDevLock();
  return computed(() => state.value.license);
}
