# devlock-client

> Frontend SDK for DevLock — License enforcement, remote management, and developer protection for web applications.

[![npm version](https://img.shields.io/npm/v/devlock-client.svg)](https://www.npmjs.com/package/devlock-client)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

🌐 **Website & Dashboard:** [devlock.tashanto.com](https://devlock.tashanto.com) · 🖥️ **Backend SDK:** [`devlock-sdk`](https://www.npmjs.com/package/devlock-sdk)

> **Fail-safe by design.** If DevLock's servers are ever unreachable, this SDK never throws and never blocks your app — your website keeps running smoothly. See [Fail-open behavior](#fail-open-behavior).

## Features

- 🔐 **License Validation** — Verify licenses with HMAC-signed requests
- 🚀 **Real-Time Updates** — WebSocket-powered kill-switch, maintenance mode, feature flags
- 🌐 **Domain Locking** — Prevent unauthorized redistribution
- 🏴 **Feature Flags** — Toggle features instantly across all deployments
- 📡 **Offline Support** — Cryptographically signed offline tokens with grace period
- 🛡️ **Tamper Detection** — Detect SDK manipulation attempts
- 💧 **Watermark Injection** — Show watermark for invalid licenses
- 🔔 **Remote Notifications** — Push messages to deployed apps
- ⚡ **Kill Switch** — Instantly disable applications remotely
- 🔧 **Maintenance Mode** — Show maintenance messages without redeploying

## Framework Support

| Framework | Import Path |
|-----------|-------------|
| Vanilla JS/TS | `devlock-client` |
| React | `devlock-client/react` |
| Next.js | `devlock-client/next` |
| Vue 3 | `devlock-client/vue` |

## Installation

```bash
npm install devlock-client
# or
yarn add devlock-client
# or
pnpm add devlock-client
```

## Setup & Dashboard

Before using the SDK, you need to create a project and obtain your keys from the DevLock Dashboard:

1. Go to **[DevLock Dashboard](https://devlock.tashanto.com)**.
2. Sign in and navigate to the **Projects** section.
3. Click **Create Project** and fill in your details.
4. Copy your **Project Key** (starts with `pk_live_...`).
5. (Optional) Generate a **License Key** for your users from the Licenses page.

## Quick Start

### Vanilla TypeScript / JavaScript

```typescript
import { DevLock } from 'devlock-client';

const devlock = new DevLock({
  projectKey: 'pk_live_your_project_key',
  licenseKey: 'DLCK-XXXX-XXXX-XXXX-XXXX',
  on: {
    onReady: (state) => console.log('DevLock ready:', state),
    onKillSwitch: (reason) => showBlockedUI(reason),
    onMaintenanceMode: (config) => showMaintenance(config.message),
    onLicenseSuspended: (reason) => showSuspendedUI(reason),
    onFeatureToggle: (flag, enabled) => updateFeature(flag, enabled),
    onNotification: (notif) => showToast(notif.message),
  },
});

await devlock.init();

// Check feature flags
if (devlock.isFeatureEnabled('premium-export')) {
  showPremiumFeature();
}

// Check license status
if (devlock.isLicenseValid()) {
  // Full access
}

// Track custom events
devlock.track('export_clicked', { format: 'pdf' });
```

### React

```tsx
import { DevLockProvider, useDevLock, useFeatureFlag } from 'devlock-client/react';

// Wrap your app
function App() {
  return (
    <DevLockProvider
      config={{
        projectKey: 'pk_live_your_project_key',
        licenseKey: 'DLCK-XXXX-XXXX-XXXX-XXXX',
      }}
      fallback={<LoadingScreen />}
    >
      <MyApp />
    </DevLockProvider>
  );
}

// Use in components
function Dashboard() {
  const { state, isReady } = useDevLock();
  const isPremium = useFeatureFlag('premium');

  if (state.maintenance.enabled) {
    return <MaintenancePage message={state.maintenance.message} />;
  }

  if (state.killSwitch.enabled) {
    return <BlockedPage reason={state.killSwitch.reason} />;
  }

  return (
    <div>
      <h1>Dashboard</h1>
      {isPremium && <PremiumWidget />}
    </div>
  );
}
```

### Next.js

```tsx
// app/providers.tsx
'use client';
import { DevLockProvider } from 'devlock-client/next';

export function Providers({ children }) {
  return (
    <DevLockProvider
      config={{
        projectKey: process.env.NEXT_PUBLIC_DEVLOCK_KEY!,
        licenseKey: process.env.NEXT_PUBLIC_DEVLOCK_LICENSE!,
      }}
    >
      {children}
    </DevLockProvider>
  );
}
```

### Vue 3

```typescript
import { createApp } from 'vue';
import { DevLockPlugin } from 'devlock-client/vue';

const app = createApp(App);

app.use(DevLockPlugin, {
  projectKey: 'pk_live_your_project_key',
  licenseKey: 'DLCK-XXXX-XXXX-XXXX-XXXX',
});

// In components
import { useDevLock, useFeatureFlag } from 'devlock-client/vue';

const { state, isReady } = useDevLock();
const isPremium = useFeatureFlag('premium');
```

## Configuration

```typescript
const devlock = new DevLock({
  // Required
  projectKey: 'pk_live_xxx',

  // Optional
  licenseKey: 'DLCK-XXXX-XXXX-XXXX-XXXX',
  apiUrl: 'https://dl-api.tashanto.com',    // Custom API URL
  wsUrl: 'wss://dl-ws.tashanto.com',        // Custom WebSocket URL
  environment: 'production',                // 'production' | 'staging' | 'development'
  debug: false,                             // Enable console logging
  offlineGraceHours: 72,                   // Hours to allow offline operation
  heartbeatInterval: 30000,                // Heartbeat interval (ms)
  tamperDetection: true,                   // Enable tamper detection
  watermark: false,                        // Show watermark when license invalid
  watermarkText: 'UNLICENSED',            // Custom watermark text
});
```

## API Reference

### `DevLock` Class

| Method | Returns | Description |
|--------|---------|-------------|
| `init()` | `Promise<DevLockState>` | Initialize SDK, validate license, connect WebSocket |
| `isFeatureEnabled(flag)` | `boolean` | Check if a feature flag is enabled |
| `isLicenseValid()` | `boolean` | Check if license is valid |
| `isMaintenanceMode()` | `boolean` | Check if maintenance mode is active |
| `isKillSwitchActive()` | `boolean` | Check if kill switch is active |
| `getState()` | `DevLockState` | Get current SDK state |
| `getLicense()` | `LicenseInfo` | Get license information |
| `getConfig(key, default)` | `T` | Get remote config value |
| `track(event, metadata)` | `void` | Track a telemetry event |
| `revalidate()` | `Promise<DevLockState>` | Force re-validation |
| `on(event, handler)` | `() => void` | Subscribe to events (returns unsubscribe) |
| `destroy()` | `void` | Cleanup all resources |

### Events

| Event | Payload | Description |
|-------|---------|-------------|
| `ready` | `DevLockState` | SDK initialized |
| `license:valid` | `LicenseInfo` | License validated successfully |
| `license:invalid` | `string` | License validation failed |
| `license:suspended` | `string` | License suspended (reason) |
| `maintenance:enabled` | `MaintenanceConfig` | Maintenance mode activated |
| `maintenance:disabled` | — | Maintenance mode deactivated |
| `killswitch:activated` | `{ reason }` | Kill switch activated |
| `killswitch:deactivated` | — | Kill switch deactivated |
| `feature:toggled` | `flag, enabled` | Feature flag changed |
| `notification:push` | `Notification` | New notification received |
| `connection:change` | `boolean` | WebSocket connection state |
| `tamper:detected` | `string` | Tampering detected |

## Offline Support

The SDK automatically caches validation results and supports offline operation:

1. On successful validation, response is cached locally
2. If network is unavailable, cached result is used
3. Grace period (default 72h) determines how long offline is allowed
4. After grace period expires, license is considered invalid
5. On reconnection, SDK automatically revalidates

## Fail-open behavior

DevLock is a safety layer for **your** app — it must never become a single point of
failure. If DevLock's servers are unreachable and there is no usable cache, the SDK
**does not throw and does not block rendering**. `init()` resolves in a permissive
offline state and your application keeps running exactly as normal.

```typescript
const devlock = new DevLock({
  projectKey: 'pk_live_xxx',
  // failBehavior: 'open',  // default — never break the host app
  // failBehavior: 'closed', // opt in to hard-failing if you *want* to block
});

await devlock.init(); // never rejects when failBehavior is 'open'
```

Enforcement signals (kill-switch, suspension, maintenance) are still delivered and
**cached** — once received they persist across reloads, so an offline period cannot be
used to bypass a lock that was already issued.

## Links

- [Website & Dashboard](https://devlock.tashanto.com)
- [GitHub Repository](https://github.com/iamtashanto/DevLock)
- [Documentation](https://github.com/iamtashanto/DevLock/tree/main/packages/frontend-sdk)
- [Backend SDK (devlock-sdk)](https://www.npmjs.com/package/devlock-sdk)
- [Report Issues](https://github.com/iamtashanto/DevLock/issues)

## License

MIT
