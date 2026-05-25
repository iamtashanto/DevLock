# devlock-sdk

> Backend SDK for DevLock — License enforcement, remote management, and developer protection for Node.js applications.

[![npm version](https://img.shields.io/npm/v/devlock-sdk.svg)](https://www.npmjs.com/package/devlock-sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

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
  apiUrl: 'https://api.devlock.io',  // Custom API URL
  wsUrl: 'wss://ws.devlock.io',      // Custom WebSocket URL
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

## Links

- [GitHub Repository](https://github.com/mdtanvirahamedshanto/DevLock)
- [Documentation](https://github.com/mdtanvirahamedshanto/DevLock/tree/main/packages/backend-sdk)
- [Frontend SDK (devlock-client)](https://www.npmjs.com/package/devlock-client)
- [Report Issues](https://github.com/mdtanvirahamedshanto/DevLock/issues)

## License

MIT
