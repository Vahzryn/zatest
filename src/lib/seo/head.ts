import { SeoRouteData } from '../seoEngine';

export function applySeoToHead(seoData: SeoRouteData) {
  if (typeof document === 'undefined') return;

  // Title
  if (seoData.metaTitle) {
    document.title = seoData.metaTitle;
  }

  // Meta Description
  let descMeta = document.querySelector('meta[name="description"]');
  if (!descMeta) {
    descMeta = document.createElement('meta');
    descMeta.setAttribute('name', 'description');
    document.head.appendChild(descMeta);
  }
  descMeta.setAttribute('content', seoData.metaDescription || '');

  // Canonical Link
  let canonicalLink = document.querySelector('link[rel="canonical"]');
  if (!canonicalLink) {
    canonicalLink = document.createElement('link');
    canonicalLink.setAttribute('rel', 'canonical');
    document.head.appendChild(canonicalLink);
  }
  canonicalLink.setAttribute('href', seoData.canonicalUrl || 'https://zapixal.com');

  // Meta Robots
  let robotsMeta = document.querySelector('meta[name="robots"]');
  if (!robotsMeta) {
    robotsMeta = document.createElement('meta');
    robotsMeta.setAttribute('name', 'robots');
    document.head.appendChild(robotsMeta);
  }
  robotsMeta.setAttribute('content', seoData.isIndexable ? 'index, follow' : 'noindex, follow');

  // OpenGraph Title
  let ogTitle = document.querySelector('meta[property="og:title"]');
  if (!ogTitle) {
    ogTitle = document.createElement('meta');
    ogTitle.setAttribute('property', 'og:title');
    document.head.appendChild(ogTitle);
  }
  ogTitle.setAttribute('content', seoData.metaTitle || '');

  // OpenGraph Description
  let ogDesc = document.querySelector('meta[property="og:description"]');
  if (!ogDesc) {
    ogDesc = document.createElement('meta');
    ogDesc.setAttribute('property', 'og:description');
    document.head.appendChild(ogDesc);
  }
  ogDesc.setAttribute('content', seoData.metaDescription || '');

  // OpenGraph URL
  let ogUrl = document.querySelector('meta[property="og:url"]');
  if (!ogUrl) {
    ogUrl = document.createElement('meta');
    ogUrl.setAttribute('property', 'og:url');
    document.head.appendChild(ogUrl);
  }
  ogUrl.setAttribute('content', seoData.canonicalUrl || '');

  // OpenGraph Type
  let ogType = document.querySelector('meta[property="og:type"]');
  if (!ogType) {
    ogType = document.createElement('meta');
    ogType.setAttribute('property', 'og:type');
    document.head.appendChild(ogType);
  }
  ogType.setAttribute('content', seoData.pageCategory === 'resource' ? 'article' : 'website');

  // OpenGraph Site Name
  let ogSiteName = document.querySelector('meta[property="og:site_name"]');
  if (!ogSiteName) {
    ogSiteName = document.createElement('meta');
    ogSiteName.setAttribute('property', 'og:site_name');
    document.head.appendChild(ogSiteName);
  }
  ogSiteName.setAttribute('content', 'Zapixal');

  // OpenGraph Image & Twitter Image
  const routePath = seoData.path || '/';
  const filename = routePath === '/' ? 'home' : routePath.replace(/^\//, '').replace(/\//g, '-');
  const ogImageUrl = `https://zapixal.com/og-images/${filename}.png`;

  let ogImage = document.querySelector('meta[property="og:image"]');
  if (!ogImage) {
    ogImage = document.createElement('meta');
    ogImage.setAttribute('property', 'og:image');
    document.head.appendChild(ogImage);
  }
  ogImage.setAttribute('content', ogImageUrl);

  let ogImageWidth = document.querySelector('meta[property="og:image:width"]');
  if (!ogImageWidth) {
    ogImageWidth = document.createElement('meta');
    ogImageWidth.setAttribute('property', 'og:image:width');
    document.head.appendChild(ogImageWidth);
  }
  ogImageWidth.setAttribute('content', '1200');

  let ogImageHeight = document.querySelector('meta[property="og:image:height"]');
  if (!ogImageHeight) {
    ogImageHeight = document.createElement('meta');
    ogImageHeight.setAttribute('property', 'og:image:height');
    document.head.appendChild(ogImageHeight);
  }
  ogImageHeight.setAttribute('content', '630');

  let ogImageAlt = document.querySelector('meta[property="og:image:alt"]');
  if (!ogImageAlt) {
    ogImageAlt = document.createElement('meta');
    ogImageAlt.setAttribute('property', 'og:image:alt');
    document.head.appendChild(ogImageAlt);
  }
  ogImageAlt.setAttribute('content', seoData.metaTitle || seoData.h1Title || 'Zapixal');

  // Twitter Card
  let twitterCard = document.querySelector('meta[name="twitter:card"]');
  if (!twitterCard) {
    twitterCard = document.createElement('meta');
    twitterCard.setAttribute('name', 'twitter:card');
    document.head.appendChild(twitterCard);
  }
  twitterCard.setAttribute('content', 'summary_large_image');

  // Twitter Title
  let twitterTitle = document.querySelector('meta[name="twitter:title"]');
  if (!twitterTitle) {
    twitterTitle = document.createElement('meta');
    twitterTitle.setAttribute('name', 'twitter:title');
    document.head.appendChild(twitterTitle);
  }
  twitterTitle.setAttribute('content', seoData.metaTitle || '');

  // Twitter Description
  let twitterDesc = document.querySelector('meta[name="twitter:description"]');
  if (!twitterDesc) {
    twitterDesc = document.createElement('meta');
    twitterDesc.setAttribute('name', 'twitter:description');
    document.head.appendChild(twitterDesc);
  }
  twitterDesc.setAttribute('content', seoData.metaDescription || '');

  // Twitter Image
  let twitterImg = document.querySelector('meta[name="twitter:image"]');
  if (!twitterImg) {
    twitterImg = document.createElement('meta');
    twitterImg.setAttribute('name', 'twitter:image');
    document.head.appendChild(twitterImg);
  }
  twitterImg.setAttribute('content', ogImageUrl);

  // JSON-LD Script
  let jsonLdScript = document.getElementById('seo-json-ld');
  if (seoData.jsonLd) {
    if (!jsonLdScript) {
      jsonLdScript = document.createElement('script');
      jsonLdScript.id = 'seo-json-ld';
      jsonLdScript.setAttribute('type', 'application/ld+json');
      document.head.appendChild(jsonLdScript);
    }
    jsonLdScript.textContent = JSON.stringify(seoData.jsonLd);
  } else if (jsonLdScript) {
    jsonLdScript.remove();
  }
}
