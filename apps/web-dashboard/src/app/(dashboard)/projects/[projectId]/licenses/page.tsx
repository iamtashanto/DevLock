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
import { Plus, Search, Key, MoreVertical, Ban, RotateCcw, XCircle } from 'lucide-react';
import { useDebounce } from '@/hooks/use-debounce';
import { formatRelative } from '@/lib/utils';

export default function LicensesPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
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
        <Button>
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
          onAction={() => {}}
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
                          destructive
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

      <ConfirmDialog
        open={!!confirmAction}
        onOpenChange={() => setConfirmAction(null)}
        title={confirmAction?.type === 'suspend' ? 'Suspend License' : 'Revoke License'}
        description={
          confirmAction?.type === 'suspend'
            ? 'This will temporarily disable the license. The holder will not be able to validate until reactivated.'
            : 'This will permanently revoke the license. This action cannot be undone.'
        }
        confirmLabel={confirmAction?.type === 'suspend' ? 'Suspend' : 'Revoke'}
        variant="destructive"
        loading={suspendMutation.isPending || revokeMutation.isPending}
        onConfirm={() => {
          if (!confirmAction) return;
          if (confirmAction.type === 'suspend') {
            suspendMutation.mutate(confirmAction.licenseId);
          } else {
            revokeMutation.mutate(confirmAction.licenseId);
          }
        }}
      />
    </div>
  );
}
