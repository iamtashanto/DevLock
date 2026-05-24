'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { configService, type FeatureFlag } from '@/services/config.service';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { EmptyState } from '@/components/shared/empty-state';
import { TableSkeleton } from '@/components/shared/loading-skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Flag, Trash2 } from 'lucide-react';
import { formatRelative } from '@/lib/utils';

export default function FlagsPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [newFlag, setNewFlag] = useState({ key: '', name: '', description: '' });

  const { data: flags, isLoading } = useQuery({
    queryKey: ['flags', projectId],
    queryFn: () => configService.listFlags(projectId),
    enabled: !!projectId,
  });

  const toggleMutation = useMutation({
    mutationFn: ({ flagId, enabled }: { flagId: string; enabled: boolean }) =>
      configService.toggleFlag(projectId, flagId, enabled),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['flags', projectId] }),
  });

  const createMutation = useMutation({
    mutationFn: () => configService.createFlag(projectId, newFlag),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flags', projectId] });
      setCreateOpen(false);
      setNewFlag({ key: '', name: '', description: '' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (flagId: string) => configService.deleteFlag(projectId, flagId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['flags', projectId] }),
  });

  if (isLoading) {
    return <TableSkeleton rows={4} cols={3} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Feature Flags</h2>
          <p className="text-sm text-muted-foreground">
            Toggle features remotely for your application
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Flag
        </Button>
      </div>

      {!flags?.length ? (
        <EmptyState
          icon={Flag}
          title="No feature flags"
          description="Create feature flags to remotely toggle features in your application"
          actionLabel="Add Flag"
          onAction={() => setCreateOpen(true)}
        />
      ) : (
        <div className="space-y-3">
          {flags.map((flag) => (
            <Card key={flag.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{flag.name}</p>
                    <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{flag.key}</code>
                  </div>
                  {flag.description && (
                    <p className="mt-1 text-sm text-muted-foreground">{flag.description}</p>
                  )}
                  <p className="mt-1 text-xs text-muted-foreground">
                    Updated {formatRelative(flag.updatedAt)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Switch
                    checked={flag.enabled}
                    onCheckedChange={(enabled) =>
                      toggleMutation.mutate({ flagId: flag.id, enabled })
                    }
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => deleteMutation.mutate(flag.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Flag Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent onClose={() => setCreateOpen(false)}>
          <DialogHeader>
            <DialogTitle>Create Feature Flag</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="flag-name">Name</Label>
              <Input
                id="flag-name"
                placeholder="Dark Mode"
                value={newFlag.name}
                onChange={(e) => setNewFlag({ ...newFlag, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="flag-key">Key</Label>
              <Input
                id="flag-key"
                placeholder="dark_mode"
                value={newFlag.key}
                onChange={(e) => setNewFlag({ ...newFlag, key: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="flag-desc">Description (optional)</Label>
              <Input
                id="flag-desc"
                placeholder="Enable dark mode for users"
                value={newFlag.description}
                onChange={(e) => setNewFlag({ ...newFlag, description: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => createMutation.mutate()}
              loading={createMutation.isPending}
              disabled={!newFlag.key || !newFlag.name}
            >
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
