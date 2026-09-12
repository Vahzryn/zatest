import { RouteEditorialContent } from '../content';
import { generateJsonLdSchemas } from '../schema';
import { SeoRouteData } from '../../seoEngine';

function makeFaq(question: string, answer: string) {
  return { question, answer };
}

export function getCompressExactKbContent(): RouteEditorialContent {
  return {
    badge: 'Precision KB Targeting',
    section1Title: 'Meet strict KB limits for portals and email attachments',
    section1Body: 'Whether you need an image under 50KB for a government portal, 100KB for an exam application, or 1MB for a job application form, Zapixal’s exact-size targeting handles it automatically. Instead of manually guessing quality sliders, our WebAssembly engine uses an iterative bisection algorithm to calculate the exact compression parameters needed to fit your file under your strict byte limit while preserving maximum readability.',
    section2Title: 'Private, local browser processing for sensitive documents',
    section2Body: 'When compressing passports, IDs, or official documents, privacy is critical. Unlike cloud compressors that upload your files to remote servers, Zapixal processes everything directly inside your browser RAM. The image conversion itself does not require uploading your image file to a remote server. We ensure that text and facial features remain sharp enough for official review by balancing resolution and quantization locally.',
    steps: [
      'Select the "Target Size" setting and enter your specific KB limit (e.g., 50, 100, 200).',
      'Upload your JPEG, PNG, or WebP photo into the local converter workspace.',
      'Export the compressed image directly to your device with precise file size target compliance.'
    ],
    faqs: [
      makeFaq('How does Zapixal compress images to an exact KB target?', 'Zapixal utilizes an automated bisection search algorithm on WebAssembly encoder quality factors, iteratively converging on the exact byte threshold in browser memory.'),
      makeFaq('Will compressing my image to 50KB or 100KB reduce quality?', 'Reducing file size requires quantization, but Zapixal preserves visual sharpness and text legibility as much as mathematically possible within the byte constraint.'),
      makeFaq('Is my document photo uploaded to any server during compression?', 'No. All compression algorithms execute locally within your web browser sandbox using client-side WebAssembly.')
    ]
  };
}

export function getPageSeo(fullUrl: string): SeoRouteData {
  const path = '/compress-image-to-exact-size-kb';
  const guideContent = getCompressExactKbContent();
  return {
    path,
    h1Title: 'Compress Image to Exact KB Size Online',
    metaTitle: 'Compress Image to Exact KB Size | Precision Reducer',
    metaDescription: 'Reduce image file size to exact KB limits (50KB, 100KB, 200KB) in browser memory. Ideal for passport photos, exam portals, and email attachments.',
    canonicalUrl: fullUrl,
    isIndexable: true,
    pageCategory: 'compression',
    targetMaxKB: 50,
    breadcrumbs: [{ name: 'Home', url: '/' }, { name: 'Compress to exact KB', url: path }],
    guideContent,
    relatedRoutes: [
      { path: '/bulk-image-compressor-offline', label: 'Bulk Image Compressor' },
      { path: '/client-side-private-image-compressor', label: 'Private Image Compressor' }
    ],
    relatedArticles: [
      { path: '/articles/compress-image-to-kb-limit-guide', label: 'Guide to Hitting Strict KB Limits' }
    ],
    jsonLd: generateJsonLdSchemas(
      'Compress Image to Exact Size KB',
      'Reduce image file size to precise byte thresholds locally in browser memory.',
      fullUrl,
      guideContent.faqs,
      [{ name: 'Home', url: '/' }, { name: 'Compress to exact KB', url: path }],
      'compression',
      guideContent.steps
    )
  };
}
