# DevLock — Security Architecture Blueprint

> Enterprise-grade security design for a software licensing and remote management platform.

---

## Table of Contents

1. [Threat Modeling](#1-threat-modeling)
2. [SDK Tamper Protection](#2-sdk-tamper-protection)
3. [Anti-Bypass Strategy](#3-anti-bypass-strategy)
4. [Secure Token Signing](#4-secure-token-signing)
5. [Replay Attack Prevention](#5-replay-attack-prevention)
6. [MITM Protection](#6-mitm-protection)
7. [Certificate Pinning](#7-certificate-pinning)
8. [Secure WebSocket Architecture](#8-secure-websocket-architecture)
9. [Encryption Best Practices](#9-encryption-best-practices)
10. [Environment Variable Security](#10-environment-variable-security)
11. [RBAC Security](#11-rbac-security)
12. [API Gateway Protection](#12-api-gateway-protection)
13. [Rate Limiting](#13-rate-limiting)
14. [WAF Recommendations](#14-waf-recommendations)
15. [DDoS Mitigation](#15-ddos-mitigation)
16. [Secure Logging](#16-secure-logging)
17. [Audit Trails](#17-audit-trails)
18. [License Abuse Prevention](#18-license-abuse-prevention)
19. [Device Fingerprinting](#19-device-fingerprinting)
20. [Malware False-Positive Prevention](#20-malware-false-positive-prevention)
21. [Legal-Safe Enforcement](#21-legal-safe-enforcement)
22. [Secure Remote Commands](#22-secure-remote-commands)
23. [Supply-Chain Security](#23-supply-chain-security)
24. [npm Package Protection](#24-npm-package-protection)
25. [CI/CD Security](#25-cicd-security)
26. [Kubernetes Security](#26-kubernetes-security)
27. [Secret Rotation](#27-secret-rotation)
28. [SOC 2 Readiness](#28-soc-2-readiness)

---

## 1. Threat Modeling

### STRIDE Analysis for DevLock

| Threat | Category | Attack Vector | Impact | Mitigation |
|--------|----------|---------------|--------|------------|
| License key theft | Spoofing | Extract key from client source/network | Unauthorized use | Domain locking + device fingerprinting + activation limits |
| SDK bypass | Tampering | Modify SDK to always return valid | Complete bypass | Integrity hashing + server-side enforcement + obfuscation |
| Fake validation response | Tampering | MITM injects `{valid: true}` | Bypass licensing | Ed25519 signed responses + certificate pinning |
| Replay valid response | Repudiation | Capture and replay old valid response | Extend expired license | Timestamp + nonce in signed tokens + short TTL |
| License sharing | Info Disclosure | Share key across unauthorized domains | Revenue loss | Domain lock + fingerprint + concurrent activation limits |
| API key extraction | Info Disclosure | Decompile app to find secret key | Full API access | Public/secret key split + never embed secrets in frontend |
| Kill-switch bypass | Denial of Service | Block WebSocket + use cached state | Ignore admin commands | Grace period expiry + server-side enforcement on next call |
| DDoS on validation endpoint | Denial of Service | Flood /sdk/validate | Service unavailable | Rate limiting + CDN + edge caching + circuit breaker |
| Tenant data leakage | Elevation | Query manipulation to access other tenant | Data breach | Query-level tenant scoping + middleware enforcement |
| Admin account takeover | Elevation | Credential stuffing / phishing | Full platform control | MFA + IP allowlisting + session binding + anomaly detection |

### Trust Boundaries

```
┌─────────────────────────────────────────────────────────────────┐
│  UNTRUSTED ZONE                                                  │
│  • Client browser (SDK runs here — fully hostile environment)    │
│  • Client server (backend SDK — partially trusted)               │
│  • Network (assume compromised — MITM possible)                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────▼─────────┐
                    │  TRUST BOUNDARY    │
                    │  (TLS + HMAC +     │
                    │   Rate Limiting)   │
                    └─────────┬─────────┘
                              │
┌─────────────────────────────▼───────────────────────────────────┐
│  TRUSTED ZONE                                                    │
│  • DevLock API servers (our infrastructure)                      │
│  • Database (encrypted at rest)                                  │
│  • Redis (internal network only)                                 │
│  • Admin dashboard (authenticated + RBAC)                        │
└─────────────────────────────────────────────────────────────────┘
```

### Security Principles

1. **Never trust the client** — all enforcement decisions are server-authoritative
2. **Defense in depth** — multiple layers, no single point of failure
3. **Least privilege** — minimum permissions at every level
4. **Fail secure** — on error, deny access (not grant)
5. **Assume breach** — design for detection and containment

---

## 2. SDK Tamper Protection

### Frontend SDK (Hostile Environment)

```
Strategy: Make bypassing EXPENSIVE, not impossible.
Frontend code can always be modified — the goal is:
  1. Raise the skill bar required to bypass
  2. Detect tampering and report it
  3. Ensure server-side enforcement makes bypass pointless
```

**Integrity Self-Check:**
```typescript
// SDK computes its own hash at build time (embedded as constant)
const SDK_INTEGRITY_HASH = '__BUILD_HASH__'; // Replaced by build tool

function verifySelfIntegrity(): boolean {
  // Compare runtime hash against build-time hash
  const currentHash = computeModuleHash();
  return currentHash === SDK_INTEGRITY_HASH;
}
```

**Anti-Debugging Measures (Configurable):**
- Timing checks (debugger pauses cause measurable delays)
- Console method override detection
- Stack trace analysis for injected frames
- `Object.freeze()` on critical SDK internals

**Code Obfuscation (Build-Time):**
- Variable/function name mangling (terser)
- Control flow flattening (optional, impacts performance)
- String encryption for API URLs and constants
- Dead code injection to confuse static analysis

**Runtime Protection:**
```typescript
// Freeze the SDK instance to prevent monkey-patching
Object.freeze(devlockInstance);
Object.freeze(devlockInstance.constructor.prototype);

// Detect prototype pollution
const originalFetch = window.fetch;
setInterval(() => {
  if (window.fetch !== originalFetch) {
    reportTamper('fetch_override');
  }
}, 5000);
```

### Backend SDK (Partially Trusted)

- HMAC-signed requests prevent request forgery
- Server validates SDK version (reject outdated/known-vulnerable versions)
- License validation responses are Ed25519 signed (can't be faked locally)
- Offline tokens have cryptographic expiry (can't extend grace period)

---

## 3. Anti-Bypass Strategy

### Layered Enforcement Model

```
Layer 1: SDK Enforcement (Client-Side)
  ├── Immediate UX response (show/hide features)
  ├── Can be bypassed by determined attacker
  └── Purpose: UX, not security

Layer 2: Server Enforcement (API-Side)
  ├── License validated on every API call
  ├── Cannot be bypassed without valid license
  └── Purpose: Actual security boundary

Layer 3: Behavioral Detection (Analytics)
  ├── Detect anomalous patterns (validation without SDK init)
  ├── Flag accounts with suspicious activity
  └── Purpose: Detect sophisticated bypass attempts

Layer 4: Legal Enforcement (Terms of Service)
  ├── Clear ToS prohibiting circumvention
  ├── Audit trail provides evidence
  └── Purpose: Legal recourse for persistent violators
```

### Server-Side Enforcement (The Real Security)

```
For backend-protected applications:
  • Every API endpoint validates license via middleware
  • No client-side-only enforcement for critical features
  • Server returns 403 for invalid licenses — no data leaks

For frontend-only applications:
  • Accept that determined attackers CAN bypass
  • Focus on making it inconvenient for casual pirates
  • Use watermarking to identify leaked copies
  • Domain locking prevents simple redistribution
```

### Anti-Bypass Signals (Detection)

| Signal | Indicates | Action |
|--------|-----------|--------|
| Validation without prior SDK init | SDK bypassed, direct API call | Flag + rate limit |
| Same license key from 50+ IPs | Key sharing/piracy | Auto-suspend + notify owner |
| Validation from unlisted domain | Domain lock bypass attempt | Block + alert |
| SDK version = "0.0.0" or missing | Modified SDK | Reject + log |
| Fingerprint changes every request | Fingerprint spoofing | Rate limit + flag |
| Validation succeeds but no heartbeats | SDK gutted (validation only) | Reduce grace period |

---

## 4. Secure Token Signing

### Algorithm Selection

| Token Type | Algorithm | Key Size | Rationale |
|-----------|-----------|----------|-----------|
| Access tokens (JWT) | RS256 | 2048-bit RSA | Asymmetric — verify without secret |
| Refresh tokens | Opaque | 256-bit random | No payload needed, stored server-side |
| Offline license tokens | Ed25519 | 256-bit | Fast, small signatures, quantum-resistant-ish |
| Webhook signatures | HMAC-SHA256 | 256-bit | Symmetric, fast, standard |
| API request signing | HMAC-SHA256 | 256-bit | Symmetric, per-project secret |

### Ed25519 Offline Token Design

```
Token Structure:
  Base64URL(JSON({
    payload: JSON({
      lid: "license_id",
      pid: "project_id",
      sts: "active",
      fts: ["feature1", "feature2"],
      exp: 1700000000,        // License expiry (unix seconds)
      grc: 72,                // Offline grace hours
      iat: 1699900000,        // Token issued at
      nxt: 1699900300,        // Next required online check-in
      fp:  "device_hash",     // Bound to specific device
      dom: ["example.com"],   // Bound to specific domains
      ver: 42,                // Config version at time of issue
    }),
    signature: Base64(Ed25519Sign(payload, serverPrivateKey))
  }))

Verification (SDK-side):
  1. Decode base64url
  2. Extract payload and signature
  3. Verify Ed25519 signature using embedded public key
  4. Check: current_time < iat + (grc * 3600)
  5. Check: fingerprint matches current device
  6. Check: domain matches (frontend only)
  7. If all pass → license valid offline
```

### Key Management

```
Private keys:
  • Stored in external KMS (AWS KMS, HashiCorp Vault, GCP KMS)
  • Never in environment variables in production
  • Accessed via IAM role (no static credentials)
  • Rotated every 90 days (with overlap period)

Public keys:
  • Embedded in SDK at build time
  • Published at /.well-known/devlock-keys.json
  • Multiple keys supported (for rotation)
  • Key ID in token header identifies which key to use
```

---

## 5. Replay Attack Prevention

### Request-Level Protection

```
Every SDK request includes:
  X-DevLock-Timestamp: <unix_ms>     → Must be within ±5 minutes
  X-DevLock-Signature: HMAC(timestamp + body, secret)
  X-DevLock-Nonce: <random_uuid>     → One-time use (optional, for critical ops)

Server validation:
  1. Reject if |server_time - request_time| > 300,000ms
  2. Verify HMAC signature matches
  3. (Optional) Check nonce not in Redis set (TTL: 10min)
```

### Token-Level Protection

```
Offline tokens:
  • iat (issued at) — token freshness
  • nxt (next check-in) — forces periodic online validation
  • ver (config version) — stale tokens rejected if config changed
  • Short grace period — limits replay window

Access tokens (JWT):
  • 15-minute expiry — short replay window
  • jti claim (JWT ID) — can be blacklisted on logout
  • Bound to IP (optional, breaks mobile users)
```

### WebSocket Replay Prevention

```
  • Connection authenticated with fresh token on connect
  • Server-generated event IDs (monotonic)
  • Client ACKs with event ID — server tracks delivery
  • Duplicate event IDs ignored by client
```

---

## 6. MITM Protection

### Transport Security

```
Minimum: TLS 1.3 (reject TLS 1.2 and below)
  • HSTS header: max-age=31536000; includeSubDomains; preload
  • HSTS preload list submission
  • Certificate Transparency (CT) logs monitoring
  • CAA DNS records (restrict which CAs can issue certs)
```

### Response Integrity

```
Even with TLS, defense-in-depth against compromised CAs:
  • All validation responses are Ed25519 signed
  • SDK verifies signature with embedded public key
  • Attacker with MITM position cannot forge valid signatures
  • This is the critical layer — TLS is just the first barrier
```

### SDK-Level Verification

```typescript
// SDK verifies response signature before trusting any data
function verifyResponse(response: ValidationResponse): boolean {
  const { signature, ...payload } = response;
  return ed25519Verify(
    JSON.stringify(payload),
    signature,
    EMBEDDED_PUBLIC_KEY  // Compiled into SDK
  );
}
```

---

## 7. Certificate Pinning

### Strategy (Pragmatic Approach)

```
Full certificate pinning is FRAGILE in web contexts:
  • Browsers don't support it (deprecated HPKP)
  • Certificate rotation breaks pinned clients
  • Corporate proxies legitimately intercept TLS

Recommended approach for DevLock:
  1. Pin the CA (not leaf cert) — survives cert rotation
  2. Pin backup CA — survives CA migration
  3. Implement in backend SDK only (controlled environment)
  4. Frontend SDK relies on Ed25519 response signing instead
```

### Backend SDK Implementation

```typescript
// Pin Let's Encrypt and backup CA
const PINNED_CA_FINGERPRINTS = [
  'sha256/ISRG_Root_X1_fingerprint_here',
  'sha256/DigiCert_Global_Root_G2_here',
];

// Node.js TLS options
const agent = new https.Agent({
  ca: PINNED_CA_CERTS,  // Only trust these CAs for DevLock API
  checkServerIdentity: (host, cert) => {
    // Verify hostname + CA fingerprint
    const fingerprint = crypto.createHash('sha256')
      .update(cert.raw).digest('base64');
    if (!PINNED_CA_FINGERPRINTS.includes(`sha256/${fingerprint}`)) {
      throw new Error('Certificate pinning failed');
    }
  },
});
```

### Frontend Alternative: Subresource Integrity

```html
<!-- Pin SDK bundle integrity -->
<script
  src="https://cdn.devlock.io/sdk/v1.0.0/devlock.min.js"
  integrity="sha384-<hash>"
  crossorigin="anonymous"
></script>
```

---

## 8. Secure WebSocket Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  WEBSOCKET SECURITY LAYERS                                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Transport: WSS (TLS 1.3) — encrypted channel                   │
│                                                                  │
│  Authentication:                                                 │
│  • SDK sends auth token in handshake (not URL params!)           │
│  • Server validates token before upgrading connection            │
│  • Token refresh: disconnect + reconnect with new token          │
│                                                                  │
│  Authorization:                                                  │
│  • Connections scoped to project (room-based isolation)          │
│  • Cannot subscribe to other projects' events                    │
│  • Admin connections require separate JWT (not API key)          │
│                                                                  │
│  Message Integrity:                                              │
│  • Server-to-client: messages include event ID + timestamp       │
│  • Client-to-server: rate limited (max 10 msg/sec)              │
│  • Payload size limit: 64KB per message                          │
│                                                                  │
│  Abuse Prevention:                                               │
│  • Max connections per API key: 1000                             │
│  • Idle timeout: 5 minutes (no heartbeat = disconnect)           │
│  • Invalid message format: disconnect after 3 violations         │
│  • Connection rate limit: 10 new connections/min per key         │
│                                                                  │
│  Isolation:                                                      │
│  • Each project in separate Socket.IO room                       │
│  • No cross-room message leakage                                 │
│  • Admin namespace separate from SDK namespace                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 9. Encryption Best Practices

| Data | At Rest | In Transit | Algorithm |
|------|---------|------------|-----------|
| Passwords | scrypt (N=16384, r=8, p=1) | TLS 1.3 | scrypt + 32-byte salt |
| API secret keys | AES-256-GCM | TLS 1.3 | Envelope encryption (DEK+KEK) |
| License keys | AES-256-GCM (stored) + SHA-256 (lookup) | TLS 1.3 | Dual storage |
| MFA secrets | AES-256-GCM | TLS 1.3 | Per-user encryption |
| Webhook secrets | AES-256-GCM | TLS 1.3 | Per-webhook key |
| Offline tokens | Ed25519 signed (not encrypted) | TLS 1.3 | Integrity, not confidentiality |
| Database backups | AES-256-CBC | TLS 1.3 (transfer) | Separate backup key |
| Redis data | Not encrypted (internal network) | mTLS (production) | Network isolation |

### Key Hierarchy

```
Master Key (KMS-managed, never leaves HSM)
  └── Data Encryption Keys (DEKs)
       ├── DEK for user secrets (rotated monthly)
       ├── DEK for API keys (rotated quarterly)
       ├── DEK for license keys (rotated quarterly)
       └── DEK for backups (rotated annually)

Envelope Encryption:
  1. Generate random DEK (256-bit)
  2. Encrypt data with DEK (AES-256-GCM)
  3. Encrypt DEK with Master Key (KMS)
  4. Store: encrypted_data + encrypted_DEK + IV + auth_tag
  5. To decrypt: KMS decrypts DEK → DEK decrypts data
```

---

## 10. Environment Variable Security

### Classification

| Tier | Examples | Storage | Access |
|------|----------|---------|--------|
| Critical | JWT private key, DB password, encryption key | KMS/Vault | IAM role only |
| Sensitive | Stripe key, SMTP password, API secrets | Sealed secrets | Service account |
| Configuration | Port, log level, feature flags | ConfigMap | All pods |
| Public | API URL, CDN URL, app version | ConfigMap | All pods |

### Rules

```
1. NEVER commit secrets to git (even encrypted)
2. NEVER log environment variables at startup
3. NEVER pass secrets via command-line arguments (visible in ps)
4. NEVER use .env files in production (use KMS/Vault)
5. ALWAYS use separate secrets per environment
6. ALWAYS rotate secrets on team member departure
7. ALWAYS audit secret access (who accessed what, when)
```

### Production Secret Injection

```yaml
# Kubernetes: External Secrets Operator
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: devlock-secrets
spec:
  refreshInterval: 1h
  secretStoreRef:
    name: aws-secrets-manager
    kind: ClusterSecretStore
  target:
    name: devlock-secrets
  data:
    - secretKey: JWT_SECRET
      remoteRef:
        key: devlock/production/jwt-secret
    - secretKey: ENCRYPTION_KEY
      remoteRef:
        key: devlock/production/encryption-key
```

---

## 11. RBAC Security

### Enforcement Points

```
1. API Gateway (middleware) — first check, fast rejection
2. Service layer — business logic authorization
3. Database queries — always scoped by tenantId (defense in depth)
4. UI — hide unauthorized actions (UX only, not security)
```

### Privilege Escalation Prevention

```
• Role changes require OWNER or ADMIN — never self-promote
• Cannot assign role higher than your own
• Owner transfer requires email confirmation + MFA
• API keys inherit project permissions, not user permissions
• Service-to-service calls use separate service tokens (not user tokens)
```

### Token Security

```
• Permissions embedded in JWT (no DB lookup on every request)
• Permission changes take effect on next token refresh (max 15min delay)
• Critical actions (delete org, transfer ownership) require re-authentication
• Session binding: token tied to IP + User-Agent hash (optional, configurable)
```

---

## 12. API Gateway Protection

### Security Headers

```
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 0  (deprecated, rely on CSP)
Content-Security-Policy: default-src 'none'; frame-ancestors 'none'
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
X-Request-ID: <uuid>  (for tracing)
```

### Input Validation

```
• All inputs validated with Zod schemas (whitelist approach)
• Request body size limit: 1MB
• URL length limit: 2048 chars
• Header count limit: 50
• No query string in POST/PUT/DELETE bodies
• ObjectId format validation on all ID parameters
• Reject requests with unexpected Content-Type
```

### Request Sanitization

```
• Strip null bytes from all string inputs
• Reject MongoDB operator injection ($gt, $regex in user input)
• HTML entity encoding for any stored user content
• Path traversal prevention (reject ../ in file paths)
• Unicode normalization before comparison
```

---

## 13. Rate Limiting

### Multi-Tier Strategy

| Tier | Scope | Limit | Window | Action on Exceed |
|------|-------|-------|--------|-----------------|
| Global | Per IP | 10,000 req | 1 min | 429 + Retry-After |
| Auth | Per IP | 10 req | 1 min | 429 + progressive delay |
| API | Per user/key | 100 req | 1 min | 429 + Retry-After |
| SDK | Per API key | 500 req | 1 min | 429 + cached response |
| Mutations | Per user | 30 req | 1 min | 429 |
| Webhooks | Per endpoint | 30 req | 1 min | Queue backpressure |

### Progressive Penalties

```
Auth endpoint (brute force protection):
  Attempt 1-5:   Normal response (success or "invalid credentials")
  Attempt 6-10:  Add 1s delay before response
  Attempt 11-20: Add 5s delay before response
  Attempt 21+:   Block IP for 15 minutes
  
  After 5 failed attempts on same account:
    → Require CAPTCHA
  After 10 failed attempts:
    → Lock account for 30 minutes
    → Send email notification to account owner
```

---

## 14. WAF Recommendations

### Rules to Deploy

```
1. OWASP Core Rule Set (CRS) — baseline protection
2. SQL injection patterns (even though we use MongoDB)
3. XSS patterns in request bodies
4. Path traversal attempts
5. Scanner/bot detection (known bad User-Agents)
6. Geographic restrictions (optional, per-tenant)
7. Request anomaly scoring (unusual header combinations)
8. API abuse patterns (sequential ID enumeration)
```

### Recommended WAF Providers

```
Production: Cloudflare WAF or AWS WAF
  • Managed rulesets (auto-updated)
  • Bot management
  • Rate limiting at edge
  • DDoS protection included
  • Custom rules for DevLock-specific patterns
```

---

## 15. DDoS Mitigation

### Architecture

```
Internet → Cloudflare (L3/L4/L7 DDoS) → Origin (our servers)

Layer 3/4 (Network):
  • Cloudflare absorbs volumetric attacks
  • Origin IP never exposed publicly
  • Anycast network distributes load globally

Layer 7 (Application):
  • Rate limiting at edge (before reaching origin)
  • Challenge pages for suspicious traffic
  • Bot detection (JS challenge, CAPTCHA)
  • Geographic rate limiting

SDK-Specific:
  • /sdk/validate endpoint cached at edge (5s TTL)
  • Stale-while-revalidate for SDK config
  • SDK has offline fallback (doesn't hard-fail on API down)
  • Circuit breaker pattern in SDK (stop hammering if API is down)
```

---

## 16. Secure Logging

### What to Log

```
✓ Authentication events (login, logout, failed attempts)
✓ Authorization failures (403 responses)
✓ License lifecycle events (create, suspend, revoke)
✓ Admin actions (config changes, kill-switch)
✓ API errors (5xx responses)
✓ Rate limit triggers
✓ Tamper detection events
✓ Unusual patterns (flagged by anomaly detection)
```

### What to NEVER Log

```
✗ Passwords (even hashed)
✗ Full license keys (log last 4 chars only: ****-****-****-XXXX)
✗ API secret keys
✗ JWT tokens (log token ID/jti only)
✗ Credit card numbers
✗ MFA secrets/backup codes
✗ Full request bodies containing PII
✗ Session tokens
```

### PII Redaction

```typescript
// Automatic redaction in pino logger
redact: {
  paths: [
    'req.headers.authorization',
    'req.headers["x-devlock-secret"]',
    'body.password',
    'body.licenseKey',
    '*.secretKey',
    '*.token',
    '*.creditCard',
  ],
  censor: '[REDACTED]',
}

// Custom serializer for license keys
function redactLicenseKey(key: string): string {
  if (key.length < 8) return '****';
  return key.slice(0, 5) + '****' + key.slice(-4);
  // DLCK-****-****-****-XXXX
}
```

---

## 17. Audit Trails

### Immutable Audit Log Design

```
Properties:
  • Append-only (no updates, no deletes)
  • Timestamped with server time (not client time)
  • Includes actor identity (who), action (what), resource (on what)
  • Includes before/after state for mutations
  • Cryptographically chained (each entry references previous hash)
  • Retained per compliance requirements (1 year minimum)

Storage:
  • MongoDB with TTL index (auto-expire based on plan)
  • Write-ahead to separate audit database (isolation)
  • Periodic export to immutable storage (S3 Glacier)
```

### Audit Events

```
auth.login_success, auth.login_failed, auth.mfa_enabled
org.member_invited, org.member_removed, org.plan_changed
project.created, project.deleted, project.keys_rotated
license.created, license.suspended, license.revoked
config.maintenance_enabled, config.killswitch_activated
flag.created, flag.toggled, flag.deleted
webhook.created, webhook.deleted
billing.subscription_changed, billing.payment_failed
security.tamper_detected, security.rate_limit_triggered
```

---

## 18. License Abuse Prevention

### Detection Signals

| Pattern | Threshold | Action |
|---------|-----------|--------|
| Same key, many IPs | >10 unique IPs/hour | Alert owner + auto-suspend |
| Same key, many domains | >5 domains | Alert + enforce domain lock |
| Activation spike | >100 activations/day | Throttle + alert |
| Validation without heartbeat | >1 hour gap | Reduce grace period |
| Geographic impossibility | 2 countries in 1 minute | Flag for review |
| Key appears in public repo | GitHub secret scanning | Auto-revoke + notify |

### Automated Responses

```
Level 1 (Warning): Notify license owner via email/dashboard
Level 2 (Throttle): Reduce rate limits for that key
Level 3 (Suspend): Auto-suspend license, require manual review
Level 4 (Revoke): Permanent revocation + block fingerprints
```

---

## 19. Device Fingerprinting

### Frontend Fingerprint Components

```
Stable signals (rarely change):
  • Screen resolution + color depth
  • Timezone
  • Language
  • Platform (OS)
  • Hardware concurrency (CPU cores)
  • WebGL renderer string
  • Canvas fingerprint (font rendering)

Semi-stable signals (change occasionally):
  • User-Agent (browser updates)
  • Installed plugins
  • Touch support

NOT used (too volatile):
  • IP address (changes with network)
  • Cookies (can be cleared)
  • localStorage (can be cleared)
```

### Fingerprint Stability Strategy

```
• Hash all components → 256-bit fingerprint
• Allow partial match (7/10 components = same device)
• Fingerprint drift detection (gradual changes = same device)
• New fingerprint + same license = new activation (counts toward limit)
• Fingerprint collision handling (rare but possible)
```

### Backend Fingerprint

```
• OS platform + hostname + process ID
• Machine ID (from /etc/machine-id or equivalent)
• Network interface MAC addresses (hashed)
• More stable than frontend (servers don't change often)
```

---

## 20. Malware False-Positive Prevention

### Why This Matters

```
Anti-virus software may flag DevLock SDK as malicious because:
  • Anti-debugging techniques look like malware behavior
  • Network calls to external servers look like C2 communication
  • Code obfuscation triggers heuristic detection
  • DOM manipulation (watermark) looks like adware
  • WebSocket persistent connections look suspicious
```

### Mitigation Strategies

```
1. Code signing: Sign npm package with verified publisher identity
2. Transparent behavior: Document all network calls in README
3. Minimal obfuscation: Use terser (standard minification), avoid heavy obfuscation
4. Configurable features: Let developers disable anti-debug, watermark, etc.
5. Well-known domains: Use devlock.io (not random-looking domains)
6. Standard protocols: HTTPS + WSS (not custom binary protocols)
7. AV vendor outreach: Submit SDK to major AV vendors for whitelisting
8. VirusTotal monitoring: Regularly scan releases for false positives
9. Gradual rollout: New versions to small % first, monitor AV reports
```

---

## 21. Legal-Safe Enforcement

### Principles

```
1. NEVER destroy user data — only restrict access
2. NEVER brick hardware — only disable software features
3. ALWAYS provide grace period — no instant lockout without warning
4. ALWAYS allow data export — even with suspended license
5. ALWAYS show clear messaging — user must understand why access is restricted
6. NEVER use deceptive practices — no hidden functionality
7. DOCUMENT everything — clear ToS, privacy policy, enforcement policy
```

### Enforcement Escalation

```
Day 0:  License expires → Show warning banner (app still works)
Day 3:  Grace period → Show persistent warning, disable premium features
Day 7:  Degraded mode → Core features only, export still available
Day 14: Suspended → App shows "license expired" screen with renewal link
Day 30: Data preserved but app non-functional until renewed

Kill-switch (immediate, for violations):
  • Show clear message explaining why
  • Provide contact information for disputes
  • Allow data export via separate endpoint
  • Log everything for legal evidence
```

### What NOT to Do

```
✗ Delete user data without warning
✗ Inject malicious code
✗ Exfiltrate user data as "punishment"
✗ Disable unrelated system functionality
✗ Make the enforcement look like a system error
✗ Prevent uninstallation of the SDK
✗ Access data beyond what's needed for licensing
```

---

## 22. Secure Remote Commands

### Command Authentication

```
Every remote command (kill-switch, maintenance, etc.) must:
  1. Originate from authenticated admin (JWT + MFA for critical commands)
  2. Be logged in immutable audit trail
  3. Be signed by server before delivery to SDK
  4. Include timestamp (reject stale commands)
  5. Include command ID (prevent replay)
  6. Be scoped to specific project (no cross-project commands)
```

### Command Verification (SDK-Side)

```typescript
interface RemoteCommand {
  id: string;           // Unique command ID
  type: string;         // 'killswitch', 'maintenance', etc.
  projectId: string;    // Must match SDK's project
  timestamp: number;    // Must be recent (< 5 min)
  payload: unknown;     // Command-specific data
  signature: string;    // Ed25519(id + type + projectId + timestamp + payload)
}

function verifyCommand(cmd: RemoteCommand): boolean {
  // 1. Check timestamp freshness
  if (Math.abs(Date.now() - cmd.timestamp) > 300_000) return false;
  // 2. Check project scope
  if (cmd.projectId !== currentProjectId) return false;
  // 3. Verify cryptographic signature
  return ed25519Verify(serializeCommand(cmd), cmd.signature, SERVER_PUBLIC_KEY);
}
```

---

## 23. Supply-Chain Security

### Dependency Management

```
1. Lock files committed (pnpm-lock.yaml)
2. Exact versions only (no ^ or ~ in production deps)
3. Renovate bot for automated updates (with CI gate)
4. npm audit on every CI run
5. Socket.dev or Snyk for real-time vulnerability alerts
6. Minimal dependencies (fewer deps = smaller attack surface)
7. Vendor critical dependencies (copy into repo if < 100 lines)
```

### Build Integrity

```
1. Reproducible builds (same source → same output)
2. Build provenance attestation (SLSA Level 2+)
3. SBOM generation (Software Bill of Materials)
4. Signed git commits (GPG/SSH)
5. Protected branches (require reviews + CI pass)
6. No force-push to main
```

### Dependency Audit Checklist

```
Before adding any dependency:
  □ Is it actively maintained? (commits in last 6 months)
  □ Does it have known vulnerabilities? (npm audit, Snyk)
  □ Is the maintainer reputable? (not a single anonymous account)
  □ Is the package name correct? (typosquatting check)
  □ Does it request unnecessary permissions?
  □ Is the source code readable and reasonable?
  □ Can we vendor it instead? (for small utilities)
```

---

## 24. npm Package Protection

### Publishing Security

```
1. 2FA required for npm publish
2. Publish from CI only (not developer machines)
3. npm provenance enabled (--provenance flag)
4. Package signed with Sigstore
5. .npmignore excludes: tests, docs, .env, source maps
6. Pre-publish script runs: lint + test + build + audit
7. Version tags are git-signed
```

### Package Integrity

```
// Users can verify package integrity:
npm audit signatures  // Verify registry signatures
npm pack --dry-run    // Inspect what gets published

// Subresource Integrity for CDN delivery:
<script src="https://cdn.devlock.io/sdk/v1.0.0.js"
        integrity="sha384-<hash>"
        crossorigin="anonymous"></script>
```

### Typosquatting Prevention

```
• Register common misspellings (@devlock/skd, @devlock/sdk-frontend, etc.)
• Monitor npm for similar package names
• Clear package naming in documentation
```

---

## 25. CI/CD Security

```
┌─────────────────────────────────────────────────────────────────┐
│  CI/CD SECURITY CONTROLS                                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Source:                                                         │
│  • Branch protection (require reviews, CI pass)                  │
│  • Signed commits required                                       │
│  • No direct push to main                                        │
│  • CODEOWNERS for sensitive files                                │
│                                                                  │
│  Build:                                                          │
│  • Isolated build environment (ephemeral containers)             │
│  • No secrets in build logs                                      │
│  • Dependency caching with integrity verification                │
│  • SAST scanning (CodeQL, Semgrep)                               │
│  • Secret detection (TruffleHog, GitLeaks)                       │
│                                                                  │
│  Test:                                                           │
│  • Security tests in CI (OWASP ZAP, npm audit)                  │
│  • Container scanning (Trivy, Snyk Container)                    │
│  • License compliance check                                      │
│  • No test credentials in code                                   │
│                                                                  │
│  Deploy:                                                         │
│  • Separate credentials per environment                          │
│  • Deployment requires approval for production                   │
│  • Canary deployments (detect issues before full rollout)        │
│  • Automatic rollback on health check failure                    │
│  • Deploy artifacts are signed and verified                      │
│                                                                  │
│  Secrets:                                                        │
│  • GitHub Actions secrets (encrypted at rest)                    │
│  • OIDC for cloud provider auth (no static credentials)          │
│  • Secrets never printed in logs                                 │
│  • Rotate CI secrets quarterly                                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 26. Kubernetes Security

### Pod Security

```yaml
securityContext:
  runAsNonRoot: true
  runAsUser: 1001
  readOnlyRootFilesystem: true
  allowPrivilegeEscalation: false
  capabilities:
    drop: ["ALL"]
  seccompProfile:
    type: RuntimeDefault
```

### Network Policies

```yaml
# Only allow API gateway to talk to services
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: deny-all-ingress
spec:
  podSelector: {}
  policyTypes: ["Ingress"]
  ingress: []  # Deny all by default

---
# Allow gateway → services
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-gateway-to-services
spec:
  podSelector:
    matchLabels:
      tier: service
  ingress:
    - from:
        - podSelector:
            matchLabels:
              app: api-gateway
```

### Additional Controls

```
• Pod Security Standards: Restricted profile
• Service mesh (Istio/Linkerd) for mTLS between services
• OPA/Gatekeeper for policy enforcement
• Falco for runtime threat detection
• Image scanning before deployment (reject HIGH/CRITICAL CVEs)
• No latest tag — always pinned image digests
• Separate namespaces per environment
• RBAC: minimal ClusterRole bindings
```

---

## 27. Secret Rotation

### Rotation Schedule

| Secret | Rotation Period | Method | Downtime |
|--------|----------------|--------|----------|
| JWT signing key | 90 days | Dual-key (old valid for 24h) | Zero |
| Ed25519 license key | 180 days | Key ID in token header | Zero |
| API project keys | On-demand (user-initiated) | Grace period for old key (24h) | Zero |
| Database password | 90 days | Blue-green connection swap | Zero |
| Redis password | 90 days | Rolling restart | Brief |
| Encryption DEKs | 30 days | Re-encrypt on read (lazy) | Zero |
| Stripe API key | On compromise only | Immediate swap | Brief |
| CI/CD tokens | 90 days | Automated via Vault | Zero |

### Zero-Downtime Key Rotation

```
JWT Signing Key Rotation:
  1. Generate new key pair
  2. Start signing new tokens with new key
  3. Verification accepts BOTH old and new key (24h overlap)
  4. After 24h (all old tokens expired), remove old key
  5. Log rotation event in audit trail

Ed25519 License Key Rotation:
  1. Generate new key pair, assign key ID (kid: "key-2")
  2. New offline tokens signed with new key, include kid in header
  3. SDK verification checks kid → selects correct public key
  4. Old tokens remain valid until their natural expiry
  5. After max grace period, remove old public key from SDK
```

---

## 28. SOC 2 Readiness

### SOC 2 Trust Service Criteria Mapping

| Criteria | DevLock Implementation |
|----------|----------------------|
| **Security** | |
| Access control | RBAC + MFA + session management |
| Network security | TLS 1.3 + WAF + network policies |
| Vulnerability management | Automated scanning + patching |
| Incident response | Runbooks + PagerDuty + audit trail |
| **Availability** | |
| Monitoring | Prometheus + Grafana + alerting |
| Redundancy | Multi-AZ deployment + failover |
| Disaster recovery | Automated backups + tested restore |
| SLA management | 99.9% uptime target + status page |
| **Processing Integrity** | |
| Input validation | Zod schemas on all inputs |
| Error handling | Structured errors + no data leakage |
| Change management | CI/CD + code review + staging |
| **Confidentiality** | |
| Encryption | At-rest (AES-256) + in-transit (TLS 1.3) |
| Data classification | Tiered access based on sensitivity |
| Secure disposal | Crypto-shredding on deletion |
| **Privacy** | |
| Data minimization | Collect only what's needed |
| Consent | Clear privacy policy + opt-in telemetry |
| Right to erasure | Automated data deletion pipeline |
| Data residency | Region selection (US/EU/APAC) |

### Required Documentation

```
□ Information Security Policy
□ Access Control Policy
□ Incident Response Plan
□ Business Continuity Plan
□ Change Management Policy
□ Risk Assessment (annual)
□ Vendor Management Policy
□ Data Retention Policy
□ Acceptable Use Policy
□ Employee Security Training Records
```

### Technical Controls Checklist

```
□ Centralized logging with 1-year retention
□ Automated vulnerability scanning (weekly)
□ Penetration testing (annual, third-party)
□ Background checks for employees with data access
□ Encrypted backups with tested restore procedures
□ Intrusion detection system (IDS)
□ File integrity monitoring
□ Endpoint protection (company devices)
□ Security awareness training (quarterly)
□ Incident response drills (semi-annual)
```

---

## Summary

DevLock's security architecture follows a **defense-in-depth** model:

1. **Edge** — DDoS protection, WAF, rate limiting
2. **Transport** — TLS 1.3, certificate pinning (backend), HSTS
3. **Authentication** — JWT + MFA + API keys + HMAC signing
4. **Authorization** — RBAC with least privilege
5. **Application** — Input validation, output encoding, error handling
6. **Data** — Encryption at rest, field-level encryption, key rotation
7. **Infrastructure** — Network policies, pod security, secret management
8. **Detection** — Audit logging, anomaly detection, tamper reporting
9. **Response** — Automated suspension, alerting, incident runbooks
10. **Recovery** — Backups, disaster recovery, business continuity

The key insight for a licensing platform: **server-side enforcement is the real security boundary**. Client-side SDK protection raises the bar but cannot prevent a determined attacker. The architecture accepts this reality and focuses on making bypass detectable, reportable, and legally actionable rather than technically impossible.

---

*Document Version: 1.0.0*
*Classification: Internal — Security*
*Last Updated: 2026-05-25*
