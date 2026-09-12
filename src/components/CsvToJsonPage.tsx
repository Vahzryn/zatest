import React, { useState, useMemo, useCallback } from 'react';
import {
  FileSpreadsheet,
  Braces,
  ArrowRightLeft,
  Copy,
  Check,
  Download,
  Trash2,
  Table,
  Code2,
  FileUp,
  Sliders,
  Sparkles,
  AlertCircle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Search,
  CheckCircle2,
  ArrowUpDown,
  Lock,
  Layers,
  ArrowRight,
  ShieldCheck,
  Cpu
} from 'lucide-react';
import {
  convertCsvToJson,
  convertJsonToCsv,
  detectDelimiter,
  DelimiterType,
  SAMPLE_CSV_DATA,
  SAMPLE_JSON_ARRAY
} from '../lib/csvConverter';
import { SeoRouteData } from '../lib/seoEngine';

interface CsvToJsonPageProps {
  seoData?: SeoRouteData;
  onNavigate?: (path: string) => void;
}

export default function CsvToJsonPage({ seoData, onNavigate }: CsvToJsonPageProps) {
  // Mode: 'csv-to-json' | 'json-to-csv'
  const [mode, setMode] = useState<'csv-to-json' | 'json-to-csv'>('csv-to-json');

  // Input & Output states
  const [inputText, setInputText] = useState<string>(SAMPLE_CSV_DATA);
  const [delimiter, setDelimiter] = useState<DelimiterType>('auto');
  const [hasHeaders, setHasHeaders] = useState<boolean>(true);
  const [parseTypes, setParseTypes] = useState<boolean>(true);
  const [parseNestedJson, setParseNestedJson] = useState<boolean>(false);
  const [nestedFormat, setNestedFormat] = useState<'json' | 'flatten'>('json');
  const [sanitizeFormulas, setSanitizeFormulas] = useState<boolean>(false);
  const [indentOption, setIndentOption] = useState<'2' | '4' | 'tab' | 'minified'>('2');

  // UI Views & Controls
  const [outputView, setOutputView] = useState<'code' | 'table'>('code');
  const [copied, setCopied] = useState<boolean>(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  // Pagination for large datasets
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(50);

  // Conversion calculations
  const conversionResult = useMemo(() => {
    if (mode === 'csv-to-json') {
      return convertCsvToJson(inputText, {
        delimiter,
        hasHeaders,
        parseNumbersAndBooleans: parseTypes,
        parseNestedJson,
        skipEmptyLines: true,
        trimWhitespace: false
      }, indentOption);
    } else {
      // JSON to CSV Mode
      const jsonRes = convertJsonToCsv(inputText, {
        delimiter: delimiter === 'auto' ? ',' : (delimiter as any),
        includeHeaders: hasHeaders,
        nestedFormat,
        sanitizeFormulas
      });
      return {
        valid: jsonRes.valid,
        data: null,
        jsonString: jsonRes.csvString,
        error: jsonRes.error ? { message: jsonRes.error } : null,
        stats: jsonRes.valid ? {
          rowCount: jsonRes.rowCount,
          columnCount: jsonRes.columnCount,
          headers: jsonRes.headers,
          inferredTypes: {},
          inputBytes: new TextEncoder().encode(inputText).length
        } : null,
        detectedDelimiter: delimiter === 'auto' ? ',' : delimiter
      };
    }
  }, [mode, inputText, delimiter, hasHeaders, parseTypes, parseNestedJson, nestedFormat, sanitizeFormulas, indentOption]);

  // Derived structured table data for Table Grid View
  const tableData = useMemo(() => {
    if (mode === 'csv-to-json') {
      if (conversionResult.valid && Array.isArray(conversionResult.data)) {
        return {
          headers: conversionResult.stats?.headers || [],
          rows: conversionResult.data
        };
      }
    } else {
      // In JSON to CSV mode, parse the input JSON to show as table if valid
      try {
        const parsed = JSON.parse(inputText);
        if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'object') {
          const headers = Array.from(new Set(parsed.flatMap(item => Object.keys(item))));
          return { headers, rows: parsed };
        }
      } catch {
        // invalid JSON
      }
    }
    return { headers: [], rows: [] };
  }, [mode, conversionResult, inputText]);

  // Filtered and sorted table rows
  const filteredAndSortedRows = useMemo(() => {
    let rows = [...tableData.rows];

    if (searchFilter.trim()) {
      const q = searchFilter.toLowerCase();
      rows = rows.filter(row => {
        return Object.values(row).some(val => String(val).toLowerCase().includes(q));
      });
    }

    if (sortColumn) {
      rows.sort((a, b) => {
        const valA = a[sortColumn];
        const valB = b[sortColumn];
        if (valA === valB) return 0;
        if (valA === undefined || valA === null) return 1;
        if (valB === undefined || valB === null) return -1;

        if (typeof valA === 'number' && typeof valB === 'number') {
          return sortDirection === 'asc' ? valA - valB : valB - valA;
        }
        return sortDirection === 'asc'
          ? String(valA).localeCompare(String(valB))
          : String(valB).localeCompare(String(valA));
      });
    }

    return rows;
  }, [tableData, searchFilter, sortColumn, sortDirection]);

  // Paginated slice
  const totalPages = Math.max(1, Math.ceil(filteredAndSortedRows.length / pageSize));
  const paginatedRows = useMemo(() => {
    const startIdx = (currentPage - 1) * pageSize;
    return filteredAndSortedRows.slice(startIdx, startIdx + pageSize);
  }, [filteredAndSortedRows, currentPage, pageSize]);

  // Handle Sort Toggle
  const handleSort = (col: string) => {
    if (sortColumn === col) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else {
        setSortColumn(null);
        setSortDirection('asc');
      }
    } else {
      setSortColumn(col);
      setSortDirection('asc');
    }
  };

  // Handle Copy to Clipboard with fallback
  const handleCopy = () => {
    const textToCopy = conversionResult.jsonString;
    if (!textToCopy) return;

    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(textToCopy).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }).catch(() => {
        fallbackCopy(textToCopy);
      });
    } else {
      fallbackCopy(textToCopy);
    }
  };

  const fallbackCopy = (text: string) => {
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setNotification('Clipboard access unavailable. Please select and copy text manually.');
      setTimeout(() => setNotification(null), 4000);
    }
  };

  // Handle Download File
  const handleDownload = () => {
    if (!conversionResult.valid || !conversionResult.jsonString) return;

    const isJson = mode === 'csv-to-json';
    const blob = new Blob([conversionResult.jsonString], {
      type: isJson ? 'application/json;charset=utf-8;' : 'text/csv;charset=utf-8;'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = isJson ? `converted_${Date.now()}.json` : `converted_${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Handle Mode Swap
  const handleSwapMode = () => {
    if (mode === 'csv-to-json') {
      setMode('json-to-csv');
      // If current output is valid JSON, feed it into input
      if (conversionResult.valid && conversionResult.jsonString) {
        setInputText(conversionResult.jsonString);
      } else {
        setInputText(JSON.stringify(SAMPLE_JSON_ARRAY, null, 2));
      }
    } else {
      setMode('csv-to-json');
      // If current output is valid CSV, feed it into input
      if (conversionResult.valid && conversionResult.jsonString) {
        setInputText(conversionResult.jsonString);
      } else {
        setInputText(SAMPLE_CSV_DATA);
      }
    }
  };

  // Handle Sample Data Load
  const handleLoadSample = () => {
    if (mode === 'csv-to-json') {
      setInputText(SAMPLE_CSV_DATA);
    } else {
      setInputText(JSON.stringify(SAMPLE_JSON_ARRAY, null, 2));
    }
    setNotification('Sample dataset loaded successfully.');
    setTimeout(() => setNotification(null), 3000);
  };

  // Handle File Upload
  const handleFileDrop = (files: FileList | File[]) => {
    const file = files[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      setNotification('File exceeds 15 MB limit. Please select a smaller file for optimal browser performance.');
      setTimeout(() => setNotification(null), 5000);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (typeof content === 'string') {
        setInputText(content);
        // Auto-detect mode based on file extension
        if (file.name.endsWith('.json')) {
          setMode('json-to-csv');
        } else if (file.name.endsWith('.csv') || file.name.endsWith('.tsv') || file.name.endsWith('.txt')) {
          setMode('csv-to-json');
        }
        setNotification(`Loaded "${file.name}" (${(file.size / 1024).toFixed(1)} KB)`);
        setTimeout(() => setNotification(null), 4000);
      }
    };
    reader.onerror = () => {
      setNotification('Failed to read file. Please ensure the file is valid and try again.');
      setTimeout(() => setNotification(null), 5000);
    };
    reader.readAsText(file);
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-2 sm:px-4 py-2 sm:py-4 flex flex-col gap-6">
      {/* Mode Switcher & Primary Action Bar */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
        {/* Conversion Direction Tabs */}
        <div className="flex items-center bg-zinc-100 dark:bg-zinc-800/80 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setMode('csv-to-json')}
            className={`flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all ${
              mode === 'csv-to-json'
                ? 'bg-white dark:bg-zinc-750 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>CSV ➔ JSON</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('json-to-csv')}
            className={`flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all ${
              mode === 'json-to-csv'
                ? 'bg-white dark:bg-zinc-750 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            <Braces className="w-4 h-4" />
            <span>JSON ➔ CSV</span>
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleSwapMode}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg text-zinc-700 dark:text-zinc-300 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 transition-colors"
            title="Swap direction"
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            <span>Swap</span>
          </button>
          <button
            type="button"
            onClick={handleLoadSample}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg text-zinc-700 dark:text-zinc-300 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 transition-colors"
            title="Load sample dataset"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Load Sample</span>
          </button>
          <label className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg text-zinc-700 dark:text-zinc-300 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 cursor-pointer transition-colors">
            <FileUp className="w-3.5 h-3.5" />
            <span>Open File</span>
            <input
              type="file"
              accept=".csv,.tsv,.txt,.json"
              className="hidden"
              onChange={(e) => e.target.files && handleFileDrop(e.target.files)}
            />
          </label>
          <button
            type="button"
            onClick={() => setInputText('')}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg text-rose-600 dark:text-rose-400 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 transition-colors"
            title="Clear workspace"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>
        </div>
      </div>

      {/* Notification Banner */}
      {notification && (
        <div className="bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-800 dark:text-indigo-200 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Options & Settings Bar */}
      <div className="bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/70 dark:border-zinc-800/80 rounded-xl p-3 sm:p-4 flex flex-wrap items-center gap-4 text-xs">
        <div className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300 font-medium">
          <Sliders className="w-4 h-4 text-zinc-500" />
          <span>Configuration:</span>
        </div>

        {/* Delimiter Selection */}
        <div className="flex items-center gap-1.5">
          <label htmlFor="delimiter-select" className="text-zinc-500 dark:text-zinc-400">Delimiter:</label>
          <select
            id="delimiter-select"
            value={delimiter}
            onChange={(e) => setDelimiter(e.target.value as DelimiterType)}
            className="bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 px-2 py-1 rounded-md text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
          >
            <option value="auto">Auto-Detect</option>
            <option value=",">Comma (,)</option>
            <option value=";">Semicolon (;)</option>
            <option value="&#9;">Tab (\t / TSV)</option>
            <option value="|">Pipe (|)</option>
          </select>
        </div>

        {/* Headers Option */}
        <label className="inline-flex items-center gap-1.5 cursor-pointer text-zinc-700 dark:text-zinc-300 font-medium select-none">
          <input
            type="checkbox"
            checked={hasHeaders}
            onChange={(e) => setHasHeaders(e.target.checked)}
            className="w-3.5 h-3.5 text-indigo-600 rounded border-zinc-300 dark:border-zinc-700 focus:ring-indigo-500"
          />
          <span>First row is Header</span>
        </label>

        {/* CSV to JSON Options */}
        {mode === 'csv-to-json' && (
          <>
            <label className="inline-flex items-center gap-1.5 cursor-pointer text-zinc-700 dark:text-zinc-300 font-medium select-none" title="Auto-convert numeric values, booleans, and nulls">
              <input
                type="checkbox"
                checked={parseTypes}
                onChange={(e) => setParseTypes(e.target.checked)}
                className="w-3.5 h-3.5 text-indigo-600 rounded border-zinc-300 dark:border-zinc-700 focus:ring-indigo-500"
              />
              <span>Parse Types</span>
            </label>

            <label className="inline-flex items-center gap-1.5 cursor-pointer text-zinc-700 dark:text-zinc-300 font-medium select-none" title="Parse stringified JSON objects/arrays inside CSV cells">
              <input
                type="checkbox"
                checked={parseNestedJson}
                onChange={(e) => setParseNestedJson(e.target.checked)}
                className="w-3.5 h-3.5 text-indigo-600 rounded border-zinc-300 dark:border-zinc-700 focus:ring-indigo-500"
              />
              <span>Parse Nested JSON Cells</span>
            </label>

            <div className="flex items-center gap-1.5 ml-auto">
              <label htmlFor="indent-select" className="text-zinc-500 dark:text-zinc-400">Indent:</label>
              <select
                id="indent-select"
                value={indentOption}
                onChange={(e) => setIndentOption(e.target.value as any)}
                className="bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 px-2 py-1 rounded-md text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              >
                <option value="2">2 Spaces</option>
                <option value="4">4 Spaces</option>
                <option value="tab">Tab</option>
                <option value="minified">Minified (Compact)</option>
              </select>
            </div>
          </>
        )}

        {/* JSON to CSV Options */}
        {mode === 'json-to-csv' && (
          <>
            <div className="flex items-center gap-1.5">
              <label htmlFor="nested-select" className="text-zinc-500 dark:text-zinc-400">Nested Objects:</label>
              <select
                id="nested-select"
                value={nestedFormat}
                onChange={(e) => setNestedFormat(e.target.value as any)}
                className="bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 px-2 py-1 rounded-md text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              >
                <option value="json">Serialize as JSON (Reversible)</option>
                <option value="flatten">Flatten with Dot Notation (e.g. address.city)</option>
              </select>
            </div>

            <label className="inline-flex items-center gap-1.5 cursor-pointer text-zinc-700 dark:text-zinc-300 font-medium select-none ml-auto" title="Prefix =, @, +, - with single quote to prevent spreadsheet formula injection in Excel/Calc">
              <input
                type="checkbox"
                checked={sanitizeFormulas}
                onChange={(e) => setSanitizeFormulas(e.target.checked)}
                className="w-3.5 h-3.5 text-indigo-600 rounded border-zinc-300 dark:border-zinc-700 focus:ring-indigo-500"
              />
              <span>Spreadsheet Formula Protection</span>
            </label>
          </>
        )}
      </div>

      {/* Main Workspace (Dual Pane) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Left Pane: Input */}
        <div className="flex flex-col bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="flex items-center justify-between px-4 py-3 bg-zinc-50 dark:bg-zinc-850 border-b border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-xs text-zinc-800 dark:text-zinc-200">
                {mode === 'csv-to-json' ? 'Source CSV / TSV' : 'Source JSON Array'}
              </span>
              <span className="text-[10px] text-zinc-500 bg-zinc-200 dark:bg-zinc-700 px-1.5 py-0.5 rounded font-mono">
                {inputText.length} chars
              </span>
            </div>
          </div>

          <div
            className="relative"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (e.dataTransfer.files) handleFileDrop(e.dataTransfer.files);
            }}
          >
            <textarea
              id="csv-json-input-editor"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={mode === 'csv-to-json' ? 'Paste CSV text or drop a .csv file here...' : 'Paste JSON array or drop a .json file here...'}
              rows={18}
              className="w-full p-4 font-mono text-xs sm:text-sm bg-transparent text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 focus:outline-hidden resize-y leading-relaxed"
              spellCheck={false}
            />
          </div>
        </div>

        {/* Right Pane: Output & Data Grid View */}
        <div className="flex flex-col bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
          {/* Output Header */}
          <div className="flex flex-wrap items-center justify-between px-4 py-2.5 bg-zinc-50 dark:bg-zinc-850 border-b border-zinc-200 dark:border-zinc-800 gap-2">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-xs text-zinc-800 dark:text-zinc-200">
                {mode === 'csv-to-json' ? 'Converted JSON Output' : 'Converted CSV Table'}
              </span>
              {conversionResult.stats && (
                <span className="text-[10px] text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded font-medium">
                  {conversionResult.stats.rowCount} rows • {conversionResult.stats.columnCount} cols
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Output Format Switcher (Code vs Table Grid) */}
              <div className="flex items-center bg-zinc-200 dark:bg-zinc-800 p-0.5 rounded-lg">
                <button
                  type="button"
                  onClick={() => setOutputView('code')}
                  className={`p-1 rounded text-xs transition-colors ${
                    outputView === 'code'
                      ? 'bg-white dark:bg-zinc-700 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                      : 'text-zinc-600 dark:text-zinc-400'
                  }`}
                  title="Code View"
                >
                  <Code2 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setOutputView('table')}
                  className={`p-1 rounded text-xs transition-colors ${
                    outputView === 'table'
                      ? 'bg-white dark:bg-zinc-700 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                      : 'text-zinc-600 dark:text-zinc-400'
                  }`}
                  title="Interactive Table View"
                >
                  <Table className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Copy Button */}
              <button
                type="button"
                onClick={handleCopy}
                disabled={!conversionResult.valid}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg text-zinc-700 dark:text-zinc-200 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700 disabled:opacity-40 transition-colors"
                title="Copy to clipboard"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>

              {/* Download Button */}
              <button
                type="button"
                onClick={handleDownload}
                disabled={!conversionResult.valid}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 transition-colors shadow-2xs"
                title="Download file"
              >
                <Download className="w-3 h-3" />
                <span>Download</span>
              </button>
            </div>
          </div>

          {/* Error Banner if invalid */}
          {conversionResult.error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border-b border-rose-200 dark:border-rose-900/60 flex items-start gap-2 text-rose-700 dark:text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">{conversionResult.error.message}</p>
                {conversionResult.error.line && (
                  <p className="text-[11px] opacity-80">Line {conversionResult.error.line}, Col {conversionResult.error.column}</p>
                )}
              </div>
            </div>
          )}

          {/* Output Content */}
          {outputView === 'code' ? (
            <div className="relative">
              <textarea
                id="csv-json-output-editor"
                readOnly
                value={conversionResult.jsonString}
                placeholder="Conversion output will appear here..."
                rows={18}
                className="w-full p-4 font-mono text-xs sm:text-sm bg-zinc-50/50 dark:bg-zinc-900/40 text-zinc-800 dark:text-zinc-100 focus:outline-hidden resize-y leading-relaxed"
                spellCheck={false}
              />
            </div>
          ) : (
            /* Interactive Data Table Grid View */
            <div className="flex flex-col min-h-[380px] max-h-[500px]">
              {/* Table search filter */}
              <div className="p-2.5 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-850/70 flex items-center gap-2">
                <Search className="w-3.5 h-3.5 text-zinc-400" />
                <input
                  type="text"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  placeholder="Filter rows by text..."
                  className="w-full bg-transparent text-xs text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 focus:outline-hidden"
                />
                {searchFilter && (
                  <button
                    type="button"
                    onClick={() => setSearchFilter('')}
                    className="text-[10px] text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                  >
                    Clear
                  </button>
                )}
              </div>

              <div className="flex-1 overflow-auto">
                {tableData.headers.length > 0 ? (
                  <table className="w-full text-left text-xs border-collapse font-mono">
                    <thead className="bg-zinc-100 dark:bg-zinc-800 sticky top-0 z-10 border-b border-zinc-200 dark:border-zinc-700">
                      <tr>
                        <th className="p-2.5 font-bold text-zinc-500 dark:text-zinc-400 w-12 text-center border-r border-zinc-200 dark:border-zinc-700">
                          #
                        </th>
                        {tableData.headers.map((header) => (
                          <th
                            key={header}
                            onClick={() => handleSort(header)}
                            className="p-2.5 font-bold text-zinc-800 dark:text-zinc-200 cursor-pointer hover:bg-zinc-200/70 dark:hover:bg-zinc-700/70 transition-colors border-r border-zinc-200 dark:border-zinc-700 whitespace-nowrap select-none"
                          >
                            <div className="flex items-center gap-1.5">
                              <span>{header}</span>
                              <ArrowUpDown className="w-3 h-3 text-zinc-400" />
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                      {paginatedRows.length > 0 ? (
                        paginatedRows.map((row, idx) => {
                          const rowNum = (currentPage - 1) * pageSize + idx + 1;
                          return (
                            <tr key={idx} className="hover:bg-zinc-50 dark:hover:bg-zinc-850/60 transition-colors">
                              <td className="p-2.5 text-zinc-400 text-center border-r border-zinc-200 dark:border-zinc-800 text-[11px]">
                                {rowNum}
                              </td>
                              {tableData.headers.map((header) => {
                                const cellValue = row[header];
                                const isBool = typeof cellValue === 'boolean';
                                const isNum = typeof cellValue === 'number';
                                const isNull = cellValue === null;
                                const isObj = cellValue !== null && typeof cellValue === 'object';

                                return (
                                  <td
                                    key={header}
                                    className="p-2.5 text-zinc-700 dark:text-zinc-300 border-r border-zinc-200 dark:border-zinc-800 max-w-[220px] truncate"
                                    title={isObj ? JSON.stringify(cellValue) : String(cellValue ?? '')}
                                  >
                                    {isBool ? (
                                      <span className={cellValue ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-rose-600 dark:text-rose-400 font-semibold'}>
                                        {String(cellValue)}
                                      </span>
                                    ) : isNum ? (
                                      <span className="text-indigo-600 dark:text-indigo-400 font-semibold">
                                        {cellValue}
                                      </span>
                                    ) : isNull ? (
                                      <span className="text-zinc-400 italic">null</span>
                                    ) : isObj ? (
                                      <span className="text-sky-600 dark:text-sky-400">
                                        {JSON.stringify(cellValue)}
                                      </span>
                                    ) : (
                                      String(cellValue ?? '')
                                    )}
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={tableData.headers.length + 1} className="p-6 text-center text-zinc-400 text-xs">
                            No matching rows found for query "{searchFilter}".
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                ) : (
                  <div className="p-8 text-center text-zinc-400 text-xs">
                    No tabular data available. Convert valid CSV or JSON to populate the table grid.
                  </div>
                )}
              </div>

              {/* Table Pagination Bar */}
              {filteredAndSortedRows.length > 0 && (
                <div className="px-3 py-2 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-850/80 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="text-zinc-500 dark:text-zinc-400 text-[11px]">
                    Showing {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, filteredAndSortedRows.length)} of {filteredAndSortedRows.length} rows
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 text-[11px] text-zinc-500">
                      <span>Rows:</span>
                      <select
                        value={pageSize}
                        onChange={(e) => {
                          setPageSize(Number(e.target.value));
                          setCurrentPage(1);
                        }}
                        className="bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 px-1.5 py-0.5 rounded text-[11px] focus:outline-hidden"
                      >
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                        <option value={250}>250</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="px-2 py-0.5 rounded bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 disabled:opacity-40 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-xs transition-colors"
                      >
                        Prev
                      </button>
                      <span className="text-[11px] text-zinc-600 dark:text-zinc-400 px-1">
                        {currentPage} / {totalPages}
                      </span>
                      <button
                        type="button"
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage >= totalPages}
                        className="px-2 py-0.5 rounded bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 disabled:opacity-40 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-xs transition-colors"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Feature & Privacy Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
        <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 flex items-start gap-3">
          <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider">
              100% In-Memory Privacy
            </h2>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1 leading-relaxed">
              Your sensitive spreadsheets, user lists, and customer data never leave your computer.
            </p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 flex items-start gap-3">
          <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider">
              RFC 4180 Standard Compliant
            </h2>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1 leading-relaxed">
              Correctly parses multi-line quoted cells, escaped double quotes (""), and varied line breaks (CRLF/LF).
            </p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 flex items-start gap-3">
          <div className="p-2 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider">
              Smart Type Inference
            </h2>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1 leading-relaxed">
              Automatically coerces numeric values, floats, booleans, and nulls without breaking strings with leading zeros.
            </p>
          </div>
        </div>
      </div>

      {/* Guide, Steps & Technical Explanation */}
      <div className="mt-8 pt-8 border-t border-zinc-200 dark:border-zinc-800 flex flex-col gap-8">
        <div className="prose dark:prose-invert max-w-none text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed flex flex-col gap-6">
          <div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">
              How to Convert CSV to JSON & JSON to CSV
            </h2>
            <p>
              Transforming structured tabular data into developer-friendly JSON format—or exporting database JSON arrays back to CSV spreadsheets—is fundamental for API development, data migration, and analytics pipelines. Zapixal delivers instant, bi-directional conversion with zero network dependencies.
            </p>
          </div>

          {/* 3 Step Workflow */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-2">
            <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-850 border border-zinc-200/80 dark:border-zinc-800">
              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">Step 1</span>
              <h3 className="font-semibold text-zinc-900 dark:text-white text-sm mt-1">Input Your Data</h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                Paste raw CSV/JSON text into the editor or drag and drop a <code>.csv</code>, <code>.tsv</code>, or <code>.json</code> file.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-850 border border-zinc-200/80 dark:border-zinc-800">
              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">Step 2</span>
              <h3 className="font-semibold text-zinc-900 dark:text-white text-sm mt-1">Configure Options</h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                Select your delimiter (auto-detect, comma, tab, semicolon), toggle header rows, and choose indentation formatting.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-850 border border-zinc-200/80 dark:border-zinc-800">
              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">Step 3</span>
              <h3 className="font-semibold text-zinc-900 dark:text-white text-sm mt-1">Inspect & Export</h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                Inspect converted output in raw code view or the interactive data grid table, then copy or download with one click.
              </p>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">
              Why Local Browser Conversion Protects Sensitive Records
            </h2>
            <p>
              Spreadsheets routinely contain confidential business metrics, customer email lists, pricing catalogs, and proprietary financial models. Traditional web utilities send your uploaded files to third-party cloud servers for conversion, exposing data to logging and retention risks. Zapixal executes all parsing and serialization routines directly in your browser tab using JavaScript memory buffers, ensuring that zero bytes ever leave your device.
            </p>
          </div>
        </div>

        {/* Frequently Asked Questions */}
        <div className="flex flex-col gap-4">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
            Frequently Asked Questions
          </h2>
          <div className="flex flex-col gap-3">
            {[
              {
                q: "How does the converter handle commas inside quoted CSV text?",
                a: "The parser adheres strictly to the RFC 4180 specification. Any field wrapped in double quotes (such as \"San Francisco, CA\") is parsed as a single literal string cell. Internal double quotes escaped as (\"\") are automatically unescaped to a single quote."
              },
              {
                q: "Can I convert TSV (Tab-Separated Values) to JSON?",
                a: "Yes. Set the delimiter selector to Tab (\\t / TSV) or leave it on Auto-Detect. The parser will automatically identify tab separators and convert the columns accurately into JSON objects."
              },
              {
                q: "What happens if my CSV does not have a header row?",
                a: "Uncheck the 'First row is Header' option. The engine will automatically generate numeric column identifiers (col_1, col_2, col_3...) and preserve the first row as standard data."
              },
              {
                q: "Are numbers and boolean values preserved as data types?",
                a: "Yes. When 'Auto-parse Numbers & Booleans' is enabled, values like 149.99, true, false, and null are converted to their native JavaScript types in the JSON output. Text strings with leading zeros (e.g., zip codes like '02138') are intelligently retained as strings to avoid numeric data loss."
              }
            ].map((faq, idx) => (
              <div
                key={idx}
                className="border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900 overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                  className="w-full px-4 py-3.5 text-left flex items-center justify-between text-xs sm:text-sm font-semibold text-zinc-900 dark:text-white hover:bg-zinc-50 dark:hover:bg-zinc-850 transition-colors"
                >
                  <span>{faq.q}</span>
                  {activeFaq === idx ? <ChevronUp className="w-4 h-4 text-zinc-400" /> : <ChevronDown className="w-4 h-4 text-zinc-400" />}
                </button>
                {activeFaq === idx && (
                  <div className="px-4 pb-4 pt-1 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed border-t border-zinc-100 dark:border-zinc-800">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Related Developer Tools Links */}
        <div className="p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex flex-col gap-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Explore Related Local Tools
          </h2>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onNavigate?.('/json-formatter-validator')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors shadow-2xs"
            >
              <Braces className="w-3.5 h-3.5 text-indigo-500" />
              <span>JSON Formatter & Validator</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate?.('/client-side-image-to-base64')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors shadow-2xs"
            >
              <Layers className="w-3.5 h-3.5 text-sky-500" />
              <span>Image to Base64 Encoder</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate?.('/palette-color-extractor-image-hex')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors shadow-2xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Color Palette Extractor</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate?.('/tools')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors shadow-2xs"
            >
              <span>Browse All Tools</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
