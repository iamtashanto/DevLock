import type { OfflineToken, ValidationResponse } from '../types.js';

const STORAGE_PREFIX = 'devlock:';
const CACHE_KEY = `${STORAGE_PREFIX}cache`;
const TOKEN_KEY = `${STORAGE_PREFIX}offline_token`;
const FINGERPRINT_KEY = `${STORAGE_PREFIX}fp`;

interface CachedState {
  response: ValidationResponse;
  timestamp: number;
  version: number;
}

/**
 * Encrypted local cache for offline license validation.
 * Uses localStorage with basic obfuscation (not security-critical,
 * the offline token itself is cryptographically signed).
 */
export class CacheManager {
  private available: boolean;

  constructor() {
    this.available = this.checkAvailability();
  }

  /**
   * Store validation response for offline use.
   */
  saveValidation(response: ValidationResponse): void {
    if (!this.available) return;
    try {
      const cached: CachedState = {
        response,
        timestamp: Date.now(),
        version: response.config?.version ?? 0,
      };
      localStorage.setItem(CACHE_KEY, this.encode(JSON.stringify(cached)));
    } catch {
      // Storage full or blocked — ignore
    }
  }

  /**
   * Retrieve cached validation response.
   */
  getValidation(): CachedState | null {
    if (!this.available) return null;
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      return JSON.parse(this.decode(raw)) as CachedState;
    } catch {
      return null;
    }
  }

  /**
   * Store offline token (Ed25519 signed by server).
   */
  saveOfflineToken(token: string): void {
    if (!this.available) return;
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch {
      // ignore
    }
  }

  /**
   * Retrieve offline token.
   */
  getOfflineToken(): string | null {
    if (!this.available) return null;
    return localStorage.getItem(TOKEN_KEY);
  }

  /**
   * Store device fingerprint.
   */
  saveFingerprint(fp: string): void {
    if (!this.available) return;
    try {
      localStorage.setItem(FINGERPRINT_KEY, fp);
    } catch {
      // ignore
    }
  }

  /**
   * Get stored fingerprint.
   */
  getFingerprint(): string | null {
    if (!this.available) return null;
    return localStorage.getItem(FINGERPRINT_KEY);
  }

  /**
   * Clear all cached data.
   */
  clear(): void {
    if (!this.available) return;
    localStorage.removeItem(CACHE_KEY);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(FINGERPRINT_KEY);
  }

  /**
   * Check if cached data is within grace period.
   */
  isWithinGrace(graceHours: number): boolean {
    const cached = this.getValidation();
    if (!cached) return false;
    const elapsed = Date.now() - cached.timestamp;
    return elapsed < graceHours * 60 * 60 * 1000;
  }

  // ── Obfuscation (not encryption — offline token is the real security) ──

  private encode(data: string): string {
    return btoa(encodeURIComponent(data));
  }

  private decode(data: string): string {
    return decodeURIComponent(atob(data));
  }

  private checkAvailability(): boolean {
    try {
      const test = '__devlock_test__';
      localStorage.setItem(test, '1');
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }
}
