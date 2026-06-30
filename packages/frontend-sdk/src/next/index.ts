/**
 * Next.js integration for DevLock SDK.
 *
 * Re-exports React provider with Next.js-specific utilities.
 *
 * @example
 * ```tsx
 * // app/providers.tsx
 * 'use client';
 * import { DevLockProvider } from '@devlock/sdk/next';
 *
 * export function Providers({ children }) {
 *   return (
 *     <DevLockProvider
 *       config={{
 *         projectKey: process.env.NEXT_PUBLIC_DEVLOCK_KEY!,
 *         licenseKey: process.env.NEXT_PUBLIC_DEVLOCK_LICENSE!,
 *       }}
 *     >
 *       {children}
 *     </DevLockProvider>
 *   );
 * }
 * ```
 */

// Re-export React integration (works in Next.js client components)
export { DevLockProvider, useDevLock, useFeatureFlag, useLicense, useDevLockEvent } from '../react/provider.js';

// Next.js specific: middleware helper for server-side license check
export { createDevLockMiddleware } from './middleware.js';
