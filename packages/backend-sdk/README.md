# devlock-sdk

> Backend SDK for DevLock — License enforcement, remote management, and developer protection for Node.js applications.

[![npm version](https://img.shields.io/npm/v/devlock-sdk.svg)](https://www.npmjs.com/package/devlock-sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

🌐 **Website & Dashboard:** [devlock.tashanto.com](https://devlock.tashanto.com) · 🌍 **Frontend SDK:** [`devlock-client`](https://www.npmjs.com/package/devlock-client)

> **Fail-safe by design.** If DevLock's servers are ever unreachable, `init()` never throws and the middleware never blocks traffic on our outage — your service keeps serving requests. See [Fail-open behavior](#fail-open-behavior).

## Features

- 🔐 **License Validation** — HMAC-signed server-to-server verification with caching
- ⚡ **Kill Switch** — Instant application disable via WebSocket
- 🔧 **Maintenance Mode** — Return 503 automatically when enabled
- 🏴 **Feature Flags** — Real-time feature toggling
- 📡 **Offline Support** — Redis + in-memory cache with grace period
- 🔄 **Auto-Sync** — Periodic config sync with WebSocket push updates
- 📊 **Telemetry** — Batched event tracking
- 🛡️ **API Suspension** — Remote API disable capability
- 🔁 **Retry Logic** — Exponential backoff with jitter

## Framework Support

| Framework | Import Path |
|-----------|-------------|
| Core (any Node.js) | `devlock-sdk` |
| Express.js | `devlock-sdk/express` |
| Fastify | `devlock-sdk/fastify` |
| NestJS | `devlock-sdk/nestjs` |

## Installation

```bash
npm install devlock-sdk
# or
yarn add devlock-sdk
# or
pnpm add devlock-sdk
```

## Setup & Dashboard

Before using the SDK, you need to create a project and obtain your keys from the DevLock Dashboard:

1. Go to **[DevLock Dashboard](https://devlock.tashanto.com)**.
2. Sign in and navigate to the **Projects** section.
3. Click **Create Project** and fill in your details.
4. Copy your **Project ID** and **Secret Key** (`sk_live_...`). Note that the Secret Key must be kept secure and never exposed to the frontend.

## Quick Start

### Express.js (Recommended)

```typescript
import express from 'express';
import { createMiddleware } from 'devlock-sdk/express';

const app = express();

// Protect all routes with license validation
app.use(createMiddleware({
  secretKey: process.env.DEVLOCK_SECRET_KEY!,
  projectId: process.env.DEVLOCK_PROJECT_ID!,
  excludePaths: ['/health', '/public', '/webhooks'],
  on: {
    onKillSwitch: (reason) => {
      console.error('Kill switch activated:', reason);
    },
    onMaintenance: (enabled, message) => {
      console.log('Maintenance:', enabled, message);
    },
  },
}));

// Access license info in route handlers
app.get('/api/data', (req, res) => {
  const { license, isFeatureEnabled, track } = req.devlock!;

  // Check features
  if (isFeatureEnabled('advanced-export')) {
    // serve premium feature
  }

  // Track usage
  track('data_accessed', { endpoint: '/api/data' });

  res.json({ features: license.features, status: license.status });
});

app.listen(3000);
```

### Fastify

```typescript
import Fastify from 'fastify';
import { devlockPlugin } from 'devlock-sdk/fastify';

const app = Fastify();

await app.register(devlockPlugin, {
  secretKey: process.env.DEVLOCK_SECRET_KEY!,
  projectId: process.env.DEVLOCK_PROJECT_ID!,
  excludePaths: ['/health'],
});

app.get('/api/data', (request, reply) => {
  const { license, isFeatureEnabled } = request.devlock;
  reply.send({ features: license.features });
});

await app.listen({ port: 3000 });
```

### NestJS

```typescript
// app.module.ts
import { Module } from '@nestjs/common';
import { DevLockModule } from 'devlock-sdk/nestjs';

@Module({
  imports: [
    DevLockModule.forRoot({
      secretKey: process.env.DEVLOCK_SECRET_KEY!,
      projectId: process.env.DEVLOCK_PROJECT_ID!,
      excludePaths: ['/health'],
    }),
  ],
})
export class AppModule {}
```

### Core (Framework-Agnostic)

```typescript
import { DevLock } from 'devlock-sdk';

const devlock = new DevLock({
  secretKey: process.env.DEVLOCK_SECRET_KEY!,
  projectId: process.env.DEVLOCK_PROJECT_ID!,
  on: {
    onKillSwitch: (reason) => console.error('Disabled:', reason),
    onMaintenance: (enabled) => console.log('Maintenance:', enabled),
  },
});

await devlock.init();

// Validate a license
const result = await devlock.validateLicense('DLCK-XXXX-XXXX-XXXX-XXXX');
console.log(result.valid, result.features);

// Check state
if (devlock.isMaintenanceMode()) { /* ... */ }
if (devlock.isKillSwitchActive()) { /* ... */ }
if (devlock.isFeatureEnabled('premium')) { /* ... */ }

// Track events
devlock.track({ type: 'api_call', timestamp: Date.now(), path: '/users' });

// Cleanup
devlock.destroy();
```

## Configuration

```typescript
const devlock = new DevLock({
  // Required
  secretKey: 'sk_live_xxx',          // Project secret key
  projectId: 'proj_xxx',             // Project ID

  // Optional
  apiUrl: 'https://dl-api.tashanto.com',  // Custom API URL
  wsUrl: 'wss://dl-ws.tashanto.com',      // Custom WebSocket URL
  environment: 'production',          // 'production' | 'staging' | 'development'
  syncInterval: 300000,               // Config sync interval (ms, default: 5min)
  cacheTtl: 300000,                   // License cache TTL (ms, default: 5min)
  offlineGraceHours: 72,             // Offline grace period (hours)
  realtime: true,                     // Enable WebSocket updates
  redis: redisClient,                 // Optional Redis for distributed caching
  logger: customLogger,               // Custom logger (default: console)
});
```

## Redis Caching (Recommended for Production)

```typescript
import Redis from 'ioredis';
import { createMiddleware } from 'devlock-sdk/express';

const redis = new Redis(process.env.REDIS_URL);

app.use(createMiddleware({
  secretKey: process.env.DEVLOCK_SECRET_KEY!,
  projectId: process.env.DEVLOCK_PROJECT_ID!,
  redis: redis,  // Enables distributed caching across instances
}));
```

## API Reference

### `DevLock` Class

| Method | Returns | Description |
|--------|---------|-------------|
| `init()` | `Promise<void>` | Initialize SDK, sync config, connect WebSocket |
| `validateLicense(key, opts?)` | `Promise<ValidationResult>` | Validate a license key |
| `isFeatureEnabled(flag)` | `boolean` | Check feature flag |
| `isMaintenanceMode()` | `boolean` | Check maintenance status |
| `isKillSwitchActive()` | `boolean` | Check kill switch |
| `isApiSuspended()` | `boolean` | Check API suspension |
| `getConfig(key, default?)` | `T` | Get remote config value |
| `getState()` | `SDKState` | Get full SDK state |
| `track(event)` | `void` | Track telemetry event |
| `sync()` | `Promise<void>` | Force config re-sync |
| `invalidateLicense(key)` | `Promise<void>` | Clear cached validation |
| `destroy()` | `void` | Cleanup resources |

### `ValidationResult`

```typescript
interface ValidationResult {
  valid: boolean;
  status: 'active' | 'suspended' | 'expired' | 'revoked' | 'trial' | 'unknown';
  features: string[];
  expiresAt?: string;
  error?: string;
  cached?: boolean;
}
```

### Express Middleware (`req.devlock`)

```typescript
interface RequestDevLock {
  license: ValidationResult;
  isFeatureEnabled: (flag: string) => boolean;
  getConfig: <T>(key: string, defaultValue?: T) => T;
  track: (event: string, metadata?: Record<string, unknown>) => void;
}
```

## License Key Extraction

By default, the middleware looks for the license key in:
1. `X-License-Key` header
2. `Authorization: License <key>` header
3. `?license_key=` query parameter

Custom extraction:
```typescript
app.use(createMiddleware({
  ...config,
  extractLicenseKey: (req) => req.headers['x-my-license'] as string,
}));
```

## Fail-open behavior

> ### 🔒 The safety guarantee
> **Your service is disabled ONLY when you explicitly lock it from the DevLock dashboard.**
> A DevLock outage, a network/API error, a request timeout, a malformed response, or the
> SDK itself failing will **never** block traffic, return 503/403, or crash your process.
> Errors always resolve to *allow*. A block is applied only when the server explicitly
> reports `enabled: true` for a kill-switch / maintenance / suspension **you** turned on.

DevLock is a safety layer for **your** service — it must never become a single point of
failure. If DevLock's servers are unreachable and there is no cached decision:

- `init()` **never throws** (resolves in a permissive offline state).
- The middleware **does not block traffic** — a request that can only be validated as
  `'unknown'` (server unreachable) is allowed through instead of returning `403`.
- Lock flags are normalised — only an explicit `enabled === true` blocks; missing or
  malformed config can never take your service down.

```typescript
app.use(createMiddleware({
  secretKey: process.env.DEVLOCK_SECRET_KEY!,
  projectId: process.env.DEVLOCK_PROJECT_ID!,
  // failBehavior: 'open',   // default — never break the host service
  // failBehavior: 'closed', // opt in to blocking when DevLock is unreachable
}));
```

Definitive enforcement signals (kill-switch, API suspension, maintenance, and
`suspended` / `expired` / `revoked` licenses) are **cached** and still block — once
received they persist across restarts, so an outage cannot be used to bypass a lock
that was already issued.

## Links

- [Website & Dashboard](https://devlock.tashanto.com)
- [Documentation](https://devlock.tashanto.com/docs)
- [GitHub Repository](https://github.com/iamtashanto/DevLock)
- [Frontend SDK (devlock-client)](https://www.npmjs.com/package/devlock-client)
- [Report Issues](https://github.com/iamtashanto/DevLock/issues)

## License

MIT

---

Built by [Md Tanvir Ahamed Shanto](https://tashanto.com) · [devlock.tashanto.com](https://devlock.tashanto.com)
