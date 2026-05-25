'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { DashboardShell } from '@/components/layout/dashboard-shell';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const hasHydrated = useAuthStore((s) => s._hasHydrated);
  const accessToken = useAuthStore((s) => s.accessToken);

  useEffect(() => {
    // Only redirect after Zustand has hydrated from localStorage
    if (hasHydrated && !accessToken) {
      router.replace('/login');
    }
  }, [hasHydrated, accessToken, router]);

  // Still hydrating — show spinner
  if (!hasHydrated) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Hydrated but no token — redirecting to login
  if (!accessToken) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return <DashboardShell>{children}</DashboardShell>;
}
