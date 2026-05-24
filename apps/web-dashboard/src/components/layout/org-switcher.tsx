'use client';

import { useOrgStore } from '@/stores/org-store';
import { DropdownMenu, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Building2, ChevronDown, Plus } from 'lucide-react';

export function OrgSwitcher() {
  const { currentOrg, organizations, setCurrentOrg } = useOrgStore();

  return (
    <DropdownMenu
      align="left"
      trigger={
        <button className="flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-accent">
          <Building2 className="h-4 w-4 text-muted-foreground" />
          <span className="max-w-[150px] truncate font-medium">
            {currentOrg?.name || 'Select Organization'}
          </span>
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        </button>
      }
    >
      {organizations.map((org) => (
        <DropdownMenuItem
          key={org.id}
          onClick={() => setCurrentOrg(org)}
          className={org.id === currentOrg?.id ? 'bg-accent' : ''}
        >
          <Building2 className="mr-2 h-4 w-4" />
          <span className="truncate">{org.name}</span>
        </DropdownMenuItem>
      ))}
      {organizations.length > 0 && <DropdownMenuSeparator />}
      <DropdownMenuItem>
        <Plus className="mr-2 h-4 w-4" />
        Create Organization
      </DropdownMenuItem>
    </DropdownMenu>
  );
}
