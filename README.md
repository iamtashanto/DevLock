# DevLock

> Software Licensing, Remote Management & Developer Protection Platform

DevLock enables developers to protect, license, and remotely manage their distributed applications. Install lightweight SDKs into client projects, then control everything from a central dashboard — suspend licenses, enable maintenance mode, push notifications, toggle features, enforce domain locking, and activate kill-switches in real time.

---

## What DevLock Does

- **License Management** — Create, validate, suspend, revoke licenses with cryptographic verification
- **Remote Kill-Switch** — Instantly disable deployed applications
- **Maintenance Mode** — Show maintenance messages without redeploying
- **Domain Locking** — Prevent unauthorized redistribution by locking to specific domains
- **Feature Flags** — Toggle features in real-time across all deployments
- **Payment Warnings** — Display payment-related notices to end-users
- **In-App Notifications** — Push messages to deployed applications instantly
- **Tamper Detection** — Detect and respond to SDK manipulation attempts
- **Offline Support** — Cryptographically signed offline license tokens
- **Multi-Tenant SaaS** — Full tenant isolation with shared infrastructure

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Monorepo | Turborepo + pnpm workspaces |
| Language | TypeScript (strict mode) |
| Frontend | Next.js 14, React 18, Tailwind CSS |
| Backend | Express.js, Node.js 20 |
| Database | MongoDB 7 (Mongoose) |
| Cache/Pub-Sub | Redis 7 (ioredis) |
| Real-time | Socket.IO 4 |
| Queue | BullMQ |
| Containers | Docker, Docker Compose |
| CI/CD | GitHub Actions |
| Code Quality | ESLint, Prettier, Husky, Commitlint |

---

## Project Structure

```
devlock/
├── apps/
│   ├── web-dashboard/          → Next.js admin dashboard (port 4000)
│   ├── api-gateway/            → Express API gateway (port 3000)
│   ├── auth-service/           → Authentication & identity (port 3001)
│   ├── license-service/        → License CRUD & validation (port 3002)
│   ├── telemetry-service/      → Analytics & audit logging (port 3003)
│   ├── notification-service/   → Email, webhooks, push (port 3004)
│   ├── billing-service/        → Stripe subscriptions (port 3005)
│   └── websocket-service/      → Real-time Socket.IO gateway (port 3010)
│
├── packages/
│   ├── shared-types/           → TypeScript types, enums, Zod validators
│   ├── database/               → Mongoose models & Redis/Mongo connections
│   ├── logger/                 → Structured logging (pino)
│   ├── config/                 → Env config with Zod validation
│   ├── encryption/             → AES-256, Ed25519, HMAC, password hashing
│   ├── ui/                     → React component library (Tailwind + CVA)
│   ├── frontend-sdk/           → Browser SDK (npm: devlock-client)
│   ├── backend-sdk/            → Node.js SDK (npm: devlock-sdk)
│   ├── eslint-config/          → Shared ESLint configs
│   └── tsconfig/               → Shared TypeScript configs
│
├── docker/
│   └── docker-compose.yml      → MongoDB + Redis + all services
│
├── scripts/
│   └── generate-keys.ts        → Crypto key generation utility
│
├── .github/workflows/ci.yml    → Full CI pipeline
├── turbo.json                  → Turborepo pipeline config
├── pnpm-workspace.yaml         → Workspace definition
├── commitlint.config.ts        → Commit message rules
└── .husky/                     → Git hooks (pre-commit, commit-msg)
```

---

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 9+
- Docker & Docker Compose

### Setup

```bash
# Clone the repository
git clone https://github.com/mdtanvirahamedshanto/DevLock.git
cd DevLock

# Install all dependencies
pnpm install

# Copy environment template
cp .env.example .env

# Generate cryptographic keys (Ed25519, AES-256, JWT secret)
pnpm generate:keys
# → Copy the output values into your .env file

# Start infrastructure (MongoDB + Redis)
pnpm docker:up

# Start all services in development mode
pnpm dev
```

### Access Points

| Service | URL |
|---------|-----|
| Dashboard | http://localhost:4000 |
| API Gateway | http://localhost:3000 |
| WebSocket | ws://localhost:3010 |
| MongoDB | mongodb://localhost:27017 |
| Redis | redis://localhost:6379 |

---

## Available Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start all services in watch mode |
| `pnpm dev:web` | Start dashboard + dependencies only |
| `pnpm dev:api` | Start API gateway + dependencies only |
| `pnpm build` | Build all packages and apps |
| `pnpm lint` | Lint entire codebase |
| `pnpm lint:fix` | Auto-fix lint issues |
| `pnpm format` | Format with Prettier |
| `pnpm format:check` | Check formatting |
| `pnpm typecheck` | Type-check all packages |
| `pnpm test` | Run all tests |
| `pnpm test:ci` | Run tests with coverage |
| `pnpm clean` | Remove all build artifacts |
| `pnpm docker:up` | Start MongoDB + Redis containers |
| `pnpm docker:down` | Stop containers |
| `pnpm docker:build` | Build all Docker images |
| `pnpm generate:keys` | Generate crypto keys for .env |

---

## SDK Usage

### Frontend SDK (Browser)

```bash
npm install devlock-client
```

```typescript
import { DevLock } from 'devlock-client';

const devlock = new DevLock({
  projectKey: 'pk_live_xxxxx',
  licenseKey: 'DLCK-XXXX-XXXX-XXXX-XXXX',
  on: {
    onLicenseSuspended: (reason) => showBlockedUI(reason),
    onMaintenanceMode: (message) => showMaintenancePage(message),
    onKillSwitch: (reason) => disableApp(reason),
    onNotification: (notif) => showToast(notif.message),
    onFeatureToggle: (flag, enabled) => updateUI(flag, enabled),
  },
});

await devlock.init();

// Check feature flags
if (devlock.isFeatureEnabled('premium-charts')) {
  renderPremiumCharts();
}
```

### Backend SDK (Node.js / Express)

```bash
npm install devlock-sdk
```

```typescript
import { createMiddleware } from 'devlock-sdk/express';

// Protect all routes with license validation
app.use(createMiddleware({
  secretKey: process.env.DEVLOCK_SECRET_KEY,
  projectId: process.env.DEVLOCK_PROJECT_ID,
  excludePaths: ['/health', '/public'],
  on: {
    onKillSwitch: (reason) => {
      console.error('Kill switch activated:', reason);
    },
  },
}));

// Access license info in route handlers
app.get('/api/data', (req, res) => {
  const { license, isFeatureEnabled } = req.devlock;

  if (isFeatureEnabled('advanced-export')) {
    // serve premium feature
  }

  res.json({ features: license.features });
});
```

---

## Architecture

### How It Works

```
┌─────────────────────┐         ┌──────────────────────┐
│  Client Application │         │  DevLock Dashboard   │
│  (SDK Integrated)   │         │  (Admin Panel)       │
└──────────┬──────────┘         └──────────┬───────────┘
           │                               │
           │  WebSocket + REST             │  REST API
           ▼                               ▼
┌──────────────────────────────────────────────────────┐
│                   API Gateway                         │
│         (Rate Limiting, Auth, Routing)                │
└──────────────────────────┬───────────────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        ▼                  ▼                  ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   License    │  │    Auth      │  │   Config     │
│   Service    │  │   Service    │  │   Service    │
└──────┬───────┘  └──────────────┘  └──────┬───────┘
       │                                    │
       ▼                                    ▼
┌──────────────────────────────────────────────────────┐
│              WebSocket Service                         │
│    (Real-time push to all connected SDKs)            │
└──────────────────────────────────────────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        ▼                  ▼                  ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   MongoDB    │  │    Redis     │  │   BullMQ     │
│  (Primary)   │  │ (Cache/PubSub)│  │  (Queues)    │
└──────────────┘  └──────────────┘  └──────────────┘
```

### Admin Actions → SDK Response (< 100ms)

1. Admin clicks "Suspend License" in dashboard
2. API Gateway → License Service updates MongoDB
3. License Service publishes event to Redis
4. WebSocket Service receives event, broadcasts to SDK connections
5. SDK receives `license:suspended` event, triggers callback
6. Client app shows blocked UI immediately

---

## Internal Package Dependencies

```
shared-types          ← Foundation (no deps)
  ↑
  ├── database        ← Models + connections (depends on: shared-types, logger)
  ├── frontend-sdk    ← Browser SDK (depends on: shared-types)
  ├── backend-sdk     ← Node SDK (depends on: shared-types)
  ├── config          ← Env validation (standalone)
  ├── logger          ← Structured logging (standalone)
  ├── encryption      ← Crypto utilities (standalone)
  └── ui              ← React components (standalone)

All apps depend on: shared-types, logger, config, database, encryption
```

---

## Environment Variables

Copy `.env.example` to `.env` and configure:

| Variable | Description |
|----------|-------------|
| `MONGODB_URI` | MongoDB connection string |
| `REDIS_URL` | Redis connection string |
| `JWT_SECRET` | Secret for JWT signing (min 32 chars) |
| `ENCRYPTION_KEY` | AES-256 key (64 hex chars) |
| `LICENSE_PRIVATE_KEY` | Ed25519 private key for license signing |
| `LICENSE_PUBLIC_KEY` | Ed25519 public key (embedded in SDKs) |
| `STRIPE_SECRET_KEY` | Stripe API key for billing |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook verification |

Run `pnpm generate:keys` to auto-generate crypto values.

---

## Commit Convention

Enforced by Commitlint + Husky:

```
<type>(<scope>): <subject>

# Examples:
feat(license-service): add offline token generation
fix(frontend-sdk): handle WebSocket reconnection edge case
docs(root): update getting started guide
refactor(database): extract connection pooling logic
test(encryption): add HMAC verification tests
```

**Types:** `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`

**Scopes:** `web-dashboard`, `api-gateway`, `license-service`, `auth-service`, `telemetry-service`, `websocket-service`, `notification-service`, `billing-service`, `frontend-sdk`, `backend-sdk`, `shared-types`, `ui`, `eslint-config`, `tsconfig`, `logger`, `encryption`, `database`, `config`, `docker`, `ci`, `root`

---

## Docker

### Development (infrastructure only)

```bash
pnpm docker:up    # Starts MongoDB + Redis
pnpm docker:down  # Stops containers
```

### Production (all services)

```bash
docker compose -f docker/docker-compose.yml build
docker compose -f docker/docker-compose.yml up -d
```

Each service has a multi-stage Dockerfile:
- Alpine-based Node.js 20
- Non-root user (`devlock:1001`)
- Health checks built in
- Minimal final image (no dev dependencies)

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/my-feature`
3. Make changes following the commit convention
4. Run checks: `pnpm lint && pnpm typecheck && pnpm test`
5. Push and open a Pull Request

---

## License

MIT

---

## Open Source

This is an open-source project. Contributions, issues, and feature requests are welcome.

If you find DevLock useful, consider giving it a ⭐ on GitHub.
