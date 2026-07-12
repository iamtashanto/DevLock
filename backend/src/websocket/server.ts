import { Server as IOServer } from 'socket.io';
import type { Server as HttpServer } from 'http';
import { createRedisClient, ProjectModel } from '@/database';
import { createLogger } from '@/logger';
import { TokenService } from '../core/auth/token-service.js';
import type { EventEnvelope } from '../core/events/index.js';

const logger = createLogger({ service: 'websocket' });
const tokenService = new TokenService();

/**
 * Real-time gateway. Connected SDKs (frontend `devlock-client` and backend
 * `devlock-sdk`) authenticate with their project key, join a per-project room,
 * and receive domain events (kill-switch, maintenance, license changes) that are
 * published to Redis by the API controllers.
 *
 * Room naming: `events:<projectId>` where projectId is the Mongo `_id` string —
 * this matches the `data.projectId` carried in every published event envelope.
 */
export function createWebSocketServer(httpServer: HttpServer): IOServer {
  const corsOrigins = process.env['CORS_ORIGINS']?.split(',').map((s) => s.trim()).filter(Boolean);

  const io = new IOServer(httpServer, {
    cors: {
      origin: corsOrigins && corsOrigins.length > 0 ? corsOrigins : '*',
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  // ── Auth ─────────────────────────────────────────────────────────────────────
  // Two kinds of clients:
  //  1. Dashboard users authenticate with a JWT (`auth.token`) → tenant/user rooms.
  //  2. SDKs authenticate with a project key (`auth.apiKey`) → per-project room.
  io.use(async (socket, next) => {
    try {
      const auth = socket.handshake.auth ?? {};
      const token = auth['token'] as string | undefined;

      // Dashboard user (JWT)
      if (token) {
        try {
          const decoded = tokenService.verifyAccessToken(token);
          socket.data['kind'] = 'user';
          socket.data['userId'] = decoded.sub;
          socket.data['tenantId'] = decoded.orgId;
          next();
          return;
        } catch {
          next(new Error('Invalid token'));
          return;
        }
      }

      // SDK (project key)
      const apiKey = (auth['apiKey'] ?? auth['projectId']) as string | undefined;
      if (!apiKey) {
        next(new Error('Missing credentials'));
        return;
      }

      const project = await ProjectModel.findOne({
        $or: [{ publicKey: apiKey }, { secretKey: apiKey }],
        isActive: true,
      })
        .select('_id')
        .lean();

      if (!project) {
        next(new Error('Invalid apiKey'));
        return;
      }

      socket.data['kind'] = 'sdk';
      socket.data['projectId'] = project._id.toString();
      next();
    } catch (err) {
      logger.warn({ err: (err as Error).message }, 'WebSocket auth error');
      next(new Error('Auth failed'));
    }
  });

  io.on('connection', (socket) => {
    const kind = socket.data['kind'] as string;

    if (kind === 'user') {
      const tenantId = socket.data['tenantId'] as string;
      const userId = socket.data['userId'] as string;
      socket.join(`tenant:${tenantId}`);
      socket.join(`user:${userId}`);
      logger.debug({ tenantId, userId, socketId: socket.id }, 'Dashboard connected');
    } else {
      const projectId = socket.data['projectId'] as string;
      socket.join(`events:${projectId}`);
      logger.debug({ projectId, socketId: socket.id }, 'SDK connected');
    }

    // Inbound SDK messages (best-effort; safe to ignore if unused today)
    socket.on('heartbeat', () => { /* reserved: liveness tracking */ });
    socket.on('telemetry:batch', () => { /* reserved: telemetry ingest */ });

    socket.on('disconnect', (reason) => {
      logger.debug({ kind, socketId: socket.id, reason }, 'Client disconnected');
    });
  });

  // ── Redis subscriber → fan events out to the matching project room ───────────
  const subscriber = createRedisClient(undefined, { keyPrefix: '' });

  subscriber.psubscribe('events:*', (err) => {
    if (err) logger.error({ err }, 'Failed to psubscribe to events:*');
    else logger.info('WebSocket subscribed to Redis events:* channel');
  });

  subscriber.on('pmessage', (_pattern, _channel, message) => {
    try {
      const envelope = JSON.parse(message) as EventEnvelope;
      if (!envelope.event) return;
      const { data } = envelope;
      const projectId = data?.['projectId'] as string | undefined;
      const tenantId = data?.['tenantId'] as string | undefined;
      const userId = data?.['userId'] as string | undefined;

      // Project-scoped events go to connected SDKs; tenant/user events go to
      // the dashboard sessions. An event can target more than one.
      if (projectId) io.to(`events:${projectId}`).emit(envelope.event, data);
      if (userId) io.to(`user:${userId}`).emit(envelope.event, data);
      if (tenantId && !userId) io.to(`tenant:${tenantId}`).emit(envelope.event, data);
    } catch (err) {
      logger.warn({ err: (err as Error).message }, 'Dropped malformed event message');
    }
  });

  return io;
}
