import { DOMAIN } from '../routes';
import { generateJsonLdSchemas } from '../schema';
import { SeoRouteData } from '../../seoEngine';

export function getPageSeo(fullUrl: string): SeoRouteData {
  const path = '/terms';
  return {
      path,
      h1Title: 'Terms of Service',
      metaTitle: 'Terms of Service & Usage — Zapixal',
      metaDescription: 'Zapixal Terms of Service. Read the terms and conditions for using our local client-side image processing tools.',
      canonicalUrl: fullUrl,
      isIndexable: true,
      pageCategory: 'use-case',
      breadcrumbs: [{ name: 'Home', url: '/' }, { name: 'Terms of Service', url: '/terms' }],
      guideContent: { badge: '', section1Title: '', section1Body: '', section2Title: '', section2Body: '', steps: [], faqs: [] },
      jsonLd: generateJsonLdSchemas('Terms of Service', 'Terms of Service for Zapixal.', fullUrl, [], [{ name: 'Home', url: '/' }, { name: 'Terms of Service', url: '/terms' }], 'legal')
    };
}
