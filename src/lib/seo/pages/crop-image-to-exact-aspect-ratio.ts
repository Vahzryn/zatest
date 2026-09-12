import { RouteEditorialContent } from '../content';
import { DOMAIN } from '../routes';
import { generateJsonLdSchemas } from '../schema';
import { SeoRouteData } from '../../seoEngine';

function makeFaq(question: string, answer: string) {
  return { question, answer };
}

export function getCropImageToExactAspectRatioContent(): RouteEditorialContent {
  return {
    badge: 'Precise Grid Alignment',
    section1Title: 'Custom aspect ratio cropping and framing without external transmissions',
    section1Body: 'Incorrect image proportions can warp or stretch layout elements on social feeds, CMS grids, and official portals. Standard cropping tools often enforce automated compression that degrades original pixel resolution. Zapixal avoids this overhead entirely by utilizing your browser’s Canvas 2D engine to isolate and redraw targeted sub-pixel coordinates. All coordinate cropping processes operate completely within local device memory, ensuring that your raw photography and private assets are never sent over the network.',
    section2Title: 'Perfect sub-pixel rendering and alignment control',
    section2Body: 'To achieve clean web design presentation, every pixel of your asset needs to line up perfectly with standard containers like 16:9, 4:3, or 1:1 square layouts. Zapixal enables you to position and scale crop frames manually while maintaining native pixel density. Because the entire compute pipeline is executed inside your browser sandbox, adjustments happen without network latency. This local architecture ensures that your photos are processed with maximum color fidelity and local data privacy.',
    steps: [
      'Load your image asset directly into the local browser sandbox.',
      'Select a preset aspect ratio or define custom pixel dimensions.',
      'Align the crop frame over your subject and export the processed file directly to your device.'
    ],
    faqs: [
      makeFaq('Does cropping an image reduce its original resolution?', 'No. Zapixal extracts the selected coordinate area directly from the original pixel buffer, preserving the full resolution of that specific region without applying default downscaling.'),
      makeFaq('Is there any network latency when adjusting crop overlays?', 'None at all. Because all visual calculations and canvas updates occur locally on your graphics hardware, frame positioning and adjustments respond smoothly and without network lag without any server round-trips.'),
      makeFaq('How are my photos kept secure during the cropping process?', 'Your files are decoded and rendered entirely within your browser’s RAM. Zapixal operates as a client-side application, making it structurally impossible to intercept, store, or collect your images.')
    ]
  };
}

export function getPageSeo(fullUrl: string): SeoRouteData {
  const path = '/crop-image-to-exact-aspect-ratio';
  const guideContent = getCropImageToExactAspectRatioContent();
  return {
    path,
    h1Title: 'Crop Images to Exact Aspect Ratios Online Privately',
    metaTitle: 'Crop Image to Aspect Ratio — Free Pixel-Accurate Tool',
    metaDescription: 'Crop and frame images to exact aspect ratios (16:9, 4:3, 1:1) in your browser. Perform sub-pixel accurate alignment without transmitting your files.',
    canonicalUrl: fullUrl,
    isIndexable: true,
    pageCategory: 'use-case',
    breadcrumbs: [{ name: 'Home', url: '/' }, { name: 'Crop Aspect Ratio', url: path }],
    guideContent,
    jsonLd: generateJsonLdSchemas(
      'Crop Images to Exact Aspect Ratios Online Privately',
      'Crop and frame images to exact aspect ratios in your browser with sub-pixel accuracy and without uploading files.',
      fullUrl,
      guideContent.faqs,
      [{ name: 'Home', url: '/' }, { name: 'Crop Aspect Ratio', url: path }],
      'use-case',
      guideContent.steps
    )
  };
}
