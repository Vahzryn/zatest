import { TargetFormat } from '../../../types';
import { RouteEditorialContent } from '../content';
import { DOMAIN } from '../routes';
import { generateJsonLdSchemas } from '../schema';
import { SeoRouteData } from '../../seoEngine';

function makeFaq(question: string, answer: string) {
  return { question, answer };
}

export function getConvertHeicToJpgContent(): RouteEditorialContent {
  return {
    badge: 'WASM iPhone Local Decoder',
    section1Title: 'Resolving the iOS format wall on non-Apple platforms',
    section1Body: 'iPhones capture photos in High Efficiency Image Container (HEIC) format by default to conserve internal flash storage. While HEIC offers superior compression efficiency, Windows PCs, legacy CMS tools, and web submission forms often refuse to read or decode `.heic` files. Zapixal embeds a WASM-compiled libheif decoder directly inside your browser. When you drop an iPhone photo into the app, your device decodes the underlying HEVC bitstream locally and rasterizes it to a clean, universally compatible JPEG array.',
    section2Title: 'Color space retention and zero quality drop during conversion',
    section2Body: 'HEIC files store rich 10-bit color depth and wide gamut Display P3 profiles. Our browser-native pipeline decodes the high-depth pixel buffer prior to JPEG encoding. This provides highly accurate color fidelity across standard displays. In addition, because Web Workers execute the HEVC frame parsing off the main thread, batch converting an entire album of iPhone shots occurs without freezing your active browser tab.',
    steps: [
      'Drop your iPhone `.heic` files directly into the browser window.',
      'Choose JPEG or WebP as your target compatibility format.',
      'Export converted files immediately to your local drive.'
    ],
    faqs: [
      makeFaq('Why cannot Windows or web forms open HEIC files by default?', 'HEIC uses the HEVC (H.265) video codec inside an ISOBMFF container. Many web applications and operating systems omit HEVC playback support due to licensing fees and legacy software constraints.'),
      makeFaq('Does converting HEIC to JPG reduce photo quality?', 'HEIC to JPEG conversion re-encodes pixel data, but at high quality parameters (e.g., 85–90%), the visual difference is imperceptible to the human eye while restoring broad platform compatibility.'),
      makeFaq('Is there a file count limit when converting iPhone photos?', 'No. Because processing uses your own device RAM and CPU rather than server quotas, you can convert as many photos as your browser memory permits.')
    ]
  };
}

export function getPageSeo(fullUrl: string): SeoRouteData {
  const path = '/convert-heic-to-jpg-locally';
  const guideContent = getConvertHeicToJpgContent();
    return {
      path,
      h1Title: 'Convert HEIC to JPG Locally on Your Device',
      metaTitle: 'Convert HEIC to JPG Locally — Free Browser Tool',
      metaDescription: 'Convert Apple HEIC photos to JPEG without server uploads. WASM iPhone local decoder ensures local security and color fidelity.',
      canonicalUrl: fullUrl,
      isIndexable: true,
      pageCategory: 'converter',
      fromFormat: 'HEIC',
      toFormat: 'jpg',
      breadcrumbs: [{ name: 'Home', url: '/' }, { name: 'Convert HEIC to JPG', url: path }],
      guideContent,
      relatedRoutes: [
        { path: '/bulk-image-compressor-offline', label: 'Bulk Local Image Compressor' },
        { path: '/client-side-private-image-compressor', label: 'Private Image Compressor' }
      ],
      relatedArticles: [
        { path: '/articles/heic-vs-jpg', label: 'HEIC vs JPG: Size, Quality & Compatibility Guide' }
      ],
      jsonLd: generateJsonLdSchemas(
        'Native iPhone HEIC to JPEG Decoding in Browser Memory',
        'Convert Apple HEIC photos to standard JPEG locally with WASM-powered decoding and without uploading your files.',
        fullUrl,
        guideContent.faqs,
        [{ name: 'Home', url: '/' }, { name: 'Convert HEIC to JPG', url: path }],
        'converter',
        guideContent.steps
      )
    };
}
