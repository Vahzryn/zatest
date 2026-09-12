import { RouteEditorialContent } from '../content';
import { generateJsonLdSchemas } from '../schema';
import { SeoRouteData } from '../../seoEngine';

function makeFaq(question: string, answer: string) {
  return { question, answer };
}

export function getSecureDocumentCompressorPdfContent(): RouteEditorialContent {
  return {
    badge: 'Client-Side Zero-Knowledge Document Engine',
    section1Title: 'Compressing confidential legal, medical, and financial records safely',
    section1Body: 'Scanned document pages, passport copies, tax forms, and signed contracts contain high-stakes personal information. Uploading these sensitive files to online cloud PDF converters exposes them to remote storage, potential data breaches, and privacy compliance violations under GDPR and HIPAA. Zapixal processes document scans and PDF page images completely in local browser RAM using client-side WebAssembly binaries. Your files are converted and compressed without ever touching an external network.',
    section2Title: 'Maintaining crisp text legibility while reducing document file sizes',
    section2Body: 'Scanned document images often suffer from inflated file sizes due to uncompressed background noise and high-resolution camera capture. Our local processing pipeline applies adaptive palette quantization and resolution scaling optimized specifically for black-and-white text and signatures. This shrinks file payloads by up to 80% while keeping small typography and official stamps completely crisp for portal submissions and email attachments.',
    steps: [
      'Upload your document images or PDF scans directly into the local browser sandbox.',
      'Adjust the compression parameters to hit your required file size limit while verifying text readability.',
      'Save compressed document assets directly to your device with complete data privacy.'
    ],
    faqs: [
      makeFaq('Are my confidential document scans uploaded to any server?', 'No. All processing occurs locally within your browser sandbox using client-side WebAssembly. Zero document bytes are transmitted over the internet.'),
      makeFaq('Will small text and signatures remain legible after document compression?', 'Yes. Zapixal optimizes contrast and palette thresholds specifically for text documents, ensuring fine print and signature details remain readable.'),
      makeFaq('Can I compress multi-page PDF documents privately?', 'Yes. Zapixal converts PDF pages into optimized images or compresses PDF page assets directly inside browser memory without third-party server processing.')
    ]
  };
}

export function getPageSeo(fullUrl: string): SeoRouteData {
  const path = '/secure-document-compressor-pdf';
  const guideContent = getSecureDocumentCompressorPdfContent();
  return {
    path,
    h1Title: 'Secure Document & PDF Image Compressor (Client-Side)',
    metaTitle: 'Secure Document Compressor — Private Client-Side Tool',
    metaDescription: 'Compress sensitive document images and PDF pages in browser RAM without server uploads. Keep financial, legal, and medical records private.',
    canonicalUrl: fullUrl,
    isIndexable: true,
    pageCategory: 'resource',
    breadcrumbs: [{ name: 'Home', url: '/' }, { name: 'Secure Document Compressor', url: path }],
    guideContent,
    relatedRoutes: [
      { path: '/convert-pdf-pages-to-jpg-images', label: 'Convert PDF Pages to JPG' },
      { path: '/blur-sensitive-image-privacy-pixelator', label: 'Blur Sensitive Image Privacy Pixelator' }
    ],
    jsonLd: generateJsonLdSchemas(
      'Secure Document & PDF Image Compressor (Client-Side)',
      'Compress sensitive document images and PDF pages in browser memory without uploading files and with local privacy.',
      fullUrl,
      guideContent.faqs,
      [{ name: 'Home', url: '/' }, { name: 'Secure Document Compressor', url: path }],
      'resource',
      guideContent.steps
    )
  };
}
