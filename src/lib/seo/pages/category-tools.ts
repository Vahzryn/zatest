import { SeoRouteData } from '../../seoEngine';
import { TOOL_REGISTRY } from '../../toolRegistry';
import { generateJsonLdSchemas } from '../schema';

export type CategoryKey = 'images' | 'documents' | 'developer' | 'text' | 'utilities';

export interface CategoryInfo {
  key: CategoryKey;
  path: string;
  name: string;
  metaTitle: string;
  metaDescription: string;
  h1Title: string;
  badge: string;
  introText: string;
}

export const CATEGORY_PAGE_DEFINITIONS: Record<CategoryKey, CategoryInfo> = {
  images: {
    key: 'images',
    path: '/tools/images',
    name: 'Image Tools',
    metaTitle: 'Image Tools — Compress, Convert, Crop & Optimize | Zapixal',
    metaDescription: 'Fast, browser-based tools to compress, convert, crop, resize, and remove EXIF metadata from image files locally in your browser.',
    h1Title: 'Browser Image Tools & Codecs',
    badge: 'Optimization & Codecs',
    introText: 'Optimize, convert, crop, and strip metadata from image files locally in your browser using WebAssembly and Web Workers. Core image processing runs entirely on your device with zero server uploads.',
  },
  documents: {
    key: 'documents',
    path: '/tools/documents',
    name: 'PDF & Document Tools',
    metaTitle: 'PDF & Document Tools — Merge, Split & Compress | Zapixal',
    metaDescription: 'Local browser tools to merge PDF files, split pages, compress documents, and convert images to PDF securely.',
    h1Title: 'PDF & Document Utilities',
    badge: 'Local Documents',
    introText: 'Merge PDF files, split pages, compress document sizes, and convert images to PDF directly in browser memory. Keep confidential files on your local machine.',
  },
  developer: {
    key: 'developer',
    path: '/tools/developer',
    name: 'Developer Tools',
    metaTitle: 'Developer Tools — JSON, CSV, JWT & Base64 | Zapixal',
    metaDescription: 'Browser-based developer utilities to format JSON, convert CSV to JSON, decode JWT tokens, test Regex, and encode Base64 securely.',
    h1Title: 'Developer Utilities & Formatters',
    badge: 'Code, Formats & Tokens',
    introText: 'Format and validate JSON, transform CSV datasets, decode JWT authentication tokens, test regular expressions, and convert files to Base64 in your browser.',
  },
  text: {
    key: 'text',
    path: '/tools/text',
    name: 'Text Tools',
    metaTitle: 'Text Tools — Markdown Live Previewer & Text Diff | Zapixal',
    metaDescription: 'Local text utilities for live Markdown rendering, side-by-side text difference comparison, and text analysis.',
    h1Title: 'Text Tools & Diff Viewer',
    badge: 'Markdown & Text Comparison',
    introText: 'Preview Markdown documents in real time and compute line-by-line or character-level text diffs side-by-side entirely in your browser.',
  },
  utilities: {
    key: 'utilities',
    path: '/tools/utilities',
    name: 'Utilities & Design',
    metaTitle: 'Utilities & Design — Color Palette Extractor & Assets | Zapixal',
    metaDescription: 'Extract dominant color palettes from images, analyze HEX color codes, and manage visual design assets locally.',
    h1Title: 'Utilities & Design Tools',
    badge: 'Color & Visual Assets',
    introText: 'Extract color palettes, calculate HEX and RGB values from images, and analyze visual asset properties locally in your browser.',
  },
};

export function getCategoryPageSeo(categoryKey: CategoryKey, fullUrl: string, path: string): SeoRouteData {
  const cat = CATEGORY_PAGE_DEFINITIONS[categoryKey] || CATEGORY_PAGE_DEFINITIONS.images;
  const categoryTools = TOOL_REGISTRY.filter((t) => t.category === categoryKey && t.status === 'active');

  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: 'Tools Directory', url: '/tools' },
    { name: cat.name, url: cat.path },
  ];

  const faqs = [
    { question: `What tools are in the ${cat.name} category?`, answer: `Includes ${categoryTools.map(t => t.name).slice(0, 5).join(', ')} and more.` },
    { question: `Are ${cat.name} processed locally?`, answer: `Yes, core processing runs directly in your web browser memory for speed and privacy.` }
  ];

  const steps = [
    `Select a tool from the ${cat.name} category.`,
    'Configure options and options locally in your browser.',
    'Export or download your optimized result instantly.'
  ];

  const jsonLd = generateJsonLdSchemas(
    cat.name,
    cat.metaDescription,
    fullUrl,
    faqs,
    breadcrumbs,
    'use-case',
    steps
  );

  return {
    path,
    h1Title: cat.h1Title,
    metaTitle: cat.metaTitle,
    metaDescription: cat.metaDescription,
    canonicalUrl: fullUrl,
    isIndexable: true,
    pageCategory: 'use-case',
    breadcrumbs,
    jsonLd,
  };
}
