import fs from 'node:fs';
import path from 'node:path';
import { TOOL_REGISTRY } from '../src/lib/toolRegistry';
import { ALL_ARTICLE_SYSTEM_ROUTES, CATEGORY_ROUTES, DOMAIN } from '../src/lib/seo/routes';
import { ALL_ARTICLES, getArticleBySlug, getArticlesByCategory, getCategoryInfo } from '../src/content/articles';
import { ROUTE_ALIASES } from '../src/lib/seo/meta';

const STATIC_ROUTES = ['/', '/tools', '/about', '/privacy', '/terms', '/widget'];

function getRouteLastMod(routePath: string): string | null {
  if (routePath === '/privacy') {
    return '2026-08-06';
  }

  if (routePath === '/articles') {
    const dates = ALL_ARTICLES.map((a) => a.dateModified).filter(Boolean);
    if (dates.length > 0) {
      return dates.sort().pop() || null;
    }
    return null;
  }

  if (routePath.startsWith('/articles/')) {
    const subPath = routePath.replace(/^\/articles\//, '');
    const article = getArticleBySlug(subPath);
    if (article && article.dateModified) {
      return article.dateModified;
    }

    const catInfo = getCategoryInfo(subPath);
    if (catInfo) {
      const catArticles = getArticlesByCategory(catInfo.id);
      const catDates = catArticles.map((a) => a.dateModified).filter(Boolean);
      if (catDates.length > 0) {
        return catDates.sort().pop() || null;
      }
      return '2026-08-09';
    }
  }

  return null;
}

function generateSitemap() {
  const routesSet = new Set<string>();

  // Add static routes
  STATIC_ROUTES.forEach((r) => routesSet.add(r));

  // Add category routes
  CATEGORY_ROUTES.forEach((r) => routesSet.add(r));

  // Add article system routes
  ALL_ARTICLE_SYSTEM_ROUTES.forEach((r) => routesSet.add(r));

  // Add registered tool routes
  const aliasKeys = new Set(Object.keys(ROUTE_ALIASES).map((k) => `/${k}`));
  TOOL_REGISTRY.forEach((item) => {
    if (item.route && item.indexable && !aliasKeys.has(item.route)) {
      routesSet.add(item.route);
    }
  });

  const baseUrl = DOMAIN.replace(/\/$/, '');

  const urlEntries = Array.from(routesSet).map((routePath) => {
    const formattedPath = routePath === '/' ? '' : (routePath.startsWith('/') ? routePath : `/${routePath}`);
    const loc = `${baseUrl}${formattedPath}`;
    const lastmod = getRouteLastMod(routePath);
    if (lastmod) {
      return `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${lastmod}</lastmod>\n  </url>`;
    }
    return `  <url>\n    <loc>${loc}</loc>\n  </url>`;
  });

  const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries.join('\n')}
</urlset>
`;

  const outputPath = path.resolve(process.cwd(), 'public', 'sitemap.xml');
  fs.writeFileSync(outputPath, xmlContent, 'utf-8');
  console.log(`Generated sitemap.xml with ${routesSet.size} routes at ${outputPath}`);
}

generateSitemap();


