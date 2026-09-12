import { SeoRouteData } from '../../seoEngine';
import { generateSoftwareAppSchema, generateFaqSchema, generateBreadcrumbSchema, generateHowToSchema } from '../schema';

export function getPageSeo(fullUrl: string, path: string): SeoRouteData {
  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: 'Tools', url: '/tools' },
    { name: 'Developer Tools', url: '/tools?category=developer' },
    { name: 'Diff Viewer & Text Comparator', url: '/text-diff' }
  ];

  const faqs = [
    {
      question: 'Does this text diff tool process my documents locally or upload them to a server?',
      answer: 'Text diff calculations, character-level comparison, and patch generation execute 100% locally in your browser memory. Your text, source code files, logs, and sensitive data are never uploaded to any remote server or stored in external databases.'
    },
    {
      question: 'What views and comparison options are supported?',
      answer: 'This tool provides both Side-by-Side and Unified diff views with line numbers, intra-line character/word level change highlighting, whitespace controls (ignore whitespace, trim spaces, ignore blank lines), case sensitivity toggles, and JSON auto-formatting before comparison.'
    },
    {
      question: 'Can I upload files directly or compare code files?',
      answer: 'Yes. You can drag and drop or select plain text (.txt), Markdown (.md), JSON (.json), CSV (.csv), or common source code files (.js, .ts, .py, .html, .css, .log, etc.). Files are read locally as UTF-8 text in your browser RAM.'
    },
    {
      question: 'How do I copy or export the comparison result?',
      answer: 'You can copy the raw unified diff patch to your clipboard, copy the modified text, or download the patch as a standard .diff / .patch file ready for use in Git or software patch utilities.'
    },
    {
      question: 'How does the tool handle large files and long lines?',
      answer: 'The diff engine uses optimized Myers line comparison and includes safe performance limits. For lines exceeding 2,000 characters, character-level diffing gracefully degrades to line-level highlighting to prevent browser UI freezing.'
    }
  ];

  const howToSteps = [
    'Paste original text into the Left pane and modified text into the Right pane, or upload local text files.',
    'Toggle comparison options such as Ignore Whitespace, Trim Spaces, Ignore Case, or Format JSON.',
    'Switch between Side-by-Side and Unified diff view modes to inspect added, removed, and modified lines with inline character highlighting.',
    'Copy the unified diff patch or download it as a .diff file locally.'
  ];

  const softwareApp = generateSoftwareAppSchema(
    'Diff Viewer & Text Comparator',
    'Compare two text or code files side-by-side or in unified view with character-level diff highlighting, whitespace controls, statistics, and offline patch export.',
    fullUrl,
    'DeveloperApplication'
  );

  const faqPage = generateFaqSchema(faqs);
  const breadcrumbSchema = generateBreadcrumbSchema(breadcrumbs);
  const howTo = generateHowToSchema(
    'How to Compare Text and Code Files',
    'Compare two text blocks or source code files side-by-side with character-level diff highlighting.',
    howToSteps
  );

  return {
    path,
    h1Title: 'Diff Viewer & Text Comparator',
    metaTitle: 'Text Diff Viewer & Comparator — Side-by-Side Online',
    metaDescription: 'Compare text or code side-by-side or unified. Character-level diff highlighting, whitespace filters, and patch export locally in your browser.',
    canonicalUrl: fullUrl,
    isIndexable: true,
    pageCategory: 'use-case',
    breadcrumbs,
    guideContent: {
      badge: 'In-Browser Diff Engine',
      section1Title: 'Side-by-Side and Unified Text Comparison Engine',
      section1Body: 'Compare source code, documentation drafts, JSON payloads, or text documents instantly. Inspect added, deleted, and modified lines with precision character-level word highlighting, line numbers, and customizable whitespace options with zero remote server processing.',
      section2Title: 'Local File Import, Privacy Guarantees & Patch Export',
      section2Body: 'Load text files directly into browser memory with UTF-8 BOM stripping and binary content detection. Easily export standard unified .diff or .patch files for Git workflows while ensuring your data never leaves your device.',
      steps: howToSteps,
      faqs
    },
    relatedRoutes: [
      { path: '/markdown-live-preview', label: 'Markdown Live Previewer' },
      { path: '/regex-tester', label: 'Regex Tester & String Debugger' },
      { path: '/json-formatter-validator', label: 'JSON Formatter & Validator' },
      { path: '/csv-to-json-converter', label: 'CSV ↔ JSON Converter' }
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
