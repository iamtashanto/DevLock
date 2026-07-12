'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useAuthStore } from '@/stores/auth-store';
import { PageHeader } from '@/components/shared/page-header';
import { EmptyState } from '@/components/shared/empty-state';
import { CardsSkeleton } from '@/components/shared/loading-skeleton';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { formatRelative } from '@/lib/utils';
import { ActivitySquare, User, MonitorSmartphone } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface AuditLog {
  _id: string;
  action: string;
  actor: { type: string; id?: string; ip?: string; userAgent?: string };
  resource: { type: string; id: string };
  timestamp: string;
}

export default function AuditLogsPage() {
  const user = useAuthStore(state => state.user);
  
  const { data, isLoading } = useQuery({
    queryKey: ['audit-logs', user?.orgId],
    queryFn: async () => {
      // The API client automatically unwraps { success: true, data: logs }
      if (!user?.orgId) return [];
      const res = await apiClient.get<AuditLog[]>(`/organizations/${user.orgId}/audit-logs`);
      return res || [];
    },
    enabled: !!user?.orgId,
  });

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Audit Logs" 
        description="Track all actions and events within your organization." 
      />

      {isLoading ? (
        <CardsSkeleton count={3} />
      ) : !data?.length ? (
        <EmptyState
          icon={ActivitySquare}
          title="No activity yet"
          description="Actions performed in your organization will appear here."
        />
      ) : (
        <div className="space-y-4">
          {data.map((log) => (
            <Card key={log._id} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="flex items-center gap-4 p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    {log.actor.type === 'user' ? <User className="h-5 w-5" /> : <MonitorSmartphone className="h-5 w-5" />}
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {log.action}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Resource: {log.resource.type} ({log.resource.id})
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1 text-right">
                    <Badge variant="outline" className="capitalize">
                      {log.actor.type}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatRelative(log.timestamp)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
