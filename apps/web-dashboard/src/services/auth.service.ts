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

export const authService = {
  async login(data: LoginRequest): Promise<{ accessToken: string; user: User }> {
    const response = await apiClient.post<AuthResponse>('/auth/login', data);
    // Store token temporarily to fetch user profile
    localStorage.setItem('access_token', response.accessToken);
    const user = await apiClient.get<any>('/auth/me');
    return {
      accessToken: response.accessToken,
      user: {
        id: user.userId,
        name: '', // Will be fetched properly later
        email: data.email,
        role: user.role,
        orgId: user.orgId,
        permissions: user.permissions,
      },
    };
  },

  async register(data: RegisterRequest): Promise<{ accessToken: string; user: User }> {
    const response = await apiClient.post<AuthResponse>('/auth/register', data);
    // Store token temporarily to fetch user profile
    localStorage.setItem('access_token', response.accessToken);
    const user = await apiClient.get<any>('/auth/me');
    return {
      accessToken: response.accessToken,
      user: {
        id: user.userId,
        name: data.name,
        email: data.email,
        role: user.role,
        orgId: user.orgId,
        permissions: user.permissions,
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
