import fs from 'node:fs';
import path from 'node:path';
import { Resvg } from '@resvg/resvg-js';
import { parseSeoRoute } from '../src/lib/seo/meta';
import { TOOL_REGISTRY } from "../src/lib/toolRegistry";
import { PSEO_ROUTES_LIST, ALL_ARTICLE_SYSTEM_ROUTES, CATEGORY_ROUTES, SeoRouteItem } from '../src/lib/seo/routes';
import { SeoRouteData } from '../src/lib/seoEngine';

function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case "'": return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}

function wrapText(text: string | undefined, maxCharsPerLine = 24, maxLines = 3): string[] {
  if (!text) return [];
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    if ((currentLine + ' ' + word).trim().length <= maxCharsPerLine) {
      currentLine = (currentLine + ' ' + word).trim();
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines.slice(0, maxLines);
}

function getCategoryBadge(pathStr: string, pageCategory?: string): string {
  if (pathStr === '/') return 'WASM Core Engine';
  if (pathStr === '/tools') return 'Tools Directory';
  if (pathStr.startsWith('/articles')) return 'Technical Guide';
  if (pageCategory === 'converter') return 'In-Browser Converter';
  if (pageCategory === 'compression') return 'Client-Side Compressor';
  if (pageCategory === 'use-case') return 'Local Image Utility';
  return 'Client-Side WASM';
}

function getMicroLabel(pathStr: string, pageCategory?: string): string {
  if (pathStr === '/') return 'WEBASSEMBLY IMAGE PLATFORM';
  if (pathStr === '/tools') return 'ALL LOCAL TOOLS';
  if (pathStr.startsWith('/articles')) return 'EDITORIAL & ARCHITECTURE';
  if (pageCategory === 'converter') return 'FORMAT CONVERSION ENGINE';
  if (pageCategory === 'compression') return 'LOSSLESS & ADAPTIVE COMPRESSOR';
  if (pageCategory === 'use-case') return 'SPECIALIZED WORKFLOW UTILITY';
  return 'CLIENT-SIDE UTILITY';
}

function extractFormats(routePath: string, seoData: SeoRouteData): { from: string; to: string } {
  let from = (seoData.fromFormat || '').toUpperCase();
  let to = (seoData.toFormat || '').toUpperCase();

  if (!from || !to) {
    const slug = routePath.toLowerCase();
    if (slug.includes('heic-to-jpg')) { from = from || 'HEIC'; to = to || 'JPG'; }
    else if (slug.includes('webp-to-png')) { from = from || 'WEBP'; to = to || 'PNG'; }
    else if (slug.includes('avif-to-jpg')) { from = from || 'AVIF'; to = to || 'JPG'; }
    else if (slug.includes('svg-to-png')) { from = from || 'SVG'; to = to || 'PNG'; }
    else if (slug.includes('png-to-webp')) { from = from || 'PNG'; to = to || 'WEBP'; }
    else if (slug.includes('tiff-bmp-to-jpg')) { from = from || 'TIFF/BMP'; to = to || 'JPG'; }
    else if (slug.includes('jpg-to-webp')) { from = from || 'JPG'; to = to || 'WEBP'; }
    else if (slug.includes('ico-to-png')) { from = from || 'ICO'; to = to || 'PNG'; }
    else if (slug.includes('png-to-jpg')) { from = from || 'PNG'; to = to || 'JPG'; }
    else if (slug.includes('heic-to-png')) { from = from || 'HEIC'; to = to || 'PNG'; }
    else if (slug.includes('to-avif')) { from = from || 'IMAGE'; to = to || 'AVIF'; }
    else if (slug.includes('pdf-pages-to-jpg') || slug.includes('pdf-to-jpg')) { from = from || 'PDF'; to = to || 'JPG'; }
  }

  return { from: from || 'INPUT', to: to || 'OUTPUT' };
}

function generateRightVisualSvg(routePath: string, seoData: SeoRouteData): string {
  const slug = routePath.toLowerCase();

  // 00. Diff Viewer & Text Comparator
  if (slug.includes('text-diff') || slug.includes('diff')) {
    return `
      <g transform="translate(660, 160)">
        <rect width="420" height="260" rx="18" fill="#1E293B" stroke="#10B981" stroke-width="1.5"/>
        <rect x="20" y="20" width="380" height="35" rx="8" fill="#0F172A" stroke="#334155" stroke-width="1"/>
        <circle cx="42" cy="37" r="5" fill="#EF4444"/>
        <circle cx="58" cy="37" r="5" fill="#F59E0B"/>
        <circle cx="74" cy="37" r="5" fill="#10B981"/>
        <text x="210" y="42" fill="#34D399" font-size="12" font-family="monospace" text-anchor="middle">Side-by-Side &amp; Unified Text Diff</text>

        <!-- Diff Columns Representation -->
        <g transform="translate(30, 75)">
          <rect x="0" y="0" width="170" height="110" rx="8" fill="#0F172A" stroke="#334155"/>
          <text x="10" y="22" fill="#94A3B8" font-size="11" font-family="monospace">1  const val = 10;</text>
          <rect x="6" y="32" width="158" height="20" fill="#EF4444" fill-opacity="0.2"/>
          <text x="10" y="46" fill="#F87171" font-size="11" font-family="monospace">-  const max = 50;</text>
          <text x="10" y="70" fill="#94A3B8" font-size="11" font-family="monospace">3  return val;</text>

          <rect x="190" y="0" width="170" height="110" rx="8" fill="#0F172A" stroke="#334155"/>
          <text x="10" y="22" fill="#94A3B8" font-size="11" font-family="monospace">1  const val = 10;</text>
          <rect x="6" y="32" width="158" height="20" fill="#10B981" fill-opacity="0.2"/>
          <text x="10" y="46" fill="#34D399" font-size="11" font-family="monospace">+  const max = 100;</text>
          <text x="10" y="70" fill="#94A3B8" font-size="11" font-family="monospace">3  return val;</text>
        </g>

        <rect x="110" y="195" width="200" height="36" rx="18" fill="#064E3B" stroke="#10B981" stroke-width="1.5"/>
        <text x="210" y="218" fill="#34D399" font-size="12" font-family="sans-serif" font-weight="800" text-anchor="middle">INLINE CHAR HIGHLIGHT</text>
      </g>`;
  }

  // 0. Markdown Live Previewer & Converter
  if (slug.includes('markdown-live-preview') || slug.includes('markdown')) {
    return `
      <g transform="translate(660, 160)">
        <rect width="420" height="260" rx="18" fill="#1E293B" stroke="#3B82F6" stroke-width="1.5"/>
        <rect x="20" y="20" width="380" height="35" rx="8" fill="#0F172A" stroke="#334155" stroke-width="1"/>
        <circle cx="42" cy="37" r="5" fill="#EF4444"/>
        <circle cx="58" cy="37" r="5" fill="#F59E0B"/>
        <circle cx="74" cy="37" r="5" fill="#10B981"/>
        <text x="210" y="42" fill="#60A5FA" font-size="12" font-family="monospace" text-anchor="middle">Markdown GFM • Live Split View</text>

        <!-- Markdown and Rendered Columns representation -->
        <g transform="translate(30, 75)">
          <text x="10" y="20" fill="#94A3B8" font-size="12" font-family="monospace"># Hello World</text>
          <text x="10" y="45" fill="#94A3B8" font-size="12" font-family="monospace">| Tables | GFM |</text>
          <text x="10" y="70" fill="#38BDF8" font-size="12" font-family="monospace">- [x] Client-Side AST</text>
          <text x="10" y="95" fill="#34D399" font-size="12" font-family="monospace">&gt; Zero Telemetry</text>
        </g>

        <rect x="110" y="195" width="200" height="36" rx="18" fill="#1E3A8A" stroke="#3B82F6" stroke-width="1.5"/>
        <text x="210" y="218" fill="#93C5FD" font-size="12" font-family="sans-serif" font-weight="800" text-anchor="middle">LIVE GFM PREVIEW</text>
      </g>`;
  }

  // 0a. Regex Tester & String Debugger
  if (slug.includes('regex-tester') || slug.includes('regex')) {
    return `
      <g transform="translate(660, 160)">
        <rect width="420" height="260" rx="18" fill="#1E293B" stroke="#3B82F6" stroke-width="1.5"/>
        <rect x="20" y="20" width="380" height="35" rx="8" fill="#0F172A" stroke="#334155" stroke-width="1"/>
        <circle cx="42" cy="37" r="5" fill="#EF4444"/>
        <circle cx="58" cy="37" r="5" fill="#F59E0B"/>
        <circle cx="74" cy="37" r="5" fill="#10B981"/>
        <text x="210" y="42" fill="#60A5FA" font-size="12" font-family="monospace" text-anchor="middle">/([a-z0-9]+)@([a-z]+)\.([a-z]{2,})/g</text>

        <!-- Visual Match Highlight Boxes -->
        <g transform="translate(30, 75)">
          <text x="10" y="20" fill="#94A3B8" font-size="12" font-family="monospace">Contact: </text>
          <rect x="75" y="6" width="170" height="18" rx="4" fill="#F59E0B" fill-opacity="0.2" stroke="#F59E0B"/>
          <text x="80" y="20" fill="#FBBF24" font-size="12" font-family="monospace" font-weight="700">dev@zapixal.com</text>

          <text x="10" y="50" fill="#94A3B8" font-size="12" font-family="monospace">Group 1: </text>
          <text x="80" y="50" fill="#38BDF8" font-size="12" font-family="monospace" font-weight="700">"dev"</text>

          <text x="10" y="75" fill="#94A3B8" font-size="12" font-family="monospace">Group 2: </text>
          <text x="80" y="75" fill="#34D399" font-size="12" font-family="monospace" font-weight="700">"zapixal"</text>

          <text x="10" y="100" fill="#94A3B8" font-size="12" font-family="monospace">Unicode: </text>
          <text x="80" y="100" fill="#C084FC" font-size="12" font-family="monospace">UTF-8 • Code Points</text>
        </g>

        <rect x="110" y="195" width="200" height="36" rx="18" fill="#1E3A8A" stroke="#3B82F6" stroke-width="1.5"/>
        <text x="210" y="218" fill="#93C5FD" font-size="12" font-family="sans-serif" font-weight="800" text-anchor="middle">MATCHES HIGHLIGHTED</text>
      </g>`;
  }

  // 0b. JWT Decoder & Debugger
  if (slug.includes('jwt-decoder') || slug.includes('jwt')) {
    return `
      <g transform="translate(660, 160)">
        <rect width="420" height="260" rx="18" fill="#1E293B" stroke="#A855F7" stroke-width="1.5"/>
        <rect x="20" y="20" width="380" height="35" rx="8" fill="#0F172A" stroke="#334155" stroke-width="1"/>
        <circle cx="42" cy="37" r="5" fill="#EF4444"/>
        <circle cx="58" cy="37" r="5" fill="#F59E0B"/>
        <circle cx="74" cy="37" r="5" fill="#10B981"/>
        <text x="210" y="42" fill="#C084FC" font-size="12" font-family="monospace" text-anchor="middle">JWT Inspector: RFC 7519</text>

        <!-- Color Coded Parts -->
        <g transform="translate(30, 75)">
          <text x="10" y="20" fill="#F43F5E" font-size="12" font-family="monospace" font-weight="700">eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9</text>
          <text x="10" y="45" fill="#A855F7" font-size="12" font-family="monospace" font-weight="700">eyJzdWIiOiIxMjM0NTYiLCJuYW1lIjoiQWxleCJ9</text>
          <text x="10" y="70" fill="#06B6D4" font-size="12" font-family="monospace" font-weight="700">tjVA95OrM7E2cBab30RMHrHDcEfxjoYZgeFONFh7HgQ</text>
        </g>

        <rect x="110" y="195" width="200" height="36" rx="18" fill="#581C87" stroke="#A855F7" stroke-width="1.5"/>
        <text x="210" y="218" fill="#E9D5FF" font-size="12" font-family="sans-serif" font-weight="800" text-anchor="middle">VERIFIED &amp; DECODED</text>
      </g>`;
  }

  // 0b. JSON Formatter & Validator
  if (slug.includes('json-formatter') || slug.includes('json')) {
    return `
      <g transform="translate(660, 160)">
        <rect width="420" height="260" rx="18" fill="#1E293B" stroke="#38BDF8" stroke-width="1.5"/>
        <rect x="20" y="20" width="380" height="35" rx="8" fill="#0F172A" stroke="#334155" stroke-width="1"/>
        <circle cx="42" cy="37" r="5" fill="#EF4444"/>
        <circle cx="58" cy="37" r="5" fill="#F59E0B"/>
        <circle cx="74" cy="37" r="5" fill="#10B981"/>
        <text x="210" y="42" fill="#94A3B8" font-size="12" font-family="monospace" text-anchor="middle">payload.json — Valid</text>

        <!-- Code Block Preview -->
        <g transform="translate(30, 75)">
          <text x="10" y="20" fill="#38BDF8" font-size="13" font-family="monospace">"name": <tspan fill="#34D399">"Zapixal Engine"</tspan>,</text>
          <text x="10" y="45" fill="#38BDF8" font-size="13" font-family="monospace">"version": <tspan fill="#FBBF24">"1.0.0"</tspan>,</text>
          <text x="10" y="70" fill="#38BDF8" font-size="13" font-family="monospace">"offline": <tspan fill="#F43F5E">true</tspan>,</text>
          <text x="10" y="95" fill="#38BDF8" font-size="13" font-family="monospace">"sandbox": <tspan fill="#34D399">"Client RAM"</tspan></text>
        </g>

        <rect x="110" y="195" width="200" height="36" rx="18" fill="#064E3B" stroke="#10B981" stroke-width="1.5"/>
        <text x="210" y="218" fill="#34D399" font-size="12" font-family="sans-serif" font-weight="800" text-anchor="middle">SYNTAX VALIDATED</text>
      </g>`;
  }

  // 1. Palette Color Extractor
  if (slug.includes('palette-color-extractor')) {
    return `
      <g transform="translate(660, 160)">
        <rect width="420" height="260" rx="18" fill="#1E293B" stroke="#334155" stroke-width="1.5"/>
        <text x="210" y="45" fill="#F8FAFC" font-size="16" font-family="sans-serif" font-weight="700" text-anchor="middle">K-Means Color Palette Quantizer</text>
        
        <!-- Color Swatches -->
        <g transform="translate(30, 75)">
          <!-- Swatch 1 -->
          <rect x="0" y="0" width="80" height="90" rx="12" fill="#0EA5E9"/>
          <rect x="0" y="90" width="80" height="35" rx="8" fill="#0F172A"/>
          <text x="40" y="113" fill="#38BDF8" font-size="12" font-family="sans-serif" font-weight="700" text-anchor="middle">#0EA5E9</text>

          <!-- Swatch 2 -->
          <rect x="92" y="0" width="80" height="90" rx="12" fill="#10B981"/>
          <rect x="92" y="90" width="80" height="35" rx="8" fill="#0F172A"/>
          <text x="132" y="113" fill="#34D399" font-size="12" font-family="sans-serif" font-weight="700" text-anchor="middle">#10B981</text>

          <!-- Swatch 3 -->
          <rect x="184" y="0" width="80" height="90" rx="12" fill="#F59E0B"/>
          <rect x="184" y="90" width="80" height="35" rx="8" fill="#0F172A"/>
          <text x="224" y="113" fill="#FBBF24" font-size="12" font-family="sans-serif" font-weight="700" text-anchor="middle">#F59E0B</text>

          <!-- Swatch 4 -->
          <rect x="276" y="0" width="80" height="90" rx="12" fill="#8B5CF6"/>
          <rect x="276" y="90" width="80" height="35" rx="8" fill="#0F172A"/>
          <text x="316" y="113" fill="#A78BFA" font-size="12" font-family="sans-serif" font-weight="700" text-anchor="middle">#8B5CF6</text>
        </g>

        <!-- Bottom Pill -->
        <rect x="120" y="215" width="180" height="28" rx="14" fill="#0C4A6E" stroke="#0284C7" stroke-width="1"/>
        <text x="210" y="234" fill="#38BDF8" font-size="12" font-family="sans-serif" font-weight="700" text-anchor="middle">HEX &amp; RGB Extractor</text>
      </g>`;
  }

  // 2. Watermark
  if (slug.includes('watermark')) {
    return `
      <g transform="translate(660, 160)">
        <rect width="420" height="260" rx="18" fill="#1E293B" stroke="#0EA5E9" stroke-width="1.5"/>
        <rect x="20" y="20" width="380" height="220" rx="12" fill="#0F172A"/>
        
        <!-- Image Mock Canvas -->
        <path d="M 40 180 L 120 100 L 190 150 L 270 80 L 380 180 Z" fill="#1E293B" opacity="0.6"/>
        <circle cx="110" cy="70" r="20" fill="#38BDF8" opacity="0.3"/>

        <!-- Translucent Watermark Overlay -->
        <g transform="translate(210, 130) rotate(-15)">
          <rect x="-140" y="-22" width="280" height="44" rx="8" fill="#0EA5E9" fill-opacity="0.25" stroke="#38BDF8" stroke-width="1.5"/>
          <text x="0" y="7" fill="#FFFFFF" font-size="16" font-family="sans-serif" font-weight="800" text-anchor="middle" letter-spacing="2">CONFIDENTIAL • ZAPIXAL</text>
        </g>

        <!-- Badge -->
        <rect x="120" y="210" width="180" height="28" rx="14" fill="#064E3B" stroke="#10B981" stroke-width="1"/>
        <text x="210" y="229" fill="#34D399" font-size="12" font-family="sans-serif" font-weight="700" text-anchor="middle">Local In-Browser Overlay</text>
      </g>`;
  }

  // 3. Base64
  if (slug.includes('base64')) {
    return `
      <g transform="translate(660, 160)">
        <rect width="420" height="260" rx="18" fill="#1E293B" stroke="#334155" stroke-width="1.5"/>
        
        <!-- Left Image File Card -->
        <g transform="translate(25, 45)">
          <rect width="130" height="170" rx="12" fill="#0F172A" stroke="#38BDF8" stroke-width="1.5"/>
          <rect x="15" y="20" width="100" height="80" rx="8" fill="#1E293B"/>
          <text x="65" y="65" fill="#38BDF8" font-size="14" font-family="sans-serif" font-weight="700" text-anchor="middle">IMAGE</text>
          <text x="65" y="130" fill="#F8FAFC" font-size="13" font-family="sans-serif" font-weight="700" text-anchor="middle">RAW FILE</text>
        </g>

        <!-- Arrow -->
        <path d="M 170 130 L 220 130" stroke="#0EA5E9" stroke-width="3" stroke-dasharray="4,4"/>
        <polygon points="220,125 228,130 220,135" fill="#0EA5E9"/>

        <!-- Right Base64 Code Card -->
        <g transform="translate(235, 45)">
          <rect width="160" height="170" rx="12" fill="#0F172A" stroke="#10B981" stroke-width="1.5"/>
          <rect x="12" y="15" width="136" height="30" rx="6" fill="#064E3B"/>
          <text x="80" y="35" fill="#34D399" font-size="11" font-family="sans-serif" font-weight="800" text-anchor="middle">DATA URI</text>
          <text x="15" y="70" fill="#64748B" font-size="10" font-family="monospace">data:image/png;</text>
          <text x="15" y="88" fill="#64748B" font-size="10" font-family="monospace">base64,iVBORw0</text>
          <text x="15" y="106" fill="#38BDF8" font-size="10" font-family="monospace">KGgoAAAANSUhEU...</text>
          <rect x="20" y="125" width="120" height="26" rx="6" fill="#10B981"/>
          <text x="80" y="142" fill="#070A12" font-size="11" font-family="sans-serif" font-weight="800" text-anchor="middle">COPY BASE64</text>
        </g>
      </g>`;
  }

  // 4. DPI / PPI
  if (slug.includes('dpi') || slug.includes('ppi')) {
    return `
      <g transform="translate(660, 160)">
        <rect width="420" height="260" rx="18" fill="#1E293B" stroke="#0284C7" stroke-width="1.5"/>
        
        <!-- Resolution Ruler Grid -->
        <rect x="30" y="40" width="360" height="120" rx="12" fill="#0F172A" stroke="#334155" stroke-width="1"/>
        <line x1="30" y1="100" x2="390" y2="100" stroke="#38BDF8" stroke-width="2"/>
        
        <!-- Ruler Ticks -->
        <line x1="60" y1="85" x2="60" y2="100" stroke="#38BDF8" stroke-width="2"/>
        <line x1="120" y1="90" x2="120" y2="100" stroke="#38BDF8" stroke-width="1.5"/>
        <line x1="180" y1="80" x2="180" y2="100" stroke="#38BDF8" stroke-width="2.5"/>
        <line x1="240" y1="90" x2="240" y2="100" stroke="#38BDF8" stroke-width="1.5"/>
        <line x1="300" y1="80" x2="300" y2="100" stroke="#38BDF8" stroke-width="2.5"/>
        <line x1="360" y1="85" x2="360" y2="100" stroke="#38BDF8" stroke-width="2"/>

        <text x="60" y="70" fill="#64748B" font-size="12" font-family="sans-serif" text-anchor="middle">72 DPI</text>
        <text x="180" y="65" fill="#FBBF24" font-size="12" font-family="sans-serif" font-weight="700" text-anchor="middle">150 DPI</text>
        <text x="300" y="60" fill="#34D399" font-size="14" font-family="sans-serif" font-weight="800" text-anchor="middle">300 DPI</text>

        <!-- Bottom Print Ready Pill -->
        <rect x="110" y="190" width="200" height="38" rx="19" fill="#064E3B" stroke="#10B981" stroke-width="1.5"/>
        <text x="210" y="214" fill="#34D399" font-size="13" font-family="sans-serif" font-weight="800" text-anchor="middle">PRINT READY RESOLUTION</text>
      </g>`;
  }

  // 5. EXIF Privacy / Blur
  if (slug.includes('exif') || slug.includes('strip') || slug.includes('blur') || slug.includes('privacy-pixelator')) {
    return `
      <g transform="translate(660, 160)">
        <rect width="420" height="260" rx="18" fill="#1E293B" stroke="#0EA5E9" stroke-width="1.5"/>
        
        <!-- Shield Icon & Lock -->
        <g transform="translate(180, 30)">
          <path d="M 30 0 L 60 15 L 60 55 C 60 85 30 105 30 105 C 30 105 0 85 0 55 L 0 15 Z" fill="#0EA5E9" opacity="0.25" stroke="#38BDF8" stroke-width="2"/>
          <circle cx="30" cy="45" r="14" fill="#0EA5E9"/>
          <path d="M 24 45 L 28 49 L 36 41" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" fill="none"/>
        </g>

        <!-- Metadata Tag Strips -->
        <rect x="30" y="150" width="170" height="32" rx="8" fill="#451A03" stroke="#F59E0B" stroke-width="1"/>
        <text x="115" y="171" fill="#FBBF24" font-size="11" font-family="sans-serif" font-weight="700" text-anchor="middle">GPS LOGS: SCRUBBED</text>

        <rect x="220" y="150" width="170" height="32" rx="8" fill="#451A03" stroke="#F59E0B" stroke-width="1"/>
        <text x="305" y="171" fill="#FBBF24" font-size="11" font-family="sans-serif" font-weight="700" text-anchor="middle">CAMERA ID: REMOVED</text>

        <!-- Bottom Security Pill -->
        <rect x="100" y="200" width="220" height="34" rx="17" fill="#064E3B" stroke="#10B981" stroke-width="1.5"/>
        <text x="210" y="222" fill="#34D399" font-size="12" font-family="sans-serif" font-weight="800" text-anchor="middle">PRIVATE LOCAL PROCESSING</text>
      </g>`;
  }

  // 6. Bulk / Batch Processing
  if (slug.includes('bulk') || slug.includes('batch') || slug.includes('ecommerce') || slug.includes('shopify')) {
    return `
      <g transform="translate(660, 160)">
        <rect width="420" height="260" rx="18" fill="#1E293B" stroke="#334155" stroke-width="1.5"/>
        
        <!-- Card Stack Back -->
        <rect x="40" y="35" width="160" height="180" rx="12" fill="#0F172A" stroke="#334155" opacity="0.5"/>
        <!-- Card Stack Middle -->
        <rect x="60" y="45" width="160" height="180" rx="12" fill="#0F172A" stroke="#475569" opacity="0.8"/>
        <!-- Card Stack Front -->
        <g transform="translate(80, 55)">
          <rect width="160" height="180" rx="12" fill="#0F2942" stroke="#0284C7" stroke-width="2"/>
          <rect x="15" y="15" width="130" height="85" rx="8" fill="#1E293B"/>
          <text x="80" y="60" fill="#38BDF8" font-size="13" font-family="sans-serif" font-weight="700" text-anchor="middle">BATCH QUEUE</text>
          <text x="80" y="125" fill="#F8FAFC" font-size="15" font-family="sans-serif" font-weight="800" text-anchor="middle">50+ FILES</text>
          <text x="80" y="148" fill="#38BDF8" font-size="11" font-family="sans-serif" font-weight="600" text-anchor="middle">Parallel Workers</text>
        </g>

        <!-- Fast Arrow -->
        <path d="M 260 145 L 295 145" stroke="#10B981" stroke-width="3" stroke-dasharray="4,4"/>
        <polygon points="295,140 305,145 295,150" fill="#10B981"/>

        <!-- Stream Output Card -->
        <g transform="translate(310, 65)">
          <rect width="80" height="160" rx="12" fill="#064E3B" stroke="#10B981" stroke-width="2"/>
          <text x="40" y="70" fill="#34D399" font-size="12" font-family="sans-serif" font-weight="800" text-anchor="middle">ZIP</text>
          <text x="40" y="95" fill="#A7F3D0" font-size="11" font-family="sans-serif" font-weight="700" text-anchor="middle">STREAM</text>
          <circle cx="40" cy="125" r="12" fill="#10B981"/>
          <path d="M 34 125 L 38 129 L 46 121" stroke="#070A12" stroke-width="2.5" stroke-linecap="round" fill="none"/>
        </g>
      </g>`;
  }

  // 7. Format Conversion Pattern
  if (seoData.pageCategory === 'converter' || slug.includes('convert') || slug.includes('-to-')) {
    const { from, to } = extractFormats(routePath, seoData);
    return `
      <g transform="translate(660, 160)">
        <rect width="420" height="260" rx="18" fill="#1E293B" stroke="#334155" stroke-width="1.5"/>
        
        <!-- Left Input File Card -->
        <g transform="translate(25, 35)">
          <rect width="140" height="190" rx="14" fill="#0F172A" stroke="#334155" stroke-width="1.5"/>
          <path d="M 105 0 L 140 35 L 105 35 Z" fill="#334155"/>
          <rect x="15" y="20" width="70" height="24" rx="6" fill="#334155"/>
          <text x="50" y="36" fill="#94A3B8" font-size="11" font-family="sans-serif" font-weight="700" text-anchor="middle">SOURCE</text>
          
          <text x="70" y="110" fill="#F8FAFC" font-size="26" font-family="sans-serif" font-weight="800" text-anchor="middle">${escapeXml(from)}</text>
          <text x="70" y="145" fill="#64748B" font-size="12" font-family="sans-serif" text-anchor="middle">Raw Input</text>
        </g>

        <!-- WASM Arrow Flow -->
        <g transform="translate(175, 115)">
          <path d="M 0 15 L 60 15" stroke="#38BDF8" stroke-width="3" stroke-dasharray="5,3"/>
          <polygon points="58,9 68,15 58,21" fill="#38BDF8"/>
          
          <circle cx="32" cy="15" r="20" fill="#0EA5E9" stroke="#38BDF8" stroke-width="2"/>
          <path d="M 28 7 L 38 14 L 30 16 L 34 23 L 25 17 L 31 15 Z" fill="#FFFFFF"/>
          
          <text x="32" y="48" fill="#38BDF8" font-size="11" font-family="sans-serif" font-weight="800" text-anchor="middle">WASM</text>
        </g>

        <!-- Right Output File Card -->
        <g transform="translate(255, 35)">
          <rect width="140" height="190" rx="14" fill="#0F2942" stroke="#0284C7" stroke-width="2"/>
          <rect x="15" y="20" width="75" height="24" rx="6" fill="#0C4A6E"/>
          <text x="52" y="36" fill="#38BDF8" font-size="11" font-family="sans-serif" font-weight="700" text-anchor="middle">OPTIMIZED</text>
          <circle cx="118" cy="22" r="9" fill="#10B981"/>
          <path d="M 113 22 L 117 25 L 123 18" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" fill="none"/>

          <text x="70" y="110" fill="#38BDF8" font-size="26" font-family="sans-serif" font-weight="800" text-anchor="middle">${escapeXml(to)}</text>
          <text x="70" y="145" fill="#34D399" font-size="12" font-family="sans-serif" font-weight="600" text-anchor="middle">Optimized Output</text>
        </g>
      </g>`;
  }

  // 8. Compression Pattern
  if (seoData.pageCategory === 'compression' || seoData.targetMaxKB || slug.includes('compress') || slug.includes('reducer') || slug.includes('kb') || slug.includes('1mb')) {
    const targetKbVal = seoData.targetMaxKB ? `${seoData.targetMaxKB} KB` : (slug.includes('50kb') ? '50 KB' : (slug.includes('100kb') ? '100 KB' : (slug.includes('200kb') ? '200 KB' : (slug.includes('1mb') ? '1 MB' : '-85%'))));
    
    return `
      <g transform="translate(660, 160)">
        <rect width="420" height="260" rx="18" fill="#1E293B" stroke="#334155" stroke-width="1.5"/>
        
        <!-- Left Before Card -->
        <g transform="translate(25, 35)">
          <rect width="140" height="190" rx="14" fill="#0F172A" stroke="#334155" stroke-width="1.5"/>
          <rect x="15" y="20" width="110" height="26" rx="6" fill="#451A03" stroke="#F59E0B" stroke-width="1"/>
          <text x="70" y="37" fill="#FBBF24" font-size="11" font-family="sans-serif" font-weight="800" text-anchor="middle">UNOPTIMIZED</text>
          
          <text x="70" y="105" fill="#F8FAFC" font-size="22" font-family="sans-serif" font-weight="800" text-anchor="middle">5.4 MB</text>
          <text x="70" y="135" fill="#64748B" font-size="11" font-family="sans-serif" text-anchor="middle">Original Size</text>
        </g>

        <!-- Arrow & Savings Badge -->
        <g transform="translate(175, 110)">
          <path d="M 0 15 L 60 15" stroke="#10B981" stroke-width="3"/>
          <polygon points="58,9 68,15 58,21" fill="#10B981"/>
          
          <rect x="-10" y="-18" width="80" height="24" rx="12" fill="#064E3B" stroke="#10B981" stroke-width="1"/>
          <text x="30" y="-2" fill="#34D399" font-size="11" font-family="sans-serif" font-weight="800" text-anchor="middle">${escapeXml(targetKbVal)}</text>
        </g>

        <!-- Right After Card -->
        <g transform="translate(255, 35)">
          <rect width="140" height="190" rx="14" fill="#064E3B" stroke="#10B981" stroke-width="2"/>
          <rect x="15" y="20" width="110" height="26" rx="6" fill="#065F46" stroke="#34D399" stroke-width="1"/>
          <text x="70" y="37" fill="#A7F3D0" font-size="11" font-family="sans-serif" font-weight="800" text-anchor="middle">COMPRESSED</text>

          <text x="70" y="105" fill="#34D399" font-size="22" font-family="sans-serif" font-weight="800" text-anchor="middle">${escapeXml(targetKbVal)}</text>
          <text x="70" y="135" fill="#6EE7B7" font-size="11" font-family="sans-serif" font-weight="600" text-anchor="middle">Quality Retained</text>
        </g>
      </g>`;
  }

  // 9. Resize / Crop Pattern
  if (seoData.presetResize || slug.includes('resize') || slug.includes('crop') || slug.includes('aspect') || slug.includes('passport') || slug.includes('banner') || slug.includes('discord') || slug.includes('etsy')) {
    const dimText = seoData.presetResize ? `${seoData.presetResize.maxWidth} × ${seoData.presetResize.maxHeight}` : (slug.includes('passport') ? '600 × 600 PX' : (slug.includes('banner') ? '1584 × 396 PX' : (slug.includes('discord') ? '512 × 512 PX' : (slug.includes('etsy') ? '2000 × 2000 PX' : 'EXACT RESIZE'))));
    
    return `
      <g transform="translate(660, 160)">
        <rect width="420" height="260" rx="18" fill="#1E293B" stroke="#0284C7" stroke-width="1.5"/>
        
        <!-- Canvas Bounds Frame -->
        <rect x="30" y="30" width="360" height="200" rx="12" fill="#0F172A" stroke="#334155" stroke-width="1"/>
        
        <!-- Crop Box Overlay -->
        <rect x="60" y="55" width="300" height="150" rx="8" fill="#0EA5E9" fill-opacity="0.15" stroke="#38BDF8" stroke-width="2" stroke-dasharray="6,4"/>
        
        <!-- Handles -->
        <rect x="55" y="50" width="10" height="10" fill="#38BDF8"/>
        <rect x="355" y="50" width="10" height="10" fill="#38BDF8"/>
        <rect x="55" y="200" width="10" height="10" fill="#38BDF8"/>
        <rect x="355" y="200" width="10" height="10" fill="#38BDF8"/>

        <!-- Dimension Pill Center -->
        <rect x="110" y="110" width="200" height="40" rx="20" fill="#0F2942" stroke="#38BDF8" stroke-width="1.5"/>
        <text x="210" y="135" fill="#38BDF8" font-size="14" font-family="sans-serif" font-weight="800" text-anchor="middle">${escapeXml(dimText)}</text>
      </g>`;
  }

  // 10. Default / Editorial / Articles / Static Pages Architecture Diagram
  return `
    <g transform="translate(660, 160)">
      <rect width="420" height="260" rx="18" fill="#1E293B" stroke="#334155" stroke-width="1.5"/>
      
      <!-- Central WASM Engine Node -->
      <g transform="translate(130, 80)">
        <rect width="160" height="100" rx="14" fill="#0F2942" stroke="#0284C7" stroke-width="2"/>
        <text x="80" y="45" fill="#F8FAFC" font-size="15" font-family="sans-serif" font-weight="800" text-anchor="middle">WASM ENGINE</text>
        <text x="80" y="70" fill="#38BDF8" font-size="12" font-family="sans-serif" font-weight="600" text-anchor="middle">Near-Native Speed</text>
      </g>

      <!-- Codec Pills Around -->
      <rect x="30" y="30" width="100" height="30" rx="8" fill="#0F172A" stroke="#334155"/>
      <text x="80" y="50" fill="#94A3B8" font-size="11" font-family="sans-serif" font-weight="700" text-anchor="middle">MozJPEG</text>

      <rect x="290" y="30" width="100" height="30" rx="8" fill="#0F172A" stroke="#334155"/>
      <text x="340" y="50" fill="#94A3B8" font-size="11" font-family="sans-serif" font-weight="700" text-anchor="middle">UPNG WASM</text>

      <rect x="30" y="200" width="100" height="30" rx="8" fill="#0F172A" stroke="#334155"/>
      <text x="80" y="220" fill="#94A3B8" font-size="11" font-family="sans-serif" font-weight="700" text-anchor="middle">WebP VP8L</text>

      <rect x="290" y="200" width="100" height="30" rx="8" fill="#0F172A" stroke="#334155"/>
      <text x="340" y="220" fill="#94A3B8" font-size="11" font-family="sans-serif" font-weight="700" text-anchor="middle">AVIF Codec</text>

      <!-- Connecting Lines -->
      <line x1="130" y1="45" x2="160" y2="80" stroke="#0EA5E9" stroke-width="1.5" stroke-dasharray="3,3"/>
      <line x1="290" y1="45" x2="260" y2="80" stroke="#0EA5E9" stroke-width="1.5" stroke-dasharray="3,3"/>
      <line x1="130" y1="215" x2="160" y2="180" stroke="#0EA5E9" stroke-width="1.5" stroke-dasharray="3,3"/>
      <line x1="290" y1="215" x2="260" y2="180" stroke="#0EA5E9" stroke-width="1.5" stroke-dasharray="3,3"/>
    </g>`;
}

function generateOgImageSvg(
  title: string,
  description: string,
  badgeText: string,
  microLabel: string,
  rightVisualSvg: string,
  logoBase64: string
): string {
  const titleLines = wrapText(title, 24, 3);
  const descLines = wrapText(description, 38, 2);

  const titleStartY = 196;
  const titleSvg = titleLines
    .map(
      (line, i) =>
        `<text x="70" y="${titleStartY + i * 46}" fill="#FFFFFF" font-size="36" font-family="sans-serif" font-weight="800">${escapeXml(line)}</text>`
    )
    .join('\n');

  const descStartY = titleStartY + titleLines.length * 46 + 14;
  const descSvg = descLines
    .map(
      (line, i) =>
        `<text x="70" y="${descStartY + i * 26}" fill="#94A3B8" font-size="17" font-family="sans-serif" font-weight="400">${escapeXml(line)}</text>`
    )
    .join('\n');

  return `<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <clipPath id="logo-clip">
      <rect x="70" y="62" width="48" height="48" rx="10"/>
    </clipPath>
    <radialGradient id="bg-glow" cx="80%" cy="50%" r="60%">
      <stop offset="0%" stop-color="#0284C7" stop-opacity="0.12"/>
      <stop offset="100%" stop-color="#0284C7" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <!-- Deep Background Canvas -->
  <rect width="1200" height="630" fill="#070A12"/>
  <rect x="36" y="36" width="1128" height="558" rx="20" fill="#0F172A" stroke="#1E293B" stroke-width="1.5"/>
  <rect x="36" y="36" width="1128" height="558" rx="20" fill="url(#bg-glow)"/>

  <!-- Top Header Bar -->
  <g>
    <image href="${logoBase64}" x="70" y="62" width="48" height="48" clip-path="url(#logo-clip)"/>
    <text x="130" y="94" fill="#F8FAFC" font-size="22" font-family="sans-serif" font-weight="800" letter-spacing="2">ZAPIXAL</text>
  </g>

  <!-- Top Right Category Badge -->
  <rect x="830" y="65" width="290" height="38" rx="19" fill="#0C4A6E" stroke="#0284C7" stroke-width="1"/>
  <text x="975" y="89" fill="#38BDF8" font-size="13" font-family="sans-serif" font-weight="700" text-anchor="middle" letter-spacing="1">${escapeXml(badgeText)}</text>

  <!-- Left Content Area -->
  <text x="70" y="152" fill="#38BDF8" font-size="12" font-family="sans-serif" font-weight="800" letter-spacing="2.5">${escapeXml(microLabel)}</text>
  ${titleSvg}
  ${descSvg}

  <!-- Right Visual Illustration Area -->
  ${rightVisualSvg}

  <!-- Bottom Trust Bar -->
  <line x1="70" y1="520" x2="1094" y2="520" stroke="#1E293B" stroke-width="1"/>
  <circle cx="78" cy="552" r="4.5" fill="#10B981"/>
  <text x="90" y="556" fill="#64748B" font-size="14" font-family="sans-serif" font-weight="500">Zero Cloud Uploads • WASM Engine • Local RAM Sandbox</text>
  <text x="1094" y="556" fill="#38BDF8" font-size="17" font-family="sans-serif" font-weight="700" text-anchor="end">zapixal.com</text>
</svg>`;
}

async function generateAllOgImages() {
  const outputDir = path.resolve(process.cwd(), 'public', 'og-images');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const logoPngBuffer = fs.readFileSync(path.resolve(process.cwd(), 'public', 'icon-512.png'));
  const logoBase64 = `data:image/png;base64,${logoPngBuffer.toString('base64')}`;

  const staticRoutes = ['/', '/tools', '/about', '/privacy', '/terms'];
  const allRoutes = Array.from(
    new Set([
      ...staticRoutes,
      ...CATEGORY_ROUTES,
      ...ALL_ARTICLE_SYSTEM_ROUTES,
      ...TOOL_REGISTRY.map((t) => t.route),
      ...PSEO_ROUTES_LIST.map((r: SeoRouteItem) => r.path),
    ])
  );

  let generatedCount = 0;

  for (const routePath of allRoutes) {
    const seoData = await parseSeoRoute(routePath);
    const filename = routePath === '/' ? 'home' : routePath.replace(/^\//, '').replace(/\//g, '-');
    const badgeText = getCategoryBadge(routePath, seoData.pageCategory);
    const microLabel = getMicroLabel(routePath, seoData.pageCategory);

    const title = seoData.h1Title || seoData.metaTitle || 'Zapixal';
    const description = seoData.metaDescription || '';

    const rightVisualSvg = generateRightVisualSvg(routePath, seoData);

    const svg = generateOgImageSvg(title, description, badgeText, microLabel, rightVisualSvg, logoBase64);
    const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } });
    const pngBuffer = resvg.render().asPng();

    const outFile = path.join(outputDir, `${filename}.png`);
    fs.writeFileSync(outFile, pngBuffer);
    generatedCount++;
  }

  console.log(`Successfully generated ${generatedCount} route-aware OG images in public/og-images/`);
}

generateAllOgImages().catch((err) => {
  console.error('Failed to generate OG images:', err);
  process.exit(1);
});
