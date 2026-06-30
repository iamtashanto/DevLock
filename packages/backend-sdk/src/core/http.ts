import { createHmac } from 'crypto';
import { DevLockError } from '../types.js';

const SDK_VERSION = '1.0.0';
const REQUEST_TIMEOUT = 10_000;
const MAX_RETRIES = 3;
const RETRY_BASE_DELAY = 1000;

/**
 * HTTP client with HMAC signing, retries, and timeout.
 */
export class HttpClient {
  constructor(
    private apiUrl: string,
    private secretKey: string,
    private projectId: string,
  ) {}

  async post<T>(path: string, body: Record<string, unknown>): Promise<T> {
    return this.requestWithRetry<T>('POST', path, body);
  }

  async get<T>(path: string): Promise<T> {
    return this.requestWithRetry<T>('GET', path);
  }

  private async requestWithRetry<T>(method: string, path: string, body?: Record<string, unknown>): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        return await this.request<T>(method, path, body);
      } catch (err) {
        lastError = err as Error;
        // Don't retry 4xx errors (client errors)
        if (err instanceof DevLockError && !err.recoverable) throw err;
        // Wait before retry (exponential backoff with jitter)
        if (attempt < MAX_RETRIES - 1) {
          const delay = RETRY_BASE_DELAY * Math.pow(2, attempt) * (0.5 + Math.random() * 0.5);
          await new Promise((r) => setTimeout(r, delay));
        }
      }
    }

    throw lastError ?? new DevLockError('Request failed after retries', 'MAX_RETRIES');
  }

  private async request<T>(method: string, path: string, body?: Record<string, unknown>): Promise<T> {
    const url = `${this.apiUrl}${path}`;
    const timestamp = Date.now().toString();
    const bodyStr = body ? JSON.stringify(body) : '';

    // HMAC signature: sign(timestamp + body, secretKey)
    const signature = createHmac('sha256', this.secretKey)
      .update(timestamp + bodyStr)
      .digest('hex');

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'X-DevLock-Key': this.projectId,
          'X-DevLock-Timestamp': timestamp,
          'X-DevLock-Signature': signature,
          'X-DevLock-SDK': `node/${SDK_VERSION}`,
          'User-Agent': `DevLock-Node-SDK/${SDK_VERSION}`,
        },
        body: bodyStr || undefined,
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        const message = (errorBody as any)?.error?.message ?? `HTTP ${response.status}`;
        const recoverable = response.status >= 500;
        throw new DevLockError(message, `HTTP_${response.status}`, recoverable);
      }

      return (await response.json()) as T;
    } catch (err) {
      clearTimeout(timeout);
      if (err instanceof DevLockError) throw err;
      if ((err as Error).name === 'AbortError') {
        throw new DevLockError('Request timeout', 'TIMEOUT', true);
      }
      throw new DevLockError((err as Error).message, 'NETWORK_ERROR', true);
    }
  }
}
