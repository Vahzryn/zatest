/**
 * High-performance, isomorphic, secure GitHub-Flavored Markdown (GFM) engine.
 * Supports GFM tables, task lists, strikethrough, syntax highlighting classes,
 * safe URL filtering, rigorous HTML sanitization, and Unicode string diagnostics.
 */

export interface MarkdownRenderOptions {
  sanitize: boolean;
  allowSafeHtml: boolean;
  openLinksInNewTab: boolean;
  enableTaskLists: boolean;
  enableTables: boolean;
  enableStrikethrough: boolean;
  enableHeadingAnchors: boolean;
}

export const DEFAULT_MARKDOWN_OPTIONS: MarkdownRenderOptions = {
  sanitize: true,
  allowSafeHtml: true,
  openLinksInNewTab: true,
  enableTaskLists: true,
  enableTables: true,
  enableStrikethrough: true,
  enableHeadingAnchors: true,
};

export interface MarkdownStats {
  codeUnits: number;
  codePoints: number;
  utf8Bytes: number;
  lineCount: number;
  wordCount: number;
  characterCountNoSpaces: number;
  paragraphCount: number;
  headingCount: number;
  linkCount: number;
  imageCount: number;
  tableCount: number;
  codeBlockCount: number;
  taskCount: {
    total: number;
    completed: number;
    pending: number;
  };
  readingTimeMinutes: number;
}

export interface MarkdownPreset {
  id: string;
  name: string;
  category: string;
  description: string;
  content: string;
}

export type MarkdownSyntaxAction =
  | 'bold'
  | 'italic'
  | 'strikethrough'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'h4'
  | 'quote'
  | 'inline-code'
  | 'code-block'
  | 'link'
  | 'image'
  | 'bullet-list'
  | 'numbered-list'
  | 'task-list'
  | 'table'
  | 'hr';

// ==========================================
// 1. SECURITY & SANITIZATION HELPERS
// ==========================================

/**
 * Escapes standard HTML special characters.
 */
export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Replaces backslash escaped Markdown characters with placeholder tokens before parsing.
 */
const ESCAPE_MAP: Record<string, string> = {
  '\\\\': '%%ESC_BS%%',
  '\\`': '%%ESC_BT%%',
  '\\*': '%%ESC_AS%%',
  '\\_': '%%ESC_US%%',
  '\\{': '%%ESC_OB%%',
  '\\}': '%%ESC_CB%%',
  '\\[': '%%ESC_OS%%',
  '\\]': '%%ESC_CS%%',
  '\\(': '%%ESC_OP%%',
  '\\)': '%%ESC_CP%%',
  '\\#': '%%ESC_HS%%',
  '\\+': '%%ESC_PL%%',
  '\\-': '%%ESC_MN%%',
  '\\.': '%%ESC_DT%%',
  '\\!': '%%ESC_EX%%',
  '\\~': '%%ESC_TL%%',
  '\\|': '%%ESC_PP%%',
  '\\>': '%%ESC_GT%%',
  '\\<': '%%ESC_LT%%',
};

const UNESCAPE_MAP: Record<string, string> = {
  '%%ESC_BS%%': '\\',
  '%%ESC_BT%%': '`',
  '%%ESC_AS%%': '*',
  '%%ESC_US%%': '_',
  '%%ESC_OB%%': '{',
  '%%ESC_CB%%': '}',
  '%%ESC_OS%%': '[',
  '%%ESC_CS%%': ']',
  '%%ESC_OP%%': '(',
  '%%ESC_CP%%': ')',
  '%%ESC_HS%%': '#',
  '%%ESC_PL%%': '+',
  '%%ESC_MN%%': '-',
  '%%ESC_DT%%': '.',
  '%%ESC_EX%%': '!',
  '%%ESC_TL%%': '~',
  '%%ESC_PP%%': '|',
  '%%ESC_GT%%': '&gt;',
  '%%ESC_LT%%': '&lt;',
};

function protectEscapes(text: string): string {
  let res = text;
  for (const [seq, token] of Object.entries(ESCAPE_MAP)) {
    res = res.split(seq).join(token);
  }
  return res;
}

function restoreEscapes(text: string): string {
  let res = text;
  for (const [token, char] of Object.entries(UNESCAPE_MAP)) {
    res = res.split(token).join(char);
  }
  return res;
}

/**
 * Validates and sanitizes a URL against malicious schemes (javascript:, vbscript:, data: text/html).
 * Only allows http:, https:, mailto:, tel:, relative URLs, and safe image data URIs.
 */
export function sanitizeUrl(rawUrl: string, allowDataImage = false): string | null {
  if (!rawUrl) return null;
  const trimmed = rawUrl.trim();

  // Strip control characters and non-printables
  const clean = trimmed.replace(/[\x00-\x1F\x7F\u200B-\u200D\uFEFF]/g, '');

  // Normalize lowercase for protocol check
  const lower = clean.toLowerCase();

  // Explicit dangerous schemes check
  if (
    lower.startsWith('javascript:') ||
    lower.startsWith('vbscript:') ||
    lower.startsWith('file:') ||
    lower.startsWith('data:text/html') ||
    lower.startsWith('data:application/javascript') ||
    lower.startsWith('data:application/x-javascript')
  ) {
    return null;
  }

  // Safe data image check (e.g. data:image/png;base64, data:image/jpeg;base64,)
  if (lower.startsWith('data:')) {
    if (
      allowDataImage &&
      /^data:image\/(png|jpeg|jpg|webp|gif|svg\+xml);base64,[a-z0-9+/=]+$/i.test(clean)
    ) {
      return clean;
    }
    return null;
  }

  // Allow relative URLs, anchors, http, https, mailto, tel
  if (
    clean.startsWith('/') ||
    clean.startsWith('./') ||
    clean.startsWith('../') ||
    clean.startsWith('#') ||
    clean.startsWith('?') ||
    lower.startsWith('http://') ||
    lower.startsWith('https://') ||
    lower.startsWith('mailto:') ||
    lower.startsWith('tel:')
  ) {
    return escapeHtml(clean);
  }

  // Domain-like relative/absolute URL
  if (/^[a-z0-9.-]+\.[a-z]{2,}(\/.*)?$/i.test(clean)) {
    return escapeHtml(`https://${clean}`);
  }

  return escapeHtml(clean);
}

/**
 * Whitelist-based HTML tag sanitizer for raw HTML embedded inside Markdown.
 */
const ALLOWED_HTML_TAGS = new Set([
  'kbd',
  'mark',
  'u',
  'br',
  'sub',
  'sup',
  'details',
  'summary',
  'del',
  'span',
  'div',
  'em',
  'strong',
  'b',
  'i',
  'code',
  'p',
  'pre',
  'blockquote',
  'hr',
  'table',
  'thead',
  'tbody',
  'tr',
  'th',
  'td',
  'ul',
  'ol',
  'li',
  'abbr',
  'section',
  'a',
  'img',
]);

const ALLOWED_HTML_ATTRS = new Set([
  'class',
  'id',
  'title',
  'align',
  'open',
  'dir',
  'lang',
  'href',
  'src',
  'alt',
  'target',
  'rel',
  'loading',
  'referrerpolicy',
  'type',
  'checked',
  'disabled',
  'colspan',
  'rowspan',
  'width',
  'height',
]);

/**
 * Removes dangerous whole blocks (scripts, styles, iframes, svgs, objects, embeds).
 */
export function stripMaliciousTags(text: string): string {
  return text
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, '')
    .replace(/<object[\s\S]*?<\/object>/gi, '')
    .replace(/<embed[\s\S]*?<\/embed>/gi, '')
    .replace(/<svg[\s\S]*?<\/svg>/gi, '')
    .replace(/<math[\s\S]*?<\/math>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '');
}

export function sanitizeRawHtml(rawHtml: string): string {
  // 1. Strip complete dangerous blocks first
  const sanitized = stripMaliciousTags(rawHtml);

  // 2. Filter remaining tags and attributes
  return sanitized.replace(/<\/?([a-zA-Z0-9_-]+)(\s+[^>]*)?>/g, (match, tagName, attributes) => {
    const lowerTag = tagName.toLowerCase();
    if (!ALLOWED_HTML_TAGS.has(lowerTag)) {
      return ''; // Strip non-whitelisted tags
    }

    const isClosing = match.startsWith('</');
    if (isClosing) {
      return `</${lowerTag}>`;
    }

    if (!attributes) {
      return `<${lowerTag}>`;
    }

    // Sanitize attributes: only allow whitelisted attrs, strip on*, style, etc.
    const safeAttrs: string[] = [];
    const attrRegex = /([a-zA-Z0-9_-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;
    let attrMatch: RegExpExecArray | null;

    while ((attrMatch = attrRegex.exec(attributes)) !== null) {
      const attrName = attrMatch[1].toLowerCase();
      const attrValue = attrMatch[2] ?? attrMatch[3] ?? attrMatch[4] ?? '';

      // Block all event handlers (onclick, onerror, onload, etc.) and dangerous attributes
      if (attrName.startsWith('on') || attrName === 'style' || attrName === 'formaction') {
        continue;
      }

      // Check for dangerous URLs in href or src
      if (attrName === 'href' || attrName === 'src') {
        const safeUrl = sanitizeUrl(attrValue, attrName === 'src');
        if (safeUrl) {
          safeAttrs.push(`${attrName}="${safeUrl}"`);
        }
        continue;
      }

      if (ALLOWED_HTML_ATTRS.has(attrName)) {
        safeAttrs.push(`${attrName}="${escapeHtml(attrValue)}"`);
      }
    }

    const attrStr = safeAttrs.length > 0 ? ' ' + safeAttrs.join(' ') : '';
    const isSelfClosing = match.endsWith('/>') || lowerTag === 'br' || lowerTag === 'hr' || lowerTag === 'img';
    return `<${lowerTag}${attrStr}${isSelfClosing ? ' /' : ''}>`;
  });
}

// ==========================================
// 2. PARSER CORE & BLOCK TOKENIZERS
// ==========================================

function slugifyHeading(text: string): string {
  return text
    .toLowerCase()
    .replace(/<[^>]+>/g, '')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

/**
 * Parses inline Markdown elements (Bold, Italic, Strikethrough, Inline Code, Links, Images, Safe HTML).
 */
export function parseInlineMarkdown(text: string, options: MarkdownRenderOptions): string {
  let out = stripMaliciousTags(text);
  out = protectEscapes(out);

  // Store inline code snippets in placeholders so their contents are untouched
  const codeSnippets: string[] = [];
  out = out.replace(/`([^`]+)`/g, (_m, code) => {
    const placeholder = `%%INLINE_CODE_${codeSnippets.length}%%`;
    codeSnippets.push(
      `<code class="px-1.5 py-0.5 font-mono text-xs sm:text-sm bg-neutral-100 dark:bg-neutral-800 text-pink-600 dark:text-pink-400 rounded border border-neutral-200 dark:border-neutral-700">${escapeHtml(code)}</code>`
    );
    return placeholder;
  });

  // Autolinks: <https://...> or <mailto:...>
  out = out.replace(/<(https?:\/\/[^\s>]+)>/g, (_m, url) => {
    const safeUrl = sanitizeUrl(url, false);
    if (!safeUrl) return escapeHtml(url);
    const targetAttrs = options.openLinksInNewTab ? ' target="_blank" rel="noopener noreferrer"' : '';
    return `<a href="${safeUrl}"${targetAttrs} class="text-blue-600 dark:text-blue-400 font-medium hover:underline">${escapeHtml(url)}</a>`;
  });

  out = out.replace(/<([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})>/g, (_m, email) => {
    return `<a href="mailto:${escapeHtml(email)}" class="text-blue-600 dark:text-blue-400 font-medium hover:underline">${escapeHtml(email)}</a>`;
  });

  // Images: ![alt](url "title")
  out = out.replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)/g, (_m, alt, url, title) => {
    const safeUrl = sanitizeUrl(url, true);
    if (!safeUrl) {
      return `<span class="text-xs text-rose-500 font-mono italic">[Blocked Insecure Image URL]</span>`;
    }
    const titleAttr = title ? ` title="${escapeHtml(title)}"` : '';
    return `<span class="inline-block my-2"><img src="${safeUrl}" alt="${escapeHtml(alt)}"${titleAttr} loading="lazy" referrerPolicy="no-referrer" class="max-w-full h-auto rounded-xl border border-neutral-200 dark:border-neutral-700 shadow-xs" /><span class="block text-[11px] text-neutral-400 mt-1 italic">${escapeHtml(alt || 'Image preview')}</span></span>`;
  });

  // Links: [text](url "title")
  out = out.replace(/\[([^\]]+)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)/g, (_m, linkText, url, title) => {
    const safeUrl = sanitizeUrl(url, false);
    if (!safeUrl) {
      return `<span class="text-neutral-500 underline line-through">${parseInlineMarkdown(linkText, options)}</span>`;
    }
    const targetAttrs = options.openLinksInNewTab && !safeUrl.startsWith('#')
      ? ' target="_blank" rel="noopener noreferrer"'
      : '';
    const titleAttr = title ? ` title="${escapeHtml(title)}"` : '';
    const parsedText = parseInlineMarkdown(linkText, options);
    return `<a href="${safeUrl}"${targetAttrs}${titleAttr} class="text-blue-600 dark:text-blue-400 font-medium hover:underline inline-flex items-center gap-0.5">${parsedText}</a>`;
  });

  // Strikethrough: ~~text~~
  if (options.enableStrikethrough) {
    out = out.replace(/~~([^~]+)~~/g, (_m, content) => {
      return `<del class="line-through text-neutral-500 dark:text-neutral-400">${parseInlineMarkdown(content, options)}</del>`;
    });
  }

  // Bold + Italic: ***text*** or ___text___
  out = out.replace(/\*\*\*([^*]+)\*\*\*/g, (_m, content) => {
    return `<strong><em>${parseInlineMarkdown(content, options)}</em></strong>`;
  });
  out = out.replace(/___([^_]+)___/g, (_m, content) => {
    return `<strong><em>${parseInlineMarkdown(content, options)}</em></strong>`;
  });

  // Bold: **text** or __text__
  out = out.replace(/\*\*([^*]+)\*\*/g, (_m, content) => {
    return `<strong class="font-bold text-neutral-900 dark:text-white">${parseInlineMarkdown(content, options)}</strong>`;
  });
  out = out.replace(/__([^_]+)__/g, (_m, content) => {
    return `<strong class="font-bold text-neutral-900 dark:text-white">${parseInlineMarkdown(content, options)}</strong>`;
  });

  // Italic: *text* or _text_
  out = out.replace(/\*([^*]+)\*/g, (_m, content) => {
    return `<em class="italic">${parseInlineMarkdown(content, options)}</em>`;
  });
  out = out.replace(/\b_([^_]+)_\b/g, (_m, content) => {
    return `<em class="italic">${parseInlineMarkdown(content, options)}</em>`;
  });

  // Safe Raw HTML tags if allowed
  if (options.allowSafeHtml) {
    out = sanitizeRawHtml(out);
  } else {
    // If raw HTML disabled, escape residual tag brackets
    out = out.replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // Restore inline code snippets
  codeSnippets.forEach((snippet, idx) => {
    out = out.replace(`%%INLINE_CODE_${idx}%%`, snippet);
  });

  // Restore protected escape sequences
  out = restoreEscapes(out);

  return out;
}

/**
 * Parses GFM Table block into clean responsive HTML table.
 */
function parseGfmTable(lines: string[], options: MarkdownRenderOptions): string {
  if (lines.length < 2) return '';

  const headerLine = lines[0];
  const alignLine = lines[1];
  const dataLines = lines.slice(2);

  const parseRow = (line: string) => {
    return line
      .trim()
      .replace(/^\|/, '')
      .replace(/\|$/, '')
      .split('|')
      .map((cell) => cell.trim());
  };

  const headers = parseRow(headerLine);
  const alignments = parseRow(alignLine).map((cell) => {
    const left = cell.startsWith(':');
    const right = cell.endsWith(':');
    if (left && right) return 'text-center';
    if (right) return 'text-right';
    return 'text-left';
  });

  let html = `<div class="w-full my-4 overflow-x-auto rounded-2xl border border-neutral-200 dark:border-neutral-700 shadow-xs"><table class="w-full text-left text-xs sm:text-sm border-collapse">\n<thead>\n<tr class="bg-neutral-100 dark:bg-neutral-800/80 border-b border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white font-bold">\n`;

  headers.forEach((h, idx) => {
    const align = alignments[idx] || 'text-left';
    html += `  <th class="py-2.5 px-4 font-semibold ${align}">${parseInlineMarkdown(h, options)}</th>\n`;
  });

  html += `</tr>\n</thead>\n<tbody class="divide-y divide-neutral-200 dark:divide-neutral-800">\n`;

  dataLines.forEach((rowLine) => {
    const cells = parseRow(rowLine);
    html += `<tr class="hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors text-neutral-700 dark:text-neutral-300">\n`;
    headers.forEach((_, cIdx) => {
      const cellVal = cells[cIdx] !== undefined ? cells[cIdx] : '';
      const align = alignments[cIdx] || 'text-left';
      html += `  <td class="py-2.5 px-4 ${align}">${parseInlineMarkdown(cellVal, options)}</td>\n`;
    });
    html += `</tr>\n`;
  });

  html += `</tbody>\n</table></div>\n`;
  return html;
}

/**
 * Primary Markdown to HTML Compiler.
 */
export function renderMarkdownToHtml(
  markdown: string,
  userOptions?: Partial<MarkdownRenderOptions>
): string {
  if (!markdown || markdown.trim() === '') {
    return '';
  }

  const options: MarkdownRenderOptions = {
    ...DEFAULT_MARKDOWN_OPTIONS,
    ...userOptions,
  };

  // Strip whole malicious scripts / blocks before line parsing
  const cleanMarkdown = stripMaliciousTags(markdown);

  const lines = cleanMarkdown.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  const output: string[] = [];

  let inCodeBlock = false;
  let codeBlockLang = '';
  let codeBlockLines: string[] = [];

  let inTable = false;
  let tableLines: string[] = [];

  let inList = false;
  let listType: 'ul' | 'ol' = 'ul';
  let listItems: string[] = [];

  let inBlockquote = false;
  let blockquoteLines: string[] = [];

  const flushTable = () => {
    if (inTable && tableLines.length > 0) {
      output.push(parseGfmTable(tableLines, options));
      tableLines = [];
      inTable = false;
    }
  };

  const flushList = () => {
    if (inList && listItems.length > 0) {
      const tag = listType;
      const listClass =
        tag === 'ul'
          ? 'list-disc list-outside pl-6 my-3 space-y-1.5 text-neutral-800 dark:text-neutral-200'
          : 'list-decimal list-outside pl-6 my-3 space-y-1.5 text-neutral-800 dark:text-neutral-200';

      let listHtml = `<${tag} class="${listClass}">\n`;
      listItems.forEach((item) => {
        listHtml += `  <li>${item}</li>\n`;
      });
      listHtml += `</${tag}>\n`;
      output.push(listHtml);
      listItems = [];
      inList = false;
    }
  };

  const flushBlockquote = () => {
    if (inBlockquote && blockquoteLines.length > 0) {
      const bqContent = renderMarkdownToHtml(blockquoteLines.join('\n'), options);
      output.push(
        `<blockquote class="my-4 pl-4 py-1 border-l-4 border-blue-500 dark:border-blue-400 bg-blue-50/40 dark:bg-blue-950/20 rounded-r-2xl text-neutral-700 dark:text-neutral-300 italic">\n${bqContent}</blockquote>\n`
      );
      blockquoteLines = [];
      inBlockquote = false;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // 1. Fenced Code Blocks (``` or ~~~)
    const codeBlockMatch = line.match(/^(\`\`\`|~~~)\s*([a-zA-Z0-9_+-]*)\s*$/);
    if (codeBlockMatch) {
      if (!inCodeBlock) {
        flushTable();
        flushList();
        flushBlockquote();
        inCodeBlock = true;
        codeBlockLang = codeBlockMatch[2] || '';
        codeBlockLines = [];
      } else {
        // Close code block
        inCodeBlock = false;
        const codeText = codeBlockLines.join('\n');
        const escapedCode = escapeHtml(codeText);
        const langDisplay = codeBlockLang ? escapeHtml(codeBlockLang) : 'text';

        output.push(
          `<div class="my-4 rounded-2xl overflow-hidden border border-neutral-200 dark:border-neutral-700 bg-neutral-900 text-neutral-100 shadow-sm" data-code-block="true">
  <div class="flex items-center justify-between px-4 py-2 bg-neutral-800/80 border-b border-neutral-700 text-xs text-neutral-400 select-none">
    <span class="font-mono font-bold uppercase tracking-wider text-blue-400">${langDisplay}</span>
    <span class="text-[11px] font-sans">Inert Code Block</span>
  </div>
  <pre class="p-4 font-mono text-xs sm:text-sm overflow-x-auto leading-relaxed bg-[#121316] text-neutral-200"><code class="language-${langDisplay}">${escapedCode}</code></pre>
</div>\n`
        );
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockLines.push(line);
      continue;
    }

    // 2. GFM Tables Detection (Must contain | and next line has |-|-|-|)
    const isTableSeparator = (l: string) => /^\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)*\|?$/.test(l.trim());
    if (line.includes('|')) {
      if (!inTable) {
        const nextLine = lines[i + 1];
        if (nextLine && isTableSeparator(nextLine)) {
          flushList();
          flushBlockquote();
          inTable = true;
          tableLines = [line];
          continue;
        }
      } else {
        tableLines.push(line);
        continue;
      }
    } else if (inTable) {
      flushTable();
    }

    // 3. Blockquotes (> ...)
    if (line.startsWith('>')) {
      flushTable();
      flushList();
      inBlockquote = true;
      blockquoteLines.push(line.replace(/^>\s?/, ''));
      continue;
    } else if (inBlockquote) {
      flushBlockquote();
    }

    // 4. Horizontal Rules (---, ***, ___)
    if (/^(\s*[-*_]\s*){3,}$/.test(line)) {
      flushTable();
      flushList();
      output.push(`<hr class="my-6 border-t border-neutral-200 dark:border-neutral-700" />\n`);
      continue;
    }

    // 5. Headings (# H1 to ###### H6)
    const headingMatch = line.match(/^(#{1,6})\s+(.*)$/);
    if (headingMatch) {
      flushTable();
      flushList();
      const level = headingMatch[1].length;
      const headingRawText = headingMatch[2].trim();
      const headingParsed = parseInlineMarkdown(headingRawText, options);
      const slug = slugifyHeading(headingRawText);

      const headingClasses: Record<number, string> = {
        1: 'text-2xl sm:text-3xl font-black text-neutral-900 dark:text-white tracking-tight mt-6 mb-3 pb-2 border-b border-neutral-200 dark:border-neutral-800',
        2: 'text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white tracking-tight mt-5 mb-2.5',
        3: 'text-lg sm:text-xl font-bold text-neutral-900 dark:text-white mt-4 mb-2',
        4: 'text-base sm:text-lg font-bold text-neutral-800 dark:text-neutral-100 mt-3 mb-1.5',
        5: 'text-sm sm:text-base font-bold text-neutral-800 dark:text-neutral-200 mt-2.5 mb-1',
        6: 'text-xs sm:text-sm font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mt-2 mb-1',
      };

      const hClass = headingClasses[level] || headingClasses[2];
      const anchorHtml = options.enableHeadingAnchors && slug
        ? `<a href="#${slug}" class="text-neutral-400 dark:text-neutral-600 hover:text-blue-500 mr-2 no-underline text-sm opacity-60">#</a>`
        : '';

      output.push(
        `<h${level} id="${slug}" class="${hClass}">${anchorHtml}${headingParsed}</h${level}>\n`
      );
      continue;
    }

    // 6. Setext Headings (Heading\n=== or Heading\n---)
    const nextLine = lines[i + 1];
    if (nextLine && !inList && !inBlockquote && line.trim() !== '') {
      if (/^={3,}$/.test(nextLine.trim())) {
        flushTable();
        flushList();
        const headingParsed = parseInlineMarkdown(line.trim(), options);
        const slug = slugifyHeading(line.trim());
        output.push(
          `<h1 id="${slug}" class="text-2xl sm:text-3xl font-black text-neutral-900 dark:text-white tracking-tight mt-6 mb-3 pb-2 border-b border-neutral-200 dark:border-neutral-800">${headingParsed}</h1>\n`
        );
        i++; // Skip the === line
        continue;
      } else if (/^-{3,}$/.test(nextLine.trim())) {
        flushTable();
        flushList();
        const headingParsed = parseInlineMarkdown(line.trim(), options);
        const slug = slugifyHeading(line.trim());
        output.push(
          `<h2 id="${slug}" class="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white tracking-tight mt-5 mb-2.5">${headingParsed}</h2>\n`
        );
        i++; // Skip the --- line
        continue;
      }
    }

    // 7. Task Lists (- [ ] or - [x])
    const taskMatch = line.match(/^(\s*)[-*+]\s+\[([ xX])\]\s+(.*)$/);
    if (options.enableTaskLists && taskMatch) {
      flushTable();
      if (!inList || listType !== 'ul') {
        flushList();
        inList = true;
        listType = 'ul';
      }
      const isChecked = taskMatch[2].toLowerCase() === 'x';
      const itemContent = parseInlineMarkdown(taskMatch[3], options);
      const checkboxHtml = `<input type="checkbox" ${isChecked ? 'checked ' : ''}disabled class="mr-2 rounded text-blue-600 focus:ring-blue-500 cursor-default align-middle" />`;
      const itemHtml = `<span class="inline-flex items-center ${isChecked ? 'line-through text-neutral-400 dark:text-neutral-500' : ''}">${checkboxHtml}<span>${itemContent}</span></span>`;
      listItems.push(itemHtml);
      continue;
    }

    // 8. Unordered Lists (- item, * item, + item)
    const ulMatch = line.match(/^(\s*)[-*+]\s+(.*)$/);
    if (ulMatch) {
      flushTable();
      if (!inList || listType !== 'ul') {
        flushList();
        inList = true;
        listType = 'ul';
      }
      listItems.push(parseInlineMarkdown(ulMatch[2], options));
      continue;
    }

    // 9. Ordered Lists (1. item)
    const olMatch = line.match(/^(\s*)\d+\.\s+(.*)$/);
    if (olMatch) {
      flushTable();
      if (!inList || listType !== 'ol') {
        flushList();
        inList = true;
        listType = 'ol';
      }
      listItems.push(parseInlineMarkdown(olMatch[2], options));
      continue;
    }

    // 10. Empty Lines (Paragraph break)
    if (line.trim() === '') {
      flushTable();
      flushList();
      continue;
    }

    // 11. Regular Paragraph
    flushTable();
    flushList();
    const paragraphParsed = parseInlineMarkdown(line, options);
    output.push(
      `<p class="my-2.5 text-xs sm:text-sm text-neutral-800 dark:text-neutral-200 leading-relaxed">${paragraphParsed}</p>\n`
    );
  }

  // Flush any lingering blocks
  flushTable();
  flushList();
  flushBlockquote();

  return output.join('');
}

// ==========================================
// 3. PLAIN TEXT EXTRACTION
// ==========================================

/**
 * Extracts clean, readable plain text from raw Markdown by stripping formatting syntax.
 */
export function extractPlainTextFromMarkdown(markdown: string): string {
  if (!markdown) return '';

  let text = markdown;

  // Strip code fences
  text = text.replace(/```[\s\S]*?```/g, (match) => {
    return match.replace(/^```[^\n]*\n/, '').replace(/\n```$/, '');
  });

  // Strip inline code
  text = text.replace(/`([^`]+)`/g, '$1');

  // Images: ![alt](url) -> alt
  text = text.replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1');

  // Links: [text](url) -> text
  text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');

  // Autolinks
  text = text.replace(/<([^>]+)>/g, '$1');

  // Headings
  text = text.replace(/^#{1,6}\s+(.*)$/gm, '$1');

  // Task lists
  text = text.replace(/^[-*+]\s+\[[ xX]\]\s+/gm, '');

  // Bullet / numbered lists
  text = text.replace(/^[-*+]\s+/gm, '');
  text = text.replace(/^\d+\.\s+/gm, '');

  // Blockquotes
  text = text.replace(/^>\s?/gm, '');

  // Strikethrough
  text = text.replace(/~~([^~]+)~~/g, '$1');

  // Bold & Italic
  text = text.replace(/\*\*\*([^*]+)\*\*\*/g, '$1');
  text = text.replace(/___([^_]+)___/g, '$1');
  text = text.replace(/\*\*([^*]+)\*\*/g, '$1');
  text = text.replace(/__([^_]+)__/g, '$1');
  text = text.replace(/\*([^*]+)\*/g, '$1');
  text = text.replace(/_([^_]+)_/g, '$1');

  // Table pipes
  text = text.replace(/\|/g, ' ');

  // Horizontal rules
  text = text.replace(/^[-*_]{3,}$/gm, '');

  // Clean extra spaces
  text = text.replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();

  return text;
}

// ==========================================
// 4. STATISTICAL & UNICODE METRICS
// ==========================================

export function calculateMarkdownStats(markdown: string): MarkdownStats {
  const codeUnits = markdown.length;
  // Unicode code points accounting for surrogate pairs
  const codePoints = Array.from(markdown).length;

  // UTF-8 Byte calculation
  let utf8Bytes = 0;
  if (typeof TextEncoder !== 'undefined') {
    utf8Bytes = new TextEncoder().encode(markdown).length;
  } else {
    utf8Bytes = Buffer.from(markdown, 'utf8').length;
  }

  const lines = markdown.split(/\r\n|\r|\n/);
  const lineCount = markdown.trim() === '' ? 0 : lines.length;

  const plainText = extractPlainTextFromMarkdown(markdown);
  const words = plainText.trim().split(/\s+/).filter(Boolean);
  const wordCount = plainText.trim() === '' ? 0 : words.length;
  const characterCountNoSpaces = Array.from(markdown.replace(/\s/g, '')).length;

  const paragraphs = markdown.split(/\n\s*\n/).filter((p) => p.trim() !== '');
  const paragraphCount = paragraphs.length;

  // Counts of structural markdown elements
  const headingCount = (markdown.match(/^#{1,6}\s+/gm) || []).length;
  const linkCount = (markdown.match(/\[[^\]]+\]\([^)]+\)/g) || []).length;
  const imageCount = (markdown.match(/!\[[^\]]*\]\([^)]+\)/g) || []).length;
  const tableCount = (markdown.match(/^\|.+\|$/gm) || []).length > 0 ? 1 : 0;
  const codeBlockCount = (markdown.match(/^```/gm) || []).length / 2;

  const taskChecked = (markdown.match(/^[-*+]\s+\[[xX]\]/gm) || []).length;
  const taskUnchecked = (markdown.match(/^[-*+]\s+\[\s\]/gm) || []).length;

  // Approx reading time: 200 words per minute
  const readingTimeMinutes = Math.max(1, Math.ceil(wordCount / 200));

  return {
    codeUnits,
    codePoints,
    utf8Bytes,
    lineCount,
    wordCount,
    characterCountNoSpaces,
    paragraphCount,
    headingCount,
    linkCount,
    imageCount,
    tableCount,
    codeBlockCount: Math.floor(codeBlockCount),
    taskCount: {
      total: taskChecked + taskUnchecked,
      completed: taskChecked,
      pending: taskUnchecked,
    },
    readingTimeMinutes: wordCount === 0 ? 0 : readingTimeMinutes,
  };
}

// ==========================================
// 5. STANDALONE SAFE HTML EXPORT
// ==========================================

export function generateStandaloneHtmlDocument(renderedHtml: string, documentTitle = 'Markdown Document'): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(documentTitle)}</title>
  <style>
    :root {
      --bg: #ffffff;
      --text: #171717;
      --code-bg: #f4f4f5;
      --border: #e4e4e7;
      --accent: #2563eb;
    }
    @media (prefers-color-scheme: dark) {
      :root {
        --bg: #18181b;
        --text: #f4f4f5;
        --code-bg: #27272a;
        --border: #3f3f46;
        --accent: #60a5fa;
      }
    }
    body {
      max-width: 820px;
      margin: 40px auto;
      padding: 0 20px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.65;
      color: var(--text);
      background-color: var(--bg);
    }
    h1, h2, h3, h4, h5, h6 { color: var(--text); line-height: 1.25; margin-top: 1.5em; margin-bottom: 0.5em; }
    h1 { border-bottom: 1px solid var(--border); padding-bottom: 0.3em; font-size: 2em; }
    a { color: var(--accent); text-decoration: underline; }
    code { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; background: var(--code-bg); padding: 0.2em 0.4em; border-radius: 4px; font-size: 0.9em; }
    pre { background: #09090b; color: #fafafa; padding: 16px; border-radius: 8px; overflow-x: auto; }
    pre code { background: transparent; color: inherit; padding: 0; }
    blockquote { border-left: 4px solid var(--accent); padding-left: 16px; margin-left: 0; color: #71717a; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { border: 1px solid var(--border); padding: 8px 12px; text-align: left; }
    th { background: var(--code-bg); }
    img { max-width: 100%; height: auto; border-radius: 8px; }
    hr { border: none; border-top: 1px solid var(--border); margin: 30px 0; }
  </style>
</head>
<body>
${renderedHtml}
</body>
</html>`;
}

// ==========================================
// 6. EDITOR TOOLBAR SYNTAX INSERTERS
// ==========================================

export function insertMarkdownSyntax(
  currentText: string,
  selectionStart: number,
  selectionEnd: number,
  action: MarkdownSyntaxAction
): { newText: string; newSelectionStart: number; newSelectionEnd: number } {
  const selectedText = currentText.substring(selectionStart, selectionEnd);
  const beforeText = currentText.substring(0, selectionStart);
  const afterText = currentText.substring(selectionEnd);

  let inserted = '';
  let cursorOffsetStart = 0;
  let cursorOffsetEnd = 0;

  switch (action) {
    case 'bold':
      inserted = `**${selectedText || 'bold text'}**`;
      cursorOffsetStart = selectedText ? selectionStart + 2 : selectionStart + 2;
      cursorOffsetEnd = selectedText ? selectionEnd + 2 : selectionStart + 11;
      break;

    case 'italic':
      inserted = `*${selectedText || 'italic text'}*`;
      cursorOffsetStart = selectedText ? selectionStart + 1 : selectionStart + 1;
      cursorOffsetEnd = selectedText ? selectionEnd + 1 : selectionStart + 12;
      break;

    case 'strikethrough':
      inserted = `~~${selectedText || 'strikethrough text'}~~`;
      cursorOffsetStart = selectedText ? selectionStart + 2 : selectionStart + 2;
      cursorOffsetEnd = selectedText ? selectionEnd + 2 : selectionStart + 20;
      break;

    case 'h1':
      inserted = `# ${selectedText || 'Heading 1'}\n`;
      cursorOffsetStart = selectionStart + 2;
      cursorOffsetEnd = selectionStart + 2 + (selectedText.length || 9);
      break;

    case 'h2':
      inserted = `## ${selectedText || 'Heading 2'}\n`;
      cursorOffsetStart = selectionStart + 3;
      cursorOffsetEnd = selectionStart + 3 + (selectedText.length || 9);
      break;

    case 'h3':
      inserted = `### ${selectedText || 'Heading 3'}\n`;
      cursorOffsetStart = selectionStart + 4;
      cursorOffsetEnd = selectionStart + 4 + (selectedText.length || 9);
      break;

    case 'h4':
      inserted = `#### ${selectedText || 'Heading 4'}\n`;
      cursorOffsetStart = selectionStart + 5;
      cursorOffsetEnd = selectionStart + 5 + (selectedText.length || 9);
      break;

    case 'quote':
      inserted = `> ${selectedText || 'Blockquote message'}\n`;
      cursorOffsetStart = selectionStart + 2;
      cursorOffsetEnd = selectionStart + 2 + (selectedText.length || 18);
      break;

    case 'inline-code':
      inserted = `\`${selectedText || 'code'}\``;
      cursorOffsetStart = selectionStart + 1;
      cursorOffsetEnd = selectionStart + 1 + (selectedText.length || 4);
      break;

    case 'code-block':
      inserted = `\`\`\`typescript\n${selectedText || '// Write code here\nconsole.log("Hello, world!");'}\n\`\`\`\n`;
      cursorOffsetStart = selectionStart + 14;
      cursorOffsetEnd = selectionStart + 14 + (selectedText.length || 49);
      break;

    case 'link':
      inserted = `[${selectedText || 'Link Title'}](https://example.com)`;
      cursorOffsetStart = selectedText ? selectionStart + selectedText.length + 3 : selectionStart + 1;
      cursorOffsetEnd = selectedText ? selectionStart + selectedText.length + 22 : selectionStart + 11;
      break;

    case 'image':
      inserted = `![${selectedText || 'Image description'}](https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600)`;
      cursorOffsetStart = selectionStart + 2;
      cursorOffsetEnd = selectionStart + 2 + (selectedText.length || 17);
      break;

    case 'bullet-list':
      inserted = `- ${selectedText || 'List item 1'}\n- List item 2\n- List item 3\n`;
      cursorOffsetStart = selectionStart + 2;
      cursorOffsetEnd = selectionStart + 2 + (selectedText.length || 11);
      break;

    case 'numbered-list':
      inserted = `1. ${selectedText || 'First item'}\n2. Second item\n3. Third item\n`;
      cursorOffsetStart = selectionStart + 3;
      cursorOffsetEnd = selectionStart + 3 + (selectedText.length || 10);
      break;

    case 'task-list':
      inserted = `- [ ] ${selectedText || 'Pending task item'}\n- [x] Completed task item\n`;
      cursorOffsetStart = selectionStart + 6;
      cursorOffsetEnd = selectionStart + 6 + (selectedText.length || 17);
      break;

    case 'table':
      inserted = `| Feature | Status | Description |\n| :--- | :---: | ---: |\n| Fast Rendering | ✅ | Client-side in-memory compilation |\n| GFM Tables | ✅ | Column alignment support |\n| Security | 🛡️ | Rigorous XSS and protocol sanitization |\n`;
      cursorOffsetStart = selectionStart;
      cursorOffsetEnd = selectionStart + inserted.length;
      break;

    case 'hr':
      inserted = `\n---\n`;
      cursorOffsetStart = selectionStart + inserted.length;
      cursorOffsetEnd = selectionStart + inserted.length;
      break;

    default:
      return { newText: currentText, newSelectionStart: selectionStart, newSelectionEnd: selectionEnd };
  }

  const newText = beforeText + inserted + afterText;
  return {
    newText,
    newSelectionStart: cursorOffsetStart,
    newSelectionEnd: cursorOffsetEnd,
  };
}

// ==========================================
// 7. PRESET MARKDOWN TEMPLATES
// ==========================================

export const MARKDOWN_PRESETS: MarkdownPreset[] = [
  {
    id: 'gfm-showcase',
    name: 'GFM Feature Showcase',
    category: 'General',
    description: 'Comprehensive overview of headings, tables, task lists, code blocks, and formatting.',
    content: `# GitHub Flavored Markdown (GFM) Live Showcase

Welcome to the **Zapixal Markdown Live Previewer & Converter**. This tool renders your Markdown locally in browser memory with strict XSS sanitization.

---

## 1. Typography & Text Styling

You can style text with **bold**, *italic*, ***bold and italic***, or ~~strikethrough~~ formatting. You can also use inline \`code snippets\` like \`const isSecure = true;\`.

> **Note on Security:** All HTML input is strictly sanitized, dangerous URI schemes (\`javascript:\`) are blocked, and image tags include \`referrerPolicy="no-referrer"\`.

---

## 2. GFM Task Checklists

- [x] Implement in-browser GFM tokenizer
- [x] Validate column-aligned Markdown tables
- [x] Rigorous client-side XSS prevention
- [ ] Explore custom theme configurations

---

## 3. Formatted Tables with Alignment

| Framework / Tool | Status | Engine Type | Memory Model |
| :--- | :---: | :---: | ---: |
| Zapixal Markdown | ✅ Active | Pure TypeScript AST | Local Browser Memory |
| Regex Tester | ✅ Active | ECMAScript Engine | Zero Transmission |
| JWT Decoder | ✅ Active | Client Web Crypto | Offline / Private |

---

## 4. Fenced Code Blocks

\`\`\`typescript
interface MarkdownConfig {
  sanitize: boolean;
  allowSafeHtml: boolean;
  enableTaskLists: boolean;
}

export function compileMarkdown(source: string, config: MarkdownConfig): string {
  // Safe in-browser compilation
  return renderMarkdownToHtml(source, config);
}
\`\`\`

---

## 5. Safe Links & External Images

* Check out [Zapixal Developer Tools](/tools?category=developer) for more offline utilities.
* External image demonstration:

![Scenic Ocean View](https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=700 "Unsplash Ocean")
`,
  },
  {
    id: 'technical-readme',
    name: 'Technical README.md',
    category: 'Documentation',
    description: 'Standard software repository README template with badges, install guide, and config table.',
    content: `# Core Engine v2.4

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)](#)
[![License: Proprietary](https://img.shields.io/badge/License-Proprietary-blue.svg)](#)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue)](#)

A high-performance, privacy-first library for browser-based data conversions.

---

## ✨ Features

- ⚡ **Sub-millisecond processing** using zero-allocation algorithms.
- 🔒 **Zero network telemetry** — everything executes in local client memory.
- 📦 **Zero runtime dependencies** for minimal bundle weight.

---

## 🚀 Getting Started

### Installation

\`\`\`bash
npm install @zapixal/core-engine
\`\`\`

### Quick Usage

\`\`\`typescript
import { compileMarkdown } from '@zapixal/core-engine';

const html = compileMarkdown('# Hello World', {
  sanitize: true
});
console.log(html);
\`\`\`

---

## ⚙️ Configuration Options

| Option | Type | Default | Description |
| :--- | :---: | :---: | :--- |
| \`sanitize\` | \`boolean\` | \`true\` | Strips dangerous script tags and event handlers |
| \`enableTaskLists\` | \`boolean\` | \`true\` | Enables \`- [ ]\` and \`- [x]\` GFM checkboxes |
| \`openLinksInNewTab\` | \`boolean\` | \`true\` | Adds \`target="_blank"\` and \`rel="noopener"\` |

---

## 📄 License

All rights reserved © [Zapixal](https://zapixal.com)
`,
  },
  {
    id: 'api-documentation',
    name: 'REST / GraphQL API Doc',
    category: 'Developer',
    description: 'Endpoint specifications, request/response payloads, and authentication headers.',
    content: `# API Specification: Authentication & Tokens

Version: \`v1.2.0\` • Base URL: \`https://api.zapixal.com/v1\`

---

## 🔑 POST /v1/auth/token

Exchanges client credentials for a signed JSON Web Token (JWT).

### Request Headers

| Header | Type | Required | Description |
| :--- | :--- | :---: | :--- |
| \`Content-Type\` | \`string\` | Yes | Must be \`application/json\` |
| \`X-Client-Version\` | \`string\` | No | Client application semver |

### Request Payload

\`\`\`json
{
  "client_id": "client_app_9921",
  "client_secret": "sec_sandbox_881923",
  "scope": "read:documents write:export"
}
\`\`\`

### Successful Response (\`200 OK\`)

\`\`\`json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "scope": "read:documents write:export"
}
\`\`\`

### Error Responses

> **401 Unauthorized**: Invalid credentials or expired client secret.
`,
  },
  {
    id: 'changelog',
    name: 'Release Notes & Changelog',
    category: 'Release',
    description: 'Product release notes with categorized features, fixes, and contributor mentions.',
    content: `# Release Notes — Zapixal 2026.8.0

Released on **August 17, 2026**

---

## 🚀 Highlights & New Tools

* **Markdown Live Previewer & Converter**: Real-time GFM rendering, split-pane view, safe HTML export, and Unicode statistics.
* **Regex Tester & String Debugger**: ECMAScript regular expression evaluator with group inspection and line/column metrics.
* **JWT Decoder**: Real-time signature validation, header/payload inspector, and expiry diagnostics.

---

## 🐛 Bug Fixes & Improvements

- [x] Fixed zero-length regex match infinite loops in Web Worker pool.
- [x] Optimized UTF-8 byte calculation for large documents (> 5MB).
- [x] Enhanced accessibility tags across table and code block containers.

---

## 👥 Contributors

Special thanks to all developers and security auditors who contributed to this release!
`,
  },
];
