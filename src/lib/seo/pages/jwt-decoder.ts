import { SeoRouteData } from '../../seoEngine';
import { generateSoftwareAppSchema, generateFaqSchema, generateBreadcrumbSchema, generateHowToSchema } from '../schema';

export function getPageSeo(fullUrl: string, path: string): SeoRouteData {
  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: 'Tools', url: '/tools' },
    { name: 'Developer Tools', url: '/tools?category=developer' },
    { name: 'JWT Debugger & Decoder', url: '/jwt-decoder' }
  ];

  const faqs = [
    {
      question: 'Is it safe to paste private authentication tokens into this JWT decoder?',
      answer: 'Yes. Zapixal processes all JWT tokens completely client-side in your browser memory sandbox. No token, header, payload, or secret key is ever transmitted over the network or saved to remote logs.'
    },
    {
      question: 'How does the JWT expiration countdown work?',
      answer: 'The decoder reads the standard "exp" (expiration timestamp), "iat" (issued at), and "nbf" (not before) claims from the payload, converts the Unix epochs into local and UTC date strings, and computes the exact remaining lifetime or time elapsed since token expiry.'
    },
    {
      question: 'Can I verify HMAC signatures (HS256, HS384, HS512) locally?',
      answer: 'Yes. The built-in signature verification engine uses the browser native Web Crypto API (SubtleCrypto) to calculate the HMAC digest against your secret key locally in browser memory without sending your secret anywhere.'
    },
    {
      question: 'What is the difference between JWT and JWE tokens?',
      answer: 'A standard JWT (JWS) consists of 3 dot-separated Base64URL segments (Header, Payload, and Signature) where the payload is encoded and readable. A JWE (JSON Web Encryption) consists of 5 segments where the payload is cryptographically encrypted and requires a private decryption key.'
    }
  ];

  const howToSteps = [
    'Paste your raw JSON Web Token (JWT) into the encoded token input editor.',
    'Review the automatically decoded Header, Payload claims, and expiration status.',
    'Inspect timestamps, human-readable claim descriptions, and nested permissions.',
    'Optionally input your HMAC secret key to verify the cryptographic signature locally.'
  ];

  const softwareApp = generateSoftwareAppSchema(
    'JWT Debugger & Decoder',
    'Decode, inspect, and verify JSON Web Tokens (JWT) locally in browser memory with real-time expiration tracking and zero server transmission.',
    fullUrl,
    'DeveloperApplication'
  );

  const faqPage = generateFaqSchema(faqs);
  const breadcrumbSchema = generateBreadcrumbSchema(breadcrumbs);
  const howTo = generateHowToSchema('How to Decode and Inspect a JWT Token', 'Decode, debug, and verify JSON Web Tokens locally.', howToSteps);

  return {
    path,
    h1Title: 'JWT Debugger & Decoder',
    metaTitle: 'JWT Debugger & Decoder — Inspect Tokens Privately',
    metaDescription: 'Decode, inspect, and verify JSON Web Tokens (JWT) in browser memory. View claims, expiration timers, and verify HMAC signatures with zero server uploads.',
    canonicalUrl: fullUrl,
    isIndexable: true,
    pageCategory: 'use-case',
    breadcrumbs,
    guideContent: {
      badge: 'Client-Side JWT Engine',
      section1Title: 'Secure In-Memory Token Decoding and Claims Inspection',
      section1Body: 'Authentication tokens frequently carry sensitive user identifiers, authorization roles, and session metadata. Zapixal decodes Base64URL segments directly in local browser memory, displaying formatted JSON headers, decoded payload claims, and RFC 7519 field explanations without exposing tokens to third-party endpoints.',
      section2Title: 'Live Expiration Tracking and Client-Side Signature Verification',
      section2Body: 'Quickly diagnose expired session tokens, premature not-before timestamps, and invalid signature algorithms. With native Web Crypto API integration, you can verify HS256, HS384, and HS512 HMAC signatures client-side, ensuring full cryptographic verification with zero network overhead.',
      steps: howToSteps,
      faqs
    },
    relatedRoutes: [
      { path: '/json-formatter-validator', label: 'JSON Formatter & Validator' },
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
