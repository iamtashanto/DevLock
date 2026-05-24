'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectService } from '@/services/project.service';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { CopyButton } from '@/components/shared/copy-button';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { FormSkeleton } from '@/components/shared/loading-skeleton';
import { PermissionGate } from '@/components/shared/permission-gate';
import { RefreshCw, Trash2 } from 'lucide-react';

export default function ProjectSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;
  const queryClient = useQueryClient();

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [rotateOpen, setRotateOpen] = useState(false);

  const { data: project, isLoading } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => projectService.getById(projectId),
    enabled: !!projectId,
  });

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  // Initialize form when project loads
  useState(() => {
    if (project) {
      setName(project.name);
      setDescription(project.description || '');
    }
  });

  const updateMutation = useMutation({
    mutationFn: () => projectService.update(projectId, { name, description }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
    },
  });

  const rotateMutation = useMutation({
    mutationFn: () => projectService.rotateKeys(projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      setRotateOpen(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => projectService.delete(projectId),
    onSuccess: () => {
      router.push('/projects');
    },
  });

  if (isLoading) {
    return <FormSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* General Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">General</CardTitle>
          <CardDescription>Update your project details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="project-name">Project Name</Label>
            <Input
              id="project-name"
              value={name || project?.name || ''}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="project-desc">Description</Label>
            <Textarea
              id="project-desc"
              value={description || project?.description || ''}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="A brief description of your project"
            />
          </div>
          <Button
            onClick={() => updateMutation.mutate()}
            loading={updateMutation.isPending}
          >
            Save Changes
          </Button>
        </CardContent>
      </Card>

      {/* API Keys */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">API Keys</CardTitle>
          <CardDescription>
            Use these keys to authenticate SDK requests
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>API Key</Label>
            <div className="flex items-center gap-2">
              <Input
                value={project?.apiKey || ''}
                readOnly
                className="font-mono text-xs"
              />
              <CopyButton value={project?.apiKey || ''} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Secret Key</Label>
            <div className="flex items-center gap-2">
              <Input
                value={project?.secretKey || ''}
                readOnly
                type="password"
                className="font-mono text-xs"
              />
              <CopyButton value={project?.secretKey || ''} />
            </div>
          </div>
          <PermissionGate permission="project:rotate_keys">
            <Button
              variant="outline"
              onClick={() => setRotateOpen(true)}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Rotate Keys
            </Button>
          </PermissionGate>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <PermissionGate permission="project:delete">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-base text-destructive">Danger Zone</CardTitle>
            <CardDescription>
              Irreversible actions that will permanently affect this project
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="destructive" onClick={() => setDeleteOpen(true)}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Project
            </Button>
          </CardContent>
        </Card>
      </PermissionGate>

      {/* Rotate Keys Confirmation */}
      <ConfirmDialog
        open={rotateOpen}
        onOpenChange={setRotateOpen}
        title="Rotate API Keys"
        description="This will generate new API and Secret keys. Existing keys will be invalidated immediately. All SDK clients will need to be updated."
        confirmLabel="Rotate Keys"
        variant="destructive"
        loading={rotateMutation.isPending}
        onConfirm={() => rotateMutation.mutate()}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete Project"
        description="This will permanently delete the project and all associated licenses, configurations, and data. This action cannot be undone."
        confirmLabel="Delete Project"
        variant="destructive"
        loading={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate()}
      />
    </div>
  );
}
