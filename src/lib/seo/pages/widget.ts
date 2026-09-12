import { SeoRouteData } from '../../seoEngine';

export function getPageSeo(fullUrl: string, path: string = '/widget'): SeoRouteData {
  return {
    path,
    h1Title: 'Embeddable Image Processing Widget Documentation',
    metaTitle: 'Zapixal Embed Widget Integration Guide & API Reference',
    metaDescription: 'Integrate privacy-first, client-side WebAssembly image processing directly into your application or website with our lightweight embed widget.',
    canonicalUrl: fullUrl,
    isIndexable: true,
    pageCategory: 'resource',
    breadcrumbs: [{ name: 'Home', url: '/' }, { name: 'Widget Documentation', url: path }],
    guideContent: null,
    jsonLd: null
  };
}
