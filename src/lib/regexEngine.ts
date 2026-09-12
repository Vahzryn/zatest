/**
 * Zapixal - High-Performance Client-Side Regex Engine & String Diagnostics
 * Pure in-memory deterministic regex testing, capture group extraction, and Unicode string metrics.
 */

export interface RegexFlag {
  char: string;
  name: string;
  description: string;
  supported: boolean;
}

export interface RegexCaptureGroup {
  index: number;
  name: string | null;
  value: string;
  start: number;
  end: number;
}

export interface RegexMatchItem {
  matchIndex: number;
  text: string;
  index: number;
  endIndex: number;
  length: number;
  line: number;
  column: number;
  groups: RegexCaptureGroup[];
}

export interface StringDiagnostics {
  codeUnits: number;
  codePoints: number;
  utf8Bytes: number;
  lineCount: number;
  wordCount: number;
  whitespaceCount: number;
  digitCount: number;
  letterCount: number;
  specialCharCount: number;
  isEmpty: boolean;
  isBlank: boolean;
  lineEndings: {
    lfCount: number;
    crlfCount: number;
    crCount: number;
    dominant: 'LF' | 'CRLF' | 'CR' | 'Mixed' | 'None';
  };
  whitespaceDetails: {
    leadingCount: number;
    leadingText: string;
    trailingCount: number;
    trailingText: string;
  };
}

export interface RegexAnalysisResult {
  valid: boolean;
  pattern: string;
  flags: string;
  error: string | null;
  errorOffset: number | null;
  matches: RegexMatchItem[];
  matchCount: number;
  executionTimeMs: number;
  truncated: boolean;
  diagnostics: StringDiagnostics;
}

export interface HighlightSegment {
  text: string;
  isMatch: boolean;
  matchIndex?: number;
  groupIndex?: number;
}

export interface RegexPreset {
  id: string;
  name: string;
  category: string;
  pattern: string;
  flags: string;
  sampleText: string;
  replacementPattern?: string;
  description: string;
  disclaimer: string;
}

/**
 * Check browser support for regex flags (such as 'd' indices flag)
 */
export function getSupportedFlags(): RegexFlag[] {
  const flagsList = [
    { char: 'g', name: 'Global', description: 'Find all matches rather than stopping after the first match' },
    { char: 'i', name: 'Ignore Case', description: 'Case-insensitive matching (treat upper and lower case equally)' },
    { char: 'm', name: 'Multiline', description: '^ and $ match the start/end of each individual line' },
    { char: 's', name: 'DotAll', description: '. matches any character including newline characters' },
    { char: 'u', name: 'Unicode', description: 'Enable full Unicode code point support and UTF-16 surrogate pairs' },
    { char: 'y', name: 'Sticky', description: 'Matches only from the index indicated by the lastIndex property' },
    { char: 'd', name: 'Indices', description: 'Generate start/end match and group index positions (hasIndices)' }
  ];

  return flagsList.map((f) => {
    let supported = true;
    try {
      new RegExp('test', f.char);
    } catch {
      supported = false;
    }
    return { ...f, supported };
  });
}

/**
 * Calculate deep Unicode & structural string diagnostics
 */
export function calculateStringDiagnostics(text: string): StringDiagnostics {
  const codeUnits = text.length;
  
  // Unicode code points count (handles astral plane surrogate pairs like emojis 🚀)
  let codePoints = 0;
  for (const _ of text) {
    codePoints++;
  }

  // UTF-8 byte calculation (handles multi-byte sequences deterministically)
  let utf8Bytes = 0;
  if (typeof TextEncoder !== 'undefined') {
    utf8Bytes = new TextEncoder().encode(text).length;
  } else {
    // Fallback for non-browser / mock contexts
    for (let i = 0; i < text.length; i++) {
      const code = text.charCodeAt(i);
      if (code <= 0x7f) utf8Bytes += 1;
      else if (code <= 0x7ff) utf8Bytes += 2;
      else if (code >= 0xd800 && code <= 0xdbff) {
        // High surrogate
        utf8Bytes += 4;
        i++; // skip low surrogate
      } else {
        utf8Bytes += 3;
      }
    }
  }

  const isEmpty = text.length === 0;
  const isBlank = text.trim().length === 0;

  // Line endings
  let crlfCount = 0;
  let lfCount = 0;
  let crCount = 0;

  for (let i = 0; i < text.length; i++) {
    if (text[i] === '\r') {
      if (i + 1 < text.length && text[i + 1] === '\n') {
        crlfCount++;
        i++; // Skip LF in CRLF
      } else {
        crCount++;
      }
    } else if (text[i] === '\n') {
      lfCount++;
    }
  }

  const totalNewlines = crlfCount + lfCount + crCount;
  const lineCount = isEmpty ? 0 : totalNewlines + 1;

  let dominant: 'LF' | 'CRLF' | 'CR' | 'Mixed' | 'None' = 'None';
  if (totalNewlines === 0) {
    dominant = 'None';
  } else if (crlfCount > 0 && lfCount === 0 && crCount === 0) {
    dominant = 'CRLF';
  } else if (lfCount > 0 && crlfCount === 0 && crCount === 0) {
    dominant = 'LF';
  } else if (crCount > 0 && crlfCount === 0 && lfCount === 0) {
    dominant = 'CR';
  } else {
    dominant = 'Mixed';
  }

  // Character categories
  let whitespaceCount = 0;
  let digitCount = 0;
  let letterCount = 0;
  let specialCharCount = 0;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (/\s/.test(ch)) {
      whitespaceCount++;
    } else if (/[0-9]/.test(ch)) {
      digitCount++;
    } else if (/[a-zA-Z]/.test(ch)) {
      letterCount++;
    } else {
      specialCharCount++;
    }
  }

  // Word count (Unicode aware word matching)
  let wordCount = 0;
  if (!isBlank) {
    const words = text.match(/\S+/g);
    wordCount = words ? words.length : 0;
  }

  // Leading & trailing whitespace
  const leadingMatch = text.match(/^\s+/);
  const leadingCount = leadingMatch ? leadingMatch[0].length : 0;
  const leadingText = leadingMatch ? leadingMatch[0] : '';

  const trailingMatch = text.match(/\s+$/);
  const trailingCount = trailingMatch ? trailingMatch[0].length : 0;
  const trailingText = trailingMatch ? trailingMatch[0] : '';

  return {
    codeUnits,
    codePoints,
    utf8Bytes,
    lineCount,
    wordCount,
    whitespaceCount,
    digitCount,
    letterCount,
    specialCharCount,
    isEmpty,
    isBlank,
    lineEndings: {
      lfCount,
      crlfCount,
      crCount,
      dominant
    },
    whitespaceDetails: {
      leadingCount,
      leadingText,
      trailingCount,
      trailingText
    }
  };
}

/**
 * Calculate Line and 1-based Column for an index position in the test string
 */
export function getLineAndColumn(text: string, index: number): { line: number; column: number } {
  let line = 1;
  let lastLineStart = 0;

  for (let i = 0; i < index && i < text.length; i++) {
    if (text[i] === '\n') {
      line++;
      lastLineStart = i + 1;
    } else if (text[i] === '\r') {
      if (i + 1 < text.length && text[i + 1] === '\n') {
        // CRLF - let \n increment
      } else {
        line++;
        lastLineStart = i + 1;
      }
    }
  }

  const column = index - lastLineStart + 1;
  return { line, column };
}

/**
 * Clean & validate flags against supported browser features
 */
export function sanitizeFlags(flags: string): string {
  // Remove duplicates and sort standardly
  const unique = Array.from(new Set(flags.replace(/[^gimsuy d]/g, '').split(''))).sort().join('');
  return unique.replace(/\s+/g, '');
}

/**
 * Compile and run regular expression matching with safety loops and performance monitoring
 */
export function analyzeRegex(pattern: string, flags: string, testString: string, maxMatches = 5000): RegexAnalysisResult {
  const startTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
  const diagnostics = calculateStringDiagnostics(testString);

  if (!pattern && pattern !== '') {
    return {
      valid: true,
      pattern: '',
      flags,
      error: null,
      errorOffset: null,
      matches: [],
      matchCount: 0,
      executionTimeMs: 0,
      truncated: false,
      diagnostics
    };
  }

  // If pattern is empty, no matches
  if (pattern === '') {
    return {
      valid: true,
      pattern: '',
      flags,
      error: null,
      errorOffset: null,
      matches: [],
      matchCount: 0,
      executionTimeMs: 0,
      truncated: false,
      diagnostics
    };
  }

  let regex: RegExp;
  try {
    regex = new RegExp(pattern, flags);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    // Attempt to extract position if browser exposes it
    let offset: number | null = null;
    const posMatch = errorMsg.match(/position (\d+)|offset (\d+)|column (\d+)/i);
    if (posMatch) {
      const parsed = parseInt(posMatch[1] || posMatch[2] || posMatch[3], 10);
      if (!isNaN(parsed)) offset = parsed;
    }

    const endTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
    return {
      valid: false,
      pattern,
      flags,
      error: errorMsg,
      errorOffset: offset,
      matches: [],
      matchCount: 0,
      executionTimeMs: Number((endTime - startTime).toFixed(2)),
      truncated: false,
      diagnostics
    };
  }

  const matches: RegexMatchItem[] = [];
  let truncated = false;
  const isGlobal = flags.includes('g') || flags.includes('y');

  try {
    if (!isGlobal) {
      const match = regex.exec(testString);
      if (match && match.index !== undefined) {
        const { line, column } = getLineAndColumn(testString, match.index);
        const matchLength = match[0].length;
        const endIndex = match.index + matchLength;

        const groups: RegexCaptureGroup[] = [];
        // Capture groups (1-indexed)
        for (let g = 1; g < match.length; g++) {
          const val = match[g];
          groups.push({
            index: g,
            name: null,
            value: val !== undefined ? val : '',
            start: -1,
            end: -1
          });
        }

        // Named groups if present
        const namedGroups = match.groups;
        if (namedGroups) {
          Object.keys(namedGroups).forEach((name) => {
            const val = namedGroups[name];
            groups.push({
              index: -1,
              name,
              value: val !== undefined ? val : '',
              start: -1,
              end: -1
            });
          });
        }

        matches.push({
          matchIndex: 0,
          text: match[0],
          index: match.index,
          endIndex,
          length: matchLength,
          line,
          column,
          groups
        });
      }
    } else {
      let matchCount = 0;
      let match: RegExpExecArray | null = null;
      let prevLastIndex = -1;

      // Safe iteration loop preventing zero-length infinite loops
      while ((match = regex.exec(testString)) !== null) {
        matchCount++;

        const matchIdx = match.index;
        const matchText = match[0];
        const matchLength = matchText.length;
        const endIndex = matchIdx + matchLength;
        const { line, column } = getLineAndColumn(testString, matchIdx);

        const groups: RegexCaptureGroup[] = [];
        for (let g = 1; g < match.length; g++) {
          const val = match[g];
          groups.push({
            index: g,
            name: null,
            value: val !== undefined ? val : '',
            start: -1,
            end: -1
          });
        }

        const currentNamedGroups = match.groups;
        if (currentNamedGroups) {
          Object.keys(currentNamedGroups).forEach((name) => {
            const val = currentNamedGroups[name];
            groups.push({
              index: -1,
              name,
              value: val !== undefined ? val : '',
              start: -1,
              end: -1
            });
          });
        }

        matches.push({
          matchIndex: matchCount - 1,
          text: matchText,
          index: matchIdx,
          endIndex,
          length: matchLength,
          line,
          column,
          groups
        });

        // Safeguard 1: Handle zero-length matches (e.g. ^, \b, or a*)
        if (matchLength === 0) {
          if (regex.lastIndex === matchIdx) {
            regex.lastIndex++;
          }
        }

        // Safeguard 2: Detect stuck lastIndex
        if (regex.lastIndex === prevLastIndex) {
          regex.lastIndex++;
        }
        prevLastIndex = regex.lastIndex;

        // Safeguard 3: Limit max matches to avoid freezing the browser on unbounded loops
        if (matchCount >= maxMatches) {
          truncated = true;
          break;
        }

        // If lastIndex exceeded string length, stop
        if (regex.lastIndex > testString.length) {
          break;
        }
      }
    }
  } catch (executionErr: unknown) {
    const errorMsg = executionErr instanceof Error ? executionErr.message : String(executionErr);
    const endTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
    return {
      valid: false,
      pattern,
      flags,
      error: `Execution Error: ${errorMsg}`,
      errorOffset: null,
      matches: [],
      matchCount: 0,
      executionTimeMs: Number((endTime - startTime).toFixed(2)),
      truncated: false,
      diagnostics
    };
  }

  const endTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
  const executionTimeMs = Number((endTime - startTime).toFixed(2));

  return {
    valid: true,
    pattern,
    flags,
    error: null,
    errorOffset: null,
    matches,
    matchCount: matches.length,
    executionTimeMs,
    truncated,
    diagnostics
  };
}

/**
 * Generate safe non-overlapping text segments for highlight rendering in React
 */
export function buildHighlightSegments(text: string, matches: RegexMatchItem[]): HighlightSegment[] {
  if (!text) return [];
  if (!matches || matches.length === 0) {
    return [{ text, isMatch: false }];
  }

  const segments: HighlightSegment[] = [];
  let currentIndex = 0;

  for (let i = 0; i < matches.length; i++) {
    const m = matches[i];
    
    // Ignore matches that start before current pointer (e.g., overlapping zero-length matches)
    if (m.index < currentIndex && m.endIndex <= currentIndex) {
      continue;
    }

    const matchStart = Math.max(currentIndex, m.index);
    const matchEnd = Math.max(matchStart, m.endIndex);

    // Text prior to match
    if (matchStart > currentIndex) {
      segments.push({
        text: text.slice(currentIndex, matchStart),
        isMatch: false
      });
    }

    // The match itself
    if (matchEnd > matchStart) {
      segments.push({
        text: text.slice(matchStart, matchEnd),
        isMatch: true,
        matchIndex: m.matchIndex
      });
      currentIndex = matchEnd;
    } else if (matchEnd === matchStart && matchLengthZero(m)) {
      // Zero-length match visual anchor representation
      segments.push({
        text: '∅',
        isMatch: true,
        matchIndex: m.matchIndex
      });
      currentIndex = matchStart;
    }
  }

  // Trailing text
  if (currentIndex < text.length) {
    segments.push({
      text: text.slice(currentIndex),
      isMatch: false
    });
  }

  return segments;
}

function matchLengthZero(m: RegexMatchItem): boolean {
  return m.length === 0;
}

/**
 * Safely execute RegExp replace using standard JavaScript replacement patterns ($1, $&, $<name>, etc.)
 */
export function executeReplacement(
  testString: string,
  pattern: string,
  flags: string,
  replacement: string
): { success: boolean; result: string; error: string | null } {
  if (!pattern) {
    return { success: true, result: testString, error: null };
  }

  try {
    const regex = new RegExp(pattern, flags);
    const result = testString.replace(regex, replacement);
    return { success: true, result, error: null };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return { success: false, result: testString, error: errorMsg };
  }
}

/**
 * Extract matched segments or capture groups into delimited list
 */
export function extractMatches(
  matches: RegexMatchItem[],
  mode: 'full' | 'group1' | 'group2' | 'named' | 'json',
  namedGroupName = '',
  delimiter = '\n'
): string {
  if (!matches || matches.length === 0) return '';

  if (mode === 'json') {
    return JSON.stringify(
      matches.map((m) => ({
        match: m.text,
        index: m.index,
        line: m.line,
        column: m.column,
        groups: m.groups.map((g) => ({
          name: g.name,
          index: g.index,
          value: g.value
        }))
      })),
      null,
      2
    );
  }

  const items: string[] = [];

  for (const m of matches) {
    if (mode === 'full') {
      items.push(m.text);
    } else if (mode === 'group1') {
      const g1 = m.groups.find((g) => g.index === 1);
      items.push(g1 ? g1.value : '');
    } else if (mode === 'group2') {
      const g2 = m.groups.find((g) => g.index === 2);
      items.push(g2 ? g2.value : '');
    } else if (mode === 'named' && namedGroupName) {
      const ng = m.groups.find((g) => g.name === namedGroupName);
      items.push(ng ? ng.value : '');
    }
  }

  return items.join(delimiter);
}

/**
 * Built-in practical examples with educational disclaimers
 */
export const REGEX_PRESETS: RegexPreset[] = [
  {
    id: 'email',
    name: 'Email Pattern',
    category: 'Validation & Extraction',
    pattern: '(?<user>[a-zA-Z0-9._%+-]+)@(?<domain>[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,})',
    flags: 'g',
    sampleText: `Contact team at support@zapixal.com or alex.morgan+dev@example.co.uk.\nBilling inquiries: billing@company.org\nInvalid examples: user@, @domain.com, plainaddress`,
    replacementPattern: '[$<user> on $<domain>]',
    description: 'Matches standard email structures with user and domain named capturing groups.',
    disclaimer: 'Note: Standard-compliant email addresses (RFC 5322) are notoriously complex; this regex covers practical everyday web formats.'
  },
  {
    id: 'url',
    name: 'HTTP/HTTPS URL',
    category: 'Web & URLs',
    pattern: 'https?:\\/\\/(?<host>[a-zA-Z0-9.-]+)(?::(?<port>\\d+))?(?<path>\\/[^?\\s#]*)?(?:\\?(?<query>[^#\\s]*))?',
    flags: 'g',
    sampleText: `Documentation: https://zapixal.com/docs/api?version=2&format=json\nDev Server: http://localhost:3000/tools\nCDN Asset: https://assets.example.cdn.net/images/hero.webp`,
    replacementPattern: 'https://$<host>$<path>',
    description: 'Extracts protocol, host, port, path, and query parameters from web links.',
    disclaimer: 'For RFC 3986 complete URI parsing, browser URL object parser is recommended in production code.'
  },
  {
    id: 'ipv4',
    name: 'IPv4 Address',
    category: 'Network & Security',
    pattern: '\\b(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)(?:\\.(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)){3}\\b',
    flags: 'g',
    sampleText: `Gateway: 192.168.1.1\nDNS: 8.8.8.8 and 1.1.1.1\nServer: 10.0.0.254\nInvalid bounds: 256.100.0.1, 192.168.1.999`,
    replacementPattern: '[IP: $&]',
    description: 'Validates 4 octets within range 0-255 with bounded word boundaries.',
    disclaimer: 'IPv4 only. Does not match IPv6 addresses or CIDR notation.'
  },
  {
    id: 'date-iso',
    name: 'ISO Date (YYYY-MM-DD)',
    category: 'Dates & Times',
    pattern: '(?<year>\\d{4})-(?<month>0[1-9]|1[0-2])-(?<day>0[1-9]|[12]\\d|3[01])',
    flags: 'g',
    sampleText: `Release Date: 2026-08-17\nQuarter Ends: 2026-09-30\nHistorical event: 1969-07-20\nInvalid: 2026-13-45`,
    replacementPattern: '$<day>/$<month>/$<year>',
    description: 'Extracts year, month, and day components and allows date format transformation.',
    disclaimer: 'Regex validates lexical structure but does not check calendar leap year validity (e.g. Feb 29).'
  },
  {
    id: 'hex-color',
    name: 'Hex Color Codes',
    category: 'Design & Frontend',
    pattern: '#(?:(?<alpha8>[0-9a-fA-F]{8})|(?<hex6>[0-9a-fA-F]{6})|(?<hex3>[0-9a-fA-F]{3}))\\b',
    flags: 'gi',
    sampleText: `Brand palette:\nPrimary: #2563eb\nDark: #1e293b\nAccent: #38bdf880 (with alpha)\nShorthand: #fff, #000, #f06`,
    replacementPattern: 'rgb($&)',
    description: 'Matches 3, 6, and 8-digit hexadecimal color values commonly used in CSS and design tokens.',
    disclaimer: 'Hex codes only; does not match hsl() or rgb() CSS expressions.'
  },
  {
    id: 'hashtags',
    name: 'Hashtag & Mentions',
    category: 'Social & Text',
    pattern: '(?<type>[#@])(?<tag>[a-zA-Z0-9_]+)',
    flags: 'g',
    sampleText: `Check out #Zapixal release v2.0! Follow @zapixal_app for updates on #TypeScript #WebAssembly and #PrivacyFirst tools.`,
    replacementPattern: '<a href="/tag/$<tag>">$&</a>',
    description: 'Extracts social hashtags (#) and user mentions (@) with tag name capture.',
    disclaimer: 'Supports alphanumeric and underscore characters.'
  },
  {
    id: 'log-line',
    name: 'Server Log Parser',
    category: 'DevOps & Logs',
    pattern: '^\\[(?<timestamp>[^\\]]+)\\] \\[(?<level>DEBUG|INFO|WARN|ERROR|FATAL)\\] (?<message>.*)$',
    flags: 'gm',
    sampleText: `[2026-08-17T07:00:25Z] [INFO] Server started on port 3000\n[2026-08-17T07:01:10Z] [WARN] High memory pressure detected in worker thread\n[2026-08-17T07:02:45Z] [ERROR] Failed to fetch upstream resource: Connection timeout\n[2026-08-17T07:03:00Z] [INFO] Automatic cache compaction completed`,
    replacementPattern: 'LEVEL: $<level> | MSG: $<message>',
    description: 'Parses structured server log entries into timestamp, log level, and message groups.',
    disclaimer: 'Configured for multiline logs starting with bracketed timestamps.'
  },
  {
    id: 'whitespace-normalize',
    name: 'Whitespace Normalizer',
    category: 'Formatting',
    pattern: '[ \\t]+',
    flags: 'g',
    sampleText: `This    sentence   has   excessive     spaces \t  and \t\ttabs between     words.`,
    replacementPattern: ' ',
    description: 'Finds clusters of multiple consecutive space and tab characters.',
    disclaimer: 'Matches horizontal spaces while preserving line breaks.'
  }
];

export const REGEX_CHEAT_SHEET = [
  {
    category: 'Character Classes',
    items: [
      { code: '.', desc: 'Any character except newline (unless s flag is set)' },
      { code: '\\d', desc: 'Any digit [0-9]' },
      { code: '\\D', desc: 'Any non-digit [^0-9]' },
      { code: '\\w', desc: 'Any word character [a-zA-Z0-9_]' },
      { code: '\\W', desc: 'Any non-word character' },
      { code: '\\s', desc: 'Any whitespace character (space, tab, newline)' },
      { code: '\\S', desc: 'Any non-whitespace character' },
      { code: '[abc]', desc: 'Any single character in set (a, b, or c)' },
      { code: '[^abc]', desc: 'Any single character NOT in set' },
      { code: '[a-z]', desc: 'Any character in range a through z' }
    ]
  },
  {
    category: 'Anchors & Boundaries',
    items: [
      { code: '^', desc: 'Start of string (or start of line in multiline mode)' },
      { code: '$', desc: 'End of string (or end of line in multiline mode)' },
      { code: '\\b', desc: 'Word boundary position' },
      { code: '\\B', desc: 'Non-word boundary position' }
    ]
  },
  {
    category: 'Quantifiers',
    items: [
      { code: '*', desc: '0 or more times (greedy)' },
      { code: '+', desc: '1 or more times (greedy)' },
      { code: '?', desc: '0 or 1 time (optional / greedy)' },
      { code: '*?', desc: '0 or more times (lazy / non-greedy)' },
      { code: '+?', desc: '1 or more times (lazy / non-greedy)' },
      { code: '{n}', desc: 'Exactly n times' },
      { code: '{n,}', desc: 'n or more times' },
      { code: '{n,m}', desc: 'Between n and m times' }
    ]
  },
  {
    category: 'Groups & Lookarounds',
    items: [
      { code: '(abc)', desc: 'Capturing group' },
      { code: '(?<name>abc)', desc: 'Named capturing group' },
      { code: '(?:abc)', desc: 'Non-capturing group' },
      { code: '(?=abc)', desc: 'Positive lookahead assertion' },
      { code: '(?!abc)', desc: 'Negative lookahead assertion' },
      { code: '(?<=abc)', desc: 'Positive lookbehind assertion' },
      { code: '(?<!abc)', desc: 'Negative lookbehind assertion' }
    ]
  },
  {
    category: 'Replacement Tokens',
    items: [
      { code: '$&', desc: 'Inserts the entire matched substring' },
      { code: '$1, $2', desc: 'Inserts the 1st, 2nd, etc. numbered capture group' },
      { code: '$<name>', desc: 'Inserts the named capture group' },
      { code: '$`', desc: 'Inserts the portion of string preceding the match' },
      { code: "$'", desc: 'Inserts the portion of string following the match' },
      { code: '$$', desc: 'Inserts a literal "$" character' }
    ]
  }
];
