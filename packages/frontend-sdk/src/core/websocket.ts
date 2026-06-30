import { io, type Socket } from 'socket.io-client';
import type { EventEmitter } from './event-emitter.js';

/**
 * WebSocket manager for real-time updates from DevLock server.
 */
export class WebSocketManager {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;

  constructor(
    private emitter: EventEmitter,
    private wsUrl: string,
    private projectKey: string,
  ) {}

  /**
   * Connect to WebSocket server.
   */
  connect(): void {
    if (this.socket?.connected) return;

    this.socket = io(this.wsUrl, {
      auth: { apiKey: this.projectKey, projectId: this.projectKey },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 30_000,
      timeout: 10_000,
    });

    this.socket.on('connect', () => {
      this.reconnectAttempts = 0;
      this.emitter.emit('connection:change', true);
    });

    this.socket.on('disconnect', () => {
      this.emitter.emit('connection:change', false);
    });

    // Server events
    this.socket.on('license:suspended', (data) => {
      this.emitter.emit('license:suspended', data.reason ?? 'License suspended');
    });

    this.socket.on('license:revoked', (data) => {
      this.emitter.emit('license:invalid', data.reason ?? 'License revoked');
    });

    this.socket.on('license:renewed', () => {
      this.emitter.emit('license:valid', {});
    });

    this.socket.on('maintenance:enabled', (data) => {
      this.emitter.emit('maintenance:enabled', data);
    });

    this.socket.on('maintenance:disabled', () => {
      this.emitter.emit('maintenance:disabled');
    });

    this.socket.on('killswitch:activated', (data) => {
      this.emitter.emit('killswitch:activated', data);
    });

    this.socket.on('killswitch:deactivated', () => {
      this.emitter.emit('killswitch:deactivated');
    });

    this.socket.on('notification:push', (data) => {
      this.emitter.emit('notification:push', data);
    });

    this.socket.on('feature:toggled', (data) => {
      this.emitter.emit('feature:toggled', data.flag, data.enabled);
    });

    this.socket.on('config:updated', (data) => {
      this.emitter.emit('config:updated', data);
    });

    this.socket.on('popup:show', (data) => {
      this.emitter.emit('popup:show', data);
    });

    this.socket.on('domain:blocked', (data) => {
      this.emitter.emit('domain:blocked', data.domain);
    });
  }

  /**
   * Send heartbeat to server.
   */
  heartbeat(data: { sdkVersion: string; configVersion: number; uptime: number }): void {
    this.socket?.emit('heartbeat', data);
  }

  /**
   * Send telemetry batch.
   */
  sendTelemetry(events: Array<{ type: string; timestamp: number; metadata?: Record<string, unknown> }>): void {
    this.socket?.emit('telemetry:batch', { events });
  }

  /**
   * Disconnect from WebSocket server.
   */
  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
  }

  /**
   * Check if connected.
   */
  get connected(): boolean {
    return this.socket?.connected ?? false;
  }
}
