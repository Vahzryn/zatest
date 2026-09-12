import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { SeoRouteData } from '../lib/seoEngine';
import { Breadcrumbs } from './Breadcrumbs';
import { SeoGuideContent } from './Converter/SeoGuideContent';
import {
  Code,
  Check,
  Copy,
  Download,
  Upload,
  RefreshCw,
  Sparkles,
  AlertTriangle,
  FileCode,
  ShieldCheck,
  ChevronRight,
  ChevronDown,
  Layers,
  Search,
  Maximize2,
  Minimize2,
  CheckCircle2,
  Trash2,
  FolderTree
} from 'lucide-react';
import {
  validateAndParseJson,
  formatJson,
  repairCommonJsonMistakes,
  SAMPLE_JSON_DATA,
  IndentOption,
  JsonStats
} from '../lib/jsonFormatter';

interface JsonFormatterPageProps {
  seoData: SeoRouteData;
  onNavigate: (path: string) => void;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Recursive Tree Node Component
interface JsonTreeNodeProps {
  keyName?: string;
  value: any;
  depth: number;
  searchFilter: string;
  defaultExpanded?: boolean;
}

const JsonTreeNode: React.FC<JsonTreeNodeProps> = ({
  keyName,
  value,
  depth,
  searchFilter,
  defaultExpanded = true
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(defaultExpanded && depth < 3);
  const [isCopied, setIsCopied] = useState<boolean>(false);

  const isObject = value !== null && typeof value === 'object';
  const isArray = Array.isArray(value);
  const isNull = value === null;
  const isString = typeof value === 'string';
  const isNumber = typeof value === 'number';
  const isBoolean = typeof value === 'boolean';

  const typeLabel = isArray
    ? `Array(${value.length})`
    : isObject
    ? `Object{${Object.keys(value).length}}`
    : isNull
    ? 'null'
    : typeof value;

  const typeColor = isArray
    ? 'text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40 border-sky-200 dark:border-sky-800'
    : isObject
    ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800'
    : isString
    ? 'text-emerald-600 dark:text-emerald-400'
    : isNumber
    ? 'text-amber-600 dark:text-amber-400'
    : isBoolean
    ? 'text-rose-600 dark:text-rose-400'
    : 'text-zinc-500 dark:text-zinc-400';

  const matchesSearch = useMemo(() => {
    if (!searchFilter) return true;
    const filter = searchFilter.toLowerCase();
    if (keyName && keyName.toLowerCase().includes(filter)) return true;
    if (!isObject) {
      return String(value).toLowerCase().includes(filter);
    }
    return false;
  }, [keyName, value, searchFilter, isObject]);

  const handleCopyValue = (e: React.MouseEvent) => {
    e.stopPropagation();
    const strVal = typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value);
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(strVal).then(() => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 1500);
      }).catch(() => {
        // Fallback for clipboard failures
        setIsCopied(false);
      });
    }
  };

  const nodePadding = Math.min(depth * 14, 112);

  return (
    <div className={`text-xs font-mono select-text ${!matchesSearch && searchFilter ? 'opacity-30' : ''}`}>
      <div
        className={`flex items-center gap-1.5 py-1 px-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800/60 transition-colors ${
          isObject ? 'cursor-pointer' : ''
        }`}
        style={{ paddingLeft: `${Math.max(4, nodePadding)}px` }}
        onClick={() => isObject && setIsExpanded(!isExpanded)}
        role={isObject ? "treeitem" : undefined}
        aria-expanded={isObject ? isExpanded : undefined}
      >
        {isObject ? (
          <button
            type="button"
            aria-label={isExpanded ? `Collapse ${keyName || 'node'}` : `Expand ${keyName || 'node'}`}
            className="p-0.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
          >
            {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </button>
        ) : (
          <span className="w-3.5 inline-block" />
        )}

        {keyName !== undefined && (
          <span className="font-semibold text-zinc-800 dark:text-zinc-200">
            "{keyName}":
          </span>
        )}

        {isObject ? (
          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${typeColor}`}>
            {typeLabel}
          </span>
        ) : (
          <span className={`font-medium ${typeColor} break-all`}>
            {isString ? `"${value}"` : isNull ? 'null' : String(value)}
          </span>
        )}

        <button
          type="button"
          onClick={handleCopyValue}
          aria-label="Copy node value to clipboard"
          title="Copy node value"
          className="ml-auto opacity-0 group-hover:opacity-100 hover:opacity-100 focus:opacity-100 p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-opacity"
        >
          {isCopied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
        </button>
      </div>

      {isObject && isExpanded && (
        <div className="flex flex-col border-l border-zinc-200 dark:border-zinc-800 ml-2.5">
          {isArray ? (
            value.map((item: any, idx: number) => (
              <JsonTreeNode
                key={idx}
                keyName={String(idx)}
                value={item}
                depth={depth + 1}
                searchFilter={searchFilter}
                defaultExpanded={defaultExpanded}
              />
            ))
          ) : (
            Object.keys(value).map((k) => (
              <JsonTreeNode
                key={k}
                keyName={k}
                value={value[k]}
                depth={depth + 1}
                searchFilter={searchFilter}
                defaultExpanded={defaultExpanded}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
};

export function JsonFormatterPage({ seoData, onNavigate }: JsonFormatterPageProps) {
  // Raw input state
  const [rawInput, setRawInput] = useState<string>(() => JSON.stringify(SAMPLE_JSON_DATA, null, 2));
  
  // Formatting preferences
  const [indentOption, setIndentOption] = useState<IndentOption>('2');
  const [sortKeys, setSortKeys] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'code' | 'tree'>('code');
  const [searchFilter, setSearchFilter] = useState<string>('');
  
  // Feedback states
  const [copiedType, setCopiedType] = useState<'formatted' | 'minified' | null>(null);
  const [repairedNotice, setRepairedNotice] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState<boolean>(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Validate and parse raw input live
  const parseResult = useMemo(() => {
    return validateAndParseJson(rawInput);
  }, [rawInput]);

  // Formatted output text
  const formattedOutput = useMemo(() => {
    if (!parseResult.valid || parseResult.data === null) {
      return '';
    }
    try {
      return formatJson(parseResult.data, indentOption, sortKeys);
    } catch {
      return '';
    }
  }, [parseResult, indentOption, sortKeys]);

  // Handle file loading with size limit & error guards
  const handleFileDrop = (files: FileList | File[]) => {
    const file = files[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      setRepairedNotice('File exceeds 15 MB limit. Please load a smaller JSON file to maintain smooth browser performance.');
      setTimeout(() => setRepairedNotice(null), 5000);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (content !== undefined) {
        setRawInput(content);
        setRepairedNotice(null);
      }
    };
    reader.onerror = () => {
      setRepairedNotice('Failed to read file. Please ensure the file is readable and try again.');
      setTimeout(() => setRepairedNotice(null), 5000);
    };
    reader.readAsText(file);
  };

  const handleCopy = (type: 'formatted' | 'minified') => {
    if (!parseResult.valid || parseResult.data === null) return;
    const textToCopy = type === 'minified' ? formatJson(parseResult.data, 'minified', sortKeys) : formattedOutput;
    
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(textToCopy).then(() => {
        setCopiedType(type);
        setTimeout(() => setCopiedType(null), 2000);
      }).catch(() => {
        // Fallback for clipboard failures
        try {
          const textarea = document.createElement('textarea');
          textarea.value = textToCopy;
          textarea.style.position = 'fixed';
          textarea.style.opacity = '0';
          document.body.appendChild(textarea);
          textarea.select();
          document.execCommand('copy');
          document.body.removeChild(textarea);
          setCopiedType(type);
          setTimeout(() => setCopiedType(null), 2000);
        } catch {
          setRepairedNotice('Clipboard access unavailable. Please select and copy text manually.');
          setTimeout(() => setRepairedNotice(null), 4000);
        }
      });
    }
  };

  const handleDownload = () => {
    if (!parseResult.valid || !formattedOutput) return;
    const blob = new Blob([formattedOutput], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'formatted.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleAutoRepair = () => {
    const repaired = repairCommonJsonMistakes(rawInput);
    const check = validateAndParseJson(repaired);
    setRawInput(repaired);
    if (check.valid) {
      setRepairedNotice('JSON syntax successfully repaired and validated!');
    } else {
      setRepairedNotice('Applied automated syntax corrections. Please review remaining structural errors.');
    }
    setTimeout(() => setRepairedNotice(null), 5000);
  };

  const handleLoadSample = () => {
    setRawInput(JSON.stringify(SAMPLE_JSON_DATA, null, 2));
    setRepairedNotice(null);
  };

  const handleClear = () => {
    setRawInput('');
    setRepairedNotice(null);
  };

  return (
    <div className="max-w-6xl mx-auto px-2 sm:px-4 py-2 sm:py-4 space-y-6">
      {/* Main Workspace Box */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-xl overflow-hidden p-4 sm:p-6 space-y-5">
        {/* Top Control Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 dark:border-zinc-800/80 pb-4">
          {/* Indent Selector & Sort Keys */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 mr-1">
              Indentation:
            </span>
            {(['2', '4', '3', 'tab', 'minified'] as IndentOption[]).map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => setIndentOption(opt)}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                  indentOption === opt
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                    : 'bg-zinc-50 dark:bg-zinc-800/50 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                }`}
              >
                {opt === 'tab' ? 'Tab' : opt === 'minified' ? 'Minify' : `${opt} Spaces`}
              </button>
            ))}

            <button
              type="button"
              onClick={() => setSortKeys(!sortKeys)}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 ${
                sortKeys
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                  : 'bg-zinc-50 dark:bg-zinc-800/50 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Sort Keys (A-Z)</span>
            </button>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleAutoRepair}
              className="px-3 py-1.5 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
              title="Fix trailing commas, quotes, and JavaScript literals"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Auto-Fix Syntax</span>
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload JSON</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,.txt,.geojson,.jsonld"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  handleFileDrop(e.target.files);
                  e.target.value = '';
                }
              }}
            />

            <button
              type="button"
              onClick={handleLoadSample}
              className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Sample</span>
            </button>

            <button
              type="button"
              onClick={handleClear}
              className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5 text-zinc-400" />
              <span>Clear</span>
            </button>
          </div>
        </div>

        {/* Notices */}
        {repairedNotice && (
          <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-2xl flex items-center gap-2.5 text-amber-800 dark:text-amber-300 text-xs font-semibold animate-in fade-in duration-200">
            <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{repairedNotice}</span>
          </div>
        )}

        {/* Grid: Editor Left vs Output Right */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Left: Input Textarea */}
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  Raw JSON Input
                </span>
                <span className="text-[11px] text-zinc-400 font-mono">
                  {rawInput.length.toLocaleString()} chars
                </span>
              </div>

              {parseResult.valid ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                  <CheckCircle2 className="w-3 h-3" /> Valid JSON
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded-md border border-rose-200 dark:border-rose-800">
                  <AlertTriangle className="w-3 h-3" /> Invalid Syntax
                </span>
              )}
            </div>

            <div
              className={`relative border rounded-2xl overflow-hidden transition-all ${
                dragActive
                  ? 'border-indigo-500 bg-indigo-50/20'
                  : parseResult.valid
                  ? 'border-zinc-200 dark:border-zinc-700/80 bg-zinc-50/30 dark:bg-[#18191c]'
                  : 'border-rose-300 dark:border-rose-900/60 bg-rose-50/10'
              }`}
              onDragOver={(e) => {
                e.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragActive(false);
                if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                  handleFileDrop(e.dataTransfer.files);
                }
              }}
            >
              <textarea
                value={rawInput}
                onChange={(e) => setRawInput(e.target.value)}
                placeholder="Paste your JSON string or drop a .json file here..."
                spellCheck={false}
                className="w-full h-96 p-4 text-xs font-mono bg-transparent text-zinc-800 dark:text-zinc-200 focus:outline-none resize-none leading-relaxed overflow-y-auto"
              />
            </div>

            {/* Error Diagnostics Card */}
            {!parseResult.valid && parseResult.error && (
              <div className="p-4 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 rounded-2xl space-y-2 text-rose-800 dark:text-rose-300 text-xs font-mono animate-in slide-in-from-top-2 duration-200">
                <div className="flex items-center gap-2 font-bold font-sans">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>Syntax Error at Line {parseResult.error.line}, Column {parseResult.error.column}</span>
                </div>
                <p className="font-sans text-xs text-rose-700 dark:text-rose-400">
                  {parseResult.error.message}
                </p>
                {parseResult.error.snippet && (
                  <div className="p-2.5 bg-zinc-900 text-zinc-300 rounded-xl overflow-x-auto text-[11px] leading-tight">
                    <div>{parseResult.error.snippet}</div>
                    <div className="text-rose-400 font-bold">{parseResult.error.pointer}</div>
                  </div>
                )}
                <div className="pt-1 flex items-center justify-between">
                  <span className="text-[11px] font-sans text-zinc-500 dark:text-zinc-400">
                    Tip: Try clicking "Auto-Fix Syntax" above to repair common syntax errors.
                  </span>
                  <button
                    type="button"
                    onClick={handleAutoRepair}
                    className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white font-sans text-xs font-bold rounded-lg transition-colors cursor-pointer"
                  >
                    Attempt Auto-Fix
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right: Output & Viewer */}
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              {/* Tab Switcher: Code vs Tree */}
              <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 p-0.5 rounded-xl">
                <button
                  type="button"
                  onClick={() => setViewMode('code')}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                    viewMode === 'code'
                      ? 'bg-white dark:bg-[#25282c] text-zinc-900 dark:text-white shadow-xs'
                      : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700'
                  }`}
                >
                  <FileCode className="w-3.5 h-3.5" />
                  <span>Formatted Code</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('tree')}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                    viewMode === 'tree'
                      ? 'bg-white dark:bg-[#25282c] text-zinc-900 dark:text-white shadow-xs'
                      : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700'
                  }`}
                >
                  <FolderTree className="w-3.5 h-3.5" />
                  <span>Tree Explorer</span>
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={!parseResult.valid}
                  onClick={() => handleCopy('formatted')}
                  className={`px-3 py-1 text-xs font-bold rounded-lg border transition-all cursor-pointer flex items-center gap-1 ${
                    copiedType === 'formatted'
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 disabled:opacity-40'
                  }`}
                >
                  {copiedType === 'formatted' ? (
                    <>
                      <Check className="w-3 h-3" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  disabled={!parseResult.valid}
                  onClick={() => handleCopy('minified')}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition-all cursor-pointer flex items-center gap-1 ${
                    copiedType === 'minified'
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 disabled:opacity-40'
                  }`}
                >
                  {copiedType === 'minified' ? 'Copied Minified!' : 'Copy Min'}
                </button>

                <button
                  type="button"
                  disabled={!parseResult.valid}
                  onClick={handleDownload}
                  className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-bold rounded-lg transition-all shadow-xs flex items-center gap-1 cursor-pointer"
                >
                  <Download className="w-3 h-3" />
                  <span>Download .json</span>
                </button>
              </div>
            </div>

            {/* Output Display Container */}
            <div className="border border-zinc-200 dark:border-zinc-700/80 rounded-2xl bg-zinc-50/30 dark:bg-[#18191c] overflow-hidden h-96 flex flex-col">
              {viewMode === 'code' ? (
                <div className="relative flex-1 overflow-auto">
                  <textarea
                    readOnly
                    value={formattedOutput}
                    placeholder="Formatted output will appear here once valid JSON is provided..."
                    className="w-full h-full p-4 text-xs font-mono bg-transparent text-zinc-800 dark:text-zinc-200 focus:outline-none resize-none leading-relaxed"
                  />
                </div>
              ) : (
                <div className="flex-1 flex flex-col overflow-hidden">
                  {/* Tree Search Bar */}
                  <div className="p-2 border-b border-zinc-200 dark:border-zinc-800 flex items-center gap-2 bg-zinc-100/50 dark:bg-zinc-900/40">
                    <Search className="w-3.5 h-3.5 text-zinc-400 ml-1.5" />
                    <input
                      type="text"
                      value={searchFilter}
                      onChange={(e) => setSearchFilter(e.target.value)}
                      placeholder="Filter keys or values..."
                      className="w-full py-1 text-xs bg-transparent focus:outline-none text-zinc-800 dark:text-zinc-200 placeholder-zinc-400"
                    />
                    {searchFilter && (
                      <button
                        type="button"
                        onClick={() => setSearchFilter('')}
                        className="text-[10px] font-bold text-zinc-400 hover:text-zinc-600 px-1.5"
                      >
                        Clear
                      </button>
                    )}
                  </div>

                  {/* Tree Nodes List */}
                  <div className="flex-1 overflow-auto p-3 space-y-0.5">
                    {parseResult.valid && parseResult.data !== null ? (
                      <JsonTreeNode
                        value={parseResult.data}
                        depth={0}
                        searchFilter={searchFilter}
                        defaultExpanded={true}
                      />
                    ) : (
                      <div className="h-full flex items-center justify-center text-xs text-zinc-400 font-sans">
                        Provide valid JSON to explore node hierarchy.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Payload Statistics Grid */}
            {parseResult.valid && parseResult.stats && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 bg-zinc-50 dark:bg-[#25282c] border border-zinc-200 dark:border-zinc-700/80 rounded-2xl text-xs font-sans">
                <div className="flex flex-col">
                  <span className="text-[10px] text-zinc-400 font-bold uppercase">Size</span>
                  <span className="font-bold text-zinc-800 dark:text-white">
                    {formatBytes(parseResult.stats.byteSize)} ({parseResult.stats.charCount} chars)
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-zinc-400 font-bold uppercase">Depth</span>
                  <span className="font-bold text-zinc-800 dark:text-white">
                    {parseResult.stats.depth} Levels
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-zinc-400 font-bold uppercase">Keys / Values</span>
                  <span className="font-bold text-zinc-800 dark:text-white">
                    {parseResult.stats.totalKeys} keys / {parseResult.stats.totalValues} vals
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-zinc-400 font-bold uppercase">Structure</span>
                  <span className="font-bold text-zinc-800 dark:text-white">
                    {parseResult.stats.objectCount} objs, {parseResult.stats.arrayCount} arrays
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SEO & Educational Guide Section */}
      <SeoGuideContent seoData={seoData} onNavigate={onNavigate} />
    </div>
  );
}
