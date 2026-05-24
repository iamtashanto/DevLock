'use client';

import { usePermissions } from '@/hooks/use-permissions';

interface PermissionGateProps {
  permission?: string;
  permissions?: string[];
  requireAll?: boolean;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export function PermissionGate({
  permission,
  permissions,
  requireAll = false,
  fallback = null,
  children,
}: PermissionGateProps) {
  const { can, canAny, canAll } = usePermissions();

  if (permission) {
    if (!can(permission)) return <>{fallback}</>;
    return <>{children}</>;
  }

  if (permissions) {
    const hasAccess = requireAll ? canAll(...permissions) : canAny(...permissions);
    if (!hasAccess) return <>{fallback}</>;
    return <>{children}</>;
  }

  return <>{children}</>;
}
