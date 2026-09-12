import { TargetFormat } from '../../../types';
import { RouteEditorialContent } from '../content';
import { DOMAIN } from '../routes';
import { generateJsonLdSchemas } from '../schema';
import { SeoRouteData } from '../../seoEngine';

function makeFaq(question: string, answer: string) {
  return { question, answer };
}

export function getConvertPngToWhiteJpgContent(): RouteEditorialContent {
  return {
    badge: 'Alpha-Channel Matte Compositing',
    section1Title: 'Converting transparent PNG logos and graphics to solid white background JPEGs',
    section1Body: 'Transparent PNG files are essential for web design, but many online forms, official PDF generators, government portals, and marketplace uploaders do not support alpha transparency. Converting a transparent PNG to JPEG using basic software often replaces transparent areas with solid black pixels, turning white logos or dark text graphics into illegible black boxes. Zapixal applies explicit alpha-channel matte compositing, blending the 8-bit transparency layer onto a solid white canvas background before JPEG quantization.',
    section2Title: 'Custom background color filling and color space preservation',
    section2Body: 'In addition to solid white fills, Zapixal allows you to choose custom hex background colors or sample background tones directly from your image. The Canvas 2D compositing engine uses linear sRGB color blending, preventing dark halo fringes along transparent object edges. All transformations execute locally in browser RAM, ensuring proprietary company logos and graphic design assets remain strictly private.',
    steps: [
      'Upload your transparent PNG logo or graphic asset.',
      'Set your background fill color (Default: Solid White #FFFFFF).',
      'Download clean JPEG files with solid backgrounds and crisp graphic edges.'
    ],
    faqs: [
      makeFaq('Why do transparent PNGs turn black when saved as JPG in some software?', 'JPEG does not support alpha channels. Software that fails to specify a background canvas color fills empty transparent pixels with zero-value black pixels by default.'),
      makeFaq('Will converting transparent PNG to white JPEG alter the visible colors of my logo?', 'No. All non-transparent logo pixels remain mathematically identical; only empty transparent pixels are filled with solid white.'),
      makeFaq('Can I pick a custom background fill color instead of pure white?', 'Yes. You can enter any hex color code or select custom background tones to match your brand palette.')
    ]
  };
}

export function getPageSeo(fullUrl: string): SeoRouteData {
  const path = '/convert-png-to-jpg-white-background';
  const guideContent = getConvertPngToWhiteJpgContent();
    return {
      path,
      h1Title: 'Convert Transparent PNG Graphics to Solid White Background JPEGs',
      metaTitle: 'Convert PNG to JPG with White Background — Local Tool',
      metaDescription: 'Convert transparent PNG logos and graphics to solid white background JPEGs without black background artifacts. Processed securely in-browser.',
      canonicalUrl: fullUrl,
      isIndexable: true,
      pageCategory: 'converter',
      fromFormat: 'PNG',
      toFormat: 'jpg',
      breadcrumbs: [{ name: 'Home', url: '/' }, { name: 'Convert PNG to White JPG', url: path }],
      guideContent,
      jsonLd: generateJsonLdSchemas(
        'Convert Transparent PNG Graphics to Solid White Background JPEGs',
        'Composite transparent PNG alpha channels onto solid white canvas backgrounds and export crisp JPEGs locally.',
        fullUrl,
        guideContent.faqs,
        [{ name: 'Home', url: '/' }, { name: 'Convert PNG to White JPG', url: path }],
        'converter',
        guideContent.steps
      )
    };
}
