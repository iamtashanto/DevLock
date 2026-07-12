import type { Metadata } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://devlock.tashanto.com';

export const metadata: Metadata = {
  title: { absolute: 'DevLock — Software Licensing, Kill-Switch & Remote App Control' },
  description:
    'Protect, license, and remotely manage your distributed applications. Instant kill-switch, maintenance mode, feature flags, domain locking, and real-time control — all from one dashboard. Lock a client site the moment a payment stops; unlock it when they pay.',
  keywords: [
    'software licensing',
    'license management',
    'software kill switch',
    'remote app control',
    'feature flags',
    'domain locking',
    'license key generator',
    'anti-piracy',
    'developer tools',
    'client payment lock',
    'SaaS licensing',
    'devlock SDK',
  ],
  authors: [{ name: 'DevLock', url: SITE_URL }],
  creator: 'DevLock',
  publisher: 'DevLock',
  alternates: { canonical: '/' },
  openGraph: {
    title: 'DevLock — Software Licensing, Kill-Switch & Remote App Control',
    description:
      'License, protect, and remotely control your software. Kill-switch, maintenance mode, feature flags and domain locking — real-time, from one dashboard.',
    url: SITE_URL,
    siteName: 'DevLock',
    type: 'website',
    locale: 'en_US',
    images: [{ url: '/logo.png', width: 512, height: 512, alt: 'DevLock' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DevLock — Software Licensing & Remote App Control',
    description: 'License, protect, and remotely control your software with real-time kill-switch and feature flags.',
    images: ['/logo.png'],
  },
  robots: { index: true, follow: true },
};

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
