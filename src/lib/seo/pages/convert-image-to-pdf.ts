import { SeoRouteData } from '../../seoEngine';
import { generateSoftwareAppSchema, generateFaqSchema, generateBreadcrumbSchema, generateHowToSchema } from '../schema';

export function getPageSeo(fullUrl: string, path: string): SeoRouteData {
  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: 'Tools', url: '/tools' },
    { name: 'Image to PDF', url: '/convert-image-to-pdf' }
  ];

  const faqs = [
    {
      question: 'Are my photos uploaded to a server when converted to PDF?',
      answer: 'No. All image-to-PDF conversion happens strictly within your web browser using client-side JavaScript. Your photos never leave your device, ensuring total privacy.'
    },
    {
      question: 'Which image formats are supported for PDF conversion?',
      answer: 'You can combine JPG, PNG, WebP, AVIF, BMP, and even HEIC/HEIF images (like iPhone photos). Our client-side engine automatically handles required format translations before generating the PDF.'
    },
    {
      question: 'Can I reorder the images before creating the PDF?',
      answer: 'Yes! Simply drag and drop multiple images, and you can reorder them visually in the list before clicking "Convert to PDF" to generate your final multi-page document.'
    }
  ];

  const howToSteps = [
    'Drag and drop multiple images (JPG, PNG, HEIC, etc.) into the conversion workspace.',
    'Reorder the images using the up and down arrows if needed.',
    'Click "Convert to PDF" to securely generate a multi-page PDF locally.',
    'Download your combined PDF document instantly.'
  ];

  const softwareApp = generateSoftwareAppSchema(
    'Image to PDF Converter',
    'Combine multiple JPG, PNG, and HEIC images into a single multi-page PDF document locally in your browser.',
    fullUrl,
    'PDFTool'
  );

  const faqPage = generateFaqSchema(faqs);
  const breadcrumbSchema = generateBreadcrumbSchema(breadcrumbs);
  const howTo = generateHowToSchema('How to Convert Images to PDF Locally', 'Combine photos into a PDF in browser memory.', howToSteps);

  return {
    path,
    h1Title: 'Convert Images to PDF Locally',
    metaTitle: 'Image to PDF Converter — JPG, PNG, HEIC to PDF Online',
    metaDescription: 'Combine multiple JPG, PNG, WebP, and HEIC images into a single multi-page PDF document securely in your browser. Zero cloud uploads.',
    canonicalUrl: fullUrl,
    isIndexable: true,
    pageCategory: 'converter',
    breadcrumbs,
    guideContent: {
      badge: 'Client-Side PDF Generator',
      section1Title: 'Secure, Offline Image-to-PDF Generation',
      section1Body: 'Zapixal Image to PDF runs entirely in browser memory. Unlike cloud converters that require uploading personal photos, receipts, or documents to remote servers, our client-side architecture keeps your images locally private.',
      section2Title: 'Combine Multiple Formats Easily',
      section2Body: 'Seamlessly mix JPGs, PNGs, and HEIC files from your phone into one continuous PDF document. The PDF pages are automatically sized to fit the high-resolution quality of your original photos.',
      steps: howToSteps,
      faqs
    },
    relatedRoutes: [
      { path: '/convert-pdf-pages-to-jpg-images', label: 'Extract PDF to JPG' },
      { path: '/merge-pdf', label: 'Merge PDF Files' },
      { path: '/client-side-private-image-compressor', label: 'Compress Images' }
    ],
    jsonLd: {
      softwareApp,
      howTo,
      faqPage,
      breadcrumbs: breadcrumbSchema,
      organization: { '@type': 'Organization', name: 'Zapixal', url: 'https://zapixal.com' },      website: { '@type': 'WebSite', name: 'Zapixal', url: 'https://zapixal.com' }
    }
  };
}
