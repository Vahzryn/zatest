import { RouteEditorialContent } from '../content';
import { generateJsonLdSchemas } from '../schema';
import { SeoRouteData } from '../../seoEngine';

function makeFaq(question: string, answer: string) {
  return { question, answer };
}

export function getConvertPngToWebpLosslessContent(): RouteEditorialContent {
  return {
    badge: 'VP8L WebAssembly Lossless Compression',
    section1Title: 'Converting PNG to WebP while preserving 100% pixel-perfect transparency',
    section1Body: 'Portable Network Graphics (PNG) rely on DEFLATE or ZLIB compression algorithms to store uncompressed raster imagery and 8-bit alpha channels. Modern browsers support WebP (VP8L), which uses spatial predictive coding, transform color spaces, and entropy quantization. Converting PNG to VP8L WebP yields 25% to 45% smaller file sizes while preserving bit-for-bit alpha transparency. Zapixal executes libwebp WebAssembly binaries locally in browser memory, eliminating network latency.',
    section2Title: 'Improving Core Web Vitals with zero pixel loss or network transmission',
    section2Body: 'Large transparent PNG graphics directly inflate Largest Contentful Paint (LCP) and total byte payloads on modern websites. By converting PNG graphics to VP8L WebP locally, frontend developers reduce asset transfer size without degrading crisp UI icons or brand logos. Because processing occurs entirely within your local browser RAM, confidential design prototypes and proprietary graphics remain sandboxed on your local hardware.',
    steps: [
      'Upload PNG assets into the browser WebAssembly sandbox.',
      'Select WebP and enable Lossless mode for pixel-perfect fidelity.',
      'Export optimized WebP images directly to local storage without network transfers.'
    ],
    faqs: [
      makeFaq('Is WebP lossless conversion pixel identical to original PNGs?', 'Yes. VP8L WebP uses lossless entropy coding, preserving exact RGBA values and alpha channel transparency without discarding visual data.'),
      makeFaq('How much storage or bandwidth is saved converting PNG to WebP?', 'Lossless WebP files are typically 25% to 40% smaller than optimized PNGs while remaining identical in visual quality.'),
      makeFaq('Does converting PNG to WebP happen locally in my browser?', 'Yes. Zapixal executes libwebp compiled to WebAssembly inside your browser, so files are processed locally on your CPU.')
    ]
  };
}

export function getPageSeo(fullUrl: string): SeoRouteData {
  const path = '/convert-png-to-webp-lossless';
  const guideContent = getConvertPngToWebpLosslessContent();
  return {
    path,
    h1Title: 'Convert PNG to Lossless WebP with Alpha Transparency',
    metaTitle: 'Convert PNG to WebP Lossless — Fast Browser Tool',
    metaDescription: 'Convert PNG to WebP losslessly in browser memory. Preserves full alpha transparency with 25-40% smaller file size without uploading your files.',
    canonicalUrl: fullUrl,
    isIndexable: true,
    pageCategory: 'converter',
    fromFormat: 'PNG',
    toFormat: 'webp',
    breadcrumbs: [{ name: 'Home', url: '/' }, { name: 'Convert PNG to Lossless WebP', url: path }],
    guideContent,
    jsonLd: generateJsonLdSchemas(
      'Convert PNG to Lossless WebP with Alpha Transparency',
      'Convert PNG to VP8L WebP losslessly in browser RAM with full alpha transparency and without uploading files.',
      fullUrl,
      guideContent.faqs,
      [{ name: 'Home', url: '/' }, { name: 'Convert PNG to Lossless WebP', url: path }],
      'converter',
      guideContent.steps
    )
  };
}
