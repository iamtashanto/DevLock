export class ApiError extends Error {
  constructor(
    public status: number,
    public override message: string,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

type RequestOptions = {
  headers?: Record<string, string>;
  params?: Record<string, string | number | boolean | undefined>;
  signal?: AbortSignal;
};

class ApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl =
      process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/v1';
  }

  private getToken(): string | null {
    if (typeof window === 'undefined') return null;
    // Try direct localStorage first (set during login)
    const direct = localStorage.getItem('access_token');
    if (direct) return direct;
    // Fallback: read from Zustand persisted state
    try {
      const stored = localStorage.getItem('devlock-auth');
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed?.state?.accessToken || null;
      }
    } catch {}
    return null;
  }

  private buildUrl(path: string, params?: Record<string, string | number | boolean | undefined>): string {
    const url = new URL(`${this.baseUrl}${path}`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          url.searchParams.append(key, String(value));
        }
      });
    }
    return url.toString();
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    options?: RequestOptions
  ): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options?.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const url = this.buildUrl(path, options?.params);

    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: options?.signal,
    });

    if (response.status === 401) {
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
        // Do not force logout aggressively, just throw ApiError. 
        // The dashboard layout or specific components will handle redirects.
      }
      throw new ApiError(401, 'Unauthorized', 'UNAUTHORIZED');
    }

    if (!response.ok) {
      const body = await response.json().catch(() => ({
        error: { message: 'An unexpected error occurred', code: 'UNKNOWN_ERROR' },
      }));
      // Backend returns { success: false, error: { code, message, details } }
      const errorData = body.error || body;
      const message = errorData.message || 'Request failed';
      const details = errorData.details;
      throw new ApiError(
        response.status,
        details ? `${message}: ${Array.isArray(details) ? details.map((d: any) => d.message).join(', ') : JSON.stringify(details)}` : message,
        errorData.code
      );
    }

    if (response.status === 204) {
      return undefined as T;
    }

    const json = await response.json();
    // Backend wraps responses in { success: true, data: ... }
    // Unwrap automatically
    if (json && typeof json === 'object' && 'success' in json && 'data' in json) {
      return json.data as T;
    }
    return json as T;
  }

  async get<T>(path: string, options?: RequestOptions): Promise<T> {
    return this.request<T>('GET', path, undefined, options);
  }

  async post<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>('POST', path, body, options);
  }

  async put<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>('PUT', path, body, options);
  }

  async patch<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>('PATCH', path, body, options);
  }

  async delete<T>(path: string, options?: RequestOptions): Promise<T> {
    return this.request<T>('DELETE', path, undefined, options);
  }
}

export const apiClient = new ApiClient();
