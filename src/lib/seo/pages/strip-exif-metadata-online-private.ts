import { TargetFormat } from '../../../types';
import { RouteEditorialContent } from '../content';
import { DOMAIN } from '../routes';
import { generateJsonLdSchemas } from '../schema';
import { SeoRouteData } from '../../seoEngine';

function makeFaq(question: string, answer: string) {
  return { question, answer };
}

export function getStripExifContent(): RouteEditorialContent {
  return {
    badge: 'Local Metadata Scrubber',
    section1Title: 'Eliminating hidden GPS geotags, camera serial numbers, and digital footprints',
    section1Body: 'Every photo taken on smartphones or modern digital cameras embeds Exchangeable Image File Format (EXIF), XMP, and IPTC metadata directly inside file headers. This unseen metadata contains precise GPS latitude, longitude, altitude, and satellite timestamps inside the GPS IFD (Image File Directory) block. Additionally, it embeds unique camera body serial numbers, lens profiles, shutter counts, exact timestamps, and software editing history (e.g., Photoshop or Lightroom builds). When sharing photos publicly on social platforms, forums, or classified listings, malicious actors can extract this metadata to track your physical home address or link anonymous photos back to your main identity. Zapixal strips these hidden data layers completely.',
    section2Title: 'Byte-level header slicing and client-side canvas sanitization',
    section2Body: 'Zapixal delivers a comprehensive client-side metadata scrubber. Rasterizing onto an HTML5 Canvas buffer ensures the complete eradication of all non-visual metadata without relying on external servers. Because all processing executes locally in browser memory, sensitive photos, legal documents, and undercover photography never touch a cloud server.',
    steps: [
      'Load your photos or smartphone captures into the local privacy inspector.',
      'Review detected GPS location coordinates, camera serial numbers, and EXIF parameters.',
      'Click scrub metadata to export clean, anonymized image files devoid of GPS or hardware tracking tags.'
    ],
    faqs: [
      makeFaq('What specific metadata is removed when stripping EXIF and geotags?', 'GPS latitude, longitude, altitude, satellite timestamps, camera manufacturer, unique hardware serial numbers, lens profiles, exposure parameters, software build tags, and embedded preview thumbnails.'),
      makeFaq('Can camera serial numbers and GPS tags link anonymous photos to my identity?', 'Yes. Unique camera body serial numbers and GPS home coordinates are frequently cross-referenced by security researchers and tracking algorithms to link separate photos back to a single person.'),
      makeFaq('Will stripping metadata degrade the visual quality or resolution of my photos?', 'No. Metadata scrubbing is a non-destructive binary header operation. It removes embedded text and binary tags from file headers without altering raw image pixels.'),
      makeFaq('Is it safer to strip EXIF data locally on my device rather than cloud sites?', 'Absolutely. Online converters require you to upload location-tagged photos to third-party servers first. Zapixal executes locally in browser memory so your uncleaned location data is never logged on remote servers.')
    ]
  };
}

export function getPageSeo(fullUrl: string): SeoRouteData {
  const path = '/strip-exif-metadata-online-private';
  const guideContent = getStripExifContent();
  
  return {
      path,
      h1Title: 'Remove EXIF Metadata & Geotags Locally',
      metaTitle: 'Remove EXIF Metadata & Geotags — Private Browser Tool',
      metaDescription: 'Erase hidden GPS coordinates, camera serials, and EXIF data from photos on your device. Complete local metadata scrubbing.',
      canonicalUrl: fullUrl,
      isIndexable: true,
      pageCategory: 'resource',
      stripExif: true,
      breadcrumbs: [{ name: 'Home', url: '/' }, { name: 'Strip EXIF Metadata', url: path }],
      guideContent,
      relatedRoutes: [
        { path: '/blur-sensitive-image-privacy-pixelator', label: 'Blur Sensitive Images' },
        { path: '/client-side-private-image-compressor', label: 'Private Image Compressor' }
      ],
      relatedArticles: [
        { path: '/articles/exif-metadata-privacy-guide', label: 'EXIF Metadata & Privacy Risks' },
        { path: '/articles/privacy', label: 'Our Privacy Philosophy' }
      ],
      jsonLd: generateJsonLdSchemas(
        'Complete EXIF Metadata & Geotag Erasure in Browser Memory',
        'Remove GPS coordinates and camera details from photos locally in browser memory without uploading your files.',
        fullUrl,
        guideContent.faqs,
        [{ name: 'Home', url: '/' }, { name: 'Strip EXIF Metadata', url: path }],
        'resource',
        guideContent.steps
      )
    };
}
