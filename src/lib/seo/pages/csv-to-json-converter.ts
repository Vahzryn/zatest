import { SeoRouteData } from '../../seoEngine';
import { generateSoftwareAppSchema, generateFaqSchema, generateBreadcrumbSchema, generateHowToSchema } from '../schema';

export function getPageSeo(fullUrl: string, path: string): SeoRouteData {
  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: 'Tools', url: '/tools' },
    { name: 'Developer Tools', url: '/tools?category=developer' },
    { name: 'CSV ↔ JSON Converter', url: '/csv-to-json-converter' }
  ];

  const faqs = [
    {
      question: 'How does in-browser CSV to JSON conversion work?',
      answer: 'The parser tokenizes tabular CSV data directly in local browser memory according to the RFC 4180 specification. It automatically detects separators (comma, semicolon, tab, pipe), handles multi-line quoted fields, and converts data into a clean JSON array of objects.'
    },
    {
      question: 'Are my CSV files or spreadsheets uploaded to any remote server?',
      answer: 'No. All conversion and parsing routines run 100% client-side in your browser memory sandbox. Zero bytes of data are sent over the network, ensuring complete confidentiality for customer databases, pricing lists, and internal spreadsheets.'
    },
    {
      question: 'Can I convert JSON arrays back into CSV spreadsheets?',
      answer: 'Yes. Toggle to "JSON ➔ CSV" mode to transform JSON object arrays or arrays of arrays into RFC 4180 compliant CSV text, with custom delimiter support and header configuration.'
    },
    {
      question: 'Does the converter automatically detect numeric and boolean data types?',
      answer: 'Yes. When "Auto-parse Numbers & Booleans" is active, numeric values, floats, true/false booleans, and nulls are converted to their native JavaScript types. Strings with leading zeros (like postal codes or phone numbers) are preserved as strings.'
    }
  ];

  const howToSteps = [
    'Paste raw CSV/TSV text into the input editor or drop a .csv/.tsv/.json file.',
    'Select your delimiter (auto-detect, comma, semicolon, tab, pipe) and configure header settings.',
    'Inspect the converted JSON in code view or explore the interactive data grid table.',
    'Copy the result to your clipboard or download the converted .json or .csv file.'
  ];

  const softwareApp = generateSoftwareAppSchema(
    'CSV to JSON and JSON to CSV Converter',
    'Convert CSV, TSV, and tabular spreadsheet data into JSON arrays and objects locally in browser memory with RFC 4180 compliance.',
    fullUrl,
    'DeveloperApplication'
  );

  const faqPage = generateFaqSchema(faqs);
  const breadcrumbSchema = generateBreadcrumbSchema(breadcrumbs);
  const howTo = generateHowToSchema('How to Convert CSV to JSON', 'Convert CSV tabular data into structured JSON objects in browser memory.', howToSteps);

  return {
    path,
    h1Title: 'CSV ↔ JSON Converter',
    metaTitle: 'CSV ↔ JSON Converter — Fast, Private & Free',
    metaDescription: 'Convert CSV spreadsheets to JSON or JSON to RFC 4180 CSV tables. Delimiter auto-detection, type inference, and interactive data grid in your browser.',
    canonicalUrl: fullUrl,
    isIndexable: true,
    pageCategory: 'use-case',
    breadcrumbs,
    guideContent: {
      badge: 'Client-Side Data Engine',
      section1Title: 'Bi-Directional Tabular & JSON Data Conversion',
      section1Body: 'Converting structured spreadsheet files into developer-friendly JSON format—or exporting database JSON payloads back to CSV format for analysis in Excel or Google Sheets—is essential for daily development. Zapixal executes bi-directional conversion instantly with zero network transmission.',
      section2Title: 'RFC 4180 Compliance & Interactive Data Grid Inspection',
      section2Body: 'Standard web converters often fail when CSV records contain embedded commas or multi-line quoted cells. Zapixal strictly adheres to RFC 4180 rules, preserving escaped quotes ("") and nested newlines. You can also explore converted rows using the built-in interactive data grid table with real-time search and sorting.',
      steps: howToSteps,
      faqs
    },
    relatedRoutes: [
      { path: '/json-formatter-validator', label: 'JSON Formatter & Validator' },
      { path: '/client-side-image-to-base64', label: 'Image to Base64' },
      { path: '/palette-color-extractor-image-hex', label: 'Color Palette Extractor' }
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
