import { SeoRouteData } from '../../seoEngine';
import { generateSoftwareAppSchema, generateFaqSchema, generateBreadcrumbSchema, generateHowToSchema } from '../schema';

export function getPageSeo(fullUrl: string, path: string): SeoRouteData {
  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: 'Tools', url: '/tools' },
    { name: 'Developer Tools', url: '/tools?category=developer' },
    { name: 'Regex Tester & String Debugger', url: '/regex-tester' }
  ];

  const faqs = [
    {
      question: 'Does this regex tester run in my browser or send data to a remote server?',
      answer: 'Regex testing and string analysis run locally in your browser memory. Your regular expressions, test strings, and replacement results are processed exclusively client-side and never transmitted across the network.'
    },
    {
      question: 'Which regular expression flags are supported?',
      answer: 'This tool supports standard JavaScript ECMAScript flags: g (Global), i (Ignore Case), m (Multiline), s (DotAll), u (Unicode), y (Sticky), and d (Indices where supported by the browser engine).'
    },
    {
      question: 'How are capturing groups and named groups displayed?',
      answer: 'Each match provides a detailed breakdown of full matched text, character offset, line and column numbers, numbered capture groups ($1, $2), and named capture groups (?<name>).'
    },
    {
      question: 'What string diagnostics and Unicode statistics are calculated?',
      answer: 'The string debugger provides real-time counts for UTF-16 code units, Unicode code points, UTF-8 byte sizes, line endings (LF, CRLF, CR), words, whitespace, digits, letters, and leading/trailing spacing.'
    },
    {
      question: 'What is catastrophic backtracking (ReDoS) and how should I avoid it?',
      answer: 'Catastrophic backtracking happens when nested quantifiers or overlapping alternation branches cause exponential search steps on non-matching inputs. Using atomic groups, possessive-like logic, or bounded character classes helps prevent execution freezes.'
    }
  ];

  const howToSteps = [
    'Enter your regular expression pattern and select the desired flags (g, i, m, s, u, y, d).',
    'Paste or type your test string into the test text editor to see live match highlights.',
    'Inspect the match table to view match positions, line/column coordinates, and capture groups.',
    'Optionally enter a replacement pattern to preview replacements or extract specific groups.'
  ];

  const softwareApp = generateSoftwareAppSchema(
    'Regex Tester & String Debugger',
    'Test, debug, and analyze regular expressions locally with live match highlighting, capture group inspection, string metrics, and replacement preview in browser memory.',
    fullUrl,
    'DeveloperApplication'
  );

  const faqPage = generateFaqSchema(faqs);
  const breadcrumbSchema = generateBreadcrumbSchema(breadcrumbs);
  const howTo = generateHowToSchema('How to Test and Debug Regular Expressions', 'Test and debug regex patterns with instant match analysis.', howToSteps);

  return {
    path,
    h1Title: 'Regex Tester & String Debugger',
    metaTitle: 'Regex Tester & String Debugger — Test Patterns Online',
    metaDescription: 'Test and debug regular expressions with live match highlighting, group inspection, Unicode diagnostics, and replacement previews locally in browser memory.',
    canonicalUrl: fullUrl,
    isIndexable: true,
    pageCategory: 'use-case',
    breadcrumbs,
    guideContent: {
      badge: 'In-Browser Regex Engine',
      section1Title: 'Real-Time Regular Expression Testing and Group Analysis',
      section1Body: 'Construct, test, and debug JavaScript-compatible regular expressions with instant visual feedback. View match indices, capture group breakdowns, and named groups directly without sending sensitive logs or data strings to remote cloud endpoints.',
      section2Title: 'Deep Unicode String Diagnostics and Safe Replacements',
      section2Body: 'Analyze exact UTF-16 code units versus Unicode code points, calculate UTF-8 byte sizes, detect line endings (LF vs CRLF), and preview regex replacements using standard JavaScript syntax ($1, $&, $<name>) with zero network transmission.',
      steps: howToSteps,
      faqs
    },
    relatedRoutes: [
      { path: '/json-formatter-validator', label: 'JSON Formatter & Validator' },
      { path: '/jwt-decoder', label: 'JWT Debugger & Decoder' },
      { path: '/csv-to-json-converter', label: 'CSV ↔ JSON Converter' },
      { path: '/client-side-image-to-base64', label: 'Image to Base64' }
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
