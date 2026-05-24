'use client';

import { useRealtime } from '@/hooks/use-realtime';

export function SocketProvider({ children }: { children: React.ReactNode }) {
  useRealtime();
  return <>{children}</>;
}
