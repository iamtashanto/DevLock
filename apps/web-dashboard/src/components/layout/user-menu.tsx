'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { useAuthStore } from '@/stores/auth-store';
import { Avatar } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { Settings, LogOut, User } from 'lucide-react';

export function UserMenu() {
  const user = useAuthStore((state) => state.user);
  const { logout } = useAuth();

  if (!user) return null;

  return (
    <DropdownMenu
      trigger={
        <Avatar
          src={user.avatarUrl}
          fallback={user.name}
          size="sm"
          className="cursor-pointer"
        />
      }
    >
      <DropdownMenuLabel>
        <div className="flex flex-col space-y-1">
          <p className="text-sm font-medium">{user.name}</p>
          <p className="text-xs text-muted-foreground">{user.email}</p>
        </div>
      </DropdownMenuLabel>
      <DropdownMenuSeparator />
      <Link href="/settings">
        <DropdownMenuItem>
          <User className="mr-2 h-4 w-4" />
          Profile
        </DropdownMenuItem>
      </Link>
      <Link href="/settings">
        <DropdownMenuItem>
          <Settings className="mr-2 h-4 w-4" />
          Settings
        </DropdownMenuItem>
      </Link>
      <DropdownMenuSeparator />
      <DropdownMenuItem destructive onClick={logout}>
        <LogOut className="mr-2 h-4 w-4" />
        Log out
      </DropdownMenuItem>
    </DropdownMenu>
  );
}
