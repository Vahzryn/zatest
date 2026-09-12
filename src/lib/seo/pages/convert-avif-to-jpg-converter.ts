import { TargetFormat } from '../../../types';
import { RouteEditorialContent } from '../content';
import { DOMAIN } from '../routes';
import { generateJsonLdSchemas } from '../schema';
import { SeoRouteData } from '../../seoEngine';

function makeFaq(question: string, answer: string) {
  return { question, answer };
}

export function getConvertAvifToJpgContent(): RouteEditorialContent {
  return {
    badge: 'dav1d WebAssembly Bitstream Decoder',
    section1Title: 'Decompressing AV1 Still Images (AVIF) for universal JPEG compatibility',
    section1Body: 'AV1 Image File Format (AVIF) achieves incredible compression efficiency by leveraging AV1 intra-frame video coding primitives. However, legacy photo viewers, operating systems, desktop publishing tools, and print portals often lack built-in libavif decoders, resulting in broken file icons or import failures. Zapixal incorporates Google’s dav1d C-library compiled to WebAssembly, decompressing AVIF compressed frames directly inside browser Web Workers and re-encoding raw color arrays into standard baseline JPEG format directly in your browser.',
    section2Title: '10-bit HDR gamut mapping to 8-bit sRGB without uploading your files',
    section2Body: 'AVIF files frequently contain 10-bit or 12-bit color data in YUV420/YUV444 planes with High Dynamic Range (HDR) Rec.2020 or Display P3 color profiles. Converting AVIF directly using basic tools causes dull, washed-out colors due to improper color gamut truncation. Zapixal applies matrix color transformation passes to map 10-bit HDR planes accurately into standard 8-bit sRGB JPEG arrays, keeping colors vibrant. Because decoding and encoding run in browser RAM, multi-megabyte AVIF archives convert without uploading files or server-side bandwidth usage.',
    steps: [
      'Drag your downloaded `.avif` images into the local WebAssembly converter.',
      'Select JPEG as your target format and adjust your preferred target quality.',
      'Export universally compatible JPG files directly, without sending your files to a remote server.'
    ],
    faqs: [
      makeFaq('Why do older image editors and smart TVs fail to open AVIF files?', 'AVIF relies on the modern AV1 video codec standard. Legacy hardware devices and older graphic software lack native AV1 bitstream decoders unless updated.'),
      makeFaq('Does converting AVIF to JPG wash out photo colors or increase file size?', 'Zapixal performs 10-bit to 8-bit gamut mapping to preserve vibrant colors. However, because JPEG uses older compression algorithms, the resulting JPG file will typically be larger in byte size than the original AVIF.'),
      makeFaq('Can I batch convert multiple AVIF photos privately in browser memory?', 'Yes. Our multithreaded Web Worker pool handles batch AVIF conversions in parallel directly in browser RAM without sending your photos to any remote server.')
    ]
  };
}

export function getPageSeo(fullUrl: string): SeoRouteData {
  const path = '/convert-avif-to-jpg-converter';
  const guideContent = getConvertAvifToJpgContent();
    return {
      path,
      h1Title: 'Convert Modern AVIF Images to Universal JPEG Format',
      metaTitle: 'Convert AVIF to JPG — Free Local Browser Converter',
      metaDescription: 'Convert AVIF images to universally compatible JPEG format in browser RAM. Tone-maps HDR, preserves sharpness, zero cloud processing.',
      canonicalUrl: fullUrl,
      isIndexable: true,
      pageCategory: 'converter',
      fromFormat: 'AVIF',
      toFormat: 'jpg',
      breadcrumbs: [{ name: 'Home', url: '/' }, { name: 'Convert AVIF to JPG', url: path }],
      guideContent,
      jsonLd: generateJsonLdSchemas(
        'Convert Modern AVIF Images to Universal JPEG Format',
        'Convert AV1-based AVIF images to standard JPEG locally in browser memory without uploading your files.',
        fullUrl,
        guideContent.faqs,
        [{ name: 'Home', url: '/' }, { name: 'Convert AVIF to JPG', url: path }],
        'converter',
        guideContent.steps
      )
    };
}
