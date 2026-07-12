import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { createServer } from 'http';
import { createLogger } from '@/logger';
import { connectMongo, autoSeed } from '@/database';
import { requestId } from './middleware/request-id.js';
import { rateLimiter } from './middleware/rate-limiter.js';
import { errorHandler } from './middleware/error-handler.js';
import { createRoutes } from './routes/index.js';
import { NotFoundError } from './core/errors/index.js';

const logger = createLogger({ service: 'api-gateway' });
const PORT = Number(process.env['PORT'] ?? 3000);

// ── Create Express App ────────────────────────────────────────────────────────

const app: express.Express = express();

// Trust proxy (behind nginx/load balancer)
app.set('trust proxy', 1);
app.disable('x-powered-by');

// ── Global Middleware ─────────────────────────────────────────────────────────

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
  origin: process.env['CORS_ORIGINS']?.split(',') ?? '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 'Authorization', 'X-Request-ID',
    'X-DevLock-Key', 'X-DevLock-Signature', 'X-DevLock-Timestamp',
  ],
  exposedHeaders: ['X-Request-ID', 'X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset'],
  maxAge: 86400,
}));
app.use(compression({ threshold: 1024 }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false, limit: '1mb' }));
app.use(requestId);

// ── Health Checks ─────────────────────────────────────────────────────────────

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'api-gateway',
    version: process.env['APP_VERSION'] ?? '0.1.0',
    uptime: Math.floor(process.uptime()),
    timestamp: Date.now(),
  });
});

app.get('/health/ready', async (_req, res) => {
  // TODO: Check MongoDB and Redis connectivity
  res.json({ status: 'ready' });
});

// ── API Routes ────────────────────────────────────────────────────────────────

app.use('/v1', createRoutes());

// ── 404 Handler ───────────────────────────────────────────────────────────────

app.use((_req, _res, next) => {
  next(new NotFoundError('Endpoint not found'));
});

// ── Error Handler (must be last) ──────────────────────────────────────────────

app.use(errorHandler);

// ── Bootstrap ─────────────────────────────────────────────────────────────────

async function bootstrap(): Promise<void> {
  try {
    // Connect to MongoDB
    await connectMongo();
    logger.info('MongoDB connected');

    // Run auto-seeding
    await autoSeed();

    // Start HTTP server
    const server = createServer(app);

    // Real-time WebSocket gateway (fail-safe: if it can't start, the API still
    // serves traffic — SDKs fall back to polling, so nothing breaks).
    try {
      const { createWebSocketServer } = await import('./websocket/server.js');
      createWebSocketServer(server);
      logger.info('WebSocket gateway initialised');
    } catch (err) {
      logger.warn({ err }, 'WebSocket gateway failed to start — real-time disabled, polling still works');
    }

    server.listen(PORT, () => {
      logger.info({ port: PORT, env: process.env['NODE_ENV'] ?? 'development' }, 'API Gateway started');
    });

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      logger.info({ signal }, 'Shutdown signal received');
      server.close(() => {
        logger.info('HTTP server closed');
        process.exit(0);
      });
      // Force exit after 30s
      setTimeout(() => process.exit(1), 30_000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (err) {
    logger.fatal({ err }, 'Failed to start API Gateway');
    process.exit(1);
  }
}

// Handle unhandled rejections
process.on('unhandledRejection', (reason) => {
  logger.fatal({ reason }, 'Unhandled rejection');
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  logger.fatal({ err }, 'Uncaught exception');
  process.exit(1);
});

bootstrap();

export { app };
