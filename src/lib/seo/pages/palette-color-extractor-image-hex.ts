import { RouteEditorialContent } from '../content';
import { DOMAIN } from '../routes';
import { generateJsonLdSchemas } from '../schema';
import { SeoRouteData } from '../../seoEngine';

function makeFaq(question: string, answer: string) {
  return { question, answer };
}

export function getPaletteColorExtractorContent(): RouteEditorialContent {
  return {
    badge: 'Color Palette Extractor',
    section1Title: 'Extract representative colors and HEX codes from your image instantly',
    section1Body: 'Whether designing a brand, picking styling themes, or matching UI elements, extracting a consistent color scheme from a primary picture is essential. This tool uses color clustering based on pixel frequency grids and spatial distance calculations to isolate up to eight representative swatches from any uploaded file. Every swatch is computed dynamically inside the client browser, preserving full privacy by processing all graphical buffers locally without server-side file transmission.',
    section2Title: 'Using the interactive eyedropper / custom pipette tool',
    section2Body: 'While auto-extracted swatches identify dominant background and accent clusters, you might need a very specific detail pixel. The interactive color pipette lets you hover and click anywhere on your image canvas. An integrated loupe magnifying preview lets you locate sub-pixel elements. When clicked, custom colors are logged as editable swatches, making it simple to copy their precise HEX tags. We handle contrast ratio calculations dynamically so you know whether black or white text is readable over each individual swatch.',
    steps: [
      'Upload or drag your image file into the color palette analyzer workspace.',
      'The tool automatically samples pixel distributions and renders the top representative color swatches.',
      'Use the interactive viewport pipette to hover and click specific elements for custom HEX codes.',
      'Click any swatch or HEX code chip to copy its textual string to your clipboard.'
    ],
    faqs: [
      makeFaq('How is the representative color palette generated?', 'The tool draws your image onto a temporary internal canvas and samples pixel color values. It aggregates colors into distinct bins based on frequency and Euclidean distance in the RGB space to supply up to eight visually distinct dominant colors.'),
      makeFaq('Is my uploaded image sent to any server?', 'No. The image file is loaded and analyzed entirely locally in your browser memory via canvas APIs. Your image remains safe on your device.'),
      makeFaq('How do I copy a HEX color code?', 'Simply hover and click on any of the generated swatches or custom code chips, and the exact HEX string will be copied to your clipboard instantly.'),
      makeFaq('How does the interactive color pipette work?', 'When you hover over the image preview, a magnifying loupe tracks your mouse and displays the color of the pixel directly under your cursor. Clicking will add that specific color to your Custom Colors palette.')
    ]
  };
}

export function getPageSeo(fullUrl: string): SeoRouteData {
  const path = '/palette-color-extractor-image-hex';
  const guideContent = getPaletteColorExtractorContent();
  return {
    path,
    h1Title: 'Image Color Palette Hex Extractor',
    metaTitle: 'Image Color Palette HEX Extractor — Free Browser Tool',
    metaDescription: 'Extract dominant color palettes and HEX codes from images. Use the interactive eyedropper tool to copy pixel colors privately with zero uploads.',
    canonicalUrl: fullUrl,
    isIndexable: true,
    pageCategory: 'resource',
    breadcrumbs: [{ name: 'Home', url: '/' }, { name: 'Color Palette Extractor', url: path }],
    guideContent,
    jsonLd: generateJsonLdSchemas(
      'Image Color Palette Hex Extractor',
      'Extract representative color palettes and custom HEX codes from your images.',
      fullUrl,
      guideContent.faqs,
      [{ name: 'Home', url: '/' }, { name: 'Color Palette Extractor', url: path }],
      'resource',
      guideContent.steps
    )
  };
}
