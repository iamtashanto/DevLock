import type { DevLockEvent } from '../types.js';

type Listener = (...args: any[]) => void;

/**
 * Lightweight typed event emitter for SDK internal communication.
 */
export class EventEmitter {
  private listeners = new Map<string, Set<Listener>>();

  on(event: DevLockEvent, listener: Listener): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);

    // Return unsubscribe function
    return () => {
      this.listeners.get(event)?.delete(listener);
    };
  }

  once(event: DevLockEvent, listener: Listener): () => void {
    const wrapper: Listener = (...args) => {
      this.off(event, wrapper);
      listener(...args);
    };
    return this.on(event, wrapper);
  }

  off(event: DevLockEvent, listener: Listener): void {
    this.listeners.get(event)?.delete(listener);
  }

  emit(event: DevLockEvent, ...args: unknown[]): void {
    this.listeners.get(event)?.forEach((listener) => {
      try {
        listener(...args);
      } catch (err) {
        console.error(`[DevLock] Error in event listener for "${event}":`, err);
      }
    });
  }

  removeAllListeners(event?: DevLockEvent): void {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
  }
}
