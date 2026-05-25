import { apiClient } from '@/lib/api-client';
import type { User } from '@/stores/auth-store';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  organizationName: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

interface RefreshResponse {
  accessToken: string;
}

function decodeJwtPayload(token: string): Record<string, any> {
  const parts = token.split('.');
  const payload = parts[1] ?? '';
  return JSON.parse(atob(payload));
}

export const authService = {
  async login(data: LoginRequest): Promise<{ accessToken: string; user: User }> {
    const response = await apiClient.post<AuthResponse>('/auth/login', data);
    // Store token to make subsequent requests work
    localStorage.setItem('access_token', response.accessToken);
    try {
      const me = await apiClient.get<any>('/auth/me');
      return {
        accessToken: response.accessToken,
        user: {
          id: me.userId,
          name: me.name || (data.email.split('@')[0] || data.email),
          email: data.email,
          role: me.role,
          orgId: me.orgId,
          permissions: me.permissions || [],
        },
      };
    } catch {
      // If /me fails, construct user from JWT payload
      const payload = decodeJwtPayload(response.accessToken);
      return {
        accessToken: response.accessToken,
        user: {
          id: payload.sub,
          name: (data.email.split('@')[0] || data.email),
          email: data.email,
          role: payload.role,
          orgId: payload.orgId,
          permissions: payload.permissions || [],
        },
      };
    }
  },

  async register(data: RegisterRequest): Promise<{ accessToken: string; user: User }> {
    const response = await apiClient.post<AuthResponse>('/auth/register', data);
    // Decode user info from JWT (no need to call /me)
    const payload = decodeJwtPayload(response.accessToken);
    localStorage.setItem('access_token', response.accessToken);
    return {
      accessToken: response.accessToken,
      user: {
        id: payload.sub,
        name: data.name,
        email: data.email,
        role: payload.role,
        orgId: payload.orgId,
        permissions: payload.permissions || [],
      },
    };
  },

  refresh(refreshToken: string): Promise<RefreshResponse> {
    return apiClient.post<RefreshResponse>('/auth/refresh', { refreshToken });
  },

  logout(): Promise<void> {
    return apiClient.post<void>('/auth/logout');
  },

  getMe(): Promise<User> {
    return apiClient.get<User>('/auth/me');
  },

  forgotPassword(email: string): Promise<{ message: string }> {
    return apiClient.post<{ message: string }>('/auth/forgot-password', { email });
  },

  resetPassword(token: string, password: string): Promise<{ message: string }> {
    return apiClient.post<{ message: string }>('/auth/reset-password', { token, password });
  },
};
