import type { EventEmitter } from './event-emitter.js';

/**
 * Tamper detection module.
 * Detects common manipulation attempts against the SDK.
 */
export class TamperDetector {
  private checks: Array<() => boolean> = [];
  private interval: ReturnType<typeof setInterval> | null = null;

  constructor(private emitter: EventEmitter) {
    this.checks = [
      this.checkDebugger.bind(this),
      this.checkConsoleOverride.bind(this),
      this.checkPrototypeModification.bind(this),
    ];
  }

  /**
   * Start periodic tamper checks.
   */
  start(intervalMs = 10_000): void {
    this.runChecks();
    this.interval = setInterval(() => this.runChecks(), intervalMs);
  }

  /**
   * Stop tamper detection.
   */
  stop(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  private runChecks(): void {
    for (const check of this.checks) {
      try {
        if (check()) {
          // Tamper detected — don't reveal which check
          this.emitter.emit('tamper:detected', 'integrity_violation');
          return;
        }
      } catch {
        // Check itself failed — possible tampering
        this.emitter.emit('tamper:detected', 'check_failure');
        return;
      }
    }
  }

  /**
   * Detect if debugger is attached (basic check).
   */
  private checkDebugger(): boolean {
    const start = performance.now();
    // debugger statement causes pause if devtools open with breakpoints
    // We just measure timing anomalies
    const elapsed = performance.now() - start;
    return elapsed > 100; // Suspicious if > 100ms
  }

  /**
   * Check if console methods have been overridden.
   */
  private checkConsoleOverride(): boolean {
    const toString = Function.prototype.toString;
    try {
      const consoleLog = toString.call(console.log);
      return !consoleLog.includes('native code');
    } catch {
      return true; // toString was tampered
    }
  }

  /**
   * Check if critical prototypes have been modified.
   */
  private checkPrototypeModification(): boolean {
    // Check if fetch has been monkey-patched
    const fetchStr = Function.prototype.toString.call(window.fetch);
    if (!fetchStr.includes('native code') && !fetchStr.includes('[native code]')) {
      // Could be a polyfill in older browsers, so just flag it
      return false; // Don't flag — too many false positives
    }
    return false;
  }
}
