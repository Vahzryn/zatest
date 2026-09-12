import { TargetFormat } from '../../../types';
import { RouteEditorialContent } from '../content';
import { DOMAIN } from '../routes';
import { generateJsonLdSchemas } from '../schema';
import { SeoRouteData } from '../../seoEngine';

function makeFaq(question: string, answer: string) {
  return { question, answer };
}

export function getConvertWebpToPngContent(): RouteEditorialContent {
  return {
    badge: 'Alpha Channel Preserved Locally',
    section1Title: 'Preserving lossy and lossless 8-bit alpha channel transparency during WebP decoding',
    section1Body: 'WebP has become ubiquitous across the web due to its efficient spatial compression. However, desktop publishing tools, vector editors, and legacy design programs frequently throw errors when opening `.webp` images. Zapixal loads WebP files in local memory, expanding frames directly into raw RGBA pixel buffers and re-encoding them into standard PNG byte streams.',
    section2Title: 'Zero canvas color-bleeding or matte fringing artifacts',
    section2Body: 'A common bug in browser image conversion is edge fringing, where semi-transparent pixels inherit dark background matte colors. Zapixal preserves semi-transparent drop shadows, glow effects, and anti-aliased edge masks when re-encoding into standard 32-bit PNG format. Because all transformations execute inside an isolated OffscreenCanvas or browser memory, your design mockups and transparent assets never touch an external server.',
    steps: [
      'Load your `.webp` assets with transparent backgrounds into Zapixal.',
      'Select PNG as the target export format with 32-bit alpha transparency preservation enabled.',
      'Export high-fidelity, crisp 32-bit PNG files with pristine semi-transparent edge gradients.'
    ],
    faqs: [
      makeFaq('Why do converted WebP images sometimes get a black background?', 'Inferior conversion tools drop the 8-bit alpha transparency layer or fail to initialize an RGBA color space, filling empty pixel spaces with default zero-value black pixels. Zapixal explicitly enforces 32-bit RGBA channel allocation.'),
      makeFaq('Is converting WebP to PNG a lossless process?', 'Yes. Extracting raw 32-bit RGBA pixel buffers from WebP frames into PNG format preserves all pixel color values and alpha mask values without further visual degradation.'),
      makeFaq('Can I convert animated or losslessly compressed WebP files to PNG?', 'Yes. Zapixal processes WebP chunks, extracting high-resolution transparent PNG frames directly in browser memory.')
    ]
  };
}

export function getPageSeo(fullUrl: string): SeoRouteData {
  const path = '/convert-webp-to-png-transparent';
  const guideContent = getConvertWebpToPngContent();
  
  return {
      path,
      h1Title: 'Convert WebP to Transparent PNG Locally',
      metaTitle: 'Convert WebP to PNG — Preserve Transparency Locally',
      metaDescription: 'Extract standard 32-bit PNG files from WebP assets locally in browser memory. Alpha channel preserved locally.',
      canonicalUrl: fullUrl,
      isIndexable: true,
      pageCategory: 'converter',
      fromFormat: 'WEBP',
      toFormat: 'png',
      breadcrumbs: [{ name: 'Home', url: '/' }, { name: 'Convert WebP to PNG', url: path }],
      guideContent,
      jsonLd: generateJsonLdSchemas(
        'Convert WebP to PNG with Full Alpha Channel Transparency Intact',
        'Convert WebP images to 32-bit transparent PNG format locally in browser memory without server uploads.',
        fullUrl,
        guideContent.faqs,
        [{ name: 'Home', url: '/' }, { name: 'Convert WebP to PNG', url: path }],
        'converter',
        guideContent.steps
      )
    };
}
