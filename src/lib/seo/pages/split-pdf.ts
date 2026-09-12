import { SeoRouteData } from '../../seoEngine';
import { generateSoftwareAppSchema, generateFaqSchema, generateBreadcrumbSchema, generateHowToSchema } from '../schema';

export function getPageSeo(fullUrl: string, path: string): SeoRouteData {
  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: 'Tools', url: '/tools' },
    { name: 'Split PDF', url: '/split-pdf' }
  ];

  const faqs = [
    {
      question: 'Can I extract specific page ranges from a PDF?',
      answer: 'Yes! You can extract individual pages (e.g. 1, 3, 5), continuous ranges (e.g. 1-4), or combinations (e.g. 1-3, 7, 9-11).'
    },
    {
      question: 'Are my PDF files sent to any external server?',
      answer: 'Never. PDF splitting is performed entirely in your browser using secure local JavaScript and PDF-Lib.'
    },
    {
      question: 'How do I download the extracted pages?',
      answer: 'Once you enter your desired page numbers or ranges and click Extract Pages, your new tailored PDF is ready for immediate download.'
    }
  ];

  const howToSteps = [
    'Select or drop your PDF document into the split workspace.',
    'Inspect the total page count and preview document info.',
    'Enter page numbers or ranges (e.g. 1-4, 7).',
    'Click "Extract Pages" to generate your new PDF and download it securely.'
  ];

  const softwareApp = generateSoftwareAppSchema(
    'Split PDF Pages Online Free',
    'Extract specific pages and page ranges from PDF documents locally in your browser with complete privacy.',
    fullUrl,
    'PDFTool'
  );

  const faqPage = generateFaqSchema(faqs);
  const breadcrumbSchema = generateBreadcrumbSchema(breadcrumbs);
  const howTo = generateHowToSchema('How to Split PDF Files', 'Extract specific pages or ranges locally.', howToSteps);

  return {
    path,
    h1Title: 'Split PDF Pages Online (Free & Private)',
    metaTitle: 'Split PDF Online Free — Extract PDF Pages Locally',
    metaDescription: 'Extract specific pages or ranges from PDF files instantly in your browser. Secure, client-side PDF splitter with zero server uploads.',
    canonicalUrl: fullUrl,
    isIndexable: true,
    pageCategory: 'converter',
    breadcrumbs,
    guideContent: {
      badge: 'Client-Side PDF Splitter',
      section1Title: 'Precise Page Extraction',
      section1Body: 'Whether you need to extract a single page, chapter ranges, or specific document sections, Zapixal Split PDF gives you exact control over output pages without uploading your files anywhere.',
      section2Title: 'Flexible Range Formats',
      section2Body: 'Type custom comma-separated lists (1, 3, 5) or inclusive ranges (2-6) with automatic validation and out-of-bounds protection.',
      steps: howToSteps,
      faqs
    },
    relatedRoutes: [
      { path: '/merge-pdf', label: 'Merge PDF Files' },
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
