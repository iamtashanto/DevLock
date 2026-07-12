import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: 'https://devlock.tashanto.com', lastModified: new Date(), changeFrequency: 'weekly', priority: 1 },
    { url: 'https://devlock.tashanto.com/login', lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: 'https://devlock.tashanto.com/register', lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
  ];
}
