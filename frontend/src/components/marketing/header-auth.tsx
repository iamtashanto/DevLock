'use client';

import { useAuthStore } from '@/stores/auth-store';
import Link from 'next/link';

export function HeaderAuth() {
  const { _hasHydrated, accessToken, user } = useAuthStore();
  const isAuthenticated = _hasHydrated && !!accessToken && !!user;

  // Render a placeholder or loading state if not hydrated
  if (!_hasHydrated) {
    return (
      <div className="flex items-center gap-3">
        <div className="h-9 w-20 animate-pulse rounded-lg bg-slate-800" />
      </div>
    );
  }

  if (isAuthenticated) {
    return (
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard"
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500"
        >
          Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <Link href="/login" className="hidden text-sm text-slate-300 transition hover:text-white sm:inline-block">
        Sign In
      </Link>
      <Link
        href="/register"
        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500"
      >
        Get Started
      </Link>
    </div>
  );
}
