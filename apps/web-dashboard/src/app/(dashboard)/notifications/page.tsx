'use client';

import { useNotificationStore } from '@/stores/notification-store';
import { PageHeader } from '@/components/shared/page-header';
import { EmptyState } from '@/components/shared/empty-state';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bell, CheckCheck, Info, AlertTriangle, AlertCircle, CheckCircle } from 'lucide-react';
import { formatRelative } from '@/lib/utils';
import { cn } from '@/lib/utils';

const typeIcons = {
  info: Info,
  warning: AlertTriangle,
  error: AlertCircle,
  success: CheckCircle,
};

export default function NotificationsPage() {
  const { notifications, markRead, markAllRead, unreadCount } = useNotificationStore();

  return (
    <div className="space-y-6">
      <PageHeader title="Notifications" description="Stay updated on your projects">
        {unreadCount > 0 && (
          <Button variant="outline" onClick={markAllRead}>
            <CheckCheck className="mr-2 h-4 w-4" />
            Mark all read
          </Button>
        )}
      </PageHeader>

      {notifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No notifications"
          description="You're all caught up! Notifications about your projects will appear here."
        />
      ) : (
        <div className="space-y-2">
          {notifications.map((notification) => {
            const Icon = typeIcons[notification.type] || Info;
            return (
              <Card
                key={notification.id}
                className={cn(
                  'cursor-pointer transition-colors hover:bg-accent/50',
                  !notification.read && 'border-l-4 border-l-primary'
                )}
                onClick={() => markRead(notification.id)}
              >
                <CardContent className="flex items-start gap-3 p-4">
                  <div
                    className={cn(
                      'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                      notification.type === 'error' && 'bg-destructive/10 text-destructive',
                      notification.type === 'warning' && 'bg-yellow-500/10 text-yellow-600',
                      notification.type === 'success' && 'bg-green-500/10 text-green-600',
                      notification.type === 'info' && 'bg-blue-500/10 text-blue-600'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className={cn('text-sm font-medium', !notification.read && 'font-semibold')}>
                        {notification.title}
                      </p>
                      <span className="text-xs text-muted-foreground">
                        {formatRelative(notification.createdAt)}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{notification.message}</p>
                  </div>
                  {!notification.read && (
                    <div className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary" />
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
