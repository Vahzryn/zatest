import { RouteEditorialContent } from '../content';
import { generateJsonLdSchemas } from '../schema';
import { SeoRouteData } from '../../seoEngine';

function makeFaq(question: string, answer: string) {
  return { question, answer };
}

export function getSecurePasswordGeneratorOnlineContent(): RouteEditorialContent {
  return {
    badge: 'Security Tool',
    section1Title: 'Cryptographically Secure Generation',
    section1Body: 'Zapixal\'s Password Generator utilizes the native Web Crypto API (window.crypto) to ensure genuine entropy. Unlike simple random functions, this guarantees your passwords are unpredictable and secure against brute-force attacks.',
    section2Title: 'Zero-Knowledge Architecture',
    section2Body: 'Your security is paramount. This generator operates 100% offline within your browser\'s local execution environment. Passwords are never sent across a network, tracked, or stored in any database. You can even disconnect from the internet while generating passwords for absolute certainty.',
    steps: [
      'Adjust the slider to choose your desired password length. We recommend at least 16 characters for maximum security.',
      'Toggle uppercase letters, lowercase letters, numbers, and symbols to meet your specific password policy.',
      'Click the Copy button to securely save the generated password to your clipboard.'
    ],
    faqs: [
      makeFaq('Are the generated passwords secure?', 'Yes. The passwords are generated using the Web Crypto API (window.crypto.getRandomValues), which provides cryptographically strong random values.'),
      makeFaq('Does this tool save or upload my passwords?', 'No. This is a 100% client-side tool. Your passwords are generated entirely within your browser and are never transmitted to any server.'),
      makeFaq('What makes a password strong?', 'A strong password is long (16+ characters), complex (mixing uppercase, lowercase, numbers, and symbols), and completely unpredictable.')
    ]
  };
}

export function getPageSeo(fullUrl: string): SeoRouteData {
  const path = '/secure-password-generator-online';
  const guideContent = getSecurePasswordGeneratorOnlineContent();
  
  return {
    path,
    h1Title: 'Secure Password Generator',
    metaTitle: 'Secure Password Generator | Free Offline Random Passwords',
    metaDescription: 'Generate strong, cryptographically secure random passwords offline. Our client-side password generator never stores or transmits your data.',
    canonicalUrl: `https://zapixal.com${path}`,
    isIndexable: true,
    pageCategory: 'resource',
    breadcrumbs: [
      { name: 'Home', url: '/' },
      { name: 'Tools Directory', url: '/tools' },
      { name: 'Password Generator', url: path }
    ],
    guideContent,
    jsonLd: generateJsonLdSchemas(
      'Secure Password Generator',
      'Generate strong, cryptographically secure random passwords offline.',
      fullUrl,
      guideContent.faqs,
      [
        { name: 'Home', url: '/' },
        { name: 'Tools', url: '/tools' },
        { name: 'Password Generator', url: path }
      ],
      'resource',
      guideContent.steps
    )
  };
}
