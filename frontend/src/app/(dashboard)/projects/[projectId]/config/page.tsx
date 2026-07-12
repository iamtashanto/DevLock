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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertTriangle, Wrench, Bell } from 'lucide-react';
import { useState } from 'react';
import { formatRelative } from '@/lib/utils';

export default function ConfigPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const queryClient = useQueryClient();
  const [killSwitchDialog, setKillSwitchDialog] = useState(false);
  const [killSwitchReason, setKillSwitchReason] = useState('');
  const [killSwitchDialog, setKillSwitchDialog] = useState(false);
  const [killSwitchReason, setKillSwitchReason] = useState('');

  const { data: config, isLoading } = useQuery({
    queryKey: ['config', projectId],
    queryFn: () => configService.getConfig(projectId),
    enabled: !!projectId,
  });

  const updateConfigMutation = useMutation({
    mutationFn: (data: any) => configService.updateConfig(projectId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['config', projectId] });
    },
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


      {/* Kill Switch Confirmation */}
      <Dialog open={killSwitchDialog} onOpenChange={setKillSwitchDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive">Activate Kill Switch</DialogTitle>
            <DialogDescription>
              This will immediately disable ALL license validations for this project. All SDK clients will receive a kill-switch response. Are you sure?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Lock Message / Reason</Label>
              <Input
                id="reason"
                placeholder="e.g. Payment Due"
                value={killSwitchReason}
                onChange={(e) => setKillSwitchReason(e.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                This message will be sent to the SDK clients and displayed to the end-users.
              </p>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setKillSwitchDialog(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => killSwitchActivateMutation.mutate(killSwitchReason || 'Emergency shutdown')}
                disabled={killSwitchActivateMutation.isPending}
              >
                {killSwitchActivateMutation.isPending ? 'Activating...' : 'Activate'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}
