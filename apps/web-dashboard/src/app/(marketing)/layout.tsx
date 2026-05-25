import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'DevLock — Software Licensing & Remote Management Platform',
  description:
    'Protect, license, and remotely manage your distributed applications. Kill-switch, maintenance mode, feature flags, domain locking, and real-time control — all from one dashboard.',
  keywords: [
    'software licensing',
    'license management',
    'remote management',
    'kill switch',
    'feature flags',
    'developer tools',
    'SaaS',
    'SDK',
  ],
  authors: [{ name: 'DevLock' }],
  openGraph: {
    title: 'DevLock — Software Licensing & Remote Management Platform',
    description:
      'Protect, license, and remotely manage your distributed applications with real-time control.',
    url: 'https://devlock.io',
    siteName: 'DevLock',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DevLock — Software Licensing & Remote Management',
    description: 'Protect, license, and remotely manage your distributed applications.',
  },
  robots: { index: true, follow: true },
};

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
