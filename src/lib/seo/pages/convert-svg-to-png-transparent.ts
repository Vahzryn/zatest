import { TargetFormat } from '../../../types';
import { RouteEditorialContent } from '../content';
import { DOMAIN } from '../routes';
import { generateJsonLdSchemas } from '../schema';
import { SeoRouteData } from '../../seoEngine';

function makeFaq(question: string, answer: string) {
  return { question, answer };
}

export function getConvertSvgToPngContent(): RouteEditorialContent {
  return {
    badge: 'Vector Support Status',
    section1Title: 'Scalable Vector Graphics to Raster Formats',
    section1Body: 'SVG vector graphics offer infinite resolution scaling for web applications, but software like legacy image editors, email clients, social media platforms, and video editing suites often lack native SVG rendering support. Converting SVG to PNG requires precise vector rasterization that preserves path geometry, gradient fills, and transparent canvas backgrounds. Currently, Zapixal focuses exclusively on raster image formats and does not support SVG conversion in order to maintain a secure, local, and lightweight processing pipeline.',
    section2Title: 'Alternative workflows for SVG rasterization',
    section2Body: 'While you cannot currently convert SVGs directly in Zapixal, you can export your vector designs from tools like Figma or Adobe Illustrator directly to PNG or WebP, and then use Zapixal to compress those raster files efficiently in your browser without uploading them to external servers.',
    steps: [
      'Export your SVG to a raster format (like PNG) using your vector design software.',
      'Load your rasterized PNG file into the Zapixal browser optimization tool.',
      'Export a highly compressed 32-bit transparent WebP or optimized PNG directly.'
    ],
    faqs: [
      makeFaq('Does Zapixal support converting SVG files directly?', 'No. Zapixal currently blocks SVG files. Our tool focuses on compressing, resizing, and converting raster image formats (PNG, JPG, WebP, AVIF, HEIC) natively in the browser.'),
      makeFaq('Why is SVG conversion blocked?', 'To ensure a fully client-side and secure experience, Zapixal does not implement complex DOM-to-canvas vector rasterization algorithms which are often required for accurate SVG rendering.')
    ]
  };
}

export function getPageSeo(fullUrl: string): SeoRouteData {
  const path = '/convert-svg-to-png-transparent';
  const guideContent = getConvertSvgToPngContent();
  
  return {
    path,
    h1Title: 'Convert Vector Graphics to High-DPI Transparent PNG',
    metaTitle: 'Vector to PNG — Transparent Image Tool Information',
    metaDescription: 'Learn about converting vector graphics to crisp PNG images and why Zapixal currently focuses exclusively on raster image compression.',
    canonicalUrl: fullUrl,
    isIndexable: true,
    pageCategory: 'converter',
    fromFormat: 'SVG',
    toFormat: 'png',
    breadcrumbs: [{ name: 'Home', url: '/' }, { name: 'Convert SVG to PNG', url: path }],
    guideContent,
    jsonLd: generateJsonLdSchemas(
      'Vector Graphics to High-DPI Transparent PNG',
      'Information regarding SVG to PNG conversion and vector rasterization workflows.',
      fullUrl,
      guideContent.faqs,
      [{ name: 'Home', url: '/' }, { name: 'Convert SVG to PNG', url: path }],
      'converter',
      guideContent.steps
    )
  };
}
