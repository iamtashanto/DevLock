'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { authService, type LoginRequest, type RegisterRequest } from '@/services/auth.service';
import { disconnectSocket } from '@/lib/socket';

export function useAuth() {
  const router = useRouter();
  const { user, accessToken, setAuth, logout: clearAuth, isAuthenticated } = useAuthStore();

  const login = useCallback(
    async (data: LoginRequest) => {
      const response = await authService.login(data);
      setAuth(response.accessToken, response.user);
      router.push('/');
      return response;
    },
    [setAuth, router]
  );

  const register = useCallback(
    async (data: RegisterRequest) => {
      const response = await authService.register(data);
      setAuth(response.accessToken, response.user);
      router.push('/');
      return response;
    },
    [setAuth, router]
  );

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      // Ignore logout API errors
    } finally {
      disconnectSocket();
      clearAuth();
      router.push('/login');
    }
  }, [clearAuth, router]);

  const refreshUser = useCallback(async () => {
    const me = await authService.getMe();
    useAuthStore.getState().setUser(me);
    return me;
  }, []);

  return {
    user,
    accessToken,
    isAuthenticated: isAuthenticated(),
    login,
    register,
    logout,
    refreshUser,
  };
}
