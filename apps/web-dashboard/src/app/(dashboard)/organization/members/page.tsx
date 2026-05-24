'use client';

import { PageHeader } from '@/components/shared/page-header';
import { EmptyState } from '@/components/shared/empty-state';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { PermissionGate } from '@/components/shared/permission-gate';
import { Plus, Users, MoreVertical, UserMinus, Shield } from 'lucide-react';

// Placeholder data - would be fetched from API
const MOCK_MEMBERS = [
  { id: '1', name: 'John Doe', email: 'john@example.com', role: 'owner', joinedAt: '2024-01-01' },
  { id: '2', name: 'Jane Smith', email: 'jane@example.com', role: 'admin', joinedAt: '2024-01-15' },
  { id: '3', name: 'Bob Wilson', email: 'bob@example.com', role: 'developer', joinedAt: '2024-02-01' },
];

export default function MembersPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Team Members" description="Manage who has access to your organization">
        <PermissionGate permission="org:manage_members">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Invite Member
          </Button>
        </PermissionGate>
      </PageHeader>

      {MOCK_MEMBERS.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No team members"
          description="Invite team members to collaborate on your projects"
          actionLabel="Invite Member"
          onAction={() => {}}
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Member</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {MOCK_MEMBERS.map((member) => (
              <TableRow key={member.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar fallback={member.name} size="sm" />
                    <div>
                      <p className="font-medium">{member.name}</p>
                      <p className="text-xs text-muted-foreground">{member.email}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="capitalize">
                    {member.role}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">{member.joinedAt}</TableCell>
                <TableCell>
                  <PermissionGate permission="org:manage_members">
                    <DropdownMenu
                      trigger={
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      }
                    >
                      <DropdownMenuItem>
                        <Shield className="mr-2 h-4 w-4" />
                        Change Role
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem destructive>
                        <UserMinus className="mr-2 h-4 w-4" />
                        Remove
                      </DropdownMenuItem>
                    </DropdownMenu>
                  </PermissionGate>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
