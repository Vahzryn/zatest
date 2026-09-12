import { RouteEditorialContent } from '../content';
import { generateJsonLdSchemas } from '../schema';
import { SeoRouteData } from '../../seoEngine';

function makeFaq(question: string, answer: string) {
  return { question, answer };
}

export function getCompressPngImagesOnlineContent(): RouteEditorialContent {
  return {
    badge: 'Pixel-Perfect Lossless WebAssembly Engine',
    section1Title: 'Optimizing PNG assets without discarding alpha transparency or crisp lines',
    section1Body: 'Portable Network Graphics (PNG) rely on DEFLATE filter algorithms to compress lossless visual layers. Large screenshots, UI graphics, and digital illustrations frequently accumulate excessive file sizes due to unoptimized filter strategies and uncompressed metadata chunks. Zapixal executes C/C++ WebAssembly binaries directly inside browser RAM, re-evaluating PNG filter lines and entropy blocks to reduce byte payload without sacrificing single-pixel accuracy or alpha transparency.',
    section2Title: 'Browser-based execution without uploading files',
    section2Body: 'Processing confidential UI mockups, brand logos, or personal document captures on traditional cloud compressors requires uploading private assets to remote servers. Zapixal operates entirely within your browser runtime sandbox. All PNG quantization and DEFLATE re-compression algorithms run locally on your device CPU, guaranteeing complete data privacy, zero bandwidth usage, and high processing speeds.',
    steps: [
      'Select or drop your PNG files into the browser processing workspace.',
      'Choose lossless DEFLATE optimization or palette quantization according to your target file size needs.',
      'Export optimized PNG assets directly to your local device.'
    ],
    faqs: [
      makeFaq('Is PNG compression on Zapixal truly lossless?', 'Zapixal offers mathematically lossless DEFLATE re-compression that preserves exact RGBA values, as well as optional palette quantization when maximum file size reduction is required.'),
      makeFaq('Will transparent PNG backgrounds be preserved?', 'Yes. Alpha transparency channels remain completely intact across all PNG optimization modes without black backgrounds or edge corruption.'),
      makeFaq('Are my PNG files uploaded to remote servers during compression?', 'No. All PNG optimization scripts execute locally within your browser WebAssembly sandbox. Image files are processed locally.')
    ]
  };
}

export function getPageSeo(fullUrl: string): SeoRouteData {
  const path = '/compress-png-images-online';
  const guideContent = getCompressPngImagesOnlineContent();
  return {
    path,
    h1Title: 'Compress PNG Images Online with Pixel-Perfect Precision',
    metaTitle: 'Compress PNG Images Online — Lossless WebAssembly Tool',
    metaDescription: 'Compress PNG images losslessly or using palette quantization in browser memory. Preserves full alpha transparency without uploading files.',
    canonicalUrl: fullUrl,
    isIndexable: true,
    pageCategory: 'compression',
    fromFormat: 'png',
    toFormat: 'png',
    breadcrumbs: [{ name: 'Home', url: '/' }, { name: 'Compress PNG Images', url: path }],
    guideContent,
    relatedRoutes: [
      { path: '/convert-png-to-webp-lossless', label: 'Convert PNG to WebP Lossless' },
      { path: '/bulk-image-compressor-offline', label: 'Bulk Image Compressor' }
    ],
    jsonLd: generateJsonLdSchemas(
      'Compress PNG Images Online with Pixel-Perfect Precision',
      'Compress PNG images losslessly in browser RAM with full alpha transparency and without uploading files.',
      fullUrl,
      guideContent.faqs,
      [{ name: 'Home', url: '/' }, { name: 'Compress PNG Images', url: path }],
      'compression',
      guideContent.steps
    )
  };
}
