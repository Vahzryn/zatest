/**
 * Zapixal Client-Side CSV ↔ JSON Engine
 * RFC 4180 Compliant Parser & Serializer with Delimiter Detection & Type Inference
 * 100% Client-Side in Local Browser Memory
 */

export type DelimiterType = 'auto' | ',' | ';' | '\t' | '|';

export interface CsvParseOptions {
  delimiter?: DelimiterType;
  hasHeaders?: boolean;
  parseNumbersAndBooleans?: boolean;
  parseNestedJson?: boolean;
  skipEmptyLines?: boolean;
  trimWhitespace?: boolean;
}

export interface JsonToCsvOptions {
  delimiter?: ',' | ';' | '\t' | '|';
  includeHeaders?: boolean;
  nestedFormat?: 'json' | 'flatten';
  sanitizeFormulas?: boolean;
}

export interface CsvStats {
  rowCount: number;
  columnCount: number;
  headers: string[];
  inferredTypes: Record<string, string>;
  inputBytes: number;
}

export interface CsvToJsonResult {
  valid: boolean;
  data: any[] | null;
  jsonString: string;
  error: {
    message: string;
    line?: number;
    column?: number;
    snippet?: string;
  } | null;
  stats: CsvStats | null;
  detectedDelimiter: string;
}

export interface JsonToCsvResult {
  valid: boolean;
  csvString: string;
  rowCount: number;
  columnCount: number;
  headers: string[];
  error: string | null;
}

/**
 * Strips UTF-8 Byte Order Mark (BOM) if present at start of text
 */
export function stripBom(text: string): string {
  if (!text) return '';
  if (text.charCodeAt(0) === 0xfeff) {
    return text.slice(1);
  }
  return text;
}

/**
 * Automatically detects the most probable delimiter in a CSV text
 */
export function detectDelimiter(rawText: string): ',' | ';' | '\t' | '|' {
  const clean = stripBom(rawText);
  if (!clean || clean.trim().length === 0) return ',';

  // Sample the first 10,000 characters
  const sample = clean.slice(0, 10000);
  const candidates: Array<',' | ';' | '\t' | '|'> = [',', ';', '\t', '|'];
  const scores: Record<string, number> = { ',': 0, ';': 0, '\t': 0, '|': 0 };

  for (const delim of candidates) {
    try {
      const parsedRows = parseCsvRows(sample, delim, true, false).slice(0, 20);
      if (parsedRows.length > 0) {
        const colCounts = parsedRows.map(r => r.length);
        const firstCount = colCounts[0];
        if (firstCount > 1) {
          const consistentMatches = colCounts.filter(c => c === firstCount).length;
          const consistencyRatio = consistentMatches / colCounts.length;
          scores[delim] = firstCount * consistencyRatio * 10;
        }
      }
    } catch {
      scores[delim] = 0;
    }
  }

  let bestDelim: ',' | ';' | '\t' | '|' = ',';
  let maxScore = -1;
  for (const delim of candidates) {
    if (scores[delim] > maxScore) {
      maxScore = scores[delim];
      bestDelim = delim;
    }
  }

  return bestDelim;
}

/**
 * Tokenizes a CSV string into a 2D array of strings per RFC 4180
 */
export function parseCsvRows(
  csvText: string,
  delimiter: string,
  skipEmptyLines: boolean = true,
  trimWhitespace: boolean = false
): string[][] {
  const cleanText = stripBom(csvText);
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let inQuotes = false;
  const len = cleanText.length;
  let i = 0;

  while (i < len) {
    const char = cleanText[i];

    if (inQuotes) {
      if (char === '"') {
        // Lookahead for escaped quote ""
        if (i + 1 < len && cleanText[i + 1] === '"') {
          currentField += '"';
          i += 2;
          continue;
        } else {
          // Closing quote
          inQuotes = false;
          i++;
          continue;
        }
      } else {
        currentField += char;
        i++;
        continue;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
        i++;
        continue;
      } else if (char === delimiter) {
        currentRow.push(trimWhitespace ? currentField.trim() : currentField);
        currentField = '';
        i++;
        continue;
      } else if (char === '\r') {
        // Handle \r\n or standalone \r
        if (i + 1 < len && cleanText[i + 1] === '\n') {
          i++;
        }
        currentRow.push(trimWhitespace ? currentField.trim() : currentField);
        currentField = '';
        if (!skipEmptyLines || currentRow.some(f => f.length > 0)) {
          rows.push(currentRow);
        }
        currentRow = [];
        i++;
        continue;
      } else if (char === '\n') {
        currentRow.push(trimWhitespace ? currentField.trim() : currentField);
        currentField = '';
        if (!skipEmptyLines || currentRow.some(f => f.length > 0)) {
          rows.push(currentRow);
        }
        currentRow = [];
        i++;
        continue;
      } else {
        currentField += char;
        i++;
        continue;
      }
    }
  }

  // Push last field and row if any content remains
  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(trimWhitespace ? currentField.trim() : currentField);
    if (!skipEmptyLines || currentRow.some(f => f.length > 0)) {
      rows.push(currentRow);
    }
  }

  return rows;
}

/**
 * Parses raw field values to inferred JavaScript types (number, boolean, null, string, or nested JSON)
 */
export function inferValueType(rawVal: string, parseTypes: boolean, parseNestedJson: boolean = false): any {
  if (!parseTypes) return rawVal;

  const trimmed = rawVal.trim();
  if (trimmed === '') return '';
  const lower = trimmed.toLowerCase();
  if (lower === 'null') return null;
  if (lower === 'true') return true;
  if (lower === 'false') return false;

  // Optional: Parse nested JSON objects or arrays inside cells
  if (parseNestedJson && ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']')))) {
    try {
      return JSON.parse(trimmed);
    } catch {
      // Not valid JSON, continue with standard inference
    }
  }

  // Number test (integers, floats, negative numbers, scientific notation)
  if (/^-?\d+(\.\d+)?([eE][+-]?\d+)?$/.test(trimmed)) {
    // Preserve leading zeros (e.g., zip codes "02138", "00042", "01.20")
    if (trimmed.length > 1 && trimmed.startsWith('0') && !trimmed.startsWith('0.')) {
      return rawVal;
    }
    // Negative leading zeros (e.g. "-001")
    if (trimmed.length > 2 && trimmed.startsWith('-0') && !trimmed.startsWith('-0.')) {
      return rawVal;
    }

    // Protect 64-bit integers from silent precision loss (e.g., Snowflake IDs > Number.MAX_SAFE_INTEGER)
    if (/^-?\d+$/.test(trimmed)) {
      const absLen = trimmed.startsWith('-') ? trimmed.length - 1 : trimmed.length;
      if (absLen >= 16) {
        try {
          const big = BigInt(trimmed);
          if (big > BigInt(Number.MAX_SAFE_INTEGER) || big < BigInt(Number.MIN_SAFE_INTEGER)) {
            return rawVal;
          }
        } catch {
          return rawVal;
        }
      }
    }

    const num = Number(trimmed);
    if (!isNaN(num) && isFinite(num)) {
      return num;
    }
  }

  return rawVal;
}

/**
 * Recursively flattens nested objects and arrays into dot notation
 */
export function flattenObject(obj: any, prefix = ''): Record<string, any> {
  const result: Record<string, any> = {};

  for (const key of Object.keys(obj)) {
    const val = obj[key];
    const newKey = prefix ? `${prefix}.${key}` : key;

    if (val !== null && typeof val === 'object') {
      if (Array.isArray(val)) {
        if (val.length === 0) {
          result[newKey] = '[]';
        } else if (val.every(item => typeof item !== 'object' || item === null)) {
          // Array of primitives
          val.forEach((item, idx) => {
            result[`${newKey}.${idx}`] = item;
          });
        } else {
          // Array of objects
          val.forEach((item, idx) => {
            const nested = flattenObject(item, `${newKey}.${idx}`);
            Object.assign(result, nested);
          });
        }
      } else {
        const nested = flattenObject(val, newKey);
        Object.assign(result, nested);
      }
    } else {
      result[newKey] = val;
    }
  }

  return result;
}

/**
 * Converts CSV text to structured JSON array
 */
export function convertCsvToJson(
  csvText: string,
  options: CsvParseOptions = {},
  indent: '2' | '4' | 'tab' | 'minified' = '2'
): CsvToJsonResult {
  const clean = stripBom(csvText);
  if (!clean || clean.trim().length === 0) {
    return {
      valid: false,
      data: null,
      jsonString: '',
      error: { message: 'Input CSV text is empty.' },
      stats: null,
      detectedDelimiter: ','
    };
  }

  try {
    const activeDelimiter = options.delimiter && options.delimiter !== 'auto'
      ? options.delimiter
      : detectDelimiter(clean);

    const hasHeaders = options.hasHeaders !== false; // default true
    const parseTypes = options.parseNumbersAndBooleans !== false; // default true
    const parseNestedJson = options.parseNestedJson === true;
    const skipEmpty = options.skipEmptyLines !== false; // default true
    const trim = options.trimWhitespace === true;

    const rawRows = parseCsvRows(clean, activeDelimiter, skipEmpty, trim);

    if (rawRows.length === 0) {
      return {
        valid: false,
        data: null,
        jsonString: '',
        error: { message: 'No tabular rows found in CSV input.' },
        stats: null,
        detectedDelimiter: activeDelimiter
      };
    }

    let headers: string[] = [];
    let dataRows: string[][] = [];

    if (hasHeaders) {
      const headerRow = rawRows[0];
      // Normalize headers: trim and handle duplicates
      const seenHeaders = new Set<string>();
      headers = headerRow.map((h, idx) => {
        const cleanName = h.trim() || `column_${idx + 1}`;
        let uniqueName = cleanName;
        let counter = 2;
        while (seenHeaders.has(uniqueName)) {
          uniqueName = `${cleanName}_${counter}`;
          counter++;
        }
        seenHeaders.add(uniqueName);
        return uniqueName;
      });
      dataRows = rawRows.slice(1);
    } else {
      // Generate default column names (col_1, col_2...)
      const maxCols = Math.max(...rawRows.map(r => r.length), 1);
      for (let c = 1; c <= maxCols; c++) {
        headers.push(`col_${c}`);
      }
      dataRows = rawRows;
    }

    const inferredTypes: Record<string, string> = {};
    headers.forEach(h => { inferredTypes[h] = 'string'; });

    const resultObjects: Record<string, any>[] = [];

    for (let rIdx = 0; rIdx < dataRows.length; rIdx++) {
      const row = dataRows[rIdx];
      const obj: Record<string, any> = {};

      for (let cIdx = 0; cIdx < headers.length; cIdx++) {
        const header = headers[cIdx];
        const rawCell = row[cIdx] !== undefined ? row[cIdx] : '';
        const parsedVal = inferValueType(rawCell, parseTypes, parseNestedJson);
        obj[header] = parsedVal;

        // Record type for stats
        if (parsedVal !== null && parsedVal !== '') {
          const typeName = typeof parsedVal;
          if (inferredTypes[header] === 'string' && typeName !== 'string') {
            inferredTypes[header] = typeName;
          }
        }
      }
      resultObjects.push(obj);
    }

    // Format JSON output
    let jsonString = '';
    if (indent === 'minified') {
      jsonString = JSON.stringify(resultObjects);
    } else if (indent === '4') {
      jsonString = JSON.stringify(resultObjects, null, 4);
    } else if (indent === 'tab') {
      jsonString = JSON.stringify(resultObjects, null, '\t');
    } else {
      jsonString = JSON.stringify(resultObjects, null, 2);
    }

    const stats: CsvStats = {
      rowCount: resultObjects.length,
      columnCount: headers.length,
      headers,
      inferredTypes,
      inputBytes: new TextEncoder().encode(clean).length
    };

    return {
      valid: true,
      data: resultObjects,
      jsonString,
      error: null,
      stats,
      detectedDelimiter: activeDelimiter
    };
  } catch (err: any) {
    return {
      valid: false,
      data: null,
      jsonString: '',
      error: {
        message: err.message || 'Failed to parse CSV data'
      },
      stats: null,
      detectedDelimiter: ','
    };
  }
}

/**
 * Escapes a single string field according to RFC 4180 with optional Formula Injection protection
 */
export function escapeCsvField(
  value: any,
  delimiter: string,
  sanitizeFormulas: boolean = false
): string {
  if (value === null || value === undefined) return '';

  let str = '';
  if (typeof value === 'object') {
    str = JSON.stringify(value);
  } else {
    str = String(value);
  }

  // Formula injection mitigation (OWASP recommendation): prefix formula triggers with a single quote
  if (sanitizeFormulas && str.length > 0) {
    const first = str.charAt(0);
    if (first === '=' || first === '@' || (first === '+' && isNaN(Number(str))) || (first === '-' && isNaN(Number(str)))) {
      str = `'${str}`;
    }
  }

  // If contains delimiter, double quotes, or newlines, quote and escape internal quotes
  if (str.includes(delimiter) || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    const escaped = str.replace(/"/g, '""');
    return `"${escaped}"`;
  }

  return str;
}

/**
 * Converts JSON data (array of objects, array of arrays, primitive arrays, or single object) to RFC 4180 CSV
 */
export function convertJsonToCsv(
  jsonInput: string | any,
  options: JsonToCsvOptions = {}
): JsonToCsvResult {
  const delimiter = options.delimiter || ',';
  const includeHeaders = options.includeHeaders !== false;
  const flattenNested = options.nestedFormat === 'flatten';
  const sanitizeFormulas = options.sanitizeFormulas === true;

  let parsed: any;
  if (typeof jsonInput === 'string') {
    const clean = stripBom(jsonInput);
    if (!clean.trim()) {
      return {
        valid: false,
        csvString: '',
        rowCount: 0,
        columnCount: 0,
        headers: [],
        error: 'JSON input is empty.'
      };
    }
    try {
      parsed = JSON.parse(clean);
    } catch (err: any) {
      return {
        valid: false,
        csvString: '',
        rowCount: 0,
        columnCount: 0,
        headers: [],
        error: `Invalid JSON syntax: ${err.message}`
      };
    }
  } else {
    parsed = jsonInput;
  }

  // Handle primitive arrays like [1, 2, 3] or ["apple", "banana"]
  if (Array.isArray(parsed) && parsed.length > 0 && parsed.every(item => typeof item !== 'object' || item === null)) {
    const lines: string[] = [];
    if (includeHeaders) {
      lines.push('value');
    }
    for (const val of parsed) {
      lines.push(escapeCsvField(val, delimiter, sanitizeFormulas));
    }
    return {
      valid: true,
      csvString: lines.join('\r\n'),
      rowCount: parsed.length,
      columnCount: 1,
      headers: ['value'],
      error: null
    };
  }

  // Normalize parsed data into an array of items
  let records: any[] = [];
  if (Array.isArray(parsed)) {
    records = parsed;
  } else if (parsed !== null && typeof parsed === 'object') {
    records = [parsed];
  } else {
    return {
      valid: false,
      csvString: '',
      rowCount: 0,
      columnCount: 0,
      headers: [],
      error: 'JSON input must be an Array of Objects, Array of Arrays, Array of Primitives, or a single Object.'
    };
  }

  if (records.length === 0) {
    return {
      valid: true,
      csvString: '',
      rowCount: 0,
      columnCount: 0,
      headers: [],
      error: null
    };
  }

  // Case 1: Array of arrays (e.g. [["Name", "Age"], ["Alice", 30]])
  if (Array.isArray(records[0])) {
    const lines: string[] = [];
    records.forEach(row => {
      const escapedRow = (row as any[]).map(val => escapeCsvField(val, delimiter, sanitizeFormulas)).join(delimiter);
      lines.push(escapedRow);
    });
    return {
      valid: true,
      csvString: lines.join('\r\n'),
      rowCount: records.length,
      columnCount: (records[0] as any[]).length,
      headers: [],
      error: null
    };
  }

  // Case 2: Array of objects (Standard JSON Table)
  // Optionally flatten nested objects if requested
  const processedRecords = flattenNested
    ? records.map(r => (r && typeof r === 'object' && !Array.isArray(r) ? flattenObject(r) : r))
    : records;

  // Collect all unique keys across all records
  const headersSet = new Set<string>();
  for (const record of processedRecords) {
    if (record && typeof record === 'object' && !Array.isArray(record)) {
      Object.keys(record).forEach(k => headersSet.add(k));
    }
  }

  const headers = Array.from(headersSet);
  if (headers.length === 0) {
    return {
      valid: false,
      csvString: '',
      rowCount: 0,
      columnCount: 0,
      headers: [],
      error: 'No object properties found in JSON array to convert to CSV.'
    };
  }

  const lines: string[] = [];

  // Write header row
  if (includeHeaders) {
    const headerLine = headers.map(h => escapeCsvField(h, delimiter, sanitizeFormulas)).join(delimiter);
    lines.push(headerLine);
  }

  // Write data rows
  for (const record of processedRecords) {
    if (record && typeof record === 'object') {
      const rowLine = headers.map(h => escapeCsvField(record[h], delimiter, sanitizeFormulas)).join(delimiter);
      lines.push(rowLine);
    }
  }

  return {
    valid: true,
    csvString: lines.join('\r\n'),
    rowCount: processedRecords.length,
    columnCount: headers.length,
    headers,
    error: null
  };
}

/**
 * Pre-built sample datasets for quick testing
 */
export const SAMPLE_CSV_DATA = `id,name,email,role,salary,active,created_at
101,Sarah Connor,sarah@skynet.dev,Lead Architect,145000,true,2025-01-15
102,John Doe,"doe, john@consulting.org",Senior Analyst,98500.50,true,2025-02-10
103,Dr. Ellen Ripley,ripley@nostromo.space,"Security Officer, Flight",120000,false,2024-11-20
104,Neo Anderson,neo@matrix.io,Software Engineer,135000,true,2025-03-01
105,Dana Scully,scully@fbi.gov,"Special Agent & MD",115000.75,true,2024-09-12`;

export const SAMPLE_JSON_ARRAY = [
  {
    "sku": "PROD-8821",
    "name": "Mechanical Keyboard Pro",
    "category": "Peripherals",
    "price": 149.99,
    "inStock": true,
    "tags": "rgb,wireless,hot-swap"
  },
  {
    "sku": "PROD-9042",
    "name": "Ultra-Wide Gaming Monitor 34\"",
    "category": "Displays",
    "price": 599.50,
    "inStock": false,
    "tags": "144hz,ips,hdr"
  },
  {
    "sku": "PROD-3310",
    "name": "Ergonomic Mesh Chair",
    "category": "Furniture",
    "price": 320.00,
    "inStock": true,
    "tags": "lumbar,adjustable"
  }
];

