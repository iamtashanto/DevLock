'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { disconnectSocket } from '@/lib/socket';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const logout = useAuthStore((state) => state.logout);

  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      // Cross-tab logout: if access_token is removed in another tab
      if (event.key === 'access_token' && event.newValue === null) {
        disconnectSocket();
        logout();
        window.location.href = '/login';
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [logout]);

  return <>{children}</>;
}
