import Redis from 'ioredis';
import { createLogger } from '@/logger';

const logger = createLogger({ service: 'database' });

export type RedisClient = Redis;

export function createRedisClient(url?: string, options?: { keyPrefix?: string }): RedisClient {
  const redisUrl = url ?? process.env['REDIS_URL'] ?? 'redis://localhost:6379';

  const client = new Redis(redisUrl, {
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
      const delay = Math.min(times * 200, 5000);
      return delay;
    },
    // keyPrefix is applied to pub/sub channels too — pass '' for the event bus so
    // publisher and subscriber agree on un-prefixed `events:*` channel names.
    keyPrefix: options?.keyPrefix ?? process.env['REDIS_KEY_PREFIX'] ?? 'devlock:',
  });

  client.on('connect', () => {
    logger.info('Connected to Redis');
  });

  client.on('error', (err) => {
    logger.error({ err }, 'Redis connection error');
  });

  return client;
}
