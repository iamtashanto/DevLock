import type { MetadataRoute } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://devlock.tashanto.com';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // Keep authenticated app + private areas out of the index.
        disallow: [
          '/api/',
          '/_next/',
          '/dashboard',
          '/superadmin',
          '/projects',
          '/settings',
          '/subscription',
          '/notifications',
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
