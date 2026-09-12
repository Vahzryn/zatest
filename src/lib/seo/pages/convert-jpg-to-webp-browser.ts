import { RouteEditorialContent } from '../content';
import { generateJsonLdSchemas } from '../schema';
import { SeoRouteData } from '../../seoEngine';

function makeFaq(question: string, answer: string) {
  return { question, answer };
}

export function getConvertJpgToWebpBrowserContent(): RouteEditorialContent {
  return {
    badge: 'libwebp WebAssembly Encoder',
    section1Title: 'Converting JPEG image collections to next-gen WebP format locally',
    section1Body: 'JPEG (JFIF) has served web content for decades, but lacks modern predictive spatial coding. WebP offers superior compression density, achieving 30% to 50% byte reductions compared to JPEG at equivalent perceived visual quality. Zapixal uses WebAssembly-compiled libwebp binaries to convert JPEG photos to WebP directly inside your browser RAM, accelerating site speed without remote server processing.',
    section2Title: 'Automating site optimization workflows without network bottlenecks',
    section2Body: 'Piping massive JPEG photo libraries across external network channels consumes heavy bandwidth and creates privacy risks. Zapixal processes entire batches of JPEG images concurrently in browser Web Workers. By controlling quality sliders locally, web developers and content creators optimize image assets for web deployment directly in your browser without uploading your files.',
    steps: [
      'Drag JPEG photos into the browser conversion window.',
      'Select WebP format and adjust quality parameters for optimal compression.',
      'Download next-gen WebP files directly to your machine.'
    ],
    faqs: [
      makeFaq('Why should I convert my JPG website photos to WebP?', 'WebP reduces image file sizes by 30% to 50% compared to JPG at similar visual quality, leading to faster page load times and better search rankings.'),
      makeFaq('Are all modern web browsers compatible with WebP images?', 'Yes. All major browsers including Chrome, Safari, Firefox, Edge, and mobile browsers offer full native support for WebP.'),
      makeFaq('Are my JPEG photos transferred across external networks when converting to WebP?', 'No. Zapixal converts JPEG files to WebP locally on your device CPU using WebAssembly.')
    ]
  };
}

export function getPageSeo(fullUrl: string): SeoRouteData {
  const path = '/convert-jpg-to-webp-browser';
  const guideContent = getConvertJpgToWebpBrowserContent();
  return {
    path,
    h1Title: 'Convert JPG to WebP in Browser: Fast Local Processing',
    metaTitle: 'Convert JPG to WebP in Browser — Free Local Converter',
    metaDescription: 'Convert JPEG photos to WebP format in browser memory. Reduce file size by 30-50% for faster site loading without uploading your files.',
    canonicalUrl: fullUrl,
    isIndexable: true,
    pageCategory: 'converter',
    fromFormat: 'jpg',
    toFormat: 'webp',
    breadcrumbs: [{ name: 'Home', url: '/' }, { name: 'Convert JPG to WebP', url: path }],
    guideContent,
    jsonLd: generateJsonLdSchemas(
      'Convert JPG to WebP in Browser: Fast Local Processing',
      'Convert JPEG photos to modern WebP format locally in browser memory without uploading your files.',
      fullUrl,
      guideContent.faqs,
      [{ name: 'Home', url: '/' }, { name: 'Convert JPG to WebP', url: path }],
      'converter',
      guideContent.steps
    )
  };
}
