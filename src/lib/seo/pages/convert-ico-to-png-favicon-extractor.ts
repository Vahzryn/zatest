import { TargetFormat } from '../../../types';
import { RouteEditorialContent } from '../content';
import { DOMAIN } from '../routes';
import { generateJsonLdSchemas } from '../schema';
import { SeoRouteData } from '../../seoEngine';

function makeFaq(question: string, answer: string) {
  return { question, answer };
}

export function getConvertIcoToPngContent(): RouteEditorialContent {
  return {
    badge: 'Binary Directory Extractor',
    section1Title: 'Unpacking multi-resolution Windows ICO directory headers into clean transparent PNGs',
    section1Body: 'Favicon files (.ico) are composite binary containers that pack multiple embedded image resolutions (such as 16x16, 32x32, 48x48, 64x64, and 256x256 pixels) into a single file header structure. When developers or designers try to edit an `.ico` file in standard photo editing tools, the software usually opens only the smallest 16x16 pixel thumbnail or fails to parse the directory block entirely. Zapixal includes a custom C-compiled WASM binary reader that parses the ICONDIR and ICONDIRENTRY headers, extracting all embedded resolution layers into individual 32-bit transparent PNG assets.',
    section2Title: 'Decompressing embedded PNG and DIB bitmap frames in browser RAM',
    section2Body: 'Modern ICO files contain a mix of uncompressed Device-Independent Bitmaps (DIB) and PNG-compressed streams. Zapixal’s decoder inspects magic byte signatures (0x89504E47 for PNG or XOR/AND bitmask arrays for DIB) to reconstruct true RGBA transparency layers accurately. Because decoding runs client-side inside your browser sandbox, proprietary web application favicons and desktop app icons are extracted securely without uploading your files.',
    steps: [
      'Drag your `.ico` favicon file into the binary reader workspace.',
      'View all detected resolution layers unpacked from the icon directory.',
      'Download your desired resolution or export all frames as high-resolution transparent PNGs.'
    ],
    faqs: [
      makeFaq('What is inside a standard .ico favicon file?', 'An .ico file contains a directory header followed by multiple image frames in varying pixel dimensions (from 16x16 to 256x256) used by operating systems for display flexibility.'),
      makeFaq('Does extracting a PNG from an ICO preserve transparency?', 'Yes. Unpacked PNG assets retain full 8-bit alpha transparency and anti-aliased edge smoothing.'),
      makeFaq('Is my favicon file uploaded to any remote server during extraction?', 'No. Zapixal parses the binary ICO file structure locally in your browser’s memory.')
    ]
  };
}

export function getPageSeo(fullUrl: string): SeoRouteData {
  const path = '/convert-ico-to-png-favicon-extractor';
  const guideContent = getConvertIcoToPngContent();
    return {
      path,
      h1Title: 'Unpack Multi-Resolution ICO Favicons into Transparent PNGs',
      metaTitle: 'Extract ICO Favicon to High-Res PNG — Local Utility',
      metaDescription: 'Extract embedded resolution frames from Windows ICO favicon containers into clean 32-bit transparent PNGs locally in browser RAM.',
      canonicalUrl: fullUrl,
      isIndexable: true,
      pageCategory: 'converter',
      fromFormat: 'ICO',
      toFormat: 'png',
      breadcrumbs: [{ name: 'Home', url: '/' }, { name: 'Extract ICO Favicon to PNG', url: path }],
      guideContent,
      jsonLd: generateJsonLdSchemas(
        'Unpack Multi-Resolution ICO Favicons into Transparent PNGs',
        'Parse multi-resolution ICO directory headers and extract transparent PNG assets locally in browser memory.',
        fullUrl,
        guideContent.faqs,
        [{ name: 'Home', url: '/' }, { name: 'Extract ICO Favicon to PNG', url: path }],
        'converter',
        guideContent.steps
      )
    };
}
