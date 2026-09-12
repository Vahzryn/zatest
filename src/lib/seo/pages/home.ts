import { RouteEditorialContent } from '../content';
import { DOMAIN } from '../routes';
import { generateJsonLdSchemas } from '../schema';
import { SeoRouteData } from '../../seoEngine';

export function getHomeContent(): RouteEditorialContent {
  return {
    badge: 'Browser Utility Hub',
    section1Title: 'Practical, privacy-first tools for daily digital workflows',
    section1Body: 'Zapixal brings essential media optimization, document editing, data formatting, and text comparison tools directly into your web browser. Instead of relying on heavy cloud uploads or intrusive software installs, Zapixal executes core processing locally using client-side WebAssembly, Web Workers, and JavaScript APIs. From compressing photos under strict portal limits to merging PDFs, validating JSON data, and comparing text diffs, every utility is designed for maximum speed and privacy.',
    section2Title: 'Built for privacy, cross-platform compatibility, and developer productivity',
    section2Body: 'Keeping sensitive documents, customer photos, code snippets, and API tokens private is paramount. Processing files directly in browser memory eliminates unnecessary data transfers over the network, lowering risk and speeding up iteration. Whether you are a web designer preparing modern WebP assets, an engineer debugging JSON payloads and JWT signatures, or a professional assembling PDF documents, Zapixal delivers clean, fast results without registration, subscriptions, or intrusive popups.',
    steps: [
      'Choose your tool from the directory or drop files into the workspace.',
      'Configure options, target sizes, formatting, or comparison parameters locally.',
      'Export or copy your optimized result directly from browser memory.'
    ],
    faqs: [
      { question: 'Do my files leave my computer when using Zapixal tools?', answer: 'For core utilities like image compression, PDF merging, JSON formatting, and text diffing, processing happens directly in your browser memory via WebAssembly and Web Workers without uploading your files to our servers.' },
      { question: 'What types of tools are available on Zapixal?', answer: 'Zapixal provides five core categories of tools: Image Optimization & Codecs, PDF & Document Utilities, Developer Tools (JSON, CSV, JWT, Regex), Text Tools (Markdown preview, Text diff), and Design Utilities (Color palette extraction).' },
      { question: 'Is Zapixal free to use?', answer: 'Yes. Zapixal is completely free to use with no account registration or hidden usage fees required.' }
    ]
  };
}

export function getPageSeo(fullUrl: string, path: string): SeoRouteData {
  const guideContent = getHomeContent();
  return {
    path,
    h1Title: 'Fast Browser-Based Toolkit for Images, Documents & Developer Tools',
    metaTitle: 'Zapixal — Browser Tools for Images, Documents & Developers',
    metaDescription: 'Fast browser tools for image compression, PDF editing, JSON formatting, and dev utilities. Free, private, and client-side with zero file uploads.',
    canonicalUrl: fullUrl,
    isIndexable: true,
    pageCategory: 'home',
    breadcrumbs: [{ name: 'Home', url: '/' }],
    guideContent,
    jsonLd: generateJsonLdSchemas(
      'Zapixal: Browser Tools for Images, Documents & Developers',
      'Fast, browser-based tools for image optimization, PDF manipulation, JSON formatting, text comparison, and developer workflows.',
      fullUrl,
      guideContent.faqs,
      [{ name: 'Home', url: '/' }],
      'home',
      guideContent.steps
    )
  };
}
