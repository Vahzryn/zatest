import { DOMAIN } from '../routes';
import { generateJsonLdSchemas } from '../schema';
import { SeoRouteData } from '../../seoEngine';

export function getPageSeo(fullUrl: string): SeoRouteData {
  const path = '/about';
  return {
    path,
    h1Title: 'About Zapixal',
    metaTitle: 'About Zapixal — Client-Side Privacy Image Utility',
    metaDescription: 'Zapixal is an ultra-fast, privacy-first image conversion engine that runs entirely inside your browser using WebAssembly.',
    canonicalUrl: fullUrl,
    isIndexable: true,
    pageCategory: 'use-case',
    breadcrumbs: [{ name: 'Home', url: '/' }, { name: 'About', url: '/about' }],
    guideContent: { badge: '', section1Title: '', section1Body: '', section2Title: '', section2Body: '', steps: [], faqs: [] },
    jsonLd: generateJsonLdSchemas('About Zapixal', 'About Zapixal local image converter.', fullUrl, [], [{ name: 'Home', url: '/' }, { name: 'About', url: '/about' }], 'legal')
  };
}
