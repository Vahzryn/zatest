import { SeoRouteData } from '../../seoEngine';
import { generateSoftwareAppSchema, generateFaqSchema, generateBreadcrumbSchema, generateHowToSchema } from '../schema';

export function getPageSeo(fullUrl: string, path: string): SeoRouteData {
  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: 'Tools', url: '/tools' },
    { name: 'Merge PDF', url: '/merge-pdf' }
  ];

  const faqs = [
    {
      question: 'Are my PDF files uploaded to a server when merging?',
      answer: 'No. All PDF processing, reading, and merging happen locally in your browser memory using WebAssembly and client-side JavaScript. Your files never leave your device.'
    },
    {
      question: 'How do I change the page order of merged PDFs?',
      answer: 'You can easily reorder your selected PDF files by clicking the up and down arrow buttons next to each file item in the list before clicking Merge.'
    },
    {
      question: 'Is there a limit on file size or number of PDFs?',
      answer: 'You can merge multiple PDFs simultaneously. Browser memory is the only limit, but typical multi-document batches process instantly.'
    }
  ];

  const howToSteps = [
    'Select or drag and drop multiple PDF documents into the merge workspace.',
    'Rearrange file order using the list controls if necessary.',
    'Click "Merge PDFs" to combine all documents locally into a single file.',
    'Download your merged PDF instantly.'
  ];

  const softwareApp = generateSoftwareAppSchema(
    'Merge PDF Online Free',
    'Combine multiple PDF files into a single document locally in your browser with zero server uploads.',
    fullUrl,
    'PDFTool'
  );

  const faqPage = generateFaqSchema(faqs);
  const breadcrumbSchema = generateBreadcrumbSchema(breadcrumbs);
  const howTo = generateHowToSchema('How to Merge PDF Files Locally', 'Combine multiple PDFs in browser memory.', howToSteps);

  return {
    path,
    h1Title: 'Merge PDF Files Online (Free & Private)',
    metaTitle: 'Merge PDF Online Free — Combine PDF Files Locally',
    metaDescription: 'Combine multiple PDF documents into one single file securely in your browser. Zero cloud uploads, lightning-fast WebAssembly merging.',
    canonicalUrl: fullUrl,
    isIndexable: true,
    pageCategory: 'converter',
    breadcrumbs,
    guideContent: {
      badge: 'Client-Side PDF Merger',
      section1Title: 'Secure, Offline PDF Combination',
      section1Body: 'Zapixal Merge PDF runs entirely in browser memory. Unlike online cloud converters that require uploading sensitive contracts or personal records to remote servers, our client-side architecture keeps your documents locally private.',
      section2Title: 'Exact Page Ordering and Batch Control',
      section2Body: 'Arrange multiple PDF files in any order you choose. The resulting document preserves exact vector layout, fonts, and quality with zero rasterization loss.',
      steps: howToSteps,
      faqs
    },
    relatedRoutes: [
      { path: '/split-pdf', label: 'Split PDF Pages' },
      { path: '/convert-pdf-pages-to-jpg-images', label: 'Extract PDF Pages to JPG' },
      { path: '/secure-document-compressor-pdf', label: 'Compress PDF Securely' }
    ],
    jsonLd: {
      softwareApp,
      howTo,
      faqPage,
      breadcrumbs: breadcrumbSchema,
      organization: { '@type': 'Organization', name: 'Zapixal', url: 'https://zapixal.com' },
      website: { '@type': 'WebSite', name: 'Zapixal', url: 'https://zapixal.com' }
    }
  };
}
