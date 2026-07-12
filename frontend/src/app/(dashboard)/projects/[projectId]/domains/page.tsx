'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectService } from '@/services/project.service';
import { configService } from '@/services/config.service';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EmptyState } from '@/components/shared/empty-state';
import { TableSkeleton } from '@/components/shared/loading-skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Plus, Globe, Trash2 } from 'lucide-react';

export default function DomainsPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [newDomain, setNewDomain] = useState('');
  const [error, setError] = useState('');

  const { data: domains, isLoading } = useQuery({
    queryKey: ['domains', projectId],
    queryFn: () => projectService.listDomains(projectId),
    enabled: !!projectId,
  });

  const { data: config, isLoading: isConfigLoading } = useQuery({
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

  const addMutation = useMutation({
    mutationFn: (domain: string) => projectService.addDomain(projectId, domain),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['domains', projectId] });
      setCreateOpen(false);
      setNewDomain('');
      setError('');
    },
    onError: (err: any) => setError(err?.message || 'Failed to add domain'),
  });

  const removeMutation = useMutation({
    mutationFn: (domain: string) => projectService.removeDomain(projectId, domain),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['domains', projectId] }),
  });

  if (isLoading || isConfigLoading) {
    return <TableSkeleton rows={3} cols={2} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Allowed Domains</h2>
          <p className="text-sm text-muted-foreground">
            Domains authorized to validate licenses for this project. Leave empty to allow any domain.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Domain
        </Button>
      </div>

      {/* Domain Lock Enforcement Policy */}
      <Card>
        <CardContent className="flex items-center justify-between p-4">
          <div className="space-y-1">
            <h3 className="font-medium">Enforcement Policy</h3>
            <p className="text-sm text-muted-foreground">
              What should happen if a license is used on an unauthorized domain?
            </p>
          </div>
          <div className="flex flex-col gap-2 w-1/3">
            <select
              className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={config?.domainLock?.action || 'warn'}
              onChange={(e) => {
                updateConfigMutation.mutate({
                  domainLock: {
                    enabled: true,
                    action: e.target.value,
                    domains: domains || []
                  }
                });
              }}
              disabled={updateConfigMutation.isPending}
            >
              <option value="warn">Warn (Audit log only)</option>
              <option value="block">Block (Invalidate validation request)</option>
              <option value="kill">Kill (Trigger Kill Switch for license)</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {!domains?.length ? (
        <EmptyState
          icon={Globe}
          title="No domains configured"
          description="Add domains that are authorized to validate licenses. While empty, validation is allowed from any domain."
          actionLabel="Add Domain"
          onAction={() => setCreateOpen(true)}
        />
      ) : (
        <div className="space-y-3">
          {domains.map((domain) => (
            <Card key={domain}>
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <Globe className="h-5 w-5 text-muted-foreground" />
                  <p className="font-medium">{domain}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={() => removeMutation.mutate(domain)}
                  disabled={removeMutation.isPending}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Domain Dialog */}
      <Dialog open={createOpen} onOpenChange={(open) => { setCreateOpen(open); if (!open) setError(''); }}>
        <DialogContent onClose={() => setCreateOpen(false)}>
          <DialogHeader>
            <DialogTitle>Add Allowed Domain</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-4">
            <Input
              placeholder="app.example.com"
              value={newDomain}
              onChange={(e) => setNewDomain(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && newDomain.trim()) addMutation.mutate(newDomain.trim()); }}
            />
            <p className="text-xs text-muted-foreground">
              Enter the hostname only — the protocol, port and path are stripped automatically.
            </p>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => addMutation.mutate(newDomain.trim())}
              loading={addMutation.isPending}
              disabled={!newDomain.trim()}
            >
              Add
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
