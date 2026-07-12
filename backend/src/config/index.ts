import { z } from 'zod';
import dotenv from 'dotenv';

// Load .env files in order of precedence
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

// ─── Base Environment Schema ──────────────────────────────────────────────────

const baseEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'staging', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
});

// ─── Database Config ──────────────────────────────────────────────────────────

const databaseEnvSchema = z.object({
  MONGODB_URI: z.string().url().default('mongodb://localhost:27017/devlock?replicaSet=rs0'),
  MONGODB_MAX_POOL_SIZE: z.coerce.number().default(50),
  MONGODB_MIN_POOL_SIZE: z.coerce.number().default(5),
});

// ─── Redis Config ─────────────────────────────────────────────────────────────

const redisEnvSchema = z.object({
  REDIS_URL: z.string().default('redis://localhost:6379'),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_KEY_PREFIX: z.string().default('devlock:'),
});

// ─── Auth Config ──────────────────────────────────────────────────────────────

const authEnvSchema = z.object({
  JWT_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRY: z.string().default('15m'),
  JWT_REFRESH_EXPIRY: z.string().default('7d'),
  BCRYPT_ROUNDS: z.coerce.number().default(12),
});

// ─── Encryption Config ────────────────────────────────────────────────────────

const encryptionEnvSchema = z.object({
  ENCRYPTION_KEY: z.string().min(32),
  LICENSE_PRIVATE_KEY: z.string().optional(),
  LICENSE_PUBLIC_KEY: z.string().optional(),
});

// ─── Service URLs ─────────────────────────────────────────────────────────────

const serviceUrlsSchema = z.object({
  API_GATEWAY_URL: z.string().url().default('http://localhost:6002'),
  WEBSOCKET_URL: z.string().default('ws://localhost:3010'),
  DASHBOARD_URL: z.string().url().default('http://localhost:6001'),
});

// ─── Billing Config ───────────────────────────────────────────────────────────

const billingEnvSchema = z.object({
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
});

// ─── Full Config ──────────────────────────────────────────────────────────────

const fullEnvSchema = baseEnvSchema
  .merge(databaseEnvSchema)
  .merge(redisEnvSchema)
  .merge(authEnvSchema)
  .merge(encryptionEnvSchema)
  .merge(serviceUrlsSchema)
  .merge(billingEnvSchema);

export type EnvConfig = z.infer<typeof fullEnvSchema>;

/**
 * Load and validate environment configuration.
 * Throws on invalid/missing required variables.
 */
export function loadConfig(overrides?: Partial<EnvConfig>): EnvConfig {
  const result = fullEnvSchema.safeParse({ ...process.env, ...overrides });

  if (!result.success) {
    const formatted = result.error.format();
    const missing = Object.entries(formatted)
      .filter(([key, val]) => key !== '_errors' && val && typeof val === 'object' && '_errors' in val)
      .map(([key, val]) => `  ${key}: ${(val as { _errors: string[] })._errors.join(', ')}`)
      .join('\n');

    throw new Error(`❌ Invalid environment configuration:\n${missing}`);
  }

  return result.data;
}

/**
 * Load partial config for services that don't need all variables.
 */
export function loadPartialConfig<T extends z.ZodObject<z.ZodRawShape>>(
  schema: T,
): z.infer<T> {
  const result = schema.safeParse(process.env);
  if (!result.success) {
    throw new Error(`❌ Config validation failed: ${result.error.message}`);
  }
  return result.data;
}

// Export individual schemas for partial loading
export {
  baseEnvSchema,
  databaseEnvSchema,
  redisEnvSchema,
  authEnvSchema,
  encryptionEnvSchema,
  serviceUrlsSchema,
  billingEnvSchema,
};
