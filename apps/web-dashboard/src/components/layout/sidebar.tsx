'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { usePermissions } from '@/hooks/use-permissions';
import { useAuthStore } from '@/stores/auth-store';
import { MAIN_NAV_ITEMS, ORG_NAV_ITEMS, BOTTOM_NAV_ITEMS } from '@/lib/constants';
import { ChevronLeft, ChevronRight, Shield } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const { can } = usePermissions();
  const user = useAuthStore(state => state.user);

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  const renderNavItems = (items: typeof MAIN_NAV_ITEMS) => {
    return items
      .filter((item) => !item.permission || can(item.permission))
      .map((item) => {
        const Icon = item.icon;
        const active = isActive(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              active
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
              collapsed && 'justify-center px-2'
            )}
            title={collapsed ? item.title : undefined}
          >
            <Icon className="h-5 w-5 shrink-0" />
            {!collapsed && <span>{item.title}</span>}
          </Link>
        );
      });
  };

  return (
    <aside
      className={cn(
        'flex h-full flex-col border-r border-border bg-card transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between border-b border-border px-4">
        {!collapsed && (
          <Link href="/dashboard" className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <span className="text-lg font-bold">DevLock</span>
          </Link>
        )}
        {collapsed && (
          <Link href="/dashboard" className="mx-auto">
            <Shield className="h-6 w-6 text-primary" />
          </Link>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        <div className="space-y-1">{renderNavItems(MAIN_NAV_ITEMS)}</div>

        <Separator className="my-3" />

        {!collapsed && (
          <p className="mb-2 px-3 text-xs font-semibold uppercase text-muted-foreground">
            Organization
          </p>
        )}
        <div className="space-y-1">{renderNavItems(ORG_NAV_ITEMS)}</div>

        {user?.isSuperAdmin && (
          <>
            <Separator className="my-3" />
            {!collapsed && (
              <p className="mb-2 px-3 text-xs font-semibold uppercase text-red-500/80">
                Admin
              </p>
            )}
            <div className="space-y-1">
              <Link
                href="/superadmin"
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors text-red-400 hover:bg-red-500/10 hover:text-red-300',
                  isActive('/superadmin') && 'bg-red-500/10 text-red-300',
                  collapsed && 'justify-center px-2'
                )}
                title={collapsed ? 'Super Admin' : undefined}
              >
                <Shield className="h-5 w-5 shrink-0" />
                {!collapsed && <span>Super Admin</span>}
              </Link>
            </div>
          </>
        )}
      </nav>

      {/* Bottom */}
      <div className="border-t border-border p-3">
        <div className="space-y-1">{renderNavItems(BOTTOM_NAV_ITEMS)}</div>
        <button
          onClick={onToggle}
          className="mt-2 flex w-full items-center justify-center rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>
    </aside>
  );
}
