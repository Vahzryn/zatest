import { TargetFormat } from '../../types';

export interface SeoRouteItem {
  path: string;
  label: string;
  category: 'converter' | 'compression' | 'use-case' | 'resource';
}

export const DOMAIN = 'https://zapixal.com';

export const PSEO_ROUTES_LIST: SeoRouteItem[] = [
  {
    path: '/client-side-private-image-compressor',
    label: 'Client-Side Private Image Compressor',
    category: 'compression'
  },
  {
    path: '/compress-image-under-50kb-government-portal',
    label: 'Compress Image Under 50KB for Portals',
    category: 'use-case'
  },
  {
    path: '/convert-heic-to-jpg-locally',
    label: 'Convert HEIC to JPG Locally',
    category: 'converter'
  },
  {
    path: '/strip-exif-metadata-online-private',
    label: 'Strip EXIF Metadata Privately',
    category: 'resource'
  },
  {
    path: '/bulk-image-compressor-offline',
    label: 'Bulk Local Image Compressor',
    category: 'compression'
  },
  {
    path: '/compress-png-lossless-webassembly',
    label: 'Lossless WebAssembly PNG Compressor',
    category: 'compression'
  },
  {
    path: '/convert-webp-to-png-transparent',
    label: 'Convert WebP to PNG (Alpha Intact)',
    category: 'converter'
  },
  {
    path: '/passport-photo-size-reducer-kb',
    label: 'Passport Photo Size Reducer (KB)',
    category: 'use-case'
  },
  {
    path: '/convert-avif-to-jpg-converter',
    label: 'Convert AVIF to JPG Converter',
    category: 'converter'
  },
  {
    path: '/resize-image-for-job-application-form',
    label: 'Resize Image for Job Applications',
    category: 'use-case'
  },
  {
    path: '/secure-signature-compressor-pdf',
    label: 'Secure Digital Signature Compressor',
    category: 'use-case'
  },
  {
    path: '/client-side-image-to-base64',
    label: 'Client-Side Image to Base64 Encoder',
    category: 'resource'
  },
  {
    path: '/convert-svg-to-png-transparent',
    label: 'Convert SVG to High-Res PNG (Transparent)',
    category: 'converter'
  },
  {
    path: '/compress-animated-gif-size-online',
    label: 'Compress Animated GIF Size',
    category: 'compression'
  },
  {
    path: '/convert-png-to-webp-lossless',
    label: 'Convert PNG to Lossless WebP',
    category: 'converter'
  },
  {
    path: '/crop-image-to-exact-aspect-ratio',
    label: 'Crop Image to Custom Aspect Ratio',
    category: 'use-case'
  },
  {
    path: '/add-text-watermark-image-browser',
    label: 'Apply Text Watermark Client-Side',
    category: 'use-case'
  },
  {
    path: '/convert-tiff-bmp-to-jpg',
    label: 'Convert TIFF & BMP to JPG',
    category: 'converter'
  },
  {
    path: '/high-res-image-resizer-client-side',
    label: 'High-Res Image Resizer Client-Side',
    category: 'use-case'
  },
  {
    path: '/dpi-ppi-converter-change-image-resolution',
    label: 'Change Image DPI & PPI for Print',
    category: 'use-case'
  },
  {
    path: '/compress-image-for-email-attachment-limit',
    label: 'Compress Image for Email Limits',
    category: 'use-case'
  },
  {
    path: '/convert-jpg-to-webp-browser',
    label: 'Convert JPG to WebP in Browser',
    category: 'converter'
  },
  {
    path: '/compress-screenshot-png-size-fast',
    label: 'Compress Screenshot PNG Fast',
    category: 'compression'
  },
  {
    path: '/convert-ico-to-png-favicon-extractor',
    label: 'Extract ICO Favicon to PNG',
    category: 'converter'
  },
  {
    path: '/bulk-image-resizer-ecommerce-catalog',
    label: 'Bulk E-commerce Catalog Resizer',
    category: 'use-case'
  },
  {
    path: '/convert-png-to-jpg-white-background',
    label: 'Convert PNG to JPG (White Fill)',
    category: 'converter'
  },
  {
    path: '/blur-sensitive-image-privacy-pixelator',
    label: 'Blur & Pixelate Sensitive Info',
    category: 'use-case'
  },
  {
    path: '/convert-hdr-heic-to-png-transparency',
    label: 'Convert iPhone HEIC to Transparent PNG',
    category: 'converter'
  },
  {
    path: '/social-media-banner-resizer-linkedin-twitter',
    label: 'Social Media Cover Banner Resizer',
    category: 'use-case'
  },
  {
    path: '/palette-color-extractor-image-hex',
    label: 'Image Color Palette Hex Extractor',
    category: 'resource'
  },
  {
    path: '/lossless-jpeg-optimizer-exif-preserve',
    label: 'Lossless Metadata-Preserving JPEG Optimizer',
    category: 'compression'
  },
  {
    path: '/compress-pdf-scanned-document-images',
    label: 'Scanned Document Image Quantizer',
    category: 'use-case'
  },
  {
    path: '/shopify-image-optimizer-bulk-free',
    label: 'Shopify Product Image Optimizer',
    category: 'use-case'
  },
  {
    path: '/convert-to-avif-online-free',
    label: 'Convert Image to AVIF (Next-Gen)',
    category: 'converter'
  },
  {
    path: '/ai-image-compressor-online-private',
    label: 'Private Smart Image Compressor',
    category: 'compression'
  },
  {
    path: '/compress-image-to-100kb-online',
    label: 'Compress Image to 100KB',
    category: 'compression'
  },
  {
    path: '/compress-image-to-200kb-online',
    label: 'Compress Image to 200KB',
    category: 'compression'
  },
  {
    path: '/bulk-heic-to-jpg-converter-offline',
    label: 'Bulk HEIC to JPG (Local)',
    category: 'converter'
  },
  {
    path: '/discord-avatar-compressor-pfp-size',
    label: 'Discord Avatar & PFP Compressor',
    category: 'use-case'
  },
  {
    path: '/reduce-image-size-to-1mb-online',
    label: 'Reduce Image Size to 1MB',
    category: 'compression'
  },
  {
    path: '/etsy-image-resizer-batch-optimize',
    label: 'Etsy Listing Image Resizer',
    category: 'use-case'
  },
  {
    path: '/convert-pdf-pages-to-jpg-images',
    label: 'Convert PDF Pages to JPG Images',
    category: 'converter'
  },
  {
    path: '/compress-image-to-exact-size-kb',
    label: 'Compress Image to Exact Size KB',
    category: 'compression'
  },
  {
    path: '/secure-document-compressor-pdf',
    label: 'Secure PDF Document Compressor',
    category: 'use-case'
  },
  {
    path: '/compress-png-images-online',
    label: 'Compress PNG Images Lossless Online',
    category: 'compression'
  },
];

export const CATEGORY_ROUTES = [
  '/tools/images',
  '/tools/documents',
  '/tools/developer',
  '/tools/text',
  '/tools/utilities',
];

export const ARTICLE_CATEGORY_ROUTES = [
  '/articles/formats',
  '/articles/privacy',
  '/articles/workflows',
  '/articles/performance',
];

export const ARTICLE_ITEM_ROUTES = [
  '/articles/heic-vs-jpg',
  '/articles/exif-metadata-privacy-guide',
  '/articles/compress-image-to-kb-limit-guide',
  '/articles/webp-vs-png-vs-jpeg',
  '/articles/browser-wasm-privacy-architecture',
  '/articles/client-side-pdf-merge-split-security-guide',
  '/articles/benchmarks',
];

export const ALL_ARTICLE_SYSTEM_ROUTES = [
  '/articles',
  ...ARTICLE_CATEGORY_ROUTES,
  ...ARTICLE_ITEM_ROUTES,
];

