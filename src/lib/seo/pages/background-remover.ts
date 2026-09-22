import { RouteEditorialContent } from '../content';
import { generateJsonLdSchemas } from '../schema';
import { SeoRouteData } from '../../seoEngine';

function makeFaq(question: string, answer: string) {
  return { question, answer };
}

export function getBackgroundRemoverContent(): RouteEditorialContent {
  return {
    badge: 'In-Browser AI Segmentation',
    section1Title: 'Client-side AI subject segmentation with zero server uploads',
    section1Body: 'Zapixal isolates foreground subjects and cuts out image backgrounds entirely inside your web browser. Utilizing modern neural segmentation models accelerated by WebGPU and WebAssembly SIMD, your images never leave your machine. This eliminates privacy risks when editing personal photos, signatures, or confidential enterprise graphics.',
    section2Title: 'Instant cutouts, custom backgrounds, and full compression pipeline',
    section2Body: 'Once the background is removed, you can export transparent PNG or WebP files, composite custom solid or blurred background colors, and pass the resulting cutout directly into Zapixal’s client-side compression pipeline to optimize file sizes without any quality loss or cloud round-trips.',
    steps: [
      'Drop your image (PNG, JPG, WebP, or HEIC) into the browser window.',
      'The local AI model automatically segments and removes the background in seconds.',
      'Choose transparent output, color fill, or blur, and export your optimized image.'
    ],
    faqs: [
      makeFaq('Are my photos uploaded to any external server?', 'No. Background removal runs 100% on your device using client-side WebGPU and WebAssembly. Your photos remain in your browser memory and are never uploaded to any remote server or cloud service.'),
      makeFaq('What hardware acceleration does Zapixal use?', 'Zapixal detects your device capabilities and prioritizes WebGPU for hardware-accelerated neural network inference. If WebGPU is unsupported or disabled, it seamlessly falls back to multithreaded WebAssembly (WASM).'),
      makeFaq('Can I download transparent PNG or WebP cutouts?', 'Yes. You can export cutouts with full alpha transparency as PNG or WebP, or replace the background with custom solid colors or subtle blur effects.')
    ]
  };
}

export function getPageSeo(fullUrl: string): SeoRouteData {
  const path = '/background-remover';
  const guideContent = getBackgroundRemoverContent();
  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: 'Image Tools', url: '/tools/images' },
    { name: 'Background Remover', url: path }
  ];

  return {
    path,
    h1Title: 'Free AI Background Remover: 100% Private & In-Browser',
    metaTitle: 'Free AI Background Remover — Private Client-Side Tool | Zapixal',
    metaDescription: 'Remove image backgrounds instantly in your browser using local AI and WebGPU/WASM acceleration. 100% private with zero server uploads.',
    canonicalUrl: fullUrl,
    isIndexable: true,
    pageCategory: 'use-case',
    breadcrumbs,
    guideContent,
    relatedRoutes: [
      { path: '/client-side-private-image-compressor', label: 'Image Compressor' },
      { path: '/compress-png-images-online', label: 'Compress PNG' },
      { path: '/convert-heic-to-jpg-locally', label: 'Convert HEIC to JPG' }
    ],
    relatedArticles: [
      { path: '/articles/privacy', label: 'Our Privacy Philosophy' }
    ],
    jsonLd: generateJsonLdSchemas(
      'AI Background Remover',
      'Remove image backgrounds locally in your browser with WebGPU and WASM neural segmentation. Completely private with zero cloud uploads.',
      fullUrl,
      guideContent.faqs,
      breadcrumbs,
      'use-case',
      guideContent.steps
    )
  };
}
