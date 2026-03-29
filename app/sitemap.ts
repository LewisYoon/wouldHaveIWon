import { MetadataRoute } from 'next';

export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://whatiflotto.com';
  
  const mainRoutes = [
    '',
    '/luck/',
    '/simulator/',
    '/how-it-works/',
    '/odds/',
    '/responsible-play/',
    '/privacy/',
    '/terms/',
    '/login/',
    '/stats/',
    '/analytics/',
    '/analyzer/',
    '/leaderboard/',
    '/premium/',
    '/contact/',
    '/refund-policy/',
  ];

  const blogSlugs = [
    'mathematics-of-powerball',
    'history-of-oz-lotto',
    'benefits-of-simulation',
    'the-gamblers-fallacy-explained',
    'system-entries-vs-standard',
    'quick-pick-vs-manual-selection',
    'history-of-lottery-australia',
    'understanding-house-edge',
    'how-to-read-lotto-stats',
    'responsible-play-guide',
  ];

  const routes = mainRoutes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date().toISOString().split('T')[0],
    changeFrequency: 'daily' as const,
    priority: route === '' ? 1 : 0.8,
  }));

  const blogRoutes = blogSlugs.map((slug) => ({
    url: `${baseUrl}/blog/${slug}/`,
    lastModified: new Date().toISOString().split('T')[0],
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }));

  return [...routes, ...blogRoutes];
}
