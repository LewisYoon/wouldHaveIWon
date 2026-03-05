import { MetadataRoute } from 'next';

export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://whatiflotto.com';
  
  const routes = [
    '',
    '/luck',
    '/simulator',
    '/how-it-works',
    '/odds',
    '/responsible-play',
    '/privacy',
    '/terms',
    '/login'
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date().toISOString().split('T')[0],
    changeFrequency: 'daily' as const,
    priority: route === '' ? 1 : 0.8,
  }));

  return routes;
}
