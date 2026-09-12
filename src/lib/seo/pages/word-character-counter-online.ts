import { RouteEditorialContent } from '../content';
import { generateJsonLdSchemas } from '../schema';
import { SeoRouteData } from '../../seoEngine';

function makeFaq(question: string, answer: string) {
  return { question, answer };
}

export function getWordCharacterCounterOnlineContent(): RouteEditorialContent {
  return {
    badge: 'Text Analysis Tool',
    section1Title: 'Instant Real-Time Text Analysis',
    section1Body: 'Zapixal\'s Word Counter analyzes your text precisely as you type or paste. This is perfect for adhering to strict character limits on social media platforms, writing academic essays, or structuring professional reports without needing to open a heavy word processor.',
    section2Title: '100% Private and Secure text processing',
    section2Body: 'We understand that your writing may contain sensitive, personal, or proprietary information. That\'s why our text analyzer is built strictly as a client-side utility. No data is sent to our servers. All counting logic executes directly in your browser\'s local memory environment.',
    steps: [
      'Begin typing directly into the text area, or paste a document you have copied to your clipboard.',
      'As you type, the tool instantly updates the counts for words, characters, sentences, and paragraphs.',
      'Copy the text when you are done by using the copy button.'
    ],
    faqs: [
      makeFaq('Is my text uploaded to a server?', 'No. This word counter operates entirely client-side within your browser. Your text never leaves your device, ensuring complete privacy.'),
      makeFaq('Does this tool count spaces as characters?', 'The tool provides two separate metrics: total characters (which includes spaces and punctuation) and characters without spaces.'),
      makeFaq('Is there a word limit?', 'Since the tool runs locally in your browser, there is no hard limit imposed by a server. You can paste massive documents with millions of words instantly.')
    ]
  };
}

export function getPageSeo(fullUrl: string): SeoRouteData {
  const path = '/word-character-counter-online';
  const guideContent = getWordCharacterCounterOnlineContent();
  
  return {
    path,
    h1Title: 'Word & Character Counter',
    metaTitle: 'Word & Character Counter Online | Free Client-Side Tool',
    metaDescription: 'Instantly count words, characters, sentences, and paragraphs. 100% free, private, and offline-capable text analyzer with no server uploads.',
    canonicalUrl: `https://zapixal.com${path}`,
    isIndexable: true,
    pageCategory: 'resource',
    breadcrumbs: [
      { name: 'Home', url: '/' },
      { name: 'Tools Directory', url: '/tools' },
      { name: 'Word Counter', url: path }
    ],
    guideContent,
    jsonLd: generateJsonLdSchemas(
      'Word & Character Counter',
      'Instantly count words, characters, sentences, and paragraphs.',
      fullUrl,
      guideContent.faqs,
      [
        { name: 'Home', url: '/' },
        { name: 'Tools', url: '/tools' },
        { name: 'Word Counter', url: path }
      ],
      'resource',
      guideContent.steps
    )
  };
}
