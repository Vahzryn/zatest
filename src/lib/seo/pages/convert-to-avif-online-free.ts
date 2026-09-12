import { RouteEditorialContent } from '../content';
import { generateJsonLdSchemas } from '../schema';
import { SeoRouteData } from '../../seoEngine';

function makeFaq(question: string, answer: string) {
  return { question, answer };
}

export function getConvertToAvifContent(): RouteEditorialContent {
  return {
    badge: 'Next-Gen AV1 Encoding',
    section1Title: 'The evolution of web performance: Moving to AVIF locally',
    section1Body: 'AVIF (AV1 Image File Format) represents the absolute cutting edge of image compression technology in 2025. By utilizing the advanced AV1 video codec technology, AVIF can achieve file sizes up to 50% smaller than JPEG and 20% smaller than WebP at equivalent visual quality levels. Zapixal brings this powerful encoding capability directly to your browser via high-performance WebAssembly. This means you can generate next-gen assets for your high-performance websites without ever sending your original source files to a remote server.',
    section2Title: 'Superior fidelity with significantly lower bandwidth overhead',
    section2Body: 'Unlike legacy formats that suffer from heavy "blocking" artifacts at high compression levels, AVIF maintains remarkably clean edges and smooth gradients even at extremely low bitrates. This makes it the ideal choice for hero banners, high-resolution photography, and mobile-first web design. Zapixal’s local AVIF encoder supports alpha transparency and wide color gamuts, ensuring that your transition to next-gen formats doesn’t come at the cost of visual integrity. Our multi-threaded local worker pool ensures that even complex AVIF encoding tasks are completed rapidly on your local hardware.',
    steps: [
      'Upload your JPEGs, PNGs, or HEICs into the Zapixal converter.',
      'Select AVIF as your target output format and adjust the quality slider.',
      'Download your optimized AVIF assets for instant deployment to modern browsers.'
    ],
    faqs: [
      makeFaq('Is AVIF better than WebP?', 'In almost all cases, yes. AVIF offers superior compression efficiency and fewer visual artifacts than WebP at similar file sizes.'),
      makeFaq('Is AVIF supported by all browsers?', 'As of 2024, AVIF is supported by all major modern browsers, including Chrome, Firefox, Safari, and Edge. It is a safe and highly recommended format for production web environments.'),
      makeFaq('Why use a local converter for AVIF?', 'AVIF encoding is computationally expensive. Using Zapixal’s local WASM encoder keeps your data private and utilizes your own CPU power rather than waiting in a slow cloud queue.')
    ]
  };
}

export function getPageSeo(fullUrl: string): SeoRouteData {
  const path = '/convert-to-avif-online-free';
  const guideContent = getConvertToAvifContent();
  return {
    path,
    h1Title: 'Convert Image to AVIF: Free Next-Gen Online Optimizer',
    metaTitle: 'Convert Image to Next-Gen AVIF — Free Browser Tool',
    metaDescription: 'Convert your images to AVIF for high-performance web optimization. High-fidelity AV1 encoding is performed locally in your browser.',
    canonicalUrl: fullUrl,
    isIndexable: true,
    toFormat: 'avif',
    pageCategory: 'converter',
    breadcrumbs: [{ name: 'Home', url: '/' }, { name: 'Convert to AVIF', url: path }],
    guideContent,
    jsonLd: generateJsonLdSchemas(
      'Advanced AVIF Image Conversion & Optimization',
      'Leverage next-gen AV1 compression to shrink your images with local, browser-based AVIF encoding.',
      fullUrl,
      guideContent.faqs,
      [{ name: 'Home', url: '/' }, { name: 'Convert to AVIF', url: path }],
      'converter',
      guideContent.steps
    )
  };
}
