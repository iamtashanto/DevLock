'use client';

import { useAuthStore } from '@/stores/auth-store';

export function usePermissions() {
  const user = useAuthStore((state) => state.user);
  const permissions = user?.permissions ?? [];

  const can = (permission: string): boolean => {
    return permissions.includes(permission);
  };

  const canAny = (...perms: string[]): boolean => {
    return perms.some((p) => permissions.includes(p));
  };

  const canAll = (...perms: string[]): boolean => {
    return perms.every((p) => permissions.includes(p));
  };

  return { can, canAny, canAll, permissions, role: user?.role };
}
