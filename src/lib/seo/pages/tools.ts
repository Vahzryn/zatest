import { SeoRouteData } from '../../seoEngine';
import { generateJsonLdSchemas } from '../schema';

export function getPageSeo(fullUrl: string, path: string): SeoRouteData {
  return {
    path: '/tools',
    h1Title: 'Client-Side Privacy Tools & Utilities Directory',
    metaTitle: 'Free In-Browser Utilities & Image Tools | Zapixal',
    metaDescription: 'Explore free in-browser developer, document, and image tools including HEIC to JPG, PDF merge, JSON formatting, and JWT debugging with zero uploads.',
    canonicalUrl: 'https://zapixal.com/tools',
    isIndexable: true,
    pageCategory: 'resource',
    breadcrumbs: [
      { name: 'Home', url: '/' },
      { name: 'Tools Directory', url: '/tools' }
    ],
    guideContent: null,
    jsonLd: generateJsonLdSchemas(
      'Zapixal In-Browser Tools Directory',
      'Explore client-side privacy-first image, document, developer, and text tools powered by WebAssembly and local browser memory.',
      fullUrl,
      [],
      [{ name: 'Home', url: '/' }, { name: 'Tools Directory', url: '/tools' }],
      'resource'
    )
  };
}
