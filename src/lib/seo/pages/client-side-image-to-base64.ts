import { RouteEditorialContent } from '../content';
import { DOMAIN } from '../routes';
import { generateJsonLdSchemas } from '../schema';
import { SeoRouteData } from '../../seoEngine';

function makeFaq(question: string, answer: string) {
  return { question, answer };
}

export function getClientSideImageToBase64Content(): RouteEditorialContent {
  return {
    badge: 'Base64 Encoder Tool',
    section1Title: 'Convert images to base64 data URLs locally in your browser',
    section1Body: 'Converting an image to Base64 encodes its binary representation into an ASCII text string. A Base64-encoded image can be embedded directly in HTML, CSS, or JSON documents. This eliminates separate HTTP network requests for smaller icons, logos, and UI decorations. Zapixal converts images entirely client-side. The file is read from your local device, translated in browser memory, and presented as a ready-to-copy string. Large files produce extremely long strings that can impact DOM and page performance, so we recommend keeping inline Base64 data URLs restricted to smaller layout assets.',
    section2Title: 'HTML, CSS, or JSON: Where to use Base64 data URLs',
    section2Body: 'A complete Base64 data URL starts with a prefix declaring the MIME type, charset, and encoding method (e.g., data:image/png;base64,). For standard HTML structures, paste this complete URL directly into an img src attribute. In stylesheets, you can use it inside the url() parameter for background-image definitions. For raw API payloads or database storage, you may only need the raw Base64 string without the prefix headers. This tool provides both variations cleanly segregated. Base64 encoding increases file size by approximately 33%, so choose standard binary files for larger photographic content to optimize user bandwidth.',
    steps: [
      'Select or drag-and-drop your image file into the Base64 encoder workspace.',
      'The tool reads and translates the raw binary payload locally in browser memory.',
      'Copy either the complete Data URL for HTML/CSS or the raw Base64 payload string with a single click.'
    ],
    faqs: [
      makeFaq('What is an image to Base64 data URL?', 'An image Base64 data URL is a text-based representation of the image\'s binary data, prefixed with its MIME type and encoding method, allowing you to embed the image directly in HTML or CSS.'),
      makeFaq('Is my image uploaded to a server for Base64 conversion?', 'No. The conversion occurs entirely within your local browser memory using the FileReader API. Your image never leaves your device and is not sent to any external server.'),
      makeFaq('Which image formats can be converted to Base64?', 'All common image formats are supported, including PNG, JPEG, WEBP, SVG, GIF, and ICO.'),
      makeFaq('How does Base64 encoding affect image file size?', 'Base64 encoding increases the textual representation size by roughly 33% compared to the original raw binary file size.'),
      makeFaq('Can I use Base64 for very large images?', 'While technically possible, embedding large Base64 strings in HTML or CSS is not recommended because it increases document sizes and can degrade page rendering performance.')
    ]
  };
}

export function getPageSeo(fullUrl: string): SeoRouteData {
  const path = '/client-side-image-to-base64';
  const guideContent = getClientSideImageToBase64Content();
  return {
    path,
    h1Title: 'Convert Image to Base64 Data URL',
    metaTitle: 'Convert Image to Base64 Data URL — Free Browser Tool',
    metaDescription: 'Convert PNG, JPG, WebP, or SVG images to Base64 strings in your browser. Get HTML/CSS Data URLs and raw Base64 payloads with zero server uploads.',
    canonicalUrl: fullUrl,
    isIndexable: true,
    pageCategory: 'resource',
    breadcrumbs: [{ name: 'Home', url: '/' }, { name: 'Image to Base64 Converter', url: path }],
    guideContent,
    jsonLd: generateJsonLdSchemas(
      'Image to Base64 Converter',
      'Convert images to Base64 strings locally in your browser.',
      fullUrl,
      guideContent.faqs,
      [{ name: 'Home', url: '/' }, { name: 'Image to Base64 Converter', url: path }],
      'resource',
      guideContent.steps
    )
  };
}
