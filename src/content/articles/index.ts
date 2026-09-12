import { Article, ArticleCategory, CategoryInfo } from './types';
import { ARTICLE_CATEGORIES } from './categories';
import { articleHeicVsJpg } from './heic-vs-jpg';
import { articleExifMetadataPrivacyGuide } from './exif-metadata-privacy-guide';
import { articleCompressImageToKbLimitGuide } from './compress-image-to-kb-limit-guide';
import { articleWebpVsPngVsJpeg } from './webp-vs-png-vs-jpeg';
import { articleBrowserWasmPrivacyArchitecture } from './browser-wasm-privacy-architecture';
import { articleClientSidePdfMergeSplitSecurityGuide } from './client-side-pdf-merge-split-security-guide';

export * from './types';
export * from './categories';

export const ALL_ARTICLES: Article[] = [
  articleHeicVsJpg,
  articleExifMetadataPrivacyGuide,
  articleCompressImageToKbLimitGuide,
  articleWebpVsPngVsJpeg,
  articleBrowserWasmPrivacyArchitecture,
  articleClientSidePdfMergeSplitSecurityGuide,
];

export function getArticleBySlug(slug: string): Article | undefined {
  const cleanSlug = slug.replace(/^\/+/, '').replace(/^articles\//, '');
  return ALL_ARTICLES.find(
    (art) => art.slug === cleanSlug || art.slug === cleanSlug.split('/').pop()
  );
}

export function getArticlesByCategory(category: ArticleCategory): Article[] {
  return ALL_ARTICLES.filter((art) => art.category === category);
}

export function getCategoryInfo(category: string): CategoryInfo | undefined {
  if (category in ARTICLE_CATEGORIES) {
    return ARTICLE_CATEGORIES[category as ArticleCategory];
  }
  return undefined;
}

export function getRelatedArticles(slugs: string[]): Article[] {
  return ALL_ARTICLES.filter((art) => slugs.includes(art.slug));
}
