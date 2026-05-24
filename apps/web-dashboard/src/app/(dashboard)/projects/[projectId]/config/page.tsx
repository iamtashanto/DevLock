'use client';

import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { configService } from '@/services/config.service';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FormSkeleton } from '@/components/shared/loading-skeleton';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { AlertTriangle, Wrench, Bell } from 'lucide-react';
import { useState } from 'react';
import { formatRelative } from '@/lib/utils';

export default function ConfigPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const queryClient = useQueryClient();
  const [killSwitchDialog, setKillSwitchDialog] = useState(false);
  const [killSwitchReason, setKillSwitchReason] = useState('');

  const { data: config, isLoading } = useQuery({
    queryKey: ['config', projectId],
    queryFn: () => configService.getConfig(projectId),
    enabled: !!projectId,
  });

  const maintenanceMutation = useMutation({
    mutationFn: (enabled: boolean) => configService.toggleMaintenance(projectId, enabled),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['config', projectId] }),
  });

  const killSwitchActivateMutation = useMutation({
    mutationFn: (reason: string) => configService.activateKillSwitch(projectId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['config', projectId] });
      setKillSwitchDialog(false);
      setKillSwitchReason('');
    },
  });

  const killSwitchDeactivateMutation = useMutation({
    mutationFn: () => configService.deactivateKillSwitch(projectId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['config', projectId] }),
  });

  if (isLoading) {
    return <FormSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Maintenance Mode */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Wrench className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-base">Maintenance Mode</CardTitle>
          </div>
          <CardDescription>
            When enabled, all SDK validations will return a maintenance response
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">
                {config?.maintenance ? 'Enabled' : 'Disabled'}
              </span>
              {config?.maintenance && <Badge variant="warning">Active</Badge>}
            </div>
            <Switch
              checked={config?.maintenance ?? false}
              onCheckedChange={(checked) => maintenanceMutation.mutate(checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Kill Switch */}
      <Card className={config?.killSwitch ? 'border-destructive' : ''}>
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <CardTitle className="text-base">Kill Switch</CardTitle>
          </div>
          <CardDescription>
            Emergency shutdown — immediately disables all license validations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              {config?.killSwitch ? (
                <div className="space-y-1">
                  <Badge variant="destructive">ACTIVATED</Badge>
                  {config.killSwitchReason && (
                    <p className="text-sm text-muted-foreground">
                      Reason: {config.killSwitchReason}
                    </p>
                  )}
                </div>
              ) : (
                <span className="text-sm text-muted-foreground">Not activated</span>
              )}
            </div>
            {config?.killSwitch ? (
              <Button
                variant="outline"
                onClick={() => killSwitchDeactivateMutation.mutate()}
                loading={killSwitchDeactivateMutation.isPending}
              >
                Deactivate
              </Button>
            ) : (
              <Button
                variant="destructive"
                onClick={() => setKillSwitchDialog(true)}
              >
                Activate Kill Switch
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-base">Client Notifications</CardTitle>
          </div>
          <CardDescription>
            Messages displayed to SDK clients on validation
          </CardDescription>
        </CardHeader>
        <CardContent>
          {config?.notifications?.length ? (
            <div className="space-y-3">
              {config.notifications.map((notification) => (
                <div
                  key={notification.id}
                  className="flex items-start justify-between rounded-md border border-border p-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{notification.title}</p>
                      <Badge
                        variant={
                          notification.type === 'critical'
                            ? 'destructive'
                            : notification.type === 'warning'
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
                  <Badge variant={notification.active ? 'success' : 'outline'}>
                    {notification.active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No notifications configured</p>
          )}
        </CardContent>
      </Card>

      {/* Kill Switch Confirmation */}
      <ConfirmDialog
        open={killSwitchDialog}
        onOpenChange={setKillSwitchDialog}
        title="Activate Kill Switch"
        description="This will immediately disable ALL license validations for this project. All SDK clients will receive a kill-switch response. Are you sure?"
        confirmLabel="Activate"
        variant="destructive"
        loading={killSwitchActivateMutation.isPending}
        onConfirm={() => killSwitchActivateMutation.mutate(killSwitchReason || 'Emergency shutdown')}
      />
    </div>
  );
}
