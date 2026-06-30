import { io, type Socket } from 'socket.io-client';
import type { Logger } from '../types.js';

type EventHandler = (...args: unknown[]) => void;

/**
 * WebSocket manager for real-time server-to-SDK communication.
 */
export class WebSocketManager {
  private socket: Socket | null = null;
  private handlers = new Map<string, EventHandler[]>();

  constructor(
    private wsUrl: string,
    private secretKey: string,
    private projectId: string,
    private logger: Logger,
  ) {}

  connect(): void {
    if (this.socket?.connected) return;

    this.socket = io(this.wsUrl, {
      auth: { apiKey: this.secretKey, projectId: this.projectId },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 30_000,
    });

    this.socket.on('connect', () => {
      this.logger.debug('[DevLock] WebSocket connected');
      this.emit('connection:change', true);
    });

    this.socket.on('disconnect', () => {
      this.logger.debug('[DevLock] WebSocket disconnected');
      this.emit('connection:change', false);
    });

    // Forward server events
    const events = [
      'killswitch:activated', 'killswitch:deactivated',
      'maintenance:enabled', 'maintenance:disabled',
      'license:suspended', 'license:revoked', 'license:renewed',
      'config:updated', 'feature:toggled',
      'api:suspended', 'api:resumed',
    ];

    for (const event of events) {
      this.socket.on(event, (data: unknown) => this.emit(event, data));
    }
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
  }

  on(event: string, handler: EventHandler): () => void {
    if (!this.handlers.has(event)) this.handlers.set(event, []);
    this.handlers.get(event)!.push(handler);
    return () => {
      const arr = this.handlers.get(event);
      if (arr) {
        const idx = arr.indexOf(handler);
        if (idx >= 0) arr.splice(idx, 1);
      }
    };
  }

  sendHeartbeat(data: Record<string, unknown>): void {
    this.socket?.emit('heartbeat', data);
  }

  sendTelemetry(events: unknown[]): void {
    this.socket?.emit('telemetry:batch', { events });
  }

  get connected(): boolean {
    return this.socket?.connected ?? false;
  }

  private emit(event: string, ...args: unknown[]): void {
    this.handlers.get(event)?.forEach((h) => {
      try { h(...args); } catch { /* swallow listener errors */ }
    });
  }
}
