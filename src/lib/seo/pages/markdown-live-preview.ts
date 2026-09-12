import { SeoRouteData } from '../../seoEngine';
import { generateSoftwareAppSchema, generateFaqSchema, generateBreadcrumbSchema, generateHowToSchema } from '../schema';

export function getPageSeo(fullUrl: string, path: string): SeoRouteData {
  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: 'Tools', url: '/tools' },
    { name: 'Developer Tools', url: '/tools?category=developer' },
    { name: 'Markdown Live Previewer & Converter', url: '/markdown-live-preview' }
  ];

  const faqs = [
    {
      question: 'Does this Markdown editor run in my browser or send content to a server?',
      answer: 'Markdown parsing, HTML sanitization, and live previewing execute 100% locally in your browser memory. Your text, notes, and documentation are never uploaded to any remote server or stored in external databases.'
    },
    {
      question: 'Which Markdown specifications and GitHub-Flavored Markdown (GFM) features are supported?',
      answer: 'This previewer supports standard CommonMark and GitHub-Flavored Markdown (GFM), including headings with anchor IDs, bold, italic, strikethrough, blockquotes, fenced code blocks with language labels, auto-links, column-aligned tables, and interactive task checklists.'
    },
    {
      question: 'How does this tool protect against Cross-Site Scripting (XSS)?',
      answer: 'All rendered HTML output passes through a strict client-side AST and sanitization engine. Script tags, inline event listeners (like onclick or onerror), dangerous URL schemes (such as javascript: or vbscript:), and unsafe SVG scripts are neutralized. External images include no-referrer policies.'
    },
    {
      question: 'Can I export my Markdown to clean HTML or plain text?',
      answer: 'Yes. You can copy raw Markdown, copy sanitized HTML markup, copy extracted plain text (with formatting stripped), download a .md file, or download a standalone styled .html file ready for offline viewing or documentation publishing.'
    },
    {
      question: 'What statistics and character metrics are calculated?',
      answer: 'The live diagnostics panel provides real-time counts for word count, character count, Unicode code points, UTF-8 byte payload size, line count, paragraph count, heading count, and checklist task completion progress.'
    }
  ];

  const howToSteps = [
    'Type or paste your Markdown content into the left editor pane, or choose a starter template.',
    'Use the quick formatting toolbar to add headings, bold/italic text, code blocks, tables, or task lists.',
    'View the live sanitized preview on the right pane in split, editor-only, or preview-only view mode.',
    'Inspect statistical metrics and export your content to Markdown (.md) or standalone HTML (.html).'
  ];

  const softwareApp = generateSoftwareAppSchema(
    'Markdown Live Previewer & Converter',
    'Edit, preview, and convert GitHub-Flavored Markdown (GFM) in real-time with live HTML preview, GFM tables, task lists, XSS protection, and offline exports.',
    fullUrl,
    'DeveloperApplication'
  );

  const faqPage = generateFaqSchema(faqs);
  const breadcrumbSchema = generateBreadcrumbSchema(breadcrumbs);
  const howTo = generateHowToSchema(
    'How to Edit and Convert Markdown to HTML',
    'Write and preview GitHub-Flavored Markdown with instant safe HTML rendering.',
    howToSteps
  );

  return {
    path,
    h1Title: 'Markdown Live Previewer & Converter',
    metaTitle: 'Markdown Live Previewer & GFM Editor Online | Zapixal',
    metaDescription: 'Edit and preview GitHub-Flavored Markdown (GFM) in real time with tables, code blocks, XSS sanitization, live statistics, and instant HTML export.',
    canonicalUrl: fullUrl,
    isIndexable: true,
    pageCategory: 'use-case',
    breadcrumbs,
    guideContent: {
      badge: 'In-Browser GFM Engine',
      section1Title: 'Real-Time GitHub-Flavored Markdown Preview and Editing',
      section1Body: 'Draft documentation, technical README files, API specifications, and blog posts with instant split-screen feedback. Full support for GFM tables with column alignment, nested lists, task checklists, and fenced code blocks without sending text to remote servers.',
      section2Title: 'Strict XSS Sanitization, Unicode Diagnostics & Clean Exports',
      section2Body: 'Render untrusted Markdown safely with automated protocol validation, script neutralization, and referrer blocking. Easily export formatted documents to standalone HTML with clean typography or copy clean plain text with zero telemetry.',
      steps: howToSteps,
      faqs
    },
    relatedRoutes: [
      { path: '/json-formatter-validator', label: 'JSON Formatter & Validator' },
      { path: '/regex-tester', label: 'Regex Tester & String Debugger' },
      { path: '/jwt-decoder', label: 'JWT Debugger & Decoder' },
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
