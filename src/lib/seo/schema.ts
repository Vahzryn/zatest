import { DOMAIN } from './routes';

export type JsonLdCategory =
  | 'converter'
  | 'compression'
  | 'use-case'
  | 'home'
  | 'resource'
  | 'legal'
  | 'e-commerce'
  | 'job-application'
  | 'developer'
  | 'text'
  | 'utilities'
  | 'documents';

export function generateJsonLdSchemas(
  name: string,
  description: string,
  url: string,
  faqs: { question: string; answer: string }[] = [],
  breadcrumbs: { name: string; url: string }[] = [],
  category: JsonLdCategory = 'home',
  customSteps?: string[]
) {
  let softwareApp: object | null = null;

  if (category === 'legal' || category === 'resource') {
    softwareApp = null;
  } else if (category === 'home') {
    softwareApp = {
      '@context': 'https://schema.org',
      '@type': ['SoftwareApplication', 'WebApplication'],
      'name': 'Zapixal',
      'applicationCategory': 'UtilitiesApplication',
      'applicationSubCategory': 'Browser Utilities Hub',
      'softwareVersion': '1.0.0',
      'operatingSystem': 'All (Windows, macOS, Linux, iOS, Android)',
      'browserRequirements': 'Requires Modern Web Browser with WebAssembly (WASM) and JavaScript support',
      'license': 'Proprietary',
      'isAccessibleForFree': true,
      'offers': {
        '@type': 'Offer',
        'price': '0',
        'priceCurrency': 'USD',
        'availability': 'https://schema.org/InStock',
      },
      'featureList': [
        'Client-side image conversion and compression',
        'PDF merging, splitting, and image export',
        'Developer utilities for JSON, CSV, JWT, and regex debugging',
        'Privacy-first local processing without server uploads'
      ],
      'description': description,
      'url': url,
      'screenshot': `${DOMAIN}/icon-512.png`,
      'author': {
        '@type': 'Organization',
        'name': 'Zapixal',
        'url': DOMAIN,
      },
      'creator': {
        '@type': 'Organization',
        'name': 'Zapixal',
        'url': DOMAIN,
      },
    };
  } else {
    let appCategory = 'MultimediaApplication';
    let subCategory = 'Image Conversion and Compression';
    let browserReq = 'Requires Modern Web Browser with WebAssembly (WASM) support';
    let featureList = [
      'Client-Side In-Browser Processing',
      'Zero Cloud Server Uploads for file privacy',
      'WebAssembly (WASM) and Web Worker processing',
      'Local device processing'
    ];

    if (category === 'developer') {
      appCategory = 'DeveloperApplication';
      subCategory = 'Developer Utility';
      browserReq = 'Requires Modern Web Browser';
      featureList = [
        'Client-Side In-Browser Execution',
        'Zero Cloud Server Uploads for data privacy',
        'Real-time parsing and validation'
      ];
    } else if (category === 'text') {
      appCategory = 'UtilitiesApplication';
      subCategory = 'Text Utility';
      browserReq = 'Requires Modern Web Browser';
      featureList = [
        'Client-Side Text Processing',
        'Zero Cloud Server Uploads',
        'Instant analysis in browser memory'
      ];
    } else if (category === 'utilities') {
      appCategory = 'UtilitiesApplication';
      subCategory = 'Utility Tool';
      browserReq = 'Requires Modern Web Browser';
      featureList = [
        'Client-Side In-Browser Execution',
        'Zero Cloud Server Uploads',
        'Local memory computation'
      ];
    } else if (category === 'documents') {
      appCategory = 'BusinessApplication';
      subCategory = 'PDF Tool';
      browserReq = 'Requires Modern Web Browser';
      featureList = [
        'Client-Side PDF Processing',
        'Zero Cloud Server Uploads',
        'Local document manipulation'
      ];
    }

    softwareApp = {
      '@context': 'https://schema.org',
      '@type': ['SoftwareApplication', 'WebApplication'],
      'name': `Zapixal - ${name}`,
      'applicationCategory': appCategory,
      'applicationSubCategory': subCategory,
      'softwareVersion': '1.0.0',
      'operatingSystem': 'All (Windows, macOS, Linux, iOS, Android)',
      'browserRequirements': browserReq,
      'license': 'Proprietary',
      'isAccessibleForFree': true,
      'offers': {
        '@type': 'Offer',
        'price': '0',
        'priceCurrency': 'USD',
        'availability': 'https://schema.org/InStock',
      },
      'featureList': featureList,
      'description': description,
      'url': url,
      'screenshot': `${DOMAIN}/icon-512.png`,
      'author': {
        '@type': 'Organization',
        'name': 'Zapixal',
        'url': DOMAIN,
      },
      'creator': {
        '@type': 'Organization',
        'name': 'Zapixal',
        'url': DOMAIN,
      },
    };
  }

  const faqPage = faqs && faqs.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    'mainEntity': faqs.map((faq) => ({
      '@type': 'Question',
      'name': faq.question,
      'acceptedAnswer': {
        '@type': 'Answer',
        'text': faq.answer,
      },
    })),
  } : null;

  let howTo: object | null = null;
  if (category !== 'legal' && category !== 'resource' && category !== 'home') {
    if (customSteps && customSteps.length > 0) {
      const stepsList = customSteps.map((stepText, idx) => ({
        name: `Step ${idx + 1}`,
        text: stepText,
      }));
      const howToName = name.toLowerCase().startsWith('how to') ? name : `How to use ${name}`;
      howTo = {
        '@context': 'https://schema.org',
        '@type': 'HowTo',
        'name': howToName,
        'description': description,
        'totalTime': 'PT1M',
        'step': stepsList.map((s) => ({
          '@type': 'HowToStep',
          'name': s.name,
          'text': s.text,
        })),
      };
    } else if (category === 'compression') {
      const stepsList = [
        { name: 'Select Files', text: 'Drag and drop or select images needing compression.' },
        { name: 'Adjust Settings', text: 'Configure target file size or compression quality slider.' },
        { name: 'Download Output', text: 'Download compressed images directly from browser memory.' },
      ];
      howTo = {
        '@context': 'https://schema.org',
        '@type': 'HowTo',
        'name': `How to compress images with ${name}`,
        'description': description,
        'totalTime': 'PT1M',
        'step': stepsList.map((s) => ({
          '@type': 'HowToStep',
          'name': s.name,
          'text': s.text,
        })),
      };
    } else if (category === 'converter') {
      const stepsList = [
        { name: 'Select Images', text: 'Drag and drop source images into the conversion dropzone.' },
        { name: 'Choose Target Format', text: 'Select desired output format (WEBP, AVIF, JPG, PNG, PDF, ICO).' },
        { name: 'Download Converted Files', text: 'Download converted images individually or as a ZIP archive.' },
      ];
      howTo = {
        '@context': 'https://schema.org',
        '@type': 'HowTo',
        'name': `How to convert images with ${name}`,
        'description': description,
        'totalTime': 'PT1M',
        'step': stepsList.map((s) => ({
          '@type': 'HowToStep',
          'name': s.name,
          'text': s.text,
        })),
      };
    } else if (category === 'documents') {
      const stepsList = [
        { name: 'Add Documents', text: 'Select or drop PDF or document files into the workspace.' },
        { name: 'Configure Options', text: 'Rearrange pages, set extraction ranges, or configure document options.' },
        { name: 'Save Output', text: 'Download processed documents directly without server uploads.' },
      ];
      howTo = {
        '@context': 'https://schema.org',
        '@type': 'HowTo',
        'name': `How to process documents with ${name}`,
        'description': description,
        'totalTime': 'PT1M',
        'step': stepsList.map((s) => ({
          '@type': 'HowToStep',
          'name': s.name,
          'text': s.text,
        })),
      };
    }
  }

  const isHomepage = url === DOMAIN || url === `${DOMAIN}/` || url === '/';
  const breadcrumbsSchema = (!isHomepage && breadcrumbs && breadcrumbs.length > 1) ? {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': breadcrumbs.map((b, idx) => ({
      '@type': 'ListItem',
      'position': idx + 1,
      'name': b.name,
      'item': b.url.startsWith('http') ? b.url : `${DOMAIN}${b.url}`,
    })),
  } : null;

  const organization = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    'name': 'Zapixal',
    'url': DOMAIN,
    'logo': `${DOMAIN}/icon-512.png`,
  };

  const website = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    'name': 'Zapixal',
    'url': DOMAIN,
  };

  return {
    softwareApp,
    howTo,
    faqPage,
    breadcrumbs: breadcrumbsSchema,
    organization,
    website,
  };
}

export function generateArticleJsonLdSchema(
  title: string,
  description: string,
  url: string,
  author: string,
  datePublished: string,
  dateModified: string,
  categoryName: string,
  breadcrumbs: { name: string; url: string }[] = []
) {
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    'headline': title,
    'description': description,
    'url': url,
    'datePublished': datePublished,
    'dateModified': dateModified,
    'author': {
      '@type': 'Organization',
      'name': author,
      'url': DOMAIN,
    },
    'publisher': {
      '@type': 'Organization',
      'name': 'Zapixal',
      'logo': {
        '@type': 'ImageObject',
        'url': `${DOMAIN}/icon-512.png`,
      },
    },
    'mainEntityOfPage': {
      '@type': 'WebPage',
      '@id': url,
    },
    'about': {
      '@type': 'Thing',
      'name': categoryName,
    },
    'inLanguage': 'en-US',
  };

  const breadcrumbsSchema = breadcrumbs && breadcrumbs.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': breadcrumbs.map((b, idx) => ({
      '@type': 'ListItem',
      'position': idx + 1,
      'name': b.name,
      'item': b.url.startsWith('http') ? b.url : `${DOMAIN}${b.url}`,
    })),
  } : null;

  const organization = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    'name': 'Zapixal',
    'url': DOMAIN,
    'logo': `${DOMAIN}/icon-512.png`,
  };

  const website = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    'name': 'Zapixal',
    'url': DOMAIN,
  };

  return {
    article: articleSchema,
    softwareApp: null,
    howTo: null,
    faqPage: null,
    breadcrumbs: breadcrumbsSchema,
    organization,
    website,
  };
}

export function generateSoftwareAppSchema(name: string, description: string, url: string, subCategory: string = 'PDFTool') {
  let appCategory = 'MultimediaApplication';
  let browserReq = 'Requires Modern Web Browser with WebAssembly (WASM) support';

  const lowerSub = subCategory.toLowerCase();
  if (lowerSub.includes('developer')) {
    appCategory = 'DeveloperApplication';
    browserReq = 'Requires Modern Web Browser';
  } else if (lowerSub.includes('text')) {
    appCategory = 'UtilitiesApplication';
    browserReq = 'Requires Modern Web Browser';
  } else if (lowerSub.includes('pdf') || lowerSub.includes('document') || lowerSub.includes('business')) {
    appCategory = 'BusinessApplication';
    browserReq = 'Requires Modern Web Browser';
  } else if (lowerSub.includes('utilit')) {
    appCategory = 'UtilitiesApplication';
    browserReq = 'Requires Modern Web Browser';
  }

  return {
    '@context': 'https://schema.org',
    '@type': ['SoftwareApplication', 'WebApplication'],
    'name': `Zapixal - ${name}`,
    'applicationCategory': appCategory,
    'applicationSubCategory': subCategory,
    'softwareVersion': '1.0.0',
    'operatingSystem': 'All (Windows, macOS, Linux, iOS, Android)',
    'browserRequirements': browserReq,
    'license': 'Proprietary',
    'isAccessibleForFree': true,
    'offers': {
      '@type': 'Offer',
      'price': '0',
      'priceCurrency': 'USD',
      'availability': 'https://schema.org/InStock',
    },
    'description': description,
    'url': url,
    'screenshot': `${DOMAIN}/icon-512.png`,
    'author': {
      '@type': 'Organization',
      'name': 'Zapixal',
      'url': DOMAIN,
    }
  };
}

export function generateFaqSchema(faqs: { question: string; answer: string }[]) {
  if (!faqs || faqs.length === 0) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    'mainEntity': faqs.map((faq) => ({
      '@type': 'Question',
      'name': faq.question,
      'acceptedAnswer': {
        '@type': 'Answer',
        'text': faq.answer,
      },
    })),
  };
}

export function generateBreadcrumbSchema(breadcrumbs: { name: string; url: string }[]) {
  if (!breadcrumbs || breadcrumbs.length === 0) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': breadcrumbs.map((b, idx) => ({
      '@type': 'ListItem',
      'position': idx + 1,
      'name': b.name,
      'item': b.url.startsWith('http') ? b.url : `${DOMAIN}${b.url}`,
    })),
  };
}

export function generateHowToSchema(name: string, description: string, steps: string[]) {
  if (!steps || steps.length === 0) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    'name': name,
    'description': description,
    'totalTime': 'PT1M',
    'step': steps.map((s, idx) => ({
      '@type': 'HowToStep',
      'name': `Step ${idx + 1}`,
      'text': s,
    })),
  };
}


