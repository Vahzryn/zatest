import { useState, useEffect, useCallback } from 'react';
import { SeoRouteData } from '../lib/seoEngine';
import { applySeoToHead } from '../lib/seo/head';
import { parseSeoRoute } from '../lib/seo/meta';
import { PSEO_ROUTES_LIST } from '../lib/seo/routes';
import { getNotFoundSeo } from '../lib/seoEngine';
import { DOMAIN } from '../lib/seo/routes';
import { ConversionSettings } from '../types';
import { getArticleBySlug } from '../content/articles';

interface UseAppRoutingOptions {
  initialPath?: string;
  initialSeoData?: SeoRouteData;
  setSettings: React.Dispatch<React.SetStateAction<ConversionSettings>>;
  touchedKeys?: Set<string>;
}

const STATIC_KNOWN_ROUTES = new Set([
  '/',
  '/tools',
  '/tools/images',
  '/tools/documents',
  '/tools/developer',
  '/tools/text',
  '/tools/utilities',
  '/about',
  '/privacy',
  '/terms',
  '/404',
  '/widget',
  '/embed'
]);

export function isKnownRoute(pathname: string): boolean {
  const rawPath = (pathname || '/').split('?')[0].split('#')[0].toLowerCase().trim();
  let path = rawPath.length > 1 && rawPath.endsWith('/') ? rawPath.slice(0, -1) : (rawPath || '/');
  if (path.length > 5 && path.endsWith('.html')) {
    path = path.replace(/\.html$/, '');
  }
  
  if (STATIC_KNOWN_ROUTES.has(path)) return true;
  if (path === '/articles' || path.startsWith('/articles/')) return true;
  if (PSEO_ROUTES_LIST.some(r => r.path === path)) return true;
  if (path in REDIRECTS_MAP) return true;
  
  return false;
}

const INITIAL_FALLBACK_SEO: SeoRouteData = {
  path: '/',
  h1Title: 'Free Client-Side Batch Image Converter & Compressor',
  metaTitle: 'Free Local Image Converter & Compressor | Secure Processing | Zapixal',
  metaDescription: 'Convert, compress, and optimize HEIC, PNG, JPG, WebP, AVIF, SVG, and PDF files locally in your browser.',
  canonicalUrl: 'https://zapixal.com',
  isIndexable: true,
  pageCategory: 'home',
  breadcrumbs: [{ name: 'Home', url: '/' }],
  guideContent: null,
  jsonLd: null
};

function getEmbeddedSeoData(): SeoRouteData | null {
  if (typeof document !== 'undefined') {
    const el = document.getElementById('seo-data-payload');
    if (el) {
      try {
        return JSON.parse(el.textContent || '') as SeoRouteData;
      } catch (e) {
        console.error('Failed to parse embedded SEO data:', e);
      }
    }
  }
  return null;
}

const REDIRECTS_MAP: Record<string, string> = {
  '/grayscale-black-and-white-photo-converter': '/client-side-private-image-compressor',
  '/adjust-image-brightness-contrast-gamma-canvas': '/client-side-private-image-compressor',
  '/add-rounded-corners-border-radius-image': '/client-side-private-image-compressor',
  '/split-image-grid-instagram-banner': '/crop-image-to-exact-aspect-ratio',
  '/convert-animated-webp-to-gif': '/convert-webp-to-png-transparent',
  '/convert-eps-psd-preview-to-png': '/convert-svg-to-png-transparent',
  '/passport-visa-photo-resizer-background-white': '/crop-image-to-exact-aspect-ratio',
  '/rotate-and-flip-image-local': '/crop-image-to-exact-aspect-ratio',
  '/batch-rename-watermark-resize-pipeline': '/bulk-image-compressor-offline',
  '/square-photo-maker-no-crop-blur-border': '/crop-image-to-exact-aspect-ratio',
  
  // Cleaned up PSEO doorways -> Consolidated routes
  '/compress-image-under-50kb-government-portal': '/compress-image-to-exact-size-kb',
  '/compress-image-to-100kb-online': '/compress-image-to-exact-size-kb',
  '/compress-image-to-200kb-online': '/compress-image-to-exact-size-kb',
  '/reduce-image-size-to-1mb-online': '/compress-image-to-exact-size-kb',
  '/compress-image-for-email-attachment-limit': '/compress-image-to-exact-size-kb',
  
  '/secure-signature-compressor-pdf': '/secure-document-compressor-pdf',
  '/compress-pdf-scanned-document-images': '/secure-document-compressor-pdf',
  
  '/compress-png-lossless-webassembly': '/compress-png-images-online',
  '/compress-screenshot-png-size-fast': '/compress-png-images-online',
  
  '/bulk-image-resizer-ecommerce-catalog': '/bulk-image-compressor-offline',
  '/shopify-image-optimizer-bulk-free': '/bulk-image-compressor-offline',
  '/etsy-image-resizer-batch-optimize': '/bulk-image-compressor-offline',
  '/bulk-heic-to-jpg-converter-offline': '/convert-heic-to-jpg-locally',
  
  '/discord-avatar-compressor-pfp-size': '/crop-image-to-exact-aspect-ratio',
  '/social-media-banner-resizer-linkedin-twitter': '/crop-image-to-exact-aspect-ratio',
  '/resize-image-for-job-application-form': '/crop-image-to-exact-aspect-ratio',
  '/passport-photo-size-reducer-kb': '/crop-image-to-exact-aspect-ratio',
  
  '/convert-hdr-heic-to-png-transparency': '/convert-heic-to-jpg-locally',
  '/lossless-jpeg-optimizer-exif-preserve': '/client-side-private-image-compressor',
  '/high-res-image-resizer-client-side': '/client-side-private-image-compressor',
  
  // Features we don't have
  '/ai-image-compressor-online-private': '/client-side-private-image-compressor',
  '/compress-animated-gif-size-online': '/client-side-private-image-compressor',

  // Clean Search Route Aliases
  '/image-compressor': '/client-side-private-image-compressor',
  '/compress-pdf': '/secure-document-compressor-pdf',
  '/color-palette-extractor': '/palette-color-extractor-image-hex',
  '/blur-image': '/blur-sensitive-image-privacy-pixelator',
  '/pixelate-image': '/blur-sensitive-image-privacy-pixelator',
  '/strip-exif': '/strip-exif-metadata-online-private',
  '/remove-exif': '/strip-exif-metadata-online-private',
  '/jpg-to-pdf': '/convert-image-to-pdf',
  '/png-to-pdf': '/convert-image-to-pdf',
  '/heic-to-jpg': '/convert-heic-to-jpg-locally',
  '/webp-to-png': '/convert-webp-to-png-transparent',
  '/png-to-webp': '/convert-png-to-webp-lossless',
  '/svg-to-png': '/convert-svg-to-png-transparent',
  '/avif-to-jpg': '/convert-avif-to-jpg-converter',
};

export function useAppRouting({ initialPath, initialSeoData, setSettings, touchedKeys }: UseAppRoutingOptions) {
  const [currentPath, setCurrentPath] = useState<string>(() => {
    let rawPath = initialPath;
    if (!rawPath && typeof window !== 'undefined') {
      rawPath = window.location.pathname || '/';
    }
    rawPath = rawPath || '/';
    let path = rawPath.length > 1 && rawPath.endsWith('/') ? rawPath.slice(0, -1) : rawPath;
    
    // Normalize .html suffix (e.g. /embed.html -> /embed)
    if (path.length > 5 && path.endsWith('.html')) {
      const stripped = path.replace(/\.html$/, '');
      if (STATIC_KNOWN_ROUTES.has(stripped) || stripped in REDIRECTS_MAP || PSEO_ROUTES_LIST.some(r => r.path === stripped)) {
        path = stripped;
        if (typeof window !== 'undefined') {
          const search = window.location.search || '';
          const hash = window.location.hash || '';
          window.history.replaceState(null, '', `${path}${search}${hash}`);
        }
      }
    }
    
    // Canonicalize nested article paths like /articles/workflows/slug to /articles/slug
    if (path.startsWith('/articles/')) {
      const subPath = path.replace(/^\/articles\//, '');
      const article = getArticleBySlug(subPath);
      if (article && path !== `/articles/${article.slug}`) {
        const target = `/articles/${article.slug}`;
        if (typeof window !== 'undefined') {
          window.history.replaceState(null, '', target);
        }
        return target;
      }
    }
    
    if (path in REDIRECTS_MAP) {
      const target = REDIRECTS_MAP[path];
      if (typeof window !== 'undefined') {
        window.history.replaceState(null, '', target);
      }
      return target;
    }
    return path;
  });

  const [seoData, setSeoData] = useState<SeoRouteData>(() => {
    if (initialSeoData) return initialSeoData;
    const embedded = getEmbeddedSeoData();
    if (embedded) {
      if (embedded.path === currentPath || embedded.isNotFound) {
        return { ...embedded, path: currentPath };
      }
    }
    
    if (!isKnownRoute(currentPath)) {
      const fullUrl = `${DOMAIN}${currentPath === '/' ? '' : currentPath}`;
      return getNotFoundSeo(fullUrl, currentPath);
    }
    
    return { ...INITIAL_FALLBACK_SEO, path: currentPath };
  });

  const applySettings = useCallback((seo: SeoRouteData) => {
    setSettings(prev => {
      let next = { ...prev };
      const touched = touchedKeys || new Set<string>();
      
      if (!touched.has('targetFormat') && seo.toFormat) {
        next.targetFormat = seo.toFormat;
      }
      
      if (!touched.has('targetMaxKB')) {
        if (seo.targetMaxKB) {
          next.targetMaxKB = seo.targetMaxKB;
        } else {
          next.targetMaxKB = undefined;
        }
      }
      
      if (!touched.has('stripExif')) {
        if (seo.stripExif !== undefined) {
          next.stripExif = seo.stripExif;
        }
      }
      
      if (!touched.has('resize')) {
        if (seo.presetResize) {
          next.resize = {
            enabled: true,
            maxWidth: seo.presetResize.maxWidth,
            maxHeight: seo.presetResize.maxHeight,
            keepAspectRatio: true
          };
        } else if (seo.path.includes('resize') || seo.path.includes('passport') || seo.path.includes('size-reducer')) {
          next.resize = { ...next.resize, enabled: true, keepAspectRatio: true };
        } else {
          next.resize = { ...next.resize, enabled: false };
        }
      }
      
      if (!touched.has('cropAspectRatio')) {
        if (seo.path.includes('crop')) {
          next.cropAspectRatio = { width: 16, height: 9 };
        } else {
          next.cropAspectRatio = null;
        }
      }
      
      return next;
    });
  }, [setSettings, touchedKeys]);

  // Handle path transitions asynchronously
  useEffect(() => {
    let isCancelled = false;
    
    const embedded = getEmbeddedSeoData();
    if (embedded && embedded.path === currentPath) {
      setSeoData(embedded);
      applySeoToHead(embedded);
      applySettings(embedded);
    } else {
      parseSeoRoute(currentPath).then(seo => {
        if (!isCancelled) {
          setSeoData(seo);
          applySeoToHead(seo);
          applySettings(seo);
        }
      });
    }
    
    return () => {
      isCancelled = true;
    };
  }, [currentPath, applySettings]);

  useEffect(() => {
    const handlePopState = () => {
      let path = window.location.pathname || '/';
      let normalizedPath = path.length > 1 && path.endsWith('/') ? path.slice(0, -1) : path;
      
      // Canonicalize nested article paths like /articles/workflows/slug to /articles/slug
      if (normalizedPath.startsWith('/articles/')) {
        const subPath = normalizedPath.replace(/^\/articles\//, '');
        const article = getArticleBySlug(subPath);
        if (article && normalizedPath !== `/articles/${article.slug}`) {
          const target = `/articles/${article.slug}`;
          window.history.replaceState(null, '', target);
          setCurrentPath(target);
          return;
        }
      }
      
      if (normalizedPath in REDIRECTS_MAP) {
        const target = REDIRECTS_MAP[normalizedPath];
        window.history.replaceState(null, '', target);
        setCurrentPath(target);
      } else {
        setCurrentPath(path);
      }
    };
    
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleNavigate = useCallback((newPath: string) => {
    if (typeof window !== 'undefined') {
      let normalizedPath = newPath.length > 1 && newPath.endsWith('/') ? newPath.slice(0, -1) : newPath;
      
      // Canonicalize nested article paths like /articles/workflows/slug to /articles/slug
      if (normalizedPath.startsWith('/articles/')) {
        const subPath = normalizedPath.replace(/^\/articles\//, '');
        const article = getArticleBySlug(subPath);
        if (article && normalizedPath !== `/articles/${article.slug}`) {
          normalizedPath = `/articles/${article.slug}`;
        }
      }
      
      const targetPath = normalizedPath in REDIRECTS_MAP ? REDIRECTS_MAP[normalizedPath] : normalizedPath;
      const currentWindowPath = window.location.pathname || '/';
      const isInternalToolsSwitch = currentWindowPath.startsWith('/tools') && targetPath.startsWith('/tools');

      window.history.pushState(null, '', targetPath);
      setCurrentPath(targetPath);

      // Normal route navigation scrolls to top; internal Tools Directory category changes do not trigger global scroll
      if (!isInternalToolsSwitch) {
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
      }
    }
  }, []);

  return {
    currentPath,
    setCurrentPath,
    handleNavigate,
    seoData
  };
}
