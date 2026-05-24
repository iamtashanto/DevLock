import { Badge } from '@/components/ui/badge';
import type { LicenseStatus } from '@/services/license.service';

const statusConfig: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'success' | 'warning' | 'outline'; label: string }> = {
  active: { variant: 'success', label: 'Active' },
  expired: { variant: 'secondary', label: 'Expired' },
  suspended: { variant: 'warning', label: 'Suspended' },
  revoked: { variant: 'destructive', label: 'Revoked' },
  trial: { variant: 'outline', label: 'Trial' },
  archived: { variant: 'secondary', label: 'Archived' },
  verified: { variant: 'success', label: 'Verified' },
  pending: { variant: 'warning', label: 'Pending' },
  failed: { variant: 'destructive', label: 'Failed' },
};

interface StatusBadgeProps {
  status: LicenseStatus | string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] || { variant: 'outline' as const, label: status };

  return (
    <Badge variant={config.variant} className={className}>
      {config.label}
    </Badge>
  );
}
