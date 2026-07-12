# DevLock — Backend Architecture Blueprint

> Production-grade backend architecture for a software licensing, remote management, and developer protection platform.

---

## Table of Contents

1. [REST API Structure](#1-rest-api-structure)
2. [Event-Driven Architecture](#2-event-driven-architecture)
3. [Queue System](#3-queue-system)
4. [Database Schema](#4-database-schema)
5. [MongoDB Collections](#5-mongodb-collections)
6. [Redis Strategy](#6-redis-strategy)
7. [JWT Architecture](#7-jwt-architecture)
8. [Access Control (RBAC)](#8-access-control-rbac)
9. [API Validation](#9-api-validation)
10. [Rate Limiting](#10-rate-limiting)
11. [Security Middleware](#11-security-middleware)
12. [SDK Validation Flow](#12-sdk-validation-flow)
13. [Signed Token System](#13-signed-token-system)
14. [Encryption Architecture](#14-encryption-architecture)
15. [Webhook System](#15-webhook-system)
16. [Retry System](#16-retry-system)
17. [Logging System](#17-logging-system)
18. [Error Handling Architecture](#18-error-handling-architecture)
19. [Production Folder Structure](#19-production-folder-structure)
20. [Clean Architecture & DI](#20-clean-architecture--dependency-injection)
21. [Docker Setup](#21-docker-setup)
22. [Kubernetes Deployment](#22-kubernetes-deployment)
23. [Horizontal Scaling](#23-horizontal-scaling)
24. [Production Express.js Setup](#24-production-expressjs-setup)

---

## 1. REST API Structure

### Base URL: `https://api.devlock.tashanto.com/v1`

### Authentication
```
POST   /v1/auth/register              → Create account + organization
POST   /v1/auth/login                 → Email/password login
POST   /v1/auth/login/oauth           → OAuth (Google, GitHub)
POST   /v1/auth/refresh               → Refresh access token
POST   /v1/auth/logout                → Invalidate session
POST   /v1/auth/forgot-password       → Send reset email
POST   /v1/auth/reset-password        → Reset with token
POST   /v1/auth/verify-email          → Email verification
POST   /v1/auth/mfa/enable            → Enable TOTP MFA
POST   /v1/auth/mfa/verify            → Verify MFA code
DELETE /v1/auth/mfa/disable           → Disable MFA
```

### Organizations
```
GET    /v1/organizations              → List user's orgs
POST   /v1/organizations              → Create organization
GET    /v1/organizations/:orgId       → Get org details
PUT    /v1/organizations/:orgId       → Update org
DELETE /v1/organizations/:orgId       → Delete org (owner only)
GET    /v1/organizations/:orgId/usage → Usage & limits
```

### Teams
```
GET    /v1/organizations/:orgId/teams           → List teams
POST   /v1/organizations/:orgId/teams           → Create team
GET    /v1/organizations/:orgId/teams/:teamId   → Get team
PUT    /v1/organizations/:orgId/teams/:teamId   → Update team
DELETE /v1/organizations/:orgId/teams/:teamId   → Delete team
POST   /v1/organizations/:orgId/teams/:teamId/members → Add member
DELETE /v1/organizations/:orgId/teams/:teamId/members/:userId → Remove member
```

### Projects
```
GET    /v1/projects                   → List projects (scoped to org)
POST   /v1/projects                   → Create project
GET    /v1/projects/:projectId        → Get project
PUT    /v1/projects/:projectId        → Update project
DELETE /v1/projects/:projectId        → Delete project
POST   /v1/projects/:projectId/rotate-keys → Rotate API keys
GET    /v1/projects/:projectId/stats  → Project statistics
```

### Licenses
```
GET    /v1/projects/:projectId/licenses           → List licenses
POST   /v1/projects/:projectId/licenses           → Create license
GET    /v1/projects/:projectId/licenses/:licenseId → Get license
PUT    /v1/projects/:projectId/licenses/:licenseId → Update license
DELETE /v1/projects/:projectId/licenses/:licenseId → Delete license
POST   /v1/projects/:projectId/licenses/:licenseId/suspend   → Suspend
POST   /v1/projects/:projectId/licenses/:licenseId/revoke    → Revoke
POST   /v1/projects/:projectId/licenses/:licenseId/reactivate → Reactivate
GET    /v1/projects/:projectId/licenses/:licenseId/activations → List activations
DELETE /v1/projects/:projectId/licenses/:licenseId/activations/:activationId → Deactivate
```

### Domain Locking
```
GET    /v1/projects/:projectId/domains            → List domains
POST   /v1/projects/:projectId/domains            → Add domain
DELETE /v1/projects/:projectId/domains/:domainId  → Remove domain
POST   /v1/projects/:projectId/domains/:domainId/verify → Verify domain
PUT    /v1/projects/:projectId/domain-policy      → Update lock policy (warn/block/kill)
```

### Remote Commands & Config
```
GET    /v1/projects/:projectId/config             → Get remote config
PUT    /v1/projects/:projectId/config             → Update config
PUT    /v1/projects/:projectId/maintenance        → Toggle maintenance mode
POST   /v1/projects/:projectId/kill-switch        → Activate/deactivate kill-switch
PUT    /v1/projects/:projectId/api-suspension     → Suspend/resume APIs
POST   /v1/projects/:projectId/commands           → Send remote command to SDKs
```

### Feature Flags
```
GET    /v1/projects/:projectId/flags              → List flags
POST   /v1/projects/:projectId/flags              → Create flag
PUT    /v1/projects/:projectId/flags/:flagId      → Update flag
DELETE /v1/projects/:projectId/flags/:flagId      → Delete flag
POST   /v1/projects/:projectId/flags/:flagId/toggle → Quick toggle
```

### SDK Endpoints (Public, API-Key Auth)
```
POST   /v1/sdk/init                   → Initialize SDK session
POST   /v1/sdk/validate               → Validate license
POST   /v1/sdk/heartbeat              → Heartbeat + config sync
POST   /v1/sdk/activate               → Activate license on device
POST   /v1/sdk/deactivate             → Deactivate license on device
POST   /v1/sdk/telemetry              → Batch telemetry ingestion
GET    /v1/sdk/config                 → Fetch remote config
POST   /v1/sdk/verify                 → SDK integrity verification
```

### Telemetry & Analytics
```
GET    /v1/projects/:projectId/analytics/overview     → Dashboard stats
GET    /v1/projects/:projectId/analytics/licenses     → License analytics
GET    /v1/projects/:projectId/analytics/usage        → Usage over time
GET    /v1/projects/:projectId/analytics/devices      → Device breakdown
GET    /v1/projects/:projectId/analytics/domains      → Domain analytics
GET    /v1/projects/:projectId/analytics/events       → Event stream
```

### Audit Logs
```
GET    /v1/organizations/:orgId/audit-logs            → List audit logs
GET    /v1/organizations/:orgId/audit-logs/:logId     → Get log detail
GET    /v1/organizations/:orgId/audit-logs/export     → Export CSV/JSON
```

### Notifications
```
GET    /v1/notifications                              → List notifications
PUT    /v1/notifications/:id/read                     → Mark as read
POST   /v1/notifications/read-all                     → Mark all read
GET    /v1/notifications/preferences                  → Get preferences
PUT    /v1/notifications/preferences                  → Update preferences
```

### Billing
```
GET    /v1/billing/subscription                       → Current subscription
POST   /v1/billing/checkout                           → Create checkout session
PUT    /v1/billing/subscription                       → Change plan
POST   /v1/billing/cancel                             → Cancel subscription
GET    /v1/billing/invoices                           → List invoices
GET    /v1/billing/usage                              → Current usage
POST   /v1/billing/webhook                            → Stripe webhook (internal)
```

### Webhooks (Outbound)
```
GET    /v1/projects/:projectId/webhooks               → List webhooks
POST   /v1/projects/:projectId/webhooks               → Create webhook
PUT    /v1/projects/:projectId/webhooks/:webhookId    → Update webhook
DELETE /v1/projects/:projectId/webhooks/:webhookId    → Delete webhook
POST   /v1/projects/:projectId/webhooks/:webhookId/test → Send test event
GET    /v1/projects/:projectId/webhooks/:webhookId/deliveries → Delivery log
```

---

## 2. Event-Driven Architecture

### Event Bus (Redis Pub/Sub + BullMQ)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        EVENT FLOW                                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Producer (Service)                                                       │
│       │                                                                  │
│       ├──► Redis Pub/Sub ──► WebSocket Service ──► Connected SDKs       │
│       │    (real-time)        (broadcast)           (instant)            │
│       │                                                                  │
│       └──► BullMQ Queue ──► Worker ──► Side Effects                     │
│            (reliable)        (async)    (email, webhook, analytics)      │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Domain Events

```typescript
// events/domain-events.ts

export const DomainEvents = {
  // License lifecycle
  'license.created': { projectId, licenseId, type, metadata },
  'license.activated': { projectId, licenseId, deviceId, domain },
  'license.suspended': { projectId, licenseId, reason, actor },
  'license.revoked': { projectId, licenseId, reason, actor },
  'license.expired': { projectId, licenseId },
  'license.renewed': { projectId, licenseId },

  // Config changes (trigger real-time push)
  'config.updated': { projectId, changes, version },
  'maintenance.toggled': { projectId, enabled, message },
  'killswitch.activated': { projectId, reason, actor },
  'killswitch.deactivated': { projectId, actor },
  'flag.toggled': { projectId, flagKey, enabled },
  'api.suspended': { projectId, reason },
  'api.resumed': { projectId },

  // Security events
  'domain.violation': { projectId, licenseId, domain, action },
  'tamper.detected': { projectId, licenseId, type, severity },
  'sdk.integrity.failed': { projectId, fingerprint },

  // Billing events
  'subscription.created': { orgId, plan, stripeId },
  'subscription.updated': { orgId, plan },
  'subscription.canceled': { orgId },
  'payment.failed': { orgId, invoiceId },
  'payment.recovered': { orgId, invoiceId },

  // Organization events
  'member.invited': { orgId, email, role },
  'member.joined': { orgId, userId },
  'member.removed': { orgId, userId },
} as const;
```

### Event Dispatcher

```typescript
// core/events/event-bus.ts

import { Redis } from 'ioredis';
import { Queue } from 'bullmq';

export class EventBus {
  constructor(
    private redis: Redis,
    private queues: Map<string, Queue>,
  ) {}

  /**
   * Publish event for real-time delivery (Redis Pub/Sub)
   * AND queue for reliable async processing (BullMQ)
   */
  async emit(event: string, payload: Record<string, unknown>): Promise<void> {
    const envelope = {
      event,
      data: payload,
      timestamp: Date.now(),
      eventId: crypto.randomUUID(),
    };

    // Real-time: broadcast to WebSocket service
    await this.redis.publish(`events:${payload.projectId}`, JSON.stringify(envelope));

    // Reliable: queue for async processing
    const queue = this.queues.get('events') ?? this.queues.get('default');
    await queue?.add(event, envelope, {
      removeOnComplete: 1000,
      removeOnFail: 5000,
      attempts: 3,
      backoff: { type: 'exponential', delay: 1000 },
    });
  }
}
```

---

## 3. Queue System

### BullMQ Queue Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        QUEUE TOPOLOGY                                     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Queue: license-events (Priority: HIGH)                                  │
│  ├── Jobs: validate, activate, suspend, revoke, expire-check            │
│  ├── Concurrency: 10                                                    │
│  ├── Rate limit: 100/sec                                                │
│  └── Retry: 3x exponential (1s, 4s, 16s)                               │
│                                                                          │
│  Queue: notifications (Priority: MEDIUM)                                 │
│  ├── Jobs: email, in-app, push, sms                                    │
│  ├── Concurrency: 20                                                    │
│  ├── Rate limit: 50/sec                                                 │
│  └── Retry: 5x exponential (2s, 8s, 32s, 128s, 512s)                  │
│                                                                          │
│  Queue: webhooks (Priority: MEDIUM)                                      │
│  ├── Jobs: deliver, retry-failed                                        │
│  ├── Concurrency: 15                                                    │
│  ├── Rate limit: 30/sec per endpoint                                    │
│  └── Retry: 8x exponential (10s → 24h), then dead-letter               │
│                                                                          │
│  Queue: telemetry (Priority: LOW)                                        │
│  ├── Jobs: ingest-batch, aggregate, cleanup                             │
│  ├── Concurrency: 30                                                    │
│  ├── Rate limit: none (batch processing)                                │
│  └── Retry: 2x, then drop                                              │
│                                                                          │
│  Queue: billing (Priority: HIGH)                                         │
│  ├── Jobs: meter-usage, sync-stripe, dunning                           │
│  ├── Concurrency: 5                                                     │
│  ├── Rate limit: 10/sec                                                 │
│  └── Retry: 5x exponential                                             │
│                                                                          │
│  Queue: scheduled (Repeatable Jobs)                                      │
│  ├── license-expiry-scan: every 1h                                      │
│  ├── domain-reverification: every 24h                                   │
│  ├── analytics-aggregation: every 15min                                 │
│  ├── stale-session-cleanup: every 6h                                    │
│  ├── usage-metering-snapshot: every 1h                                  │
│  └── webhook-dead-letter-retry: every 4h                                │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Queue Implementation

```typescript
// infrastructure/queues/queue-manager.ts

import { Queue, Worker, QueueScheduler } from 'bullmq';
import { Redis } from 'ioredis';

export class QueueManager {
  private queues = new Map<string, Queue>();
  private workers = new Map<string, Worker>();

  constructor(private connection: Redis) {}

  register(name: string, processor: Processor, opts: QueueOptions): void {
    const queue = new Queue(name, { connection: this.connection, ...opts });
    const worker = new Worker(name, processor, {
      connection: this.connection,
      concurrency: opts.concurrency ?? 5,
      limiter: opts.rateLimit ? { max: opts.rateLimit, duration: 1000 } : undefined,
    });

    worker.on('failed', (job, err) => {
      logger.error({ jobId: job?.id, queue: name, err }, 'Job failed');
    });

    worker.on('completed', (job) => {
      logger.debug({ jobId: job.id, queue: name }, 'Job completed');
    });

    this.queues.set(name, queue);
    this.workers.set(name, worker);
  }

  async shutdown(): Promise<void> {
    await Promise.all([
      ...Array.from(this.workers.values()).map((w) => w.close()),
      ...Array.from(this.queues.values()).map((q) => q.close()),
    ]);
  }
}
```

---

## 4. Database Schema

### Entity Relationship

```
Organization (1) ──► (N) Team
Organization (1) ──► (N) Member (User pivot)
Organization (1) ──► (N) Project
Organization (1) ──► (1) Subscription

Project (1) ──► (N) License
Project (1) ──► (1) Config
Project (1) ──► (N) Domain
Project (1) ──► (N) FeatureFlag
Project (1) ──► (N) Webhook

License (1) ──► (N) Activation (Device)
License (1) ──► (N) ValidationLog

User (1) ──► (N) Session
User (1) ──► (N) AuditLog (as actor)
Organization (1) ──► (N) AuditLog (scoped)
```

---

## 5. MongoDB Collections

### `organizations`
```typescript
{
  _id: ObjectId,
  name: string,                    // "Acme Corp"
  slug: string,                    // "acme-corp" (unique)
  ownerId: ObjectId,               // → users
  plan: 'free' | 'pro' | 'business' | 'enterprise',
  settings: {
    defaultDomainPolicy: 'warn' | 'block' | 'kill',
    requireMfa: boolean,
    ipAllowlist: string[],
    ssoEnabled: boolean,
    ssoProvider?: { type: string, config: object },
  },
  billing: {
    stripeCustomerId: string,
    subscriptionId: string,
    currentPeriodEnd: Date,
    paymentStatus: 'active' | 'past_due' | 'canceled',
  },
  limits: {
    maxProjects: number,
    maxLicenses: number,
    maxTeamMembers: number,
    maxApiCalls: number,
    maxWebhooks: number,
  },
  createdAt: Date,
  updatedAt: Date,
}
// Indexes: { slug: 1 }, { ownerId: 1 }, { 'billing.stripeCustomerId': 1 }
```

### `users`
```typescript
{
  _id: ObjectId,
  email: string,                   // unique globally
  name: string,
  avatarUrl?: string,
  passwordHash: string,            // scrypt
  mfa: {
    enabled: boolean,
    secret?: string,               // encrypted
    backupCodes?: string[],        // encrypted
  },
  emailVerifiedAt?: Date,
  lastLoginAt?: Date,
  createdAt: Date,
  updatedAt: Date,
}
// Indexes: { email: 1 } unique
```

### `org_members` (pivot)
```typescript
{
  _id: ObjectId,
  orgId: ObjectId,                 // → organizations
  userId: ObjectId,                // → users
  role: 'owner' | 'admin' | 'developer' | 'viewer' | 'billing',
  teamIds: ObjectId[],             // → teams
  invitedBy: ObjectId,
  joinedAt: Date,
}
// Indexes: { orgId: 1, userId: 1 } unique, { userId: 1 }
```

### `teams`
```typescript
{
  _id: ObjectId,
  orgId: ObjectId,
  name: string,
  description?: string,
  projectIds: ObjectId[],          // projects this team can access
  createdAt: Date,
}
// Indexes: { orgId: 1 }
```

### `projects`
```typescript
{
  _id: ObjectId,
  orgId: ObjectId,
  name: string,
  description?: string,
  publicKey: string,               // pk_live_xxx (unique)
  secretKey: string,               // sk_live_xxx (encrypted at rest)
  secretKeyHash: string,           // for lookup without decryption
  allowedDomains: string[],
  domainPolicy: 'warn' | 'block' | 'kill',
  settings: {
    tamperDetection: { enabled: boolean, level: string },
    offlineGraceHours: number,
    maxActivationsDefault: number,
    requireFingerprint: boolean,
  },
  sdkConfig: {
    minVersion?: string,
    integrityHash?: string,        // expected SDK hash
  },
  isActive: boolean,
  createdAt: Date,
  updatedAt: Date,
}
// Indexes: { orgId: 1 }, { publicKey: 1 } unique, { secretKeyHash: 1 }
```

### `licenses`
```typescript
{
  _id: ObjectId,
  orgId: ObjectId,
  projectId: ObjectId,
  key: string,                     // DLCK-XXXX-XXXX-XXXX-XXXX (unique)
  keyHash: string,                 // SHA-256 for fast lookup
  status: 'active' | 'suspended' | 'expired' | 'revoked' | 'trial',
  type: 'perpetual' | 'subscription' | 'trial' | 'floating',
  customerEmail?: string,
  customerName?: string,
  maxActivations: number,
  currentActivations: number,
  features: string[],
  metadata: Record<string, any>,   // custom fields
  expiresAt?: Date,
  suspendedAt?: Date,
  suspendedReason?: string,
  revokedAt?: Date,
  lastValidatedAt?: Date,
  lastValidatedIp?: string,
  totalValidations: number,
  createdAt: Date,
  updatedAt: Date,
}
// Indexes: { keyHash: 1 } unique, { orgId: 1, projectId: 1 },
//          { projectId: 1, status: 1 }, { status: 1, expiresAt: 1 }
```

### `activations` (device tracking)
```typescript
{
  _id: ObjectId,
  orgId: ObjectId,
  projectId: ObjectId,
  licenseId: ObjectId,
  fingerprint: string,             // device fingerprint hash
  hostname?: string,
  os?: string,
  ip: string,
  domain?: string,
  userAgent?: string,
  sdkVersion: string,
  lastSeenAt: Date,
  lastIp: string,
  isActive: boolean,
  activatedAt: Date,
  deactivatedAt?: Date,
}
// Indexes: { licenseId: 1, fingerprint: 1 } unique,
//          { licenseId: 1, isActive: 1 }, { projectId: 1 }
```

### `configs` (remote config per project)
```typescript
{
  _id: ObjectId,
  orgId: ObjectId,
  projectId: ObjectId,             // unique per project
  version: number,                 // monotonic increment
  maintenance: {
    enabled: boolean,
    message?: string,
    estimatedEnd?: Date,
    allowedIps?: string[],
  },
  killSwitch: {
    enabled: boolean,
    reason?: string,
    activatedAt?: Date,
    activatedBy?: ObjectId,
  },
  apiSuspension: {
    enabled: boolean,
    reason?: string,
    allowedEndpoints?: string[],
  },
  notifications: [{
    id: string,
    type: 'info' | 'warning' | 'error' | 'payment',
    message: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    active: boolean,
    dismissible: boolean,
    createdAt: Date,
  }],
  domainLock: {
    enabled: boolean,
    domains: string[],
    action: 'warn' | 'block' | 'kill',
  },
  customData: Record<string, any>, // arbitrary key-value
  updatedAt: Date,
}
// Indexes: { projectId: 1 } unique, { projectId: 1, version: 1 }
```

### `feature_flags`
```typescript
{
  _id: ObjectId,
  orgId: ObjectId,
  projectId: ObjectId,
  key: string,                     // "premium-export"
  name: string,                    // "Premium Export Feature"
  description?: string,
  enabled: boolean,
  rules: [{
    type: 'percentage' | 'domain' | 'license_type' | 'license_id' | 'custom',
    operator: 'eq' | 'neq' | 'in' | 'gt' | 'lt',
    value: any,
    enabled: boolean,
  }],
  createdAt: Date,
  updatedAt: Date,
}
// Indexes: { projectId: 1, key: 1 } unique
```

### `domains`
```typescript
{
  _id: ObjectId,
  orgId: ObjectId,
  projectId: ObjectId,
  domain: string,                  // "example.com"
  verified: boolean,
  verificationMethod: 'dns' | 'meta' | 'file',
  verificationToken: string,
  verifiedAt?: Date,
  lastCheckedAt?: Date,
  createdAt: Date,
}
// Indexes: { projectId: 1, domain: 1 } unique
```

### `webhooks`
```typescript
{
  _id: ObjectId,
  orgId: ObjectId,
  projectId: ObjectId,
  url: string,
  secret: string,                  // encrypted, for HMAC signing
  events: string[],                // ['license.created', 'license.suspended']
  isActive: boolean,
  failureCount: number,
  lastDeliveredAt?: Date,
  lastFailedAt?: Date,
  createdAt: Date,
  updatedAt: Date,
}
// Indexes: { projectId: 1 }
```

### `webhook_deliveries`
```typescript
{
  _id: ObjectId,
  webhookId: ObjectId,
  event: string,
  payload: object,
  status: 'pending' | 'success' | 'failed',
  httpStatus?: number,
  responseBody?: string,           // truncated
  attempts: number,
  nextRetryAt?: Date,
  deliveredAt?: Date,
  createdAt: Date,
}
// Indexes: { webhookId: 1, createdAt: -1 }, { status: 1, nextRetryAt: 1 }
// TTL: { createdAt: 1 } expireAfterSeconds: 30 days
```

### `audit_logs`
```typescript
{
  _id: ObjectId,
  orgId: ObjectId,
  actor: {
    type: 'user' | 'system' | 'sdk' | 'api_key' | 'webhook',
    id?: string,
    email?: string,
    ip?: string,
    userAgent?: string,
  },
  action: string,                  // 'license.suspended'
  resource: {
    type: string,                  // 'license'
    id: string,
    name?: string,
  },
  changes?: {
    before: Record<string, any>,
    after: Record<string, any>,
  },
  metadata?: Record<string, any>,
  timestamp: Date,
}
// Indexes: { orgId: 1, timestamp: -1 }, { orgId: 1, action: 1 },
//          { orgId: 1, 'resource.type': 1, 'resource.id': 1 }
// TTL: { timestamp: 1 } expireAfterSeconds: 365 days (configurable per plan)
```

### `telemetry_events` (Time-Series)
```typescript
{
  _id: ObjectId,
  orgId: ObjectId,
  projectId: ObjectId,
  licenseId?: ObjectId,
  sessionId: string,
  event: string,                   // 'sdk.init', 'license.validated', 'feature.checked'
  metadata: Record<string, any>,
  fingerprint?: string,
  domain?: string,
  ip?: string,
  sdkVersion: string,
  timestamp: Date,
}
// Time-series collection with: timeField: 'timestamp', metaField: 'projectId'
// Indexes: { projectId: 1, timestamp: -1 }, { projectId: 1, event: 1, timestamp: -1 }
// TTL: based on plan (7d free, 90d pro, 365d enterprise)
```

### `sessions`
```typescript
{
  _id: ObjectId,
  userId: ObjectId,
  refreshToken: string,            // hashed
  ip: string,
  userAgent: string,
  expiresAt: Date,
  createdAt: Date,
}
// Indexes: { userId: 1 }, { refreshToken: 1 }, { expiresAt: 1 } TTL
```

### `notifications`
```typescript
{
  _id: ObjectId,
  userId: ObjectId,
  orgId: ObjectId,
  type: string,                    // 'license.expired', 'payment.failed'
  title: string,
  message: string,
  data?: Record<string, any>,
  read: boolean,
  readAt?: Date,
  createdAt: Date,
}
// Indexes: { userId: 1, read: 1, createdAt: -1 }
```

---

## 6. Redis Strategy

### Key Namespace Design

```
devlock:{scope}:{identifier}:{field}

Examples:
  devlock:session:{userId}:{tokenHash}          → session data (TTL: 7d)
  devlock:license:{keyHash}                     → cached validation result (TTL: 5min)
  devlock:config:{projectId}                    → cached project config (TTL: 2min)
  devlock:config:{projectId}:version            → config version number
  devlock:ratelimit:{apiKey}:{window}           → rate limit counter (TTL: 60s)
  devlock:ratelimit:ip:{ip}:{window}            → IP rate limit (TTL: 60s)
  devlock:lock:{resource}:{id}                  → distributed lock (TTL: 30s)
  devlock:org:{orgId}:limits                    → cached org limits (TTL: 10min)
  devlock:project:{projectId}:flags             → cached feature flags (TTL: 2min)
  devlock:ws:connections:{projectId}            → active WS connection count
  devlock:cooldown:{action}:{identifier}        → action cooldown (TTL: varies)
```

### Redis Usage Patterns

| Pattern | Use Case | TTL |
|---------|----------|-----|
| Cache-aside | License validation, config fetch | 2-5 min |
| Pub/Sub | Real-time event broadcasting | N/A |
| Sorted Set | Rate limiting (sliding window) | 60s |
| SET NX | Distributed locks | 30s |
| Hash | Session storage | 7 days |
| Stream | Event sourcing (optional) | 24h |
| Counter | Usage metering | 1h buckets |

### Cache Invalidation

```typescript
// On any mutation, invalidate related caches:
async function invalidateProjectCache(projectId: string): Promise<void> {
  const pipeline = redis.pipeline();
  pipeline.del(`devlock:config:${projectId}`);
  pipeline.del(`devlock:project:${projectId}:flags`);
  // Publish invalidation event for other nodes
  pipeline.publish('cache:invalidate', JSON.stringify({ projectId }));
  await pipeline.exec();
}
```

---

## 7. JWT Architecture

### Token Types

```
┌─────────────────────────────────────────────────────────────────┐
│  Access Token (Short-lived)                                      │
│  ├── Algorithm: RS256 (asymmetric)                              │
│  ├── Expiry: 15 minutes                                        │
│  ├── Payload: { sub, orgId, role, permissions, iat, exp }       │
│  ├── Stored: Client memory only (never localStorage)            │
│  └── Rotation: On every refresh                                 │
│                                                                  │
│  Refresh Token (Long-lived)                                      │
│  ├── Format: Opaque (random 256-bit, stored hashed in DB)       │
│  ├── Expiry: 7 days (sliding)                                   │
│  ├── Stored: httpOnly secure cookie + DB session                │
│  ├── Rotation: On every use (one-time use)                      │
│  └── Revocation: Delete from sessions collection                │
│                                                                  │
│  SDK Token (License validation response)                         │
│  ├── Algorithm: Ed25519 (EdDSA)                                 │
│  ├── Expiry: Matches offline grace period                       │
│  ├── Payload: { lid, pid, status, features, exp, grc, fp }     │
│  ├── Stored: SDK local cache (encrypted)                        │
│  └── Verification: Public key embedded in SDK                   │
│                                                                  │
│  API Key (Project authentication)                                │
│  ├── Format: pk_live_<64hex> / sk_live_<64hex>                  │
│  ├── Expiry: Never (until rotated)                              │
│  ├── Stored: Hashed in DB, plaintext shown once                 │
│  └── Scope: Per-project, public vs secret                       │
└─────────────────────────────────────────────────────────────────┘
```

### Token Generation

```typescript
// core/auth/token-service.ts

import { SignJWT, jwtVerify } from 'jose';

export class TokenService {
  constructor(
    private privateKey: CryptoKey,
    private publicKey: CryptoKey,
  ) {}

  async generateAccessToken(user: AuthUser): Promise<string> {
    return new SignJWT({
      sub: user.id,
      orgId: user.orgId,
      role: user.role,
      permissions: user.permissions,
    })
      .setProtectedHeader({ alg: 'RS256', typ: 'JWT' })
      .setIssuedAt()
      .setExpirationTime('15m')
      .setIssuer('devlock')
      .setAudience('devlock-api')
      .sign(this.privateKey);
  }

  async verifyAccessToken(token: string): Promise<JWTPayload> {
    const { payload } = await jwtVerify(token, this.publicKey, {
      issuer: 'devlock',
      audience: 'devlock-api',
    });
    return payload;
  }

  generateRefreshToken(): string {
    return crypto.randomBytes(32).toString('base64url');
  }
}
```

---

## 8. Access Control (RBAC)

### Role Hierarchy

```
owner > admin > developer > viewer > billing

owner:      Full control, delete org, transfer ownership
admin:      Manage members, projects, billing
developer:  Manage own projects, licenses, configs
viewer:     Read-only access to assigned projects
billing:    Billing management only
```

### Permission Matrix

```typescript
export const Permissions = {
  // Organization
  'org:read':           ['owner', 'admin', 'developer', 'viewer', 'billing'],
  'org:update':         ['owner', 'admin'],
  'org:delete':         ['owner'],
  'org:manage_members': ['owner', 'admin'],
  'org:manage_billing': ['owner', 'admin', 'billing'],

  // Projects
  'project:create':     ['owner', 'admin', 'developer'],
  'project:read':       ['owner', 'admin', 'developer', 'viewer'],
  'project:update':     ['owner', 'admin', 'developer'],
  'project:delete':     ['owner', 'admin'],
  'project:rotate_keys':['owner', 'admin'],

  // Licenses
  'license:create':     ['owner', 'admin', 'developer'],
  'license:read':       ['owner', 'admin', 'developer', 'viewer'],
  'license:update':     ['owner', 'admin', 'developer'],
  'license:suspend':    ['owner', 'admin', 'developer'],
  'license:revoke':     ['owner', 'admin'],

  // Config & Commands
  'config:read':        ['owner', 'admin', 'developer', 'viewer'],
  'config:update':      ['owner', 'admin', 'developer'],
  'killswitch:activate':['owner', 'admin'],

  // Analytics
  'analytics:read':     ['owner', 'admin', 'developer', 'viewer'],
  'audit:read':         ['owner', 'admin'],
  'audit:export':       ['owner', 'admin'],
} as const;
```

### Authorization Middleware

```typescript
// middleware/authorize.ts

export function authorize(...requiredPermissions: Permission[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const { role, orgId } = req.auth;

    for (const permission of requiredPermissions) {
      const allowedRoles = Permissions[permission];
      if (!allowedRoles.includes(role)) {
        throw new ForbiddenError(`Missing permission: ${permission}`);
      }
    }

    next();
  };
}

// Usage:
router.post('/licenses', authorize('license:create'), licenseController.create);
router.post('/kill-switch', authorize('killswitch:activate'), configController.killSwitch);
```

---

## 9. API Validation

### Zod Schema Layer

```typescript
// modules/licenses/license.validator.ts

import { z } from 'zod';

export const CreateLicenseSchema = z.object({
  body: z.object({
    type: z.enum(['perpetual', 'subscription', 'trial', 'floating']),
    maxActivations: z.number().int().min(1).max(10000).default(1),
    expiresAt: z.string().datetime().optional(),
    features: z.array(z.string().max(100)).max(100).optional(),
    customerEmail: z.string().email().optional(),
    customerName: z.string().max(200).optional(),
    metadata: z.record(z.unknown()).optional(),
  }),
  params: z.object({
    projectId: z.string().regex(/^[a-f0-9]{24}$/),
  }),
});

export const ValidateLicenseSchema = z.object({
  body: z.object({
    licenseKey: z.string().min(1).max(100),
    fingerprint: z.string().min(1).max(512),
    domain: z.string().max(253).optional(),
    sdkVersion: z.string().min(1).max(20),
    environment: z.enum(['production', 'staging', 'development']),
    integrityHash: z.string().optional(),
  }),
  headers: z.object({
    'x-devlock-key': z.string().min(1),
    'x-devlock-timestamp': z.string().regex(/^\d+$/),
    'x-devlock-signature': z.string().min(1),
  }).passthrough(),
});
```

### Validation Middleware

```typescript
// middleware/validate.ts

import { ZodSchema } from 'zod';

export function validate(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse({
      body: req.body,
      params: req.params,
      query: req.query,
      headers: req.headers,
    });

    if (!result.success) {
      throw new ValidationError(result.error.flatten());
    }

    // Replace with parsed (coerced/defaulted) values
    req.body = result.data.body ?? req.body;
    req.params = result.data.params ?? req.params;
    req.query = result.data.query ?? req.query;
    next();
  };
}
```

---

## 10. Rate Limiting

### Sliding Window (Redis + Lua)

```typescript
// middleware/rate-limiter.ts

const RATE_LIMITS = {
  sdk: { window: 60, max: 500, keyPrefix: 'sdk' },       // 500/min per API key
  auth: { window: 60, max: 10, keyPrefix: 'auth' },      // 10/min per IP
  api: { window: 60, max: 100, keyPrefix: 'api' },       // 100/min per user
  webhook: { window: 60, max: 30, keyPrefix: 'wh' },     // 30/min per endpoint
} as const;

// Lua script for atomic sliding window
const SLIDING_WINDOW_LUA = `
  local key = KEYS[1]
  local window = tonumber(ARGV[1])
  local max = tonumber(ARGV[2])
  local now = tonumber(ARGV[3])
  local clearBefore = now - window * 1000

  redis.call('ZREMRANGEBYSCORE', key, 0, clearBefore)
  local count = redis.call('ZCARD', key)

  if count < max then
    redis.call('ZADD', key, now, now .. ':' .. math.random())
    redis.call('PEXPIRE', key, window * 1000)
    return {1, max - count - 1}
  end

  return {0, 0}
`;

export function rateLimiter(tier: keyof typeof RATE_LIMITS) {
  const config = RATE_LIMITS[tier];

  return async (req: Request, res: Response, next: NextFunction) => {
    const identifier = getIdentifier(req, config.keyPrefix);
    const key = `devlock:ratelimit:${config.keyPrefix}:${identifier}`;

    const [allowed, remaining] = await redis.eval(
      SLIDING_WINDOW_LUA, 1, key, config.window, config.max, Date.now()
    );

    res.setHeader('X-RateLimit-Limit', config.max);
    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader('X-RateLimit-Reset', Math.ceil(Date.now() / 1000) + config.window);

    if (!allowed) {
      res.setHeader('Retry-After', config.window);
      throw new RateLimitError();
    }

    next();
  };
}
```

---

## 11. Security Middleware

### Middleware Stack (Order Matters)

```typescript
// server.ts — middleware registration order

app.use(helmet());                          // Security headers
app.use(requestId());                       // X-Request-ID
app.use(correlationId());                   // Trace propagation
app.use(ipExtractor());                     // Normalize client IP
app.use(cors(corsConfig));                  // CORS policy
app.use(compression());                     // Gzip
app.use(express.json({ limit: '1mb' }));   // Body parsing with size limit
app.use(requestLogger());                   // Structured request logging
app.use(rateLimiter('api'));                // Global rate limit
app.use(timestampValidator());             // Reject stale requests (±5min)
app.use(signatureVerifier());              // HMAC signature check (SDK routes)
```

### Timestamp Validation (Anti-Replay)

```typescript
export function timestampValidator(maxDriftMs = 300_000) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const timestamp = req.headers['x-devlock-timestamp'];
    if (!timestamp) { next(); return; } // Only enforce on SDK routes

    const requestTime = parseInt(timestamp as string, 10);
    const drift = Math.abs(Date.now() - requestTime);

    if (drift > maxDriftMs) {
      throw new AppError(401, 'Request timestamp expired', 'TIMESTAMP_EXPIRED');
    }
    next();
  };
}
```

### HMAC Signature Verification

```typescript
export function signatureVerifier() {
  return async (req: Request, _res: Response, next: NextFunction) => {
    if (!req.path.startsWith('/v1/sdk')) { next(); return; }

    const signature = req.headers['x-devlock-signature'] as string;
    const timestamp = req.headers['x-devlock-timestamp'] as string;
    const apiKey = req.headers['x-devlock-key'] as string;

    if (!signature || !timestamp || !apiKey) {
      throw new AppError(401, 'Missing authentication headers', 'AUTH_MISSING');
    }

    // Look up project secret by public key
    const project = await projectRepo.findByPublicKey(apiKey);
    if (!project) throw new AppError(401, 'Invalid API key', 'INVALID_KEY');

    // Verify HMAC: sign(timestamp + body)
    const payload = timestamp + JSON.stringify(req.body);
    const expectedSig = createHmac('sha256', project.secretKey)
      .update(payload)
      .digest('hex');

    if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) {
      throw new AppError(401, 'Invalid signature', 'INVALID_SIGNATURE');
    }

    req.project = project;
    next();
  };
}
```

---

## 12. SDK Validation Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    SDK LICENSE VALIDATION FLOW                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  SDK Request: POST /v1/sdk/validate                                      │
│  Headers: X-DevLock-Key, X-DevLock-Signature, X-DevLock-Timestamp       │
│  Body: { licenseKey, fingerprint, domain, sdkVersion, environment }     │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │ Step 1: SIGNATURE VERIFICATION                                    │   │
│  │ • Verify HMAC(timestamp + body, secretKey)                       │   │
│  │ • Reject if timestamp drift > 5 minutes                         │   │
│  │ • Reject if signature mismatch                                   │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                              ↓                                           │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │ Step 2: RATE LIMIT CHECK                                          │   │
│  │ • Check Redis: devlock:ratelimit:sdk:{apiKey}                    │   │
│  │ • 500 req/min per API key                                        │   │
│  │ • Return 429 if exceeded                                         │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                              ↓                                           │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │ Step 3: CACHE LOOKUP                                              │   │
│  │ • Check Redis: devlock:license:{keyHash}                         │   │
│  │ • If HIT and not stale → return cached result                    │   │
│  │ • If MISS → proceed to DB                                        │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                              ↓                                           │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │ Step 4: DATABASE VALIDATION                                       │   │
│  │ • Find license by keyHash                                        │   │
│  │ • Check: status === 'active'                                     │   │
│  │ • Check: not expired (expiresAt > now)                           │   │
│  │ • Check: activation count < maxActivations                       │   │
│  │ • Check: fingerprint registered or register new                  │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                              ↓                                           │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │ Step 5: DOMAIN VERIFICATION                                       │   │
│  │ • If domainLock enabled on project                               │   │
│  │ • Check: request domain ∈ allowedDomains                         │   │
│  │ • Action on violation: warn / block / kill                       │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                              ↓                                           │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │ Step 6: SDK INTEGRITY CHECK                                       │   │
│  │ • If integrityHash provided in request                           │   │
│  │ • Compare against project.sdkConfig.integrityHash                │   │
│  │ • If mismatch → flag tamper event                                │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                              ↓                                           │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │ Step 7: FETCH CONFIG + FLAGS                                      │   │
│  │ • Load project config (maintenance, killSwitch, notifications)   │   │
│  │ • Evaluate feature flags for this license                        │   │
│  │ • Build response payload                                         │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                              ↓                                           │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │ Step 8: SIGN & RESPOND                                            │   │
│  │ • Generate offline token (Ed25519 signed)                        │   │
│  │ • Cache result in Redis (TTL: 5min)                              │   │
│  │ • Update lastValidatedAt on license                              │   │
│  │ • Emit telemetry event (async)                                   │   │
│  │ • Return signed response                                         │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  Response:                                                               │
│  {                                                                       │
│    valid: true,                                                          │
│    license: { status, features, expiresAt },                            │
│    config: { maintenance, killSwitch, notifications, flags },           │
│    offlineToken: "<Ed25519 signed token>",                              │
│    serverTime: 1700000000000,                                           │
│    signature: "<response signature>"                                    │
│  }                                                                       │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 13. Signed Token System

### Offline License Token (Ed25519)

```typescript
// core/tokens/license-token.ts

import { sign, verify, createPrivateKey, createPublicKey } from 'crypto';

interface OfflineTokenPayload {
  lid: string;    // license ID
  pid: string;    // project ID
  oid: string;    // org ID
  sts: string;    // status
  fts: string[];  // features
  exp: number;    // license expiry (unix)
  grc: number;    // offline grace hours
  iat: number;    // issued at
  nxt: number;    // next required online check-in
  fp: string;     // fingerprint hash
  dom: string[];  // allowed domains
  ver: number;    // config version
}

export class LicenseTokenService {
  private privateKey: KeyObject;
  private publicKey: KeyObject;

  constructor(privateKeyPem: string, publicKeyPem: string) {
    this.privateKey = createPrivateKey(privateKeyPem);
    this.publicKey = createPublicKey(publicKeyPem);
  }

  sign(payload: OfflineTokenPayload): string {
    const data = JSON.stringify(payload);
    const signature = sign(null, Buffer.from(data), this.privateKey);
    return Buffer.from(JSON.stringify({
      p: data,
      s: signature.toString('base64'),
    })).toString('base64url');
  }

  verify(token: string): OfflineTokenPayload | null {
    try {
      const { p, s } = JSON.parse(Buffer.from(token, 'base64url').toString());
      const isValid = verify(null, Buffer.from(p), this.publicKey, Buffer.from(s, 'base64'));
      if (!isValid) return null;
      return JSON.parse(p);
    } catch {
      return null;
    }
  }
}
```

---

## 14. Encryption Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    ENCRYPTION LAYERS                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  At Rest:                                                        │
│  ├── Database fields: AES-256-GCM (secretKey, mfa.secret)       │
│  ├── Encryption key: External KMS or env variable               │
│  ├── Key rotation: Envelope encryption (DEK + KEK)              │
│  └── Backup encryption: AES-256-CBC                             │
│                                                                  │
│  In Transit:                                                     │
│  ├── TLS 1.3 (all connections)                                  │
│  ├── Certificate pinning (SDK → API)                            │
│  └── mTLS (inter-service, production)                           │
│                                                                  │
│  Passwords:                                                      │
│  ├── Algorithm: scrypt (N=16384, r=8, p=1)                      │
│  ├── Salt: 32 bytes random per password                         │
│  └── Output: 64 bytes                                           │
│                                                                  │
│  API Keys:                                                       │
│  ├── Generation: crypto.randomBytes(32).toString('hex')         │
│  ├── Storage: SHA-256 hash in DB                                │
│  └── Display: Shown once at creation, never again               │
│                                                                  │
│  License Keys:                                                   │
│  ├── Format: DLCK-XXXX-XXXX-XXXX-XXXX                          │
│  ├── Charset: A-Z, 2-9 (no ambiguous chars)                    │
│  ├── Storage: SHA-256 hash for lookup                           │
│  └── Signing: Ed25519 for offline tokens                        │
│                                                                  │
│  Webhook Secrets:                                                │
│  ├── Generation: crypto.randomBytes(32).toString('hex')         │
│  ├── Storage: AES-256-GCM encrypted in DB                      │
│  └── Usage: HMAC-SHA256 signature on payload                    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 15. Webhook System

### Outbound Webhook Architecture

```typescript
// modules/webhooks/webhook-dispatcher.ts

export class WebhookDispatcher {
  async dispatch(webhook: Webhook, event: string, payload: object): Promise<void> {
    const body = JSON.stringify({
      id: crypto.randomUUID(),
      event,
      data: payload,
      timestamp: new Date().toISOString(),
      projectId: webhook.projectId,
    });

    // Sign payload with webhook secret
    const signature = createHmac('sha256', webhook.secret)
      .update(body)
      .digest('hex');

    await this.queue.add('webhook:deliver', {
      webhookId: webhook.id,
      url: webhook.url,
      body,
      headers: {
        'Content-Type': 'application/json',
        'X-DevLock-Signature': `sha256=${signature}`,
        'X-DevLock-Event': event,
        'X-DevLock-Delivery': crypto.randomUUID(),
        'X-DevLock-Timestamp': Date.now().toString(),
        'User-Agent': 'DevLock-Webhook/1.0',
      },
    }, {
      attempts: 8,
      backoff: { type: 'exponential', delay: 10_000 }, // 10s, 40s, 160s...
      removeOnComplete: 1000,
    });
  }
}
```

### Webhook Verification (Consumer Side)

```typescript
// Example: How consumers verify DevLock webhooks
function verifyWebhook(body: string, signature: string, secret: string): boolean {
  const expected = `sha256=${createHmac('sha256', secret).update(body).digest('hex')}`;
  return timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}
```

---

## 16. Retry System

### Exponential Backoff with Jitter

```typescript
// infrastructure/retry/retry.ts

interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;      // ms
  maxDelay: number;       // ms
  factor: number;         // multiplier
  jitter: boolean;
  retryableErrors?: string[];
}

const RETRY_CONFIGS: Record<string, RetryConfig> = {
  webhook: { maxAttempts: 8, baseDelay: 10_000, maxDelay: 86_400_000, factor: 4, jitter: true },
  email: { maxAttempts: 5, baseDelay: 2_000, maxDelay: 300_000, factor: 4, jitter: true },
  stripe: { maxAttempts: 3, baseDelay: 1_000, maxDelay: 30_000, factor: 2, jitter: true },
  database: { maxAttempts: 3, baseDelay: 100, maxDelay: 5_000, factor: 2, jitter: true },
};

export function calculateDelay(attempt: number, config: RetryConfig): number {
  const delay = Math.min(config.baseDelay * Math.pow(config.factor, attempt), config.maxDelay);
  if (!config.jitter) return delay;
  // Full jitter: random between 0 and calculated delay
  return Math.random() * delay;
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  config: RetryConfig,
): Promise<T> {
  let lastError: Error;

  for (let attempt = 0; attempt < config.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err as Error;
      if (attempt === config.maxAttempts - 1) break;
      if (config.retryableErrors && !config.retryableErrors.includes(err.code)) break;
      await sleep(calculateDelay(attempt, config));
    }
  }

  throw lastError!;
}
```

---

## 17. Logging System

### Structured Logging (pino)

```typescript
// infrastructure/logger/logger.ts

import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  timestamp: pino.stdTimeFunctions.isoTime,
  formatters: {
    level: (label) => ({ level: label }),
    bindings: (bindings) => ({
      service: process.env.SERVICE_NAME,
      version: process.env.APP_VERSION,
      env: process.env.NODE_ENV,
      pid: bindings.pid,
      host: bindings.hostname,
    }),
  },
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers["x-devlock-secret"]',
      'req.headers["x-devlock-signature"]',
      'body.password',
      'body.secretKey',
      'body.licenseKey',
      '*.passwordHash',
      '*.secret',
      '*.token',
    ],
    censor: '[REDACTED]',
  },
  serializers: {
    req: pino.stdSerializers.req,
    res: pino.stdSerializers.res,
    err: pino.stdSerializers.err,
  },
});

// Child logger with request context
export function createRequestLogger(req: Request): pino.Logger {
  return logger.child({
    requestId: req.headers['x-request-id'],
    traceId: req.headers['x-trace-id'],
    userId: req.auth?.sub,
    orgId: req.auth?.orgId,
    ip: req.ip,
    method: req.method,
    path: req.path,
  });
}
```

### Log Levels by Environment

| Level | Development | Staging | Production |
|-------|-------------|---------|------------|
| trace | ✓ | ✗ | ✗ |
| debug | ✓ | ✓ | ✗ |
| info | ✓ | ✓ | ✓ |
| warn | ✓ | ✓ | ✓ |
| error | ✓ | ✓ | ✓ |
| fatal | ✓ | ✓ | ✓ |

---

## 18. Error Handling Architecture

### Error Hierarchy

```typescript
// core/errors/index.ts

export abstract class BaseError extends Error {
  abstract statusCode: number;
  abstract code: string;
  isOperational = true;

  constructor(message: string, public details?: unknown) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      error: {
        code: this.code,
        message: this.message,
        ...(process.env.NODE_ENV !== 'production' && { details: this.details }),
      },
    };
  }
}

export class ValidationError extends BaseError {
  statusCode = 400;
  code = 'VALIDATION_ERROR';
}

export class AuthenticationError extends BaseError {
  statusCode = 401;
  code = 'AUTHENTICATION_ERROR';
}

export class ForbiddenError extends BaseError {
  statusCode = 403;
  code = 'FORBIDDEN';
}

export class NotFoundError extends BaseError {
  statusCode = 404;
  code = 'NOT_FOUND';
}

export class ConflictError extends BaseError {
  statusCode = 409;
  code = 'CONFLICT';
}

export class RateLimitError extends BaseError {
  statusCode = 429;
  code = 'RATE_LIMIT_EXCEEDED';
  constructor() { super('Too many requests'); }
}

export class InternalError extends BaseError {
  statusCode = 500;
  code = 'INTERNAL_ERROR';
  isOperational = false;
}
```

### Global Error Handler

```typescript
// middleware/error-handler.ts

export function globalErrorHandler(err: Error, req: Request, res: Response, _next: NextFunction) {
  const logger = createRequestLogger(req);

  if (err instanceof BaseError) {
    if (!err.isOperational) {
      logger.fatal({ err }, 'Non-operational error');
      // Alert on-call, trigger graceful shutdown
    } else {
      logger.warn({ err, statusCode: err.statusCode }, err.message);
    }

    res.status(err.statusCode).json(err.toJSON());
    return;
  }

  // Unexpected errors
  logger.fatal({ err }, 'Unhandled error');
  res.status(500).json({
    error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
  });
}
```

---

## 19. Production Folder Structure

```
apps/api-gateway/
├── src/
│   ├── index.ts                    → Entry point, bootstrap
│   ├── server.ts                   → Express app factory
│   │
│   ├── core/                       → Domain-agnostic infrastructure
│   │   ├── errors/                 → Error classes
│   │   │   └── index.ts
│   │   ├── events/                 → Event bus, domain events
│   │   │   ├── event-bus.ts
│   │   │   └── domain-events.ts
│   │   ├── auth/                   → Token service, strategies
│   │   │   ├── token-service.ts
│   │   │   └── strategies/
│   │   └── container.ts            → DI container setup
│   │
│   ├── infrastructure/             → External concerns
│   │   ├── database/
│   │   │   ├── mongo.ts            → Connection manager
│   │   │   └── redis.ts            → Redis client factory
│   │   ├── queues/
│   │   │   ├── queue-manager.ts
│   │   │   └── processors/         → Job processors
│   │   ├── cache/
│   │   │   └── cache-service.ts
│   │   └── external/
│   │       ├── stripe.ts
│   │       └── email.ts
│   │
│   ├── middleware/                  → Express middleware
│   │   ├── authenticate.ts
│   │   ├── authorize.ts
│   │   ├── validate.ts
│   │   ├── rate-limiter.ts
│   │   ├── request-id.ts
│   │   ├── error-handler.ts
│   │   ├── request-logger.ts
│   │   ├── signature-verifier.ts
│   │   └── cors.ts
│   │
│   ├── modules/                    → Feature modules (domain logic)
│   │   ├── auth/
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.repository.ts
│   │   │   ├── auth.validator.ts
│   │   │   ├── auth.routes.ts
│   │   │   └── auth.types.ts
│   │   │
│   │   ├── organizations/
│   │   │   ├── org.controller.ts
│   │   │   ├── org.service.ts
│   │   │   ├── org.repository.ts
│   │   │   ├── org.validator.ts
│   │   │   ├── org.routes.ts
│   │   │   └── org.types.ts
│   │   │
│   │   ├── projects/
│   │   │   ├── project.controller.ts
│   │   │   ├── project.service.ts
│   │   │   ├── project.repository.ts
│   │   │   ├── project.validator.ts
│   │   │   ├── project.routes.ts
│   │   │   └── project.types.ts
│   │   │
│   │   ├── licenses/
│   │   │   ├── license.controller.ts
│   │   │   ├── license.service.ts
│   │   │   ├── license.repository.ts
│   │   │   ├── license.validator.ts
│   │   │   ├── license.routes.ts
│   │   │   └── license.types.ts
│   │   │
│   │   ├── sdk/                    → SDK-facing endpoints
│   │   │   ├── sdk.controller.ts
│   │   │   ├── sdk.service.ts
│   │   │   ├── sdk.validator.ts
│   │   │   └── sdk.routes.ts
│   │   │
│   │   ├── config/                 → Remote config & commands
│   │   ├── feature-flags/
│   │   ├── domains/
│   │   ├── webhooks/
│   │   ├── telemetry/
│   │   ├── analytics/
│   │   ├── notifications/
│   │   ├── billing/
│   │   └── audit/
│   │
│   ├── shared/                     → Shared utilities
│   │   ├── utils/
│   │   │   ├── pagination.ts
│   │   │   ├── slug.ts
│   │   │   └── date.ts
│   │   └── constants.ts
│   │
│   └── routes.ts                   → Route aggregator
│
├── tests/
│   ├── unit/
│   ├── integration/
│   └── fixtures/
│
├── Dockerfile
├── package.json
├── tsconfig.build.json
└── .eslintrc.js
```

---

## 20. Clean Architecture & Dependency Injection

### Layer Separation

```
┌─────────────────────────────────────────────────────────────────┐
│  Routes (Express)     → HTTP concern only                        │
│       ↓                                                          │
│  Controllers          → Parse request, call service, format response │
│       ↓                                                          │
│  Services             → Business logic, orchestration            │
│       ↓                                                          │
│  Repositories         → Data access abstraction                  │
│       ↓                                                          │
│  Models (Mongoose)    → Database schema & queries                │
└─────────────────────────────────────────────────────────────────┘
```

### Dependency Injection Container

```typescript
// core/container.ts

import { asClass, asFunction, createContainer, InjectionMode } from 'awilix';

export function createAppContainer() {
  const container = createContainer({ injectionMode: InjectionMode.CLASSIC });

  container.register({
    // Infrastructure
    logger: asFunction(createLogger).singleton(),
    mongoConnection: asFunction(connectMongo).singleton(),
    redisClient: asFunction(createRedisClient).singleton(),
    eventBus: asClass(EventBus).singleton(),
    queueManager: asClass(QueueManager).singleton(),
    cacheService: asClass(CacheService).singleton(),

    // Repositories
    userRepository: asClass(UserRepository).scoped(),
    orgRepository: asClass(OrgRepository).scoped(),
    projectRepository: asClass(ProjectRepository).scoped(),
    licenseRepository: asClass(LicenseRepository).scoped(),
    configRepository: asClass(ConfigRepository).scoped(),
    auditRepository: asClass(AuditRepository).scoped(),

    // Services
    authService: asClass(AuthService).scoped(),
    orgService: asClass(OrgService).scoped(),
    projectService: asClass(ProjectService).scoped(),
    licenseService: asClass(LicenseService).scoped(),
    configService: asClass(ConfigService).scoped(),
    sdkService: asClass(SDKService).scoped(),
    webhookService: asClass(WebhookService).scoped(),
    billingService: asClass(BillingService).scoped(),
    notificationService: asClass(NotificationService).scoped(),
    telemetryService: asClass(TelemetryService).scoped(),

    // Token services
    tokenService: asClass(TokenService).singleton(),
    licenseTokenService: asClass(LicenseTokenService).singleton(),
  });

  return container;
}
```

### Service Example (Clean Architecture)

```typescript
// modules/licenses/license.service.ts

export class LicenseService {
  constructor(
    private licenseRepo: LicenseRepository,
    private projectRepo: ProjectRepository,
    private eventBus: EventBus,
    private cacheService: CacheService,
    private encryptionService: EncryptionService,
    private auditRepo: AuditRepository,
  ) {}

  async create(orgId: string, projectId: string, input: CreateLicenseInput, actor: Actor): Promise<License> {
    // Verify project belongs to org
    const project = await this.projectRepo.findByIdAndOrg(projectId, orgId);
    if (!project) throw new NotFoundError('Project not found');

    // Check org limits
    const count = await this.licenseRepo.countByProject(projectId);
    if (count >= project.org.limits.maxLicenses) {
      throw new ForbiddenError('License limit reached for your plan');
    }

    // Generate license key
    const key = generateLicenseKey();
    const keyHash = sha256(key);

    // Create license
    const license = await this.licenseRepo.create({
      orgId,
      projectId,
      key: this.encryptionService.encrypt(key), // encrypt for storage
      keyHash,
      status: input.type === 'trial' ? 'trial' : 'active',
      type: input.type,
      maxActivations: input.maxActivations,
      features: input.features ?? [],
      metadata: input.metadata ?? {},
      expiresAt: input.expiresAt ? new Date(input.expiresAt) : undefined,
    });

    // Emit event
    await this.eventBus.emit('license.created', {
      orgId, projectId, licenseId: license.id, type: input.type,
    });

    // Audit log
    await this.auditRepo.log({
      orgId, actor, action: 'license.created',
      resource: { type: 'license', id: license.id },
      changes: { after: { type: input.type, maxActivations: input.maxActivations } },
    });

    return { ...license, key }; // Return plaintext key only on creation
  }

  async suspend(orgId: string, licenseId: string, reason: string, actor: Actor): Promise<License> {
    const license = await this.licenseRepo.findByIdAndOrg(licenseId, orgId);
    if (!license) throw new NotFoundError('License not found');
    if (license.status === 'revoked') throw new ConflictError('Cannot suspend a revoked license');

    const updated = await this.licenseRepo.update(licenseId, {
      status: 'suspended',
      suspendedAt: new Date(),
      suspendedReason: reason,
    });

    // Invalidate cache
    await this.cacheService.del(`license:${license.keyHash}`);

    // Emit event (triggers WebSocket push to SDK)
    await this.eventBus.emit('license.suspended', {
      orgId, projectId: license.projectId, licenseId, reason,
    });

    await this.auditRepo.log({
      orgId, actor, action: 'license.suspended',
      resource: { type: 'license', id: licenseId },
      changes: { before: { status: license.status }, after: { status: 'suspended', reason } },
    });

    return updated;
  }
}
```

---

## 21. Docker Setup

### Multi-Stage Dockerfile (per service)

```dockerfile
# Base
FROM node:20-alpine AS base
RUN corepack enable pnpm
WORKDIR /app

# Dependencies
FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/api-gateway/package.json ./apps/api-gateway/
COPY packages/shared-types/package.json ./packages/shared-types/
COPY packages/logger/package.json ./packages/logger/
COPY packages/config/package.json ./packages/config/
COPY packages/database/package.json ./packages/database/
COPY packages/encryption/package.json ./packages/encryption/
RUN pnpm install --frozen-lockfile --filter @devlock/api-gateway...

# Build
FROM base AS builder
COPY --from=deps /app ./
COPY packages/ ./packages/
COPY apps/api-gateway/ ./apps/api-gateway/
RUN pnpm --filter @devlock/api-gateway... build
RUN pnpm --filter @devlock/api-gateway deploy --prod /app/deployed

# Production
FROM node:20-alpine AS runner
RUN addgroup -g 1001 -S devlock && adduser -S devlock -u 1001
WORKDIR /app

COPY --from=builder --chown=devlock:devlock /app/deployed ./

USER devlock
ENV NODE_ENV=production
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s \
  CMD wget -qO- http://localhost:3000/health || exit 1

CMD ["node", "dist/index.js"]
```

### Docker Compose (Full Stack)

```yaml
version: '3.9'

services:
  mongodb:
    image: mongo:7
    ports: ['27017:27017']
    volumes: ['mongo_data:/data/db']
    command: ['--replSet', 'rs0']
    healthcheck:
      test: mongosh --eval "rs.status().ok || rs.initiate().ok"
      interval: 10s

  redis:
    image: redis:7-alpine
    ports: ['6379:6379']
    command: redis-server --appendonly yes --maxmemory 512mb --maxmemory-policy allkeys-lru
    healthcheck:
      test: redis-cli ping
      interval: 5s

  api-gateway:
    build: { context: .., dockerfile: apps/api-gateway/Dockerfile }
    ports: ['3000:3000']
    env_file: ../.env
    depends_on: { mongodb: { condition: service_healthy }, redis: { condition: service_healthy } }
    deploy:
      replicas: 2
      resources:
        limits: { memory: 512M, cpus: '0.5' }

  websocket-service:
    build: { context: .., dockerfile: apps/websocket-service/Dockerfile }
    ports: ['3010:3010']
    env_file: ../.env
    depends_on: { redis: { condition: service_healthy } }

volumes:
  mongo_data:
```

---

## 22. Kubernetes Deployment

```yaml
# k8s/api-gateway/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: devlock-api-gateway
  labels:
    app: devlock
    service: api-gateway
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      service: api-gateway
  template:
    metadata:
      labels:
        app: devlock
        service: api-gateway
    spec:
      containers:
        - name: api-gateway
          image: devlock/api-gateway:latest
          ports:
            - containerPort: 3000
          env:
            - name: NODE_ENV
              value: production
            - name: PORT
              value: "3000"
          envFrom:
            - secretRef:
                name: devlock-secrets
            - configMapRef:
                name: devlock-config
          resources:
            requests:
              memory: 256Mi
              cpu: 250m
            limits:
              memory: 512Mi
              cpu: 500m
          readinessProbe:
            httpGet:
              path: /health
              port: 3000
            initialDelaySeconds: 5
            periodSeconds: 10
          livenessProbe:
            httpGet:
              path: /health
              port: 3000
            initialDelaySeconds: 15
            periodSeconds: 20
          lifecycle:
            preStop:
              exec:
                command: ["/bin/sh", "-c", "sleep 10"]
      terminationGracePeriodSeconds: 30
---
apiVersion: v1
kind: Service
metadata:
  name: devlock-api-gateway
spec:
  selector:
    service: api-gateway
  ports:
    - port: 80
      targetPort: 3000
  type: ClusterIP
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: devlock-api-gateway-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: devlock-api-gateway
  minReplicas: 2
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 80
```

---

## 23. Horizontal Scaling

### Scaling Strategy per Service

| Service | Scaling Trigger | Stateless | Notes |
|---------|----------------|-----------|-------|
| API Gateway | CPU > 70%, RPS > 5K | ✓ | Scale freely |
| Auth Service | CPU > 70% | ✓ | Scale freely |
| License Service | RPS > 3K | ✓ | Redis cache critical |
| WebSocket Service | Connections > 40K | ✗ | Redis adapter for cross-node |
| Telemetry Service | Queue depth > 1K | ✓ | Scale workers independently |
| Notification Service | Queue depth > 500 | ✓ | Rate limit external APIs |
| Billing Service | Low traffic | ✓ | Single replica usually fine |

### Stateless Design Principles

1. **No in-memory state** — all state in MongoDB/Redis
2. **No sticky sessions** — JWT is self-contained
3. **No local file storage** — use object storage (S3/Minio)
4. **Idempotent operations** — safe to retry on any node
5. **Distributed locks** — Redis SET NX for critical sections

### WebSocket Scaling (Socket.IO + Redis Adapter)

```typescript
import { createAdapter } from '@socket.io/redis-adapter';

// Each WebSocket node subscribes to Redis Pub/Sub
// Messages published on any node reach all connected clients
io.adapter(createAdapter(pubClient, subClient));

// Room-based broadcasting works across nodes:
io.to(`project:${projectId}`).emit('license:suspended', data);
```

---

## 24. Production Express.js Setup

```typescript
// server.ts — Production-ready Express application factory

import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import { createServer } from 'http';

export function createApp(container: Container): express.Application {
  const app = express();

  // ── Trust proxy (behind load balancer) ─────────────────────────────
  app.set('trust proxy', 1);
  app.disable('x-powered-by');

  // ── Security headers ───────────────────────────────────────────────
  app.use(helmet({
    contentSecurityPolicy: false, // API doesn't serve HTML
    crossOriginEmbedderPolicy: false,
  }));

  // ── CORS ───────────────────────────────────────────────────────────
  app.use(cors({
    origin: process.env.CORS_ORIGINS?.split(',') ?? false,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID',
                     'X-DevLock-Key', 'X-DevLock-Signature', 'X-DevLock-Timestamp'],
    exposedHeaders: ['X-Request-ID', 'X-RateLimit-Limit',
                     'X-RateLimit-Remaining', 'X-RateLimit-Reset'],
    maxAge: 86400,
  }));

  // ── Body parsing ──────────────────────────────────────────────────
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: false, limit: '1mb' }));

  // ── Compression ───────────────────────────────────────────────────
  app.use(compression({ threshold: 1024 }));

  // ── Request context ───────────────────────────────────────────────
  app.use(requestId());
  app.use(requestLogger());

  // ── Health checks (no auth, no rate limit) ────────────────────────
  app.get('/health', (_req, res) => {
    res.json({
      status: 'ok',
      version: process.env.APP_VERSION ?? '0.0.0',
      uptime: process.uptime(),
      timestamp: Date.now(),
    });
  });

  app.get('/health/ready', async (_req, res) => {
    const checks = await runHealthChecks(container);
    const allHealthy = Object.values(checks).every((c) => c.status === 'ok');
    res.status(allHealthy ? 200 : 503).json({ status: allHealthy ? 'ready' : 'degraded', checks });
  });

  // ── Rate limiting ─────────────────────────────────────────────────
  app.use('/v1/sdk', rateLimiter('sdk'));
  app.use('/v1/auth', rateLimiter('auth'));
  app.use('/v1', rateLimiter('api'));

  // ── API routes ────────────────────────────────────────────────────
  app.use('/v1', createRoutes(container));

  // ── 404 handler ───────────────────────────────────────────────────
  app.use((_req, _res, next) => {
    next(new NotFoundError('Endpoint not found'));
  });

  // ── Global error handler ──────────────────────────────────────────
  app.use(globalErrorHandler);

  return app;
}

// ── Graceful Shutdown ─────────────────────────────────────────────────

export function startServer(app: express.Application, container: Container): void {
  const PORT = Number(process.env.PORT ?? 3000);
  const server = createServer(app);

  server.listen(PORT, () => {
    logger.info({ port: PORT }, 'Server started');
  });

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    logger.info({ signal }, 'Shutdown signal received');

    // Stop accepting new connections
    server.close();

    // Wait for in-flight requests (30s max)
    await new Promise((resolve) => setTimeout(resolve, 10_000));

    // Close infrastructure
    await container.resolve('queueManager').shutdown();
    await container.resolve('redisClient').quit();
    await container.resolve('mongoConnection').disconnect();

    logger.info('Shutdown complete');
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  // Unhandled errors
  process.on('unhandledRejection', (reason) => {
    logger.fatal({ reason }, 'Unhandled rejection');
    shutdown('unhandledRejection');
  });

  process.on('uncaughtException', (err) => {
    logger.fatal({ err }, 'Uncaught exception');
    shutdown('uncaughtException');
  });
}
```

---

## Summary

This architecture provides:

- **Sub-100ms SDK validation** via Redis caching + optimized queries
- **Real-time propagation** from admin action to SDK in < 200ms
- **Offline resilience** through Ed25519 signed tokens
- **Horizontal scalability** at every layer (stateless services + Redis adapter)
- **Enterprise security** with HMAC signing, rate limiting, RBAC, audit logging
- **Reliable async processing** via BullMQ with exponential retry
- **Clean separation** of concerns through DI and modular architecture
- **Production observability** with structured logging, health checks, metrics

---

*Document Version: 2.0.0*
*Last Updated: 2026-05-24*
