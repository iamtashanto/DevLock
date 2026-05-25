import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: 'https://devlock.io', lastModified: new Date(), changeFrequency: 'weekly', priority: 1 },
    { url: 'https://devlock.io/login', lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: 'https://devlock.io/register', lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
  ];
}
