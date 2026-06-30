'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Shield, LayoutDashboard, ChevronLeft, ChevronRight, LogOut, Users } from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import { UserMenu } from '@/components/layout/user-menu';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { hasHydrated, accessToken, user } = useAuthStore((s) => ({
    hasHydrated: s._hasHydrated,
    accessToken: s.accessToken,
    user: s.user,
  }));
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (hasHydrated && (!accessToken || !user?.isSuperAdmin)) {
      router.replace('/dashboard');
    }
  }, [hasHydrated, accessToken, user, router]);

  if (!hasHydrated || !accessToken || !user?.isSuperAdmin) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Admin Sidebar */}
      <aside
        className={cn(
          'flex h-full flex-col border-r border-border bg-card transition-all duration-300',
          collapsed ? 'w-16' : 'w-64'
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-border px-4">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-indigo-500" />
              <span className="text-lg font-bold text-indigo-500">Super Admin</span>
            </div>
          )}
          {collapsed && (
            <div className="mx-auto">
              <Shield className="h-6 w-6 text-indigo-500" />
            </div>
          )}
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          <Link
            href="/superadmin"
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              isActive('/superadmin') && pathname === '/superadmin'
                ? 'bg-indigo-500/10 text-indigo-400'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
              collapsed && 'justify-center px-2'
            )}
            title={collapsed ? 'Dashboard & Payments' : undefined}
          >
            <LayoutDashboard className="h-5 w-5 shrink-0" />
            {!collapsed && <span>Dashboard & Payments</span>}
          </Link>
          <Link
            href="/superadmin/tenants"
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              isActive('/superadmin/tenants')
                ? 'bg-indigo-500/10 text-indigo-400'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
              collapsed && 'justify-center px-2'
            )}
            title={collapsed ? 'Tenants & Subs' : undefined}
          >
            <Users className="h-5 w-5 shrink-0" />
            {!collapsed && <span>Tenants & Subs</span>}
          </Link>
          <Link
            href="/superadmin/pricing"
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              isActive('/superadmin/pricing')
                ? 'bg-indigo-500/10 text-indigo-400'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
              collapsed && 'justify-center px-2'
            )}
            title={collapsed ? 'Dynamic Pricing' : undefined}
          >
            <Shield className="h-5 w-5 shrink-0" />
            {!collapsed && <span>Dynamic Pricing</span>}
          </Link>
        </nav>

        <div className="border-t border-border p-3">
          <Link
            href="/dashboard"
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors text-muted-foreground hover:bg-accent hover:text-accent-foreground',
              collapsed && 'justify-center px-2'
            )}
            title={collapsed ? 'Exit to User Dashboard' : undefined}
          >
            <LogOut className="h-5 w-5 shrink-0" />
            {!collapsed && <span>Exit to App</span>}
          </Link>
          <Separator className="my-3" />
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex w-full items-center justify-center rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 items-center justify-end border-b border-border bg-card px-4 lg:px-6">
          <div className="flex items-center gap-3">
            <UserMenu />
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
