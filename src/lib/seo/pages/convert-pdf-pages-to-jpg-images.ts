import { RouteEditorialContent } from '../content';
import { DOMAIN } from '../routes';
import { generateJsonLdSchemas } from '../schema';
import { SeoRouteData } from '../../seoEngine';

function makeFaq(question: string, answer: string) {
  return { question, answer };
}

export function getConvertPdfPagesToJpgContent(): RouteEditorialContent {
  return {
    badge: 'PDF Rasterizer & Page Converter',
    section1Title: 'Convert individual pages from a PDF into JPG images directly in your browser',
    section1Body: 'A PDF page is not automatically the same thing as a JPG image. To create a JPG, the page has to be rendered as pixels first. Zapixal uses the browser\'s PDF rendering pipeline to load the document, retrieve the selected pages, render them to a canvas, and encode those pixels as JPEG images. This means the JPG represents the visual appearance of the selected PDF page. It does not preserve the PDF\'s editable text, vector objects, document structure, links, or other PDF-specific features. For multi-page documents, Zapixal processes pages individually rather than requiring every page to remain as a full-resolution canvas in memory at the same time. Actual processing limits depend on the browser, available memory, PDF complexity, and selected output resolution.',
    section2Title: 'Selecting pages, output quality settings, and local memory execution',
    section2Body: 'You do not need to convert the entire document if only a few pages are required. Select the pages you want before starting the conversion. For large PDFs, processing fewer pages at once can also reduce memory pressure on devices with limited RAM. JPEG uses lossy compression. Increasing JPEG quality generally preserves more visual detail but can produce larger files. Lower quality can reduce file size at the cost of additional compression artifacts. The best setting depends on the content of the page. Text-heavy documents may show compression artifacts around small characters, lines, and sharp edges. Photographic pages are generally more tolerant of JPEG compression. When the implementation processes the selected PDF entirely in browser memory, the PDF can be rendered without sending its contents to a Zapixal upload server.',
    steps: [
      'Upload or drag your PDF document into the browser tool.',
      'Select the specific pages or range of pages you need to convert to JPG images.',
      'Adjust output quality or scale factor, then click Convert to download your JPG files or ZIP bundle.'
    ],
    faqs: [
      makeFaq('Can I convert only selected PDF pages to JPG?', 'Yes. Select the pages you need before starting the conversion. You do not need to convert every page when only specific pages are required.'),
      makeFaq('Does converting PDF to JPG keep selectable text?', 'No. JPG is a raster image format. Text rendered into the JPG becomes pixels and is no longer a selectable PDF text layer.'),
      makeFaq('Does PDF to JPG preserve the original PDF?', 'The original PDF remains separate from the generated JPG files. The JPG is a rendered image representation of the selected page.'),
      makeFaq('Is the PDF uploaded to Zapixal?', 'When the implemented processing path runs entirely in the browser, the PDF is processed locally rather than uploaded to a Zapixal server.'),
      makeFaq('Why can a JPG be larger or smaller than the PDF page?', 'PDF and JPG use different representations. A PDF can contain text, vectors, compressed images, and other objects, while the JPG stores a rasterized image. Rendering and JPEG compression produce a file size that is not directly predictable from the PDF\'s original size.'),
      makeFaq('Can I convert a 100-page PDF?', 'The practical limit depends on the PDF, browser, available memory, page dimensions, and output settings. Large documents should be processed in manageable groups rather than assuming that every browser can safely render hundreds of high-resolution pages simultaneously.'),
      makeFaq('Does JPG conversion improve PDF quality?', 'No. Converting a PDF page to JPG rasterizes it and applies JPEG compression. It can make a page easier to use where an image is required, but it does not improve the original document\'s quality.')
    ]
  };
}

export function getPageSeo(fullUrl: string): SeoRouteData {
  const path = '/convert-pdf-pages-to-jpg-images';
  const guideContent = getConvertPdfPagesToJpgContent();
  return {
    path,
    h1Title: 'Convert PDF Pages to JPG Images',
    metaTitle: 'Convert PDF Pages to JPG Images — Free Browser Tool',
    metaDescription: 'Convert PDF pages to high-quality JPG images directly in your browser. Select individual pages and export images with zero server uploads.',
    canonicalUrl: fullUrl,
    isIndexable: true,
    toFormat: 'jpg',
    pageCategory: 'converter',
    breadcrumbs: [{ name: 'Home', url: '/' }, { name: 'Convert PDF Pages to JPG', url: path }],
    guideContent,
    jsonLd: generateJsonLdSchemas(
      'Convert PDF Pages to JPG Images',
      'Convert selected PDF pages to JPG images in your browser.',
      fullUrl,
      guideContent.faqs,
      [{ name: 'Home', url: '/' }, { name: 'Convert PDF Pages to JPG', url: path }],
      'converter',
      guideContent.steps
    )
  };
}
