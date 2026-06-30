import type { RedisLike, ValidationResult, SDKState } from '../types.js';

const PREFIX = 'devlock:sdk:';

/**
 * Multi-layer cache: Redis (distributed) → in-memory (local).
 * Falls back gracefully if Redis is unavailable.
 */
export class CacheManager {
  private memory = new Map<string, { value: string; expiresAt: number }>();
  private redis: RedisLike | null;
  private ttl: number;

  constructor(redis: RedisLike | null, ttlMs: number) {
    this.redis = redis;
    this.ttl = ttlMs;
  }

  async getLicenseValidation(keyHash: string): Promise<ValidationResult | null> {
    const key = `${PREFIX}license:${keyHash}`;
    return this.get<ValidationResult>(key);
  }

  async setLicenseValidation(keyHash: string, result: ValidationResult): Promise<void> {
    const key = `${PREFIX}license:${keyHash}`;
    await this.set(key, result, this.ttl);
  }

  async invalidateLicense(keyHash: string): Promise<void> {
    const key = `${PREFIX}license:${keyHash}`;
    await this.del(key);
  }

  async getState(): Promise<SDKState | null> {
    return this.get<SDKState>(`${PREFIX}state`);
  }

  async setState(state: SDKState): Promise<void> {
    await this.set(`${PREFIX}state`, state, this.ttl * 2);
  }

  async invalidateAll(): Promise<void> {
    this.memory.clear();
    // Redis keys would need SCAN in production — simplified here
  }

  // ── Generic cache operations ────────────────────────────────────────────

  private async get<T>(key: string): Promise<T | null> {
    // L1: Memory
    const memEntry = this.memory.get(key);
    if (memEntry && memEntry.expiresAt > Date.now()) {
      return JSON.parse(memEntry.value) as T;
    }
    this.memory.delete(key);

    // L2: Redis
    if (this.redis) {
      try {
        const value = await this.redis.get(key);
        if (value) {
          // Backfill memory cache
          this.memory.set(key, { value, expiresAt: Date.now() + 60_000 });
          return JSON.parse(value) as T;
        }
      } catch {
        // Redis unavailable — continue without
      }
    }

    return null;
  }

  private async set(key: string, value: unknown, ttlMs: number): Promise<void> {
    const serialized = JSON.stringify(value);

    // L1: Memory
    this.memory.set(key, { value: serialized, expiresAt: Date.now() + ttlMs });

    // L2: Redis
    if (this.redis) {
      try {
        await this.redis.set(key, serialized, 'PX', ttlMs);
      } catch {
        // Redis unavailable — memory cache still works
      }
    }
  }

  private async del(key: string): Promise<void> {
    this.memory.delete(key);
    if (this.redis) {
      try { await this.redis.del(key); } catch { /* ignore */ }
    }
  }
}
