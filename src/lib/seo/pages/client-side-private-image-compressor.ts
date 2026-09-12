import { TargetFormat } from '../../../types';
import { RouteEditorialContent } from '../content';
import { DOMAIN } from '../routes';
import { generateJsonLdSchemas } from '../schema';
import { SeoRouteData } from '../../seoEngine';

function makeFaq(question: string, answer: string) {
  return { question, answer };
}

export function getClientSidePrivateCompressorContent(): RouteEditorialContent {
  return {
    badge: 'Fully Local Processing',
    section1Title: 'The shift from cloud-dependent processing to browser-native privacy',
    section1Body: 'Zapixal processes all images within the local browser memory. Processing files locally removes the need to pipe your raw image data across the public internet to a remote server. Zapixal utilizes WebAssembly (WASM) to execute high-performance compression codecs directly within your browser’s memory. By keeping the entire compute cycle local, your files are processed entirely on your device, ensuring that not a single byte of your original image ever reaches a third-party server.',
    section2Title: 'Eliminating the "Server Round-Trip" for faster, more secure iterations',
    section2Body: 'Speed in a professional workflow isn’t just about raw throughput; it’s about the time wasted waiting for uploads to finish. When processing high-resolution assets or massive batches, the network bottleneck is often the slowest link. Our client-side approach eliminates this overhead entirely. Because the browser’s Canvas API and multithreaded Web Workers handle the heavy lifting locally, the results appear directly in your browser. Additionally, this method provides absolute metadata security—you can strip EXIF tags and geotags locally, preventing sensitive location data from being leaked before you share the optimized file.',
    steps: [
      'Drag your high-resolution images into the browser window.',
      'Adjust the compression parameters locally while monitoring real-time quality.',
      'Save the optimized assets directly to your local storage without any data transfer.'
    ],
    faqs: [
      makeFaq('How can a browser compress images without a backend server?', 'Zapixal uses WebAssembly to run high-performance codecs like MozJPEG, WebP, and Imagequant directly on your machine’s CPU. This allows the browser to perform desktop-class image processing entirely within its own memory space.'),
      makeFaq('Does my computer’s hardware affect the compression speed?', 'Yes. Unlike cloud tools that use shared server resources, Zapixal leverages your local CPU cores. On modern devices, this is often faster than the combined time of uploading a file, waiting for a server, and downloading the result.'),
      makeFaq('How does local processing compare to browser private browsing or Incognito mode?', 'Incognito or private browsing modes only prevent your local browser from saving search and history logs. They do not prevent websites from receiving or storing the images you upload. Zapixal, however, processes your files locally on your machine, so your images are not uploaded to our servers.')
    ]
  };
}

export function getPageSeo(fullUrl: string): SeoRouteData {
  const path = '/client-side-private-image-compressor';
  const guideContent = getClientSidePrivateCompressorContent();
    return {
      path,
      h1Title: 'Private Image Compressor: Fully Local Processing',
      metaTitle: 'Private Image Compressor — Client-Side Browser Tool',
      metaDescription: 'Compress images privately in your browser memory without server uploads. Fully local processing for complete data privacy.',
      canonicalUrl: fullUrl,
      isIndexable: true,
      pageCategory: 'compression',
      breadcrumbs: [{ name: 'Home', url: '/' }, { name: 'Private Compressor', url: path }],
      guideContent,
      relatedRoutes: [
        { path: '/strip-exif-metadata-online-private', label: 'Strip EXIF Metadata' },
        { path: '/blur-sensitive-image-privacy-pixelator', label: 'Blur Sensitive Images' }
      ],
      relatedArticles: [
        { path: '/articles/privacy', label: 'Our Privacy Philosophy' },
        { path: '/articles/exif-metadata-privacy-guide', label: 'EXIF Metadata & Privacy Risks' }
      ],
      jsonLd: generateJsonLdSchemas(
        'The Architecture of Trust: Local Client-Side Image Compression',
        'Compress images privately in your browser without server uploads using WASM-powered local processing.',
        fullUrl,
        guideContent.faqs,
        [{ name: 'Home', url: '/' }, { name: 'Private Compressor', url: path }],
        'compression',
        guideContent.steps
      )
    };
}
