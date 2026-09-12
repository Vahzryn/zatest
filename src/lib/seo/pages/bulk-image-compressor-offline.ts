import { TargetFormat } from '../../../types';
import { RouteEditorialContent } from '../content';
import { DOMAIN } from '../routes';
import { generateJsonLdSchemas } from '../schema';
import { SeoRouteData } from '../../seoEngine';

function makeFaq(question: string, answer: string) {
  return { question, answer };
}

export function getBulkCompresslocalContent(): RouteEditorialContent {
  return {
    badge: 'Multithreaded Local Engine',
    section1Title: 'Overcoming batch processing bottlenecks in high-volume workflows',
    section1Body: 'Photographers, e-commerce managers, and web designers regularly face the daunting task of optimizing hundreds of high-resolution images at once. Traditional cloud services force you to queue files sequentially through limited upload slots, consuming huge bandwidth and taking hours to process. Attempting the same task in a standard single-threaded browser app often leads to memory spikes and browser tab crashes. Zapixal uses a worker pool orchestration model that detects your CPU hardware concurrency and spawns multiple dedicated Web Worker threads in the background. Each worker runs a dedicated WebAssembly instance, parallelizing compression across all available processor cores.',
    section2Title: 'Smart memory heap management for crash-free bulk execution',
    section2Body: 'Processing 500 MB of raw image data inside browser RAM requires disciplined memory allocation. Uncontrolled allocation quickly exhausts browser heap limits, causing the tab to crash. Our orchestrator implements an adaptive queue manager with chunked memory recycling. As each file completes compression, its temporary Blob URLs and ArrayBuffers are explicitly revoked and scheduled for garbage collection before the next file is loaded into thread memory. This ensures continuous, smooth execution whether you are compressing 5 files or 500 files in a single session.',
    steps: [
      'Select or drop a folder containing multiple image files into the queue.',
      'Set uniform output formats or customize target specs per file type.',
      'Monitor real-time parallel worker progress and export all assets in a single zip or direct save.'
    ],
    faqs: [
      makeFaq('Does bulk compressing local consume my internet bandwidth?', 'Not a single kilobyte. All processing happens locally on your computer’s processor, meaning you can compress hundreds of photos even when completely local without internet access.'),
      makeFaq('How does Zapixal handle multi-core CPUs during batch jobs?', 'Our worker pool automatically detects your hardware thread count (e.g., 4, 8, or 16 cores) and distributes files across isolated Web Workers to maximize throughput without freezing your screen.'),
      makeFaq('Can I bulk compress different file types at the same time?', 'Yes. You can mix PNG, JPEG, WebP, and HEIC files in the same queue and convert them all to a uniform target format or apply format-specific rules per item.')
    ]
  };
}

export function getPageSeo(fullUrl: string): SeoRouteData {
  const path = '/bulk-image-compressor-offline';
  const guideContent = getBulkCompresslocalContent();
    return {
      path,
      h1Title: 'Multithreaded Client-Side Batch Compression for High-Volume Workflows',
      metaTitle: 'Bulk Image Compressor — local Multithreaded Tool',
      metaDescription: 'Batch compress hundreds of images simultaneously using Web Workers and WASM. local-ready, multithreaded, free of server-side ceilings.',
      canonicalUrl: fullUrl,
      isIndexable: true,
      pageCategory: 'compression',
      breadcrumbs: [{ name: 'Home', url: '/' }, { name: 'Bulk local Compressor', url: path }],
      guideContent,
      jsonLd: generateJsonLdSchemas(
        'Multithreaded Client-Side Batch Compression for High-Volume Workflows',
        'Batch compress hundreds of images simultaneously using Web Workers and WASM locally in browser memory.',
        fullUrl,
        guideContent.faqs,
        [{ name: 'Home', url: '/' }, { name: 'Bulk local Compressor', url: path }],
        'compression',
        guideContent.steps
      )
    };
}
