import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware only handles:
 * 1. Redirecting authenticated users away from auth pages (if cookie exists)
 * 2. All other auth is handled client-side via useAuth hook + Zustand store
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip static files
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/static') ||
    pathname.includes('favicon.ico') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
