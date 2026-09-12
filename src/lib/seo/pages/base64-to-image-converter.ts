import { RouteEditorialContent } from '../content';
import { generateJsonLdSchemas } from '../schema';
import { SeoRouteData } from '../../seoEngine';

function makeFaq(question: string, answer: string) {
  return { question, answer };
}

export function getBase64ToImageConverterContent(): RouteEditorialContent {
  return {
    badge: 'Base64 Decoder Tool',
    section1Title: 'Decode Base64 strings to image files instantly',
    section1Body: 'A Base64-encoded image string contains the binary representation of an image in ASCII text format. Our Base64 to Image Decoder instantly reads this text and reconstructs it back into its original image format. This allows you to preview and download images that were encoded for HTML, CSS, or JSON payloads without any server-side processing.',
    section2Title: '100% Private, Client-Side Decoding',
    section2Body: 'Your privacy is paramount. Unlike other tools that send your Base64 strings to a remote server for decoding, Zapixal processes everything entirely in your web browser. Your text strings never leave your device, making it perfect for sensitive architectural diagrams, medical imaging, or proprietary assets.',
    steps: [
      'Copy your Base64 string and paste it into the input area.',
      'The tool will automatically parse the string and render a preview.',
      'Click the Download button to save the decoded image to your device.'
    ],
    faqs: [
      makeFaq('Is my Base64 data uploaded to a server?', 'No. This tool operates entirely client-side within your browser. Your data never leaves your device, ensuring complete privacy.'),
      makeFaq('What image formats are supported?', 'The decoder supports any format that can be encoded in Base64 and rendered by a web browser, including PNG, JPEG, SVG, GIF, and WebP.'),
      makeFaq('Why is my Base64 string not decoding?', 'Ensure the string is complete and not corrupted. If the data URI scheme (e.g., data:image/png;base64,) is missing, the tool attempts to auto-detect it, but a malformed string will fail to render.')
    ]
  };
}

export function getPageSeo(fullUrl: string): SeoRouteData {
  const path = '/base64-to-image-converter';
  const guideContent = getBase64ToImageConverterContent();
  
  return {
    path,
    h1Title: 'Base64 to Image Decoder',
    metaTitle: 'Base64 to Image Decoder | Free Client-Side Converter',
    metaDescription: 'Instantly decode Base64 strings to image files (PNG, JPG, SVG) directly in your browser. 100% free, private, offline-capable tool with no server uploads.',
    canonicalUrl: `https://zapixal.com${path}`,
    isIndexable: true,
    pageCategory: 'resource',
    breadcrumbs: [
      { name: 'Home', url: '/' },
      { name: 'Tools Directory', url: '/tools' },
      { name: 'Base64 to Image', url: path }
    ],
    guideContent,
    jsonLd: generateJsonLdSchemas(
      'Base64 to Image Decoder',
      'Instantly decode Base64 strings to image files (PNG, JPG, SVG) directly in your browser.',
      fullUrl,
      guideContent.faqs,
      [
        { name: 'Home', url: '/' },
        { name: 'Tools', url: '/tools' },
        { name: 'Base64 to Image', url: path }
      ],
      'resource',
      guideContent.steps
    )
  };
}
