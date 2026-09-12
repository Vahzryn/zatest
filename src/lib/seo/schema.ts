import { DOMAIN } from './routes';

export function generateJsonLdSchemas(
  name: string,
  description: string,
  url: string,
  faqs: { question: string; answer: string }[] = [],
  breadcrumbs: { name: string; url: string }[] = [],
  category: 'converter' | 'compression' | 'use-case' | 'home' | 'resource' | 'legal' | 'e-commerce' | 'job-application' = 'home',
  customSteps?: string[]
) {
  const softwareApp = {
    '@context': 'https://schema.org',
    '@type': ['SoftwareApplication', 'WebApplication'],
    'name': `Zapixal - ${name}`,
    'applicationCategory': 'MultimediaApplication',
    'applicationSubCategory': 'Image Conversion and Compression',
    'softwareVersion': '1.0.0',
    'operatingSystem': 'All (Windows, macOS, Linux, iOS, Android)',
    'browserRequirements': 'Requires Modern Web Browser with WebAssembly (WASM) support',
    'license': 'Proprietary',
    'isAccessibleForFree': true,
    'keywords': ['image converter', 'image compressor', 'client-side image tool', 'private image converter', 'HEIC to JPG', 'PNG to WebP'],
    'offers': {
      '@type': 'Offer',
      'price': '0',
      'priceCurrency': 'USD',
      'availability': 'https://schema.org/InStock',
    },
    'featureList': [
      'Client-Side In-Browser Image Processing',
      'Zero Cloud Server Uploads for conversion privacy',
      'WebAssembly (WASM) and Web Worker processing',
      'Adaptive Batch Image Processing',
      'Practical guidance for compatibility, accessibility, and file-size targets',
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
  if (category !== 'legal') {
    let stepsList: { name: string; text: string }[] = [];

    if (customSteps && customSteps.length > 0) {
      stepsList = customSteps.map((stepText, idx) => ({
        name: `Step ${idx + 1}`,
        text: stepText,
      }));
    } else if (category === 'compression') {
      stepsList = [
        { name: 'Upload Files', text: 'Select or drag & drop images needing file size reduction.' },
        { name: 'Set KB/MB Target', text: 'Configure target file size cap or compression slider.' },
        { name: 'Download Compressed Output', text: 'Export compressed images directly without server upload.' },
      ];
    } else if (category === 'converter') {
      stepsList = [
        { name: 'Select Images', text: 'Drag and drop source images into the conversion dropzone.' },
        { name: 'Choose Target Format', text: 'Select output image format (WEBP, AVIF, JPG, PNG, PDF, ICO).' },
        { name: 'Download Converted Files', text: 'Download converted images individually or as a single ZIP package.' },
      ];
    } else {
      stepsList = [
        { name: 'Add Images', text: 'Select image files from your local device or drop into the browser.' },
        { name: 'Configure Options', text: 'Set image quality, format, or dimensional constraints.' },
        { name: 'Export Outputs', text: 'Save processed images directly from browser memory.' },
      ];
    }

    howTo = {
      '@context': 'https://schema.org',
      '@type': 'HowTo',
      'name': `How to process images with ${name}`,
      'description': description,
      'totalTime': 'PT1M',
      'step': stepsList.map((s) => ({
        '@type': 'HowToStep',
        'name': s.name,
        'text': s.text,
      })),
    };
  }

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
    softwareApp: category === 'legal' ? null : softwareApp,
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
  return {
    '@context': 'https://schema.org',
    '@type': ['SoftwareApplication', 'WebApplication'],
    'name': `Zapixal - ${name}`,
    'applicationCategory': 'MultimediaApplication',
    'applicationSubCategory': subCategory,
    'softwareVersion': '1.0.0',
    'operatingSystem': 'All (Windows, macOS, Linux, iOS, Android)',
    'browserRequirements': 'Requires Modern Web Browser with WebAssembly (WASM) support',
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


