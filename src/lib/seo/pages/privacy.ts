import { TargetFormat } from '../../../types';
import { DOMAIN } from '../routes';
import { generateJsonLdSchemas } from '../schema';
import { SeoRouteData } from '../../seoEngine';

function makeFaq(question: string, answer: string) {
  return { question, answer };
}

export function getPageSeo(fullUrl: string): SeoRouteData {
  const path = '/privacy';
  return {
      path,
      h1Title: 'Privacy Policy',
      metaTitle: 'Privacy Policy — Client-Side Local Processing | Zapixal',
      metaDescription: 'Zapixal Privacy Policy. All file processing occurs locally in browser memory. Files are never uploaded to remote servers for conversion or editing.',
      canonicalUrl: fullUrl,
      isIndexable: true,
      pageCategory: 'use-case',
      breadcrumbs: [{ name: 'Home', url: '/' }, { name: 'Privacy Policy', url: '/privacy' }],
      guideContent: { badge: '', section1Title: '', section1Body: '', section2Title: '', section2Body: '', steps: [], faqs: [] },
      jsonLd: generateJsonLdSchemas('Privacy Policy', 'Local client-side privacy policy.', fullUrl, [], [{ name: 'Home', url: '/' }, { name: 'Privacy Policy', url: '/privacy' }], 'legal')
    };
}
