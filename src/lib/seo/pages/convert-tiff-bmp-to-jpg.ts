import { RouteEditorialContent } from '../content';
import { generateJsonLdSchemas } from '../schema';
import { SeoRouteData } from '../../seoEngine';

function makeFaq(question: string, answer: string) {
  return { question, answer };
}

export function getConvertTiffBmpToJpgContent(): RouteEditorialContent {
  return {
    badge: 'Canvas Raster Decoder & MozJPEG',
    section1Title: 'Converting uncompressed legacy TIFF and BMP rasters into standard JPEG',
    section1Body: 'Legacy hardware scanners, medical imaging devices, and older Windows software output uncompressed bitmap (BMP) or tagged image file format (TIFF) files. These formats carry high byte overhead and are rejected by web forms and social platforms. Zapixal decodes supported uncompressed pixel arrays in local browser memory and re-encodes them into baseline JPEG using MozJPEG WebAssembly binaries, dramatically reducing byte size. Please note that native TIFF decoding is currently only supported in Safari browsers.',
    section2Title: 'Processing legacy scan archives without remote data transmission',
    section2Body: 'Medical records, legal documents, and historical scans saved as multi-megabyte BMP files (and TIFF in supported browsers) create massive storage bottlenecks. Converting them to optimized JPEG format shrinks files by 80% to 95% while retaining legible text and fine details. Because the conversion pipeline runs entirely within your browser tab, sensitive documents remain securely sandboxed on your local hardware.',
    steps: [
      'Drag BMP (or TIFF on Safari) files directly into the browser converter window.',
      'Adjust the output JPEG quality slider to balance clarity and file size.',
      'Save the lightweight JPG files locally without sending data across external networks.'
    ],
    faqs: [
      makeFaq('Are TIFF files supported on all browsers?', 'No. Currently, Zapixal relies on native browser capabilities for TIFF decoding, which is only supported in Safari. Users on Chrome or Firefox will need to use BMP or another format.'),
      makeFaq('Why are TIFF and BMP files rejected by modern websites and web forms?', 'TIFF and BMP are uncompressed or minimally compressed formats designed for print and legacy hardware. Modern web platforms require JPEG, WebP, or PNG formats.'),
      makeFaq('How much smaller is a JPEG compared to a BMP or TIFF file?', 'JPEG compression typically reduces file size by 80% to 95% compared to uncompressed BMP or TIFF files.'),
      makeFaq('Are my scanned document images transferred to external systems during conversion?', 'No. Zapixal processes all pixel data inside local browser memory using client-side WebAssembly.')
    ]
  };
}

export function getPageSeo(fullUrl: string): SeoRouteData {
  const path = '/convert-tiff-bmp-to-jpg';
  const guideContent = getConvertTiffBmpToJpgContent();
  return {
    path,
    h1Title: 'Convert TIFF and BMP Scans to Universal JPG Format',
    metaTitle: 'Convert TIFF & BMP to JPG — Private Local Utility',
    metaDescription: 'Convert legacy BMP images (and TIFF in Safari) to universal JPEG format in your browser. Shrink scans by up to 95% with local local processing.',
    canonicalUrl: fullUrl,
    isIndexable: true,
    pageCategory: 'converter',
    toFormat: 'jpg',
    breadcrumbs: [{ name: 'Home', url: '/' }, { name: 'Convert TIFF & BMP to JPG', url: path }],
    guideContent,
    jsonLd: generateJsonLdSchemas(
      'Convert TIFF and BMP Scans to Universal JPG Format',
      'Convert uncompressed BMP files (and TIFF in Safari) to lightweight JPEG format in local browser RAM with zero remote data transmission.',
      fullUrl,
      guideContent.faqs,
      [{ name: 'Home', url: '/' }, { name: 'Convert TIFF & BMP to JPG', url: path }],
      'converter',
      guideContent.steps
    )
  };
}
