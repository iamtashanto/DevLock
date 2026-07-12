'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { licenseService, type LicenseStatus } from '@/services/license.service';
import { PageHeader } from '@/components/shared/page-header';
import { EmptyState } from '@/components/shared/empty-state';
import { StatusBadge } from '@/components/shared/status-badge';
import { TableSkeleton } from '@/components/shared/loading-skeleton';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Plus, Search, Key, MoreVertical, Ban, RotateCcw, XCircle, Copy, CheckCircle2 } from 'lucide-react';
import { useDebounce } from '@/hooks/use-debounce';
import { formatRelative } from '@/lib/utils';

export default function LicensesPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createError, setCreateError] = useState('');
  const [createData, setCreateData] = useState({
    holderName: '',
    holderEmail: '',
    type: 'perpetual',
    maxDevices: 1,
    expiresAt: '',
  });

  const [newLicenseKey, setNewLicenseKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const [confirmAction, setConfirmAction] = useState<{
    type: 'suspend' | 'revoke';
    licenseId: string;
  } | null>(null);

  const debouncedSearch = useDebounce(search, 300);

  const { data, isLoading } = useQuery({
    queryKey: ['licenses', projectId, { search: debouncedSearch, status: statusFilter }],
    queryFn: () =>
      licenseService.list(projectId, {
        search: debouncedSearch || undefined,
        status: (statusFilter as LicenseStatus) || undefined,
      }),
    enabled: !!projectId,
  });

  const createMutation = useMutation({
    mutationFn: (payload: any) => licenseService.create(projectId, payload),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['licenses', projectId] });
      setIsCreateOpen(false);
      setNewLicenseKey(data.key || data.data?.key || data.license?.key || data.data?.license?.key || 'Failed to retrieve key from response, check audit logs');
      setCreateData({
        holderName: '',
        holderEmail: '',
        type: 'node',
        maxDevices: 1,
        expiresAt: '',
      });
    },
    onError: (err: any) => {
      setCreateError(err.message || 'Failed to create license');
    }
  });

  const handleCreateLicense = (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError('');
    createMutation.mutate({
      holder: {
        name: createData.holderName,
        email: createData.holderEmail,
      },
      type: createData.type,
      maxDevices: createData.maxDevices,
      expiresAt: createData.expiresAt ? new Date(createData.expiresAt).toISOString() : undefined,
    });
  };

  const suspendMutation = useMutation({
    mutationFn: (licenseId: string) => licenseService.suspend(projectId, licenseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['licenses', projectId] });
      setConfirmAction(null);
    },
  });

  const revokeMutation = useMutation({
    mutationFn: (licenseId: string) => licenseService.revoke(projectId, licenseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['licenses', projectId] });
      setConfirmAction(null);
    },
  });

  const reactivateMutation = useMutation({
    mutationFn: (licenseId: string) => licenseService.reactivate(projectId, licenseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['licenses', projectId] });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search licenses..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-64 pl-9"
            />
          </div>
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-36"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="expired">Expired</option>
            <option value="suspended">Suspended</option>
            <option value="revoked">Revoked</option>
            <option value="trial">Trial</option>
          </Select>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create License
        </Button>
      </div>

      {isLoading ? (
        <TableSkeleton rows={5} cols={6} />
      ) : !data?.licenses?.length ? (
        <EmptyState
          icon={Key}
          title="No licenses found"
          description="Create your first license key for this project"
          actionLabel="Create License"
          onAction={() => setIsCreateOpen(true)}
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Holder</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Devices</TableHead>
              <TableHead>Expires</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.licenses.map((license) => (
              <TableRow key={license.id}>
                <TableCell>
                  <div>
                    <p className="font-medium">{license.holder.name}</p>
                    <p className="text-xs text-muted-foreground">{license.holder.email}</p>
                  </div>
                </TableCell>
                <TableCell className="capitalize">{license.type}</TableCell>
                <TableCell>
                  <StatusBadge status={license.status} />
                </TableCell>
                <TableCell>
                  {license.currentDevices}/{license.maxDevices}
                </TableCell>
                <TableCell>
                  {license.expiresAt ? formatRelative(license.expiresAt) : 'Never'}
                </TableCell>
                <TableCell>
                  <DropdownMenu
                    trigger={
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    }
                  >
                    {license.status === 'active' && (
                      <DropdownMenuItem
                        onClick={() => setConfirmAction({ type: 'suspend', licenseId: license.id })}
                      >
                        <Ban className="mr-2 h-4 w-4" />
                        Suspend
                      </DropdownMenuItem>
                    )}
                      {(license.status === 'suspended' || license.status === 'expired') && (
                        <DropdownMenuItem
                          onClick={() => reactivateMutation.mutate(license.id)}
                        >
                          <RotateCcw className="mr-2 h-4 w-4" />
                          Reactivate
                        </DropdownMenuItem>
                      )}
                      {license.status !== 'revoked' && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600 focus:text-red-600"
                            onClick={() => setConfirmAction({ type: 'revoke', licenseId: license.id })}
                          >
                            <XCircle className="mr-2 h-4 w-4" />
                            Revoke
                          </DropdownMenuItem>
                        </>
                      )}
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Create License Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent onClose={() => setIsCreateOpen(false)}>
          <DialogHeader>
            <DialogTitle>Create License</DialogTitle>
            <DialogDescription>
              Generate a new license key for this project. The key is shown once after creation.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateLicense} className="space-y-4 py-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="holder-name">Customer Name</Label>
                <Input
                  id="holder-name"
                  value={createData.holderName}
                  onChange={(e) => setCreateData({ ...createData, holderName: e.target.value })}
                  placeholder="Acme Inc."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="holder-email">Customer Email</Label>
                <Input
                  id="holder-email"
                  type="email"
                  value={createData.holderEmail}
                  onChange={(e) => setCreateData({ ...createData, holderEmail: e.target.value })}
                  placeholder="billing@acme.com"
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="license-type">Type</Label>
                <Select
                  id="license-type"
                  value={createData.type}
                  onChange={(e) => setCreateData({ ...createData, type: e.target.value })}
                >
                  <option value="perpetual">Perpetual</option>
                  <option value="subscription">Subscription</option>
                  <option value="trial">Trial</option>
                  <option value="floating">Floating</option>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="expires-at">Expiry Date (optional)</Label>
                <Input
                  id="expires-at"
                  type="date"
                  value={createData.expiresAt}
                  onChange={(e) => setCreateData({ ...createData, expiresAt: e.target.value })}
                />
              </div>
            </div>

            {createError && <p className="text-sm text-destructive">{createError}</p>}
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" loading={createMutation.isPending}>
                Create License
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Show New License Key Dialog */}
      <Dialog open={!!newLicenseKey} onOpenChange={(open) => { if (!open) { setNewLicenseKey(null); setCopied(false); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>License Created Successfully!</DialogTitle>
            <DialogDescription>
              Please copy this license key now. For security reasons, you won't be able to see it again.
            </DialogDescription>
          </DialogHeader>
          <div className="py-6">
            <div className="flex items-center gap-2 p-3 bg-muted rounded-md border border-border font-mono text-sm break-all">
              <span className="flex-1">{newLicenseKey}</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  navigator.clipboard.writeText(newLicenseKey || '');
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
              >
                {copied ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setNewLicenseKey(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Suspend / Revoke Confirmation */}
      <ConfirmDialog
        open={!!confirmAction}
        onOpenChange={(open) => { if (!open) setConfirmAction(null); }}
        title={confirmAction?.type === 'revoke' ? 'Revoke License' : 'Suspend License'}
        description={
          confirmAction?.type === 'revoke'
            ? 'This permanently revokes the license. The client will immediately fail validation and it cannot be reactivated. Continue?'
            : 'This suspends the license. The client will fail validation until you reactivate it. Continue?'
        }
        confirmLabel={confirmAction?.type === 'revoke' ? 'Revoke' : 'Suspend'}
        variant="destructive"
        loading={suspendMutation.isPending || revokeMutation.isPending}
        onConfirm={() => {
          if (!confirmAction) return;
          if (confirmAction.type === 'revoke') revokeMutation.mutate(confirmAction.licenseId);
          else suspendMutation.mutate(confirmAction.licenseId);
        }}
      />
    </div>
  );
}
