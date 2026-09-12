import { SeoRouteData } from '../../../seoEngine';

export function getPageSeo(fullUrl: string, path: string = '/articles/benchmarks'): SeoRouteData {
  return {
    path,
    h1Title: 'Image Compression Benchmark 2026: JPEG vs WebP vs AVIF',
    metaTitle: 'Image Compression Benchmark 2026: JPEG vs WebP vs AVIF',
    metaDescription: 'An independent compression benchmark comparing JPEG, WebP, and AVIF across 20 real-world photographs and UI screenshots. See byte reduction and latency results.',
    canonicalUrl: fullUrl,
    isIndexable: true,
    pageCategory: 'resource',
    breadcrumbs: [
      { name: 'Home', url: '/' },
      { name: 'Guides & Articles', url: '/articles' },
      { name: 'Compression Benchmark', url: path }
    ],
    guideContent: null,
    jsonLd: {
      article: {
        '@context': 'https://schema.org',
        '@type': 'TechArticle',
        'headline': 'Image Compression Benchmark 2026: JPEG vs WebP vs AVIF',
        'description': 'An independent compression benchmark comparing JPEG, WebP, and AVIF across 20 real-world photographs and UI screenshots. See byte reduction and latency results.',
        'author': {
          '@type': 'Organization',
          'name': 'Zapixal',
          'url': 'https://zapixal.com'
        },
        'publisher': {
          '@type': 'Organization',
          'name': 'Zapixal',
          'url': 'https://zapixal.com'
        },
        'datePublished': '2026-08-24',
        'dateModified': '2026-08-24',
        'mainEntityOfPage': fullUrl
      },
      softwareApp: null,
      howTo: null,
      faqPage: null,
      breadcrumbs: null,
      organization: {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        'name': 'Zapixal',
        'url': 'https://zapixal.com'
      },
      website: {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        'name': 'Zapixal',
        'url': 'https://zapixal.com'
      }
    }
  };
}
