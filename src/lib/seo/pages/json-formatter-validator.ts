import { SeoRouteData } from '../../seoEngine';
import { generateSoftwareAppSchema, generateFaqSchema, generateBreadcrumbSchema, generateHowToSchema } from '../schema';

export function getPageSeo(fullUrl: string, path: string): SeoRouteData {
  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: 'Tools', url: '/tools' },
    { name: 'Developer Tools', url: '/tools?category=developer' },
    { name: 'JSON Formatter & Validator', url: '/json-formatter-validator' }
  ];

  const faqs = [
    {
      question: 'How does in-browser JSON validation work?',
      answer: 'The parser processes your text directly in client-side memory using native JavaScript parsing APIs. It calculates character offsets, line counts, and column positions to display the precise syntax error location when formatting fails.'
    },
    {
      question: 'Does the formatter upload my JSON to a server?',
      answer: 'No data is uploaded over the network. The validator executes entirely within your local browser runtime memory sandbox, ensuring sensitive configuration files, API payloads, and tokens remain on your local machine.'
    },
    {
      question: 'Can this tool repair malformed JSON syntax?',
      answer: 'Yes. The auto-repair feature corrects common syntax mistakes such as trailing commas, single-quoted keys, unquoted object properties, and JavaScript object literals.'
    },
    {
      question: 'What indentation options are supported?',
      answer: 'You can format JSON with 2 spaces, 3 spaces, 4 spaces, tab indentation, or minify the output into a single compact line for network payload optimization.'
    }
  ];

  const howToSteps = [
    'Paste your raw JSON text or drag and drop a .json file into the input editor.',
    'Select your preferred indentation level (2 spaces, 4 spaces, tabs, or minified).',
    'Review syntax diagnostics or click "Auto-Fix Syntax" if malformed syntax is detected.',
    'Copy the formatted string or download the cleaned .json file.'
  ];

  const softwareApp = generateSoftwareAppSchema(
    'JSON Formatter and Validator',
    'Format, beautify, minify, and validate JSON payloads locally in browser memory with detailed syntax diagnostics.',
    fullUrl,
    'DeveloperApplication'
  );

  const faqPage = generateFaqSchema(faqs);
  const breadcrumbSchema = generateBreadcrumbSchema(breadcrumbs);
  const howTo = generateHowToSchema('How to Format and Validate JSON', 'Format, inspect, and validate JSON data in browser memory.', howToSteps);

  return {
    path,
    h1Title: 'JSON Formatter & Validator',
    metaTitle: 'JSON Formatter & Validator — Beautify, Minify & Inspect',
    metaDescription: 'Format, beautify, minify, and validate JSON in your browser. Line-by-line syntax diagnostics, key sorting, and interactive tree view with zero uploads.',
    canonicalUrl: fullUrl,
    isIndexable: true,
    pageCategory: 'use-case',
    breadcrumbs,
    guideContent: {
      badge: 'Client-Side JSON Engine',
      section1Title: 'Structured JSON Beautification and Error Diagnostics',
      section1Body: 'Working with unformatted or minified JSON strings can make debugging complex API payloads difficult. Zapixal parses JSON directly in local browser memory, displaying exact line and column numbers for syntax errors while calculating nesting depth and key-value counts.',
      section2Title: 'Automated Syntax Repair and Tree Hierarchy Inspection',
      section2Body: 'Common syntax issues like trailing commas, single quotes, or missing property quotation marks often break standard parsers. The auto-repair feature normalizes these discrepancies into valid JSON. You can also explore data visually using the interactive tree viewer to collapse nodes and copy nested paths.',
      steps: howToSteps,
      faqs
    },
    relatedRoutes: [
      { path: '/client-side-image-to-base64', label: 'Image to Base64' },
      { path: '/palette-color-extractor-image-hex', label: 'Color Palette Extractor' },
      { path: '/convert-image-to-pdf', label: 'Convert Image to PDF' }
    ],
    jsonLd: {
      softwareApp,
      howTo,
      faqPage,
      breadcrumbs: breadcrumbSchema,
      organization: { '@type': 'Organization', name: 'Zapixal', url: 'https://zapixal.com' },
      website: { '@type': 'WebSite', name: 'Zapixal', url: 'https://zapixal.com' }
    }
  };
}
