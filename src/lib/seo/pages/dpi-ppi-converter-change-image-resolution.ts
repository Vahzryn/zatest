import { TargetFormat } from '../../../types';
import { RouteEditorialContent } from '../content';
import { DOMAIN } from '../routes';
import { generateJsonLdSchemas } from '../schema';
import { SeoRouteData } from '../../seoEngine';

function makeFaq(question: string, answer: string) {
  return { question, answer };
}

export function getDpiPpiConverterContent(): RouteEditorialContent {
  return {
    badge: 'EXIF & pHYs Header Calibration',
    section1Title: 'Recalibrating density metadata for offset and desktop printing',
    section1Body: 'Print shops and prepress systems mandate specific density metadata—commonly 300 DPI for high-end brochures or 600 DPI for fine art prints—to compute physical print dimensions on paper. Digital photos default to screen display values like 72 DPI or 96 DPI in EXIF metadata blocks. Changing DPI does not alter the underlying pixel grid or re-sample image colors. Zapixal parses the binary JFIF APP0 marker or PNG pHYs chunk inside your browser memory, rewriting density unit fields to your target DPI without lossy re-encoding.',
    section2Title: 'Calculating physical print dimensions from raw pixel grids',
    section2Body: 'Physical print size equals pixel count divided by DPI. A 3000x2400 photo printed at 300 DPI yields a crisp 10x8 inch physical photograph, whereas printing the same photo at 72 DPI stretches pixels across 41 inches, causing severe blur. Zapixal provides a real-time print layout calculator alongside metadata injection, displaying expected physical dimensions in inches and centimeters before you submit files to printers.',
    steps: [
      'Select your digital photo or design asset.',
      'Input your required target DPI value (e.g., 300, 600, or custom density).',
      'Download updated image files with calibrated EXIF density headers ready for printing.'
    ],
    faqs: [
      makeFaq('Does changing an image from 72 DPI to 300 DPI increase its file size or resolution?', 'No. Modifying DPI alters physical density metadata headers used by printers without modifying the underlying raw pixel count or file size.'),
      makeFaq('Where is DPI information stored in JPEG and PNG files?', 'In JPEG files, DPI is stored inside the JFIF APP0 header segment or EXIF IFD0 block. In PNG files, it is stored in the pHYs chunk as pixels per meter.'),
      makeFaq('Why do print shops reject files marked as 72 DPI even if the pixel resolution is huge?', 'Automated prepress software inspects metadata headers. If the header reads 72 DPI, prepress flags the file as low-resolution regardless of actual pixel dimensions.')
    ]
  };
}

export function getPageSeo(fullUrl: string): SeoRouteData {
  const path = '/dpi-ppi-converter-change-image-resolution';
  const guideContent = getDpiPpiConverterContent();
    return {
      path,
      h1Title: 'Change Image DPI & PPI Density Headers for Printing',
      metaTitle: 'Change Image DPI & PPI for Print — EXIF Metadata Tool',
      metaDescription: 'Recalibrate EXIF JFIF and PNG pHYs density metadata to 300 DPI or 600 DPI for print preparation. Private browser processing, zero re-sampling loss.',
      canonicalUrl: fullUrl,
      isIndexable: true,
      pageCategory: 'use-case',
      breadcrumbs: [{ name: 'Home', url: '/' }, { name: 'Change DPI for Print', url: path }],
      guideContent,
      jsonLd: generateJsonLdSchemas(
        'Change Image DPI & PPI Density Headers for Printing',
        'Recalibrate EXIF and pHYs density metadata to 300 DPI locally in browser memory without re-encoding pixel data.',
        fullUrl,
        guideContent.faqs,
        [{ name: 'Home', url: '/' }, { name: 'Change DPI for Print', url: path }],
        'use-case',
        guideContent.steps
      )
    };
}
