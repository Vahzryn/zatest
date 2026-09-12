import { TargetFormat } from '../types';
import { PSEO_ROUTES_LIST, DOMAIN } from './seo/routes';
import { parseSeoRoute } from './seo/meta';
import { applySeoToHead } from './seo/head';
import { getPageSeo as getNotFoundPageSeo } from './seo/pages/not-found';

export function getNotFoundSeo(fullUrl: string, path: string): SeoRouteData {
  return getNotFoundPageSeo(fullUrl, path);
}

export { PSEO_ROUTES_LIST, DOMAIN, parseSeoRoute, applySeoToHead };

export interface SeoRouteData {
  path: string;
  h1Title: string;
  metaTitle: string;
  metaDescription: string;
  canonicalUrl: string;
  isIndexable: boolean;
  pageCategory: 'converter' | 'compression' | 'use-case' | 'home' | 'resource';
  isNotFound?: boolean;
  fromFormat?: string;
  toFormat?: TargetFormat;
  targetMaxKB?: number;
  stripExif?: boolean;
  presetResize?: { maxWidth: number; maxHeight: number };
  breadcrumbs: { name: string; url: string }[];
  guideContent?: {
    badge: string;
    section1Title: string;
    section1Body: string;
    section2Title: string;
    section2Body: string;
    steps: string[];
    faqs: { question: string; answer: string }[];
  } | null;
  relatedRoutes?: Array<{ path: string; label: string }> | null;
  relatedArticles?: Array<{ path: string; label: string }> | null;
  ogImage?: {
    url: string;
    width: number;
    height: number;
    alt: string;
  };
  jsonLd?: {
    article?: object | null;
    softwareApp: object | null;
    howTo: object | null;
    faqPage: object | null;
    breadcrumbs: object | null;
    organization: object;
    website: object;
  } | null;
}
