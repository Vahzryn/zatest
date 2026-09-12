import { SeoRouteData, getNotFoundSeo } from '../seoEngine';
import { applySeoToHead } from './head';
import { getArticleBySlug, getCategoryInfo } from '../../content/articles';
import { generateArticleJsonLdSchema } from './schema';
import { TOOL_REGISTRY } from '../toolRegistry';

import * as homePage from './pages/home';
import * as privacyPage from './pages/privacy';
import * as termsPage from './pages/terms';
import * as aboutPage from './pages/about';
import * as clientSidePrivateImageCompressorPage from './pages/client-side-private-image-compressor';
import * as convertHeicToJpgLocallyPage from './pages/convert-heic-to-jpg-locally';
import * as stripExifMetadataOnlinePrivatePage from './pages/strip-exif-metadata-online-private';
import * as bulkImageCompressorOfflinePage from './pages/bulk-image-compressor-offline';
import * as compressPngImagesOnlinePage from './pages/compress-png-images-online';
import * as convertWebpToPngTransparentPage from './pages/convert-webp-to-png-transparent';
import * as convertAvifToJpgConverterPage from './pages/convert-avif-to-jpg-converter';
import * as convertSvgToPngTransparentPage from './pages/convert-svg-to-png-transparent';
import * as convertPngToWebpLosslessPage from './pages/convert-png-to-webp-lossless';
import * as cropImageToExactAspectRatioPage from './pages/crop-image-to-exact-aspect-ratio';
import * as addTextWatermarkImageBrowserPage from './pages/add-text-watermark-image-browser';
import * as convertTiffBmpToJpgPage from './pages/convert-tiff-bmp-to-jpg';
import * as dpiPpiConverterChangeImageResolutionPage from './pages/dpi-ppi-converter-change-image-resolution';
import * as convertJpgToWebpBrowserPage from './pages/convert-jpg-to-webp-browser';
import * as convertIcoToPngFaviconExtractorPage from './pages/convert-ico-to-png-favicon-extractor';
import * as convertPngToJpgWhiteBackgroundPage from './pages/convert-png-to-jpg-white-background';
import * as blurSensitiveImagePrivacyPixelatorPage from './pages/blur-sensitive-image-privacy-pixelator';
import * as secureDocumentCompressorPdfPage from './pages/secure-document-compressor-pdf';
import * as convertToAvifOnlineFreePage from './pages/convert-to-avif-online-free';
import * as compressImageToExactSizeKbPage from './pages/compress-image-to-exact-size-kb';
import * as convertPdfPagesToJpgImagesPage from './pages/convert-pdf-pages-to-jpg-images';
import * as mergePdfPage from './pages/merge-pdf';
import * as splitPdfPage from './pages/split-pdf';
import * as convertImageToPdfPage from './pages/convert-image-to-pdf';
import * as clientSideImageToBase64Page from './pages/client-side-image-to-base64';
import * as base64ToImageConverterPage from './pages/base64-to-image-converter';
import * as wordCharacterCounterOnlinePage from './pages/word-character-counter-online';
import * as securePasswordGeneratorOnlinePage from './pages/secure-password-generator-online';
import * as paletteColorExtractorImageHexPage from './pages/palette-color-extractor-image-hex';
import * as jsonFormatterValidatorPage from './pages/json-formatter-validator';
import * as csvToJsonConverterPage from './pages/csv-to-json-converter';
import * as jwtDecoderPage from './pages/jwt-decoder';
import * as regexTesterPage from './pages/regex-tester';
import * as markdownLivePreviewPage from './pages/markdown-live-preview';
import * as textDiffPage from './pages/text-diff';
import * as embedPage from './pages/embed';
import * as widgetPage from './pages/widget';
import * as toolsPage from './pages/tools';
import * as articlesPage from './pages/articles';
import * as articleBenchmarksPage from './pages/articles/benchmarks';

export { applySeoToHead };

function getArticleCategorySeo(subPath: string, fullUrl: string): SeoRouteData | null {
  const cat = getCategoryInfo(subPath);
  if (!cat) return null;
  return {
    path: `/articles/${cat.slug}`,
    h1Title: cat.title,
    metaTitle: cat.metaTitle,
    metaDescription: cat.metaDescription,
    canonicalUrl: fullUrl,
    isIndexable: true,
    pageCategory: 'resource',
    breadcrumbs: [
      { name: 'Home', url: '/' },
      { name: 'Articles', url: '/articles' },
      { name: cat.title, url: `/articles/${cat.slug}` }
    ],
    guideContent: null,
    jsonLd: null
  };
}

export const PAGE_IMPORTS: Record<string, () => Promise<{ getPageSeo: (url: string, path: string) => SeoRouteData }>> = {
  'home': () => Promise.resolve(homePage),
  'privacy': () => Promise.resolve(privacyPage),
  'terms': () => Promise.resolve(termsPage),
  'about': () => Promise.resolve(aboutPage),
  'client-side-private-image-compressor': () => Promise.resolve(clientSidePrivateImageCompressorPage),
  'convert-heic-to-jpg-locally': () => Promise.resolve(convertHeicToJpgLocallyPage),
  'strip-exif-metadata-online-private': () => Promise.resolve(stripExifMetadataOnlinePrivatePage),
  'bulk-image-compressor-offline': () => Promise.resolve(bulkImageCompressorOfflinePage),
  'compress-png-images-online': () => Promise.resolve(compressPngImagesOnlinePage),
  'convert-webp-to-png-transparent': () => Promise.resolve(convertWebpToPngTransparentPage),
  'convert-avif-to-jpg-converter': () => Promise.resolve(convertAvifToJpgConverterPage),
  'convert-svg-to-png-transparent': () => Promise.resolve(convertSvgToPngTransparentPage),
  'convert-png-to-webp-lossless': () => Promise.resolve(convertPngToWebpLosslessPage),
  'crop-image-to-exact-aspect-ratio': () => Promise.resolve(cropImageToExactAspectRatioPage),
  'add-text-watermark-image-browser': () => Promise.resolve(addTextWatermarkImageBrowserPage),
  'convert-tiff-bmp-to-jpg': () => Promise.resolve(convertTiffBmpToJpgPage),
  'dpi-ppi-converter-change-image-resolution': () => Promise.resolve(dpiPpiConverterChangeImageResolutionPage),
  'convert-jpg-to-webp-browser': () => Promise.resolve(convertJpgToWebpBrowserPage),
  'convert-ico-to-png-favicon-extractor': () => Promise.resolve(convertIcoToPngFaviconExtractorPage),
  'convert-png-to-jpg-white-background': () => Promise.resolve(convertPngToJpgWhiteBackgroundPage),
  'blur-sensitive-image-privacy-pixelator': () => Promise.resolve(blurSensitiveImagePrivacyPixelatorPage),
  'secure-document-compressor-pdf': () => Promise.resolve(secureDocumentCompressorPdfPage),
  'convert-to-avif-online-free': () => Promise.resolve(convertToAvifOnlineFreePage),
  'compress-image-to-exact-size-kb': () => Promise.resolve(compressImageToExactSizeKbPage),
  'convert-pdf-pages-to-jpg-images': () => Promise.resolve(convertPdfPagesToJpgImagesPage),
  'merge-pdf': () => Promise.resolve(mergePdfPage),
  'split-pdf': () => Promise.resolve(splitPdfPage),
  'convert-image-to-pdf': () => Promise.resolve(convertImageToPdfPage),
  'client-side-image-to-base64': () => Promise.resolve(clientSideImageToBase64Page),
  'base64-to-image-converter': () => Promise.resolve(base64ToImageConverterPage),
  'word-character-counter-online': () => Promise.resolve(wordCharacterCounterOnlinePage),
  'secure-password-generator-online': () => Promise.resolve(securePasswordGeneratorOnlinePage),
  'palette-color-extractor-image-hex': () => Promise.resolve(paletteColorExtractorImageHexPage),
  'json-formatter-validator': () => Promise.resolve(jsonFormatterValidatorPage),
  'csv-to-json-converter': () => Promise.resolve(csvToJsonConverterPage),
  'jwt-decoder': () => Promise.resolve(jwtDecoderPage),
  'regex-tester': () => Promise.resolve(regexTesterPage),
  'markdown-live-preview': () => Promise.resolve(markdownLivePreviewPage),
  'text-diff': () => Promise.resolve(textDiffPage),
  'embed': () => Promise.resolve(embedPage),
  'widget': () => Promise.resolve(widgetPage),
  'tools': () => Promise.resolve(toolsPage),
  'articles': () => Promise.resolve(articlesPage),
  'articles/benchmarks': () => Promise.resolve(articleBenchmarksPage),
};

export const ROUTE_ALIASES: Record<string, string> = {
  'compress-image-under-50kb-government-portal': 'compress-image-to-exact-size-kb',
  'compress-image-to-100kb-online': 'compress-image-to-exact-size-kb',
  'compress-image-to-200kb-online': 'compress-image-to-exact-size-kb',
  'reduce-image-size-to-1mb-online': 'compress-image-to-exact-size-kb',
  'compress-image-for-email-attachment-limit': 'compress-image-to-exact-size-kb',
  'secure-signature-compressor-pdf': 'secure-document-compressor-pdf',
  'compress-pdf-scanned-document-images': 'secure-document-compressor-pdf',
  'compress-png-lossless-webassembly': 'compress-png-images-online',
  'compress-screenshot-png-size-fast': 'compress-png-images-online',
  'bulk-image-resizer-ecommerce-catalog': 'bulk-image-compressor-offline',
  'shopify-image-optimizer-bulk-free': 'bulk-image-compressor-offline',
  'etsy-image-resizer-batch-optimize': 'bulk-image-compressor-offline',
  'bulk-heic-to-jpg-converter-offline': 'convert-heic-to-jpg-locally',
  'passport-photo-size-reducer-kb': 'crop-image-to-exact-aspect-ratio',
  'discord-avatar-compressor-pfp-size': 'crop-image-to-exact-aspect-ratio',
  'social-media-banner-resizer-linkedin-twitter': 'crop-image-to-exact-aspect-ratio',
  'resize-image-for-job-application-form': 'crop-image-to-exact-aspect-ratio',
  'convert-hdr-heic-to-png-transparency': 'convert-heic-to-jpg-locally',
  'lossless-jpeg-optimizer-exif-preserve': 'client-side-private-image-compressor',
  'high-res-image-resizer-client-side': 'client-side-private-image-compressor',
  'ai-image-compressor-online-private': 'client-side-private-image-compressor',
  'compress-animated-gif-size-online': 'client-side-private-image-compressor',
};

import { getCategoryPageSeo, CategoryKey } from './pages/category-tools';

export async function parseSeoRoute(path: string): Promise<SeoRouteData> {
  const normalizedPath = path.endsWith('/') && path.length > 1 ? path.slice(0, -1) : path;
  const fullUrl = `https://zapixal.com${normalizedPath === '/' ? '' : normalizedPath}`;

  try {
    let key = normalizedPath === '/' ? 'home' : normalizedPath.replace(/^\//, '');
    const isAlias = !!ROUTE_ALIASES[key];
    if (isAlias) {
      key = ROUTE_ALIASES[key];
    }

    // Dynamic Category Tools Directory Handling
    if (key.startsWith('tools/')) {
      const catKey = key.replace('tools/', '') as CategoryKey;
      return getCategoryPageSeo(catKey, fullUrl, normalizedPath);
    }

    // Dynamic Article Handling
    if (key.startsWith('articles/')) {
      const subPath = key.replace('articles/', '');
      
      // Benchmarks has a custom SEO page
      if (subPath === 'benchmarks') {
        const module = await PAGE_IMPORTS[key]();
        return module.getPageSeo(fullUrl, normalizedPath);
      }
      
      // Category Pages
      const categorySeo = getArticleCategorySeo(subPath, fullUrl);
      if (categorySeo) {
         return categorySeo;
      }
      
      // Individual Articles
      const article = getArticleBySlug(subPath);
      if (article) {
         const articleBreadcrumbs = [
           { name: 'Home', url: '/' },
           { name: 'Articles', url: '/articles' },
           { name: article.category, url: `/articles/${article.category}` },
           { name: article.title, url: normalizedPath }
         ];
         const jsonLd = generateArticleJsonLdSchema(
           article.title,
           article.metaDescription,
           fullUrl,
           article.author,
           article.datePublished,
           article.dateModified,
           article.category,
           articleBreadcrumbs
         );
         return {
           path: normalizedPath,
           h1Title: article.title,
           metaTitle: article.metaTitle,
           metaDescription: article.metaDescription,
           canonicalUrl: fullUrl,
           isIndexable: true,
           pageCategory: 'resource',
           breadcrumbs: articleBreadcrumbs,
           guideContent: null,
           jsonLd
         };
      }
    }

    if (PAGE_IMPORTS[key]) {
      const module = await PAGE_IMPORTS[key]();
      const targetUrl = `https://zapixal.com${key === 'home' ? '' : `/${key}`}`;
      const seoRes = module.getPageSeo(targetUrl, normalizedPath);
      
      const toolData = TOOL_REGISTRY.find(t => t.id === key || t.route === `/${key}`);
      if (toolData) {
        // Auto-generate relatedRoutes from TOOL_REGISTRY if not hardcoded (or to override)
        const relatedRoutes = toolData.relatedTools.map(relId => {
          const relTool = TOOL_REGISTRY.find(t => t.id === relId);
          return relTool ? { path: relTool.route, label: relTool.name } : null;
        }).filter(Boolean) as { path: string; label: string }[];

        // Auto-generate breadcrumbs from TOOL_REGISTRY category
        const catMap: Record<string, string> = {
          'images': 'Image Tools',
          'documents': 'Document Tools',
          'developer': 'Developer Tools',
          'text': 'Text Tools',
          'utilities': 'Utilities'
        };
        const catTitle = catMap[toolData.category] || 'Tools';
        const breadcrumbs = [
          { name: 'Home', url: '/' },
          { name: 'Tools', url: '/tools' },
          { name: catTitle, url: `/tools/${toolData.category}` },
          { name: toolData.name, url: toolData.route }
        ];

        return { 
          ...seoRes, 
          path: normalizedPath,
          canonicalUrl: targetUrl,
          isIndexable: !isAlias,
          relatedRoutes: relatedRoutes.length > 0 ? relatedRoutes : seoRes.relatedRoutes,
          breadcrumbs: breadcrumbs
        };
      }

      return { 
        ...seoRes, 
        path: normalizedPath,
        canonicalUrl: targetUrl,
        isIndexable: !isAlias
      };
    }
    
    return getNotFoundSeo(fullUrl, normalizedPath);
  } catch (error) {
    console.error(`Failed to load SEO for path ${path}:`, error);
    return getNotFoundSeo(fullUrl, normalizedPath);
  }
}
