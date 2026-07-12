import { createRedisClient, type RedisClient } from '@/database';
import { createLogger } from '@/logger';
import { EventBus } from './event-bus.js';

export { EventBus } from './event-bus.js';
export type { EventEnvelope } from './event-bus.js';

const logger = createLogger({ service: 'events' });

let publisher: RedisClient | null = null;
let eventBus: EventBus | null = null;

/**
 * Lazily-constructed singleton EventBus backed by a dedicated (un-prefixed) Redis
 * publisher. Un-prefixed so it shares channel names with the WebSocket subscriber.
 */
export function getEventBus(): EventBus {
  if (!eventBus) {
    publisher = createRedisClient(undefined, { keyPrefix: '' });
    eventBus = new EventBus(publisher);
  }
  return eventBus;
}

/**
 * Emit a project-scoped domain event for real-time delivery to connected SDKs.
 *
 * Fire-and-forget and **fail-safe** — a Redis outage can never break the calling
 * request. Real-time is a best-effort enhancement on top of the SDK's polling.
 */
export async function emitProjectEvent(
  event: string,
  projectId: string,
  data: Record<string, unknown> = {},
): Promise<void> {
  try {
    await getEventBus().emit(event, { ...data, projectId });
  } catch (err) {
    logger.warn({ err: (err as Error).message, event, projectId }, 'Event emit failed (real-time only, ignored)');
  }
}

/**
 * Emit a tenant-scoped event for real-time delivery to that tenant's connected
 * dashboard sessions (e.g. in-app notifications). Fire-and-forget and fail-safe.
 */
export async function emitTenantEvent(
  tenantId: string,
  event: string,
  data: Record<string, unknown> = {},
): Promise<void> {
  try {
    await getEventBus().emit(event, { ...data, tenantId });
  } catch (err) {
    logger.warn({ err: (err as Error).message, event, tenantId }, 'Tenant event emit failed (real-time only, ignored)');
  }
}
