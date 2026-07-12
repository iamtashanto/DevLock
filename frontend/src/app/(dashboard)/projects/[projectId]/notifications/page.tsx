'use client';

import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { configService } from '@/services/config.service';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FormSkeleton } from '@/components/shared/loading-skeleton';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Bell } from 'lucide-react';
import { useState } from 'react';
import { formatRelative } from '@/lib/utils';

export default function NotificationsPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const queryClient = useQueryClient();
  const [notifDialog, setNotifDialog] = useState(false);
  const [notifMessage, setNotifMessage] = useState('');
  const [notifType, setNotifType] = useState('payment');

  const { data: config, isLoading } = useQuery({
    queryKey: ['config', projectId],
    queryFn: () => configService.getConfig(projectId),
    enabled: !!projectId,
  });

  const updateConfigMutation = useMutation({
    mutationFn: (data: any) => configService.updateConfig(projectId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['config', projectId] });
      setNotifDialog(false);
      setNotifMessage('');
    },
  });

  if (isLoading) {
    return <FormSkeleton />;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-base">Client Notifications</CardTitle>
          </div>
          <CardDescription>
            Manage broadcast messages displayed to all your SDK clients on validation.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-medium">Active Notifications</h3>
            <Button size="sm" onClick={() => setNotifDialog(true)}>
              Add Notification
            </Button>
          </div>
          {config?.notifications?.length ? (
            <div className="space-y-3">
              {config.notifications.map((notification: any) => (
                <div
                  key={notification.id}
                  className="flex items-start justify-between rounded-md border border-border p-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{notification.title || notification.type}</p>
                      <Badge
                        variant={
                          notification.type === 'critical' || notification.type === 'error'
                            ? 'destructive'
                            : notification.type === 'payment' || notification.type === 'warning'
                            ? 'warning'
                            : 'secondary'
                        }
                      >
                        {notification.type}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{notification.message}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatRelative(notification.createdAt)}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive"
                    onClick={() => {
                      updateConfigMutation.mutate({
                        notifications: config.notifications.filter((n: any) => n.id !== notification.id)
                      });
                    }}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No notifications configured</p>
          )}
        </CardContent>
      </Card>

      <Dialog open={notifDialog} onOpenChange={setNotifDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Notification</DialogTitle>
            <DialogDescription>
              Create a message that will be shown in the client application.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <select
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={notifType}
                onChange={(e) => setNotifType(e.target.value)}
              >
                <option value="payment">Payment Warning</option>
                <option value="warning">General Warning</option>
                <option value="error">Error</option>
                <option value="info">Info</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Message</Label>
              <Input
                placeholder="e.g. Payment is due next week."
                value={notifMessage}
                onChange={(e) => setNotifMessage(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setNotifDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  const newNotif = {
                    id: Math.random().toString(36).substring(7),
                    title: notifType === 'payment' ? 'Payment Due' : notifType.toUpperCase(),
                    type: notifType,
                    severity: notifType === 'payment' ? 'high' : 'medium',
                    message: notifMessage,
                    active: true,
                    dismissible: true,
                    createdAt: new Date().toISOString(),
                  };
                  updateConfigMutation.mutate({
                    notifications: [...(config?.notifications || []), newNotif],
                  });
                }}
                disabled={!notifMessage || updateConfigMutation.isPending}
              >
                {updateConfigMutation.isPending ? 'Adding...' : 'Add'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
