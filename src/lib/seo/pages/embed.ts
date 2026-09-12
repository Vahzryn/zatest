import { SeoRouteData } from '../../seoEngine';

export function getPageSeo(fullUrl: string, path: string = '/embed'): SeoRouteData {
  return {
    path,
    h1Title: 'Zapixal Embed Widget',
    metaTitle: 'Zapixal Image Converter Embed Widget',
    metaDescription: 'Embedded client-side image processing widget for third-party websites and integrations.',
    canonicalUrl: fullUrl,
    isIndexable: false,
    pageCategory: 'resource',
    breadcrumbs: [{ name: 'Home', url: '/' }, { name: 'Embed', url: path }],
    guideContent: null,
    jsonLd: null
  };
}
