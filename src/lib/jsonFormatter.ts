/**
 * Zapixal Client-Side JSON Formatter & Validator Engine
 * 100% In-Browser Memory Processing with Zero Network Transmission
 */

export interface JsonSyntaxErrorDetail {
  message: string;
  line: number;
  column: number;
  offset: number;
  snippet: string;
  pointer: string;
}

export interface JsonParseResult {
  valid: boolean;
  data: any | null;
  error: JsonSyntaxErrorDetail | null;
  stats?: JsonStats;
}

export interface JsonStats {
  charCount: number;
  byteSize: number;
  lineCount: number;
  depth: number;
  totalKeys: number;
  totalValues: number;
  objectCount: number;
  arrayCount: number;
  rootType: 'object' | 'array' | 'string' | 'number' | 'boolean' | 'null' | 'empty';
}

export type IndentOption = '2' | '4' | '3' | 'tab' | 'minified';

/**
 * Calculates byte size of a UTF-8 string accurately.
 */
export function getUtf8ByteLength(str: string): number {
  if (typeof TextEncoder !== 'undefined') {
    return new TextEncoder().encode(str).length;
  }
  return unescape(encodeURIComponent(str)).length;
}

/**
 * Computes deep structural statistics for a parsed JSON value.
 */
export function calculateJsonStats(data: any, rawString: string): JsonStats {
  const charCount = rawString.length;
  const byteSize = getUtf8ByteLength(rawString);
  const lineCount = rawString ? rawString.split(/\r\n|\r|\n/).length : 0;

  if (data === null) {
    return {
      charCount,
      byteSize,
      lineCount,
      depth: 1,
      totalKeys: 0,
      totalValues: 1,
      objectCount: 0,
      arrayCount: 0,
      rootType: 'null'
    };
  }

  if (typeof data !== 'object') {
    return {
      charCount,
      byteSize,
      lineCount,
      depth: 1,
      totalKeys: 0,
      totalValues: 1,
      objectCount: 0,
      arrayCount: 0,
      rootType: typeof data as any
    };
  }

  let depth = 0;
  let totalKeys = 0;
  let totalValues = 0;
  let objectCount = 0;
  let arrayCount = 0;

  function traverse(node: any, currentDepth: number) {
    if (currentDepth > depth) depth = currentDepth;

    if (node === null || typeof node !== 'object') {
      totalValues++;
      return;
    }

    if (Array.isArray(node)) {
      arrayCount++;
      for (let i = 0; i < node.length; i++) {
        traverse(node[i], currentDepth + 1);
      }
    } else {
      objectCount++;
      const keys = Object.keys(node);
      totalKeys += keys.length;
      for (const key of keys) {
        traverse(node[key], currentDepth + 1);
      }
    }
  }

  traverse(data, 1);

  return {
    charCount,
    byteSize,
    lineCount,
    depth,
    totalKeys,
    totalValues,
    objectCount,
    arrayCount,
    rootType: Array.isArray(data) ? 'array' : 'object'
  };
}

/**
 * Finds exact line and column number from a character offset in text.
 */
export function getLineAndColumn(text: string, offset: number): { line: number; column: number; snippet: string; pointer: string } {
  const safeOffset = Math.max(0, Math.min(offset, text.length));
  const lines = text.substring(0, safeOffset).split(/\r\n|\r|\n/);
  const line = lines.length;
  const column = lines[lines.length - 1].length + 1;

  const allLines = text.split(/\r\n|\r|\n/);
  const targetLineText = allLines[line - 1] || '';
  const snippet = targetLineText.trimEnd();
  const pointerSpaces = ' '.repeat(Math.max(0, column - 1));
  const pointer = `${pointerSpaces}^`;

  return { line, column, snippet, pointer };
}

/**
 * Accurately determines error offset across Node.js, V8, SpiderMonkey, and JavaScriptCore
 */
export function findJsonErrorOffset(input: string, message: string): number {
  const posMatch = message.match(/position\s+(\d+)/i);
  if (posMatch && posMatch[1]) {
    return parseInt(posMatch[1], 10);
  }

  const lineColMatch = message.match(/line\s+(\d+)\s+column\s+(\d+)/i);
  if (lineColMatch && lineColMatch[1] && lineColMatch[2]) {
    const errLine = parseInt(lineColMatch[1], 10);
    const errCol = parseInt(lineColMatch[2], 10);
    const lines = input.split(/\r\n|\r|\n/);
    let calculatedOffset = 0;
    for (let i = 0; i < Math.min(errLine - 1, lines.length); i++) {
      calculatedOffset += lines[i].length + 1;
    }
    calculatedOffset += errCol - 1;
    return calculatedOffset;
  }

  // Fallback: If error contains "Unexpected token <char>"
  const tokenMatch = message.match(/Unexpected token '?(.)'?/i);
  if (tokenMatch && tokenMatch[1]) {
    const char = tokenMatch[1];
    // Find first occurrence of character where JSON is invalid
    let searchIdx = input.indexOf(char);
    while (searchIdx !== -1) {
      // Test prefix validity up to searchIdx
      const prefix = input.substring(0, searchIdx).trim();
      if (prefix.endsWith(':') || prefix.endsWith(',') || prefix.endsWith('{') || prefix.endsWith('[')) {
        return searchIdx;
      }
      searchIdx = input.indexOf(char, searchIdx + 1);
    }
  }

  return 0;
}

/**
 * Parses JSON and locates syntax error with line/column position.
 */
export function validateAndParseJson(input: string): JsonParseResult {
  const trimmed = input.trim();
  if (!trimmed) {
    return {
      valid: false,
      data: null,
      error: {
        message: 'Input is empty. Please enter or paste JSON data.',
        line: 1,
        column: 1,
        offset: 0,
        snippet: '',
        pointer: '^'
      }
    };
  }

  try {
    const data = JSON.parse(input);
    const stats = calculateJsonStats(data, input);
    return {
      valid: true,
      data,
      error: null,
      stats
    };
  } catch (err: any) {
    const message = err.message || 'Invalid JSON syntax';
    const offset = findJsonErrorOffset(input, message);
    const { line, column, snippet, pointer } = getLineAndColumn(input, offset);

    return {
      valid: false,
      data: null,
      error: {
        message,
        line,
        column,
        offset,
        snippet,
        pointer
      }
    };
  }
}

/**
 * Recursively sorts all keys in an object alphabetically.
 */
export function sortJsonKeysAlphabetically(value: any): any {
  if (value === null || typeof value !== 'object') {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map(sortJsonKeysAlphabetically);
  }

  const sortedKeys = Object.keys(value).sort((a, b) => a.localeCompare(b));
  const sortedObj: Record<string, any> = {};

  for (const key of sortedKeys) {
    sortedObj[key] = sortJsonKeysAlphabetically(value[key]);
  }

  return sortedObj;
}

/**
 * Formats JSON with specified indentation or minification.
 */
export function formatJson(
  data: any,
  indent: IndentOption = '2',
  sortKeys: boolean = false
): string {
  const preparedData = sortKeys ? sortJsonKeysAlphabetically(data) : data;

  if (indent === 'minified') {
    return JSON.stringify(preparedData);
  }

  const indentMap: Record<IndentOption, string | number> = {
    '2': 2,
    '4': 4,
    '3': 3,
    'tab': '\t',
    'minified': 0
  };

  const indentValue = indentMap[indent] ?? 2;
  return JSON.stringify(preparedData, null, indentValue);
}

/**
 * Repairs common malformed JSON errors using a stateful tokenizer:
 * - Preserves all strings, URLs (e.g. https://...//...), quotes, and comments inside double quotes
 * - Converts single-quoted strings and keys into valid double-quoted JSON strings with correct escaping
 * - Strips JavaScript comments (// ... and /* ... *\/) outside strings
 * - Quotes unquoted JavaScript object keys (e.g. { name: "Alice", age: 30 })
 * - Removes trailing commas before } and ]
 * - Normalizes undefined and NaN to null
 */
export function repairCommonJsonMistakes(rawInput: string): string {
  if (!rawInput || typeof rawInput !== 'string') return '';

  const len = rawInput.length;
  let i = 0;
  let output = '';

  // Helper to peek next non-whitespace character outside comments
  function peekNextNonWhitespaceChar(startIdx: number): { char: string; index: number } {
    let idx = startIdx;
    while (idx < len) {
      const c = rawInput[idx];
      if (c === ' ' || c === '\t' || c === '\n' || c === '\r') {
        idx++;
        continue;
      }
      if (c === '/' && idx + 1 < len) {
        if (rawInput[idx + 1] === '/') {
          idx += 2;
          while (idx < len && rawInput[idx] !== '\n' && rawInput[idx] !== '\r') {
            idx++;
          }
          continue;
        } else if (rawInput[idx + 1] === '*') {
          idx += 2;
          while (idx + 1 < len && !(rawInput[idx] === '*' && rawInput[idx + 1] === '/')) {
            idx++;
          }
          idx += 2;
          continue;
        }
      }
      return { char: c, index: idx };
    }
    return { char: '', index: len };
  }

  while (i < len) {
    const char = rawInput[i];

    // 1. Single-line comment // ...
    if (char === '/' && i + 1 < len && rawInput[i + 1] === '/') {
      i += 2;
      while (i < len && rawInput[i] !== '\n' && rawInput[i] !== '\r') {
        i++;
      }
      continue;
    }

    // 2. Multi-line comment /* ... */
    if (char === '/' && i + 1 < len && rawInput[i + 1] === '*') {
      i += 2;
      while (i + 1 < len && !(rawInput[i] === '*' && rawInput[i + 1] === '/')) {
        i++;
      }
      i = Math.min(len, i + 2);
      continue;
    }

    // 3. Double-quoted string (preserve EVERYTHING inside verbatim)
    if (char === '"') {
      output += '"';
      i++;
      while (i < len) {
        const c = rawInput[i];
        if (c === '\\') {
          output += c;
          i++;
          if (i < len) {
            output += rawInput[i];
            i++;
          }
        } else if (c === '"') {
          output += '"';
          i++;
          break;
        } else {
          output += c;
          i++;
        }
      }
      continue;
    }

    // 4. Single-quoted string (convert to double quotes, properly escape internal double quotes)
    if (char === "'") {
      output += '"';
      i++;
      while (i < len) {
        const c = rawInput[i];
        if (c === '\\') {
          i++;
          if (i < len) {
            const nextC = rawInput[i];
            if (nextC === "'") {
              output += "'"; // unescape single quote
            } else if (nextC === '"') {
              output += '\\"';
            } else {
              output += '\\' + nextC;
            }
            i++;
          }
        } else if (c === "'") {
          output += '"';
          i++;
          break;
        } else if (c === '"') {
          output += '\\"'; // escape double quotes inside
          i++;
        } else {
          output += c;
          i++;
        }
      }
      continue;
    }

    // 5. Trailing comma check before } or ]
    if (char === ',') {
      const next = peekNextNonWhitespaceChar(i + 1);
      if (next.char === '}' || next.char === ']') {
        // Skip this trailing comma
        i++;
        continue;
      }
      output += ',';
      i++;
      continue;
    }

    // 6. Unquoted object keys (e.g. { foo: 1, _bar123: "val" })
    if (/[a-zA-Z_$]/.test(char)) {
      // Check if this word is followed eventually by a ':'
      let wordEnd = i;
      while (wordEnd < len && /[a-zA-Z0-9_$]/.test(rawInput[wordEnd])) {
        wordEnd++;
      }
      const word = rawInput.substring(i, wordEnd);
      const afterWord = peekNextNonWhitespaceChar(wordEnd);

      if (afterWord.char === ':') {
        // It is an unquoted key! Wrap in double quotes
        output += `"${word}"`;
        i = wordEnd;
        continue;
      } else if (word === 'undefined' || word === 'NaN') {
        output += 'null';
        i = wordEnd;
        continue;
      } else {
        output += word;
        i = wordEnd;
        continue;
      }
    }

    // Default: write character
    output += char;
    i++;
  }

  return output;
}

/**
 * Sample JSON payloads for user testing
 */
export const SAMPLE_JSON_DATA = {
  appName: "Zapixal",
  version: "1.0.0",
  privacyFirst: true,
  offlineSupported: true,
  engineSpecs: {
    runtime: "WebAssembly + Native Browser API",
    maxThreads: 8,
    memorySandbox: "Client RAM Only",
    cloudUploads: false
  },
  supportedCategories: [
    {
      id: "images",
      name: "Image Optimization",
      formats: ["AVIF", "WebP", "PNG", "JPEG", "HEIC", "SVG"],
      lossless: true
    },
    {
      id: "documents",
      name: "PDF & Documents",
      features: ["Merge", "Split", "Extract JPG", "Compress"],
      active: true
    },
    {
      id: "developer",
      name: "Developer Utilities",
      tools: ["Base64 Data URI", "JSON Formatter & Validator", "Color Palette HEX"]
    }
  ],
  telemetry: null
};
