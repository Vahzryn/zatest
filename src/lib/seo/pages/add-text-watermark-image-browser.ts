import { RouteEditorialContent } from '../content';
import { DOMAIN } from '../routes';
import { generateJsonLdSchemas } from '../schema';
import { SeoRouteData } from '../../seoEngine';

function makeFaq(question: string, answer: string) {
  return { question, answer };
}

export function getAddTextWatermarkContent(): RouteEditorialContent {
  return {
    badge: 'Vector Canvas Typography',
    section1Title: 'Protecting online visual assets with client-side watermarking',
    section1Body: 'Photographers, digital illustrators, and real estate agents need to protect their preview images before publishing them online. Uploading high-res portfolio images to online watermarking websites exposes unwatermarked original files to server storage and public link scraping. Zapixal renders custom text watermarks directly onto the bottom-right corner of your image canvas in your local browser memory. You retain full privacy over your assets without relying on remote servers.',
    section2Title: 'Subtle text shadows for legibility',
    section2Body: 'Zapixal automatically scales your watermark text based on the resolution of the image and applies a subtle drop shadow to improve legibility against varying backgrounds. Because canvas compositing runs on your local device, batch watermarking dozens of high-res photos finishes in seconds.',
    steps: [
      'Upload your photos or artwork into the watermarking workspace.',
      'Type your copyright text to be placed in the corner of your image.',
      'Export watermarked images ready for public web publication without uploading files to any server.'
    ],
    faqs: [
      makeFaq('Is my unwatermarked original image ever sent over the internet?', 'No. All typography rendering and canvas compositing happen locally on your computer in browser RAM.'),
      makeFaq('Can I apply watermarks across multiple photos at once?', 'Yes. Our batch processor applies your configured watermark text across all queued images in parallel.')
    ]
  };
}

export function getPageSeo(fullUrl: string): SeoRouteData {
  const path = '/add-text-watermark-image-browser';
  const guideContent = getAddTextWatermarkContent();
  
  return {
    path,
    h1Title: 'Apply Custom Text Watermarks to Photos Privately Client-Side',
    metaTitle: 'Add Text Watermark to Image — Client-Side Utility',
    metaDescription: 'Protect artwork and photos with custom text watermarks rendered directly in browser RAM. Zero cloud exposure.',
    canonicalUrl: fullUrl,
    isIndexable: true,
    pageCategory: 'use-case',
    breadcrumbs: [{ name: 'Home', url: '/' }, { name: 'Text Watermark', url: path }],
    guideContent,
    jsonLd: generateJsonLdSchemas(
      'Apply Custom Text Watermarks to Photos Privately Client-Side',
      'Add copyright text watermarks to images locally in browser memory without uploading your files.',
      fullUrl,
      guideContent.faqs,
      [{ name: 'Home', url: '/' }, { name: 'Text Watermark', url: path }],
      'use-case',
      guideContent.steps
    )
  };
}
