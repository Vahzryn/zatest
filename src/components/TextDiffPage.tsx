import React, { useState, useMemo, useRef, useCallback } from 'react';
import { SeoRouteData } from '../lib/seoEngine';
import { SeoGuideContent } from './Converter/SeoGuideContent';
import { ValuePropsSection } from './Converter/ValuePropsSection';
import {
  computeTextDiff,
  tryFormatJson,
  isBinaryContent,
  stripUtf8Bom,
  DiffCompareOptions,
  DiffResult,
  calculateTextStats,
} from '../lib/diffEngine';
import {
  GitCompare,
  ArrowRightLeft,
  Copy,
  Download,
  Trash2,
  Upload,
  Check,
  FileText,
  Lock,
  Sparkles,
  Info,
  Settings2,
  FileCode,
  CheckCircle2,
  AlertCircle,
  Code2,
} from 'lucide-react';

interface TextDiffPageProps {
  seoData: SeoRouteData;
  onNavigate: (path: string) => void;
}

const SAMPLE_LEFT_CODE = `function calculateTotal(items, taxRate) {
  let total = 0;
  for (let i = 0; i < items.length; i++) {
    total += items[i].price;
  }
  const tax = total * taxRate;
  console.log("Calculated total: " + total);
  return total + tax;
}`;

const SAMPLE_RIGHT_CODE = `function calculateTotal(items, taxRate = 0.05) {
  if (!Array.isArray(items) || items.length === 0) {
    return 0;
  }
  const subtotal = items.reduce((sum, item) => sum + (item.price || 0), 0);
  const tax = subtotal * taxRate;
  console.log(\`Calculated total: \${subtotal + tax}\`);
  return subtotal + tax;
}`;

const SAMPLE_LEFT_JSON = `{
  "name": "Zapixal App",
  "version": "1.0.0",
  "status": "active",
  "features": ["conversion", "compression"]
}`;

const SAMPLE_RIGHT_JSON = `{
  "name": "Zapixal Web Platform",
  "version": "1.1.0",
  "status": "active",
  "features": ["conversion", "compression", "text-diff"],
  "offlineMode": true
}`;

export function TextDiffPage({ seoData, onNavigate }: TextDiffPageProps) {
  const [leftText, setLeftText] = useState<string>(SAMPLE_LEFT_CODE);
  const [rightText, setRightText] = useState<string>(SAMPLE_RIGHT_CODE);

  const [leftFileName, setLeftFileName] = useState<string | null>(null);
  const [rightFileName, setRightFileName] = useState<string | null>(null);

  const [ignoreWhitespace, setIgnoreWhitespace] = useState<boolean>(false);
  const [ignoreTrimWhitespace, setIgnoreTrimWhitespace] = useState<boolean>(false);
  const [ignoreBlankLines, setIgnoreBlankLines] = useState<boolean>(false);
  const [ignoreCase, setIgnoreCase] = useState<boolean>(false);
  const [diffViewMode, setDiffViewMode] = useState<'side-by-side' | 'unified'>('side-by-side');

  const [isCopiedPatch, setIsCopiedPatch] = useState<boolean>(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [jsonNotice, setJsonNotice] = useState<string | null>(null);

  const leftFileInputRef = useRef<HTMLInputElement | null>(null);
  const rightFileInputRef = useRef<HTMLInputElement | null>(null);

  // Options configuration
  const diffOptions: DiffCompareOptions = useMemo(
    () => ({
      ignoreWhitespace,
      ignoreTrimWhitespace,
      ignoreBlankLines,
      ignoreCase,
      diffViewMode,
    }),
    [ignoreWhitespace, ignoreTrimWhitespace, ignoreBlankLines, ignoreCase, diffViewMode]
  );

  // Compute diff
  const diffResult: DiffResult = useMemo(() => {
    return computeTextDiff(leftText, rightText, diffOptions);
  }, [leftText, rightText, diffOptions]);

  // Statistics
  const leftStats = useMemo(() => calculateTextStats(leftText), [leftText]);
  const rightStats = useMemo(() => calculateTextStats(rightText), [rightText]);

  // Swap Left and Right
  const handleSwap = useCallback(() => {
    setLeftText(rightText);
    setRightText(leftText);
    const tempName = leftFileName;
    setLeftFileName(rightFileName);
    setRightFileName(tempName);
  }, [leftText, rightText, leftFileName, rightFileName]);

  // Format JSON before compare
  const handleFormatJson = useCallback(() => {
    const leftRes = tryFormatJson(leftText);
    const rightRes = tryFormatJson(rightText);

    if (leftRes.success || rightRes.success) {
      if (leftRes.success) setLeftText(leftRes.formatted);
      if (rightRes.success) setRightText(rightRes.formatted);
      setJsonNotice('JSON formatted successfully on valid input side(s).');
      setTimeout(() => setJsonNotice(null), 3500);
    } else {
      setJsonNotice('Could not format JSON: neither side contains valid JSON syntax.');
      setTimeout(() => setJsonNotice(null), 3500);
    }
  }, [leftText, rightText]);

  // File Upload Handlers
  const handleFileUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>, side: 'left' | 'right') => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (file.size > 5 * 1024 * 1024) {
        setFileError(`File "${file.name}" exceeds the 5MB limit for instant browser comparison.`);
        e.target.value = '';
        return;
      }

      setFileError(null);
      const reader = new FileReader();

      reader.onload = (event) => {
        const content = event.target?.result as string;
        if (!content) return;

        if (isBinaryContent(content)) {
          setFileError(`File "${file.name}" appears to be binary. Only text files are supported.`);
          return;
        }

        const cleanText = stripUtf8Bom(content);
        if (side === 'left') {
          setLeftText(cleanText);
          setLeftFileName(file.name);
        } else {
          setRightText(cleanText);
          setRightFileName(file.name);
        }
      };

      reader.readAsText(file, 'utf-8');
      e.target.value = '';
    },
    []
  );

  // Copy Unified Diff Patch
  const handleCopyPatch = useCallback(() => {
    if (!diffResult.unifiedPatchText) return;
    navigator.clipboard.writeText(diffResult.unifiedPatchText);
    setIsCopiedPatch(true);
    setTimeout(() => setIsCopiedPatch(false), 2000);
  }, [diffResult.unifiedPatchText]);

  // Download Patch (.diff)
  const handleDownloadPatch = useCallback(() => {
    if (!diffResult.unifiedPatchText) return;
    const blob = new Blob([diffResult.unifiedPatchText], { type: 'text/x-diff;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `text-comparison-${Date.now()}.diff`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [diffResult.unifiedPatchText]);

  // Load Presets
  const handleLoadSampleCode = useCallback(() => {
    setLeftText(SAMPLE_LEFT_CODE);
    setRightText(SAMPLE_RIGHT_CODE);
    setLeftFileName('calculateTotal.js (old)');
    setRightFileName('calculateTotal.js (new)');
  }, []);

  const handleLoadSampleJson = useCallback(() => {
    setLeftText(SAMPLE_LEFT_JSON);
    setRightText(SAMPLE_RIGHT_JSON);
    setLeftFileName('config-v1.json');
    setRightFileName('config-v2.json');
  }, []);

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-300">
      {/* Preset Toolbar */}
      <div className="bg-white dark:bg-zinc-800/90 border border-zinc-200 dark:border-zinc-700/80 rounded-2xl p-3 sm:p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <span className="text-xs sm:text-sm font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
          <GitCompare className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>Side-by-Side & Unified Text Diff Engine</span>
        </span>

        {/* Quick Presets */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleLoadSampleCode}
            className="px-3 py-1.5 text-xs font-medium bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-zinc-700 dark:text-zinc-200 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Code2 className="w-3.5 h-3.5" />
            Sample Code
          </button>
          <button
            onClick={handleLoadSampleJson}
            className="px-3 py-1.5 text-xs font-medium bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-zinc-700 dark:text-zinc-200 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <FileCode className="w-3.5 h-3.5" />
            Sample JSON
          </button>
        </div>
      </div>

      {/* Global Notifications */}
      {fileError && (
        <div className="p-3.5 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-xl text-xs font-medium text-red-800 dark:text-red-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
          <span>{fileError}</span>
        </div>
      )}

      {jsonNotice && (
        <div className="p-3.5 bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 rounded-xl text-xs font-medium text-indigo-800 dark:text-indigo-300 flex items-center gap-2">
          <Info className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
          <span>{jsonNotice}</span>
        </div>
      )}

      {/* Main Diff Workstation */}
      <div className="space-y-4">
        {/* Toolbar & Controls Bar */}
        <div className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl p-3 sm:p-4 shadow-xs space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* View Mode Switcher */}
            <div className="flex items-center bg-zinc-100 dark:bg-zinc-900 p-1 rounded-xl border border-zinc-200 dark:border-zinc-700">
              <button
                onClick={() => setDiffViewMode('side-by-side')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  diffViewMode === 'side-by-side'
                    ? 'bg-white dark:bg-zinc-800 text-emerald-600 dark:text-emerald-400 shadow-xs'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                Side-by-Side
              </button>
              <button
                onClick={() => setDiffViewMode('unified')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  diffViewMode === 'unified'
                    ? 'bg-white dark:bg-zinc-800 text-emerald-600 dark:text-emerald-400 shadow-xs'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                Unified
              </button>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={handleSwap}
                title="Swap left and right inputs"
                className="px-3 py-1.5 text-xs font-semibold bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-zinc-700 dark:text-zinc-200 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
                Swap Inputs
              </button>

              <button
                onClick={handleFormatJson}
                title="Auto-format valid JSON on both sides before comparing"
                className="px-3 py-1.5 text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                Format JSON
              </button>

              <button
                onClick={handleCopyPatch}
                className="px-3 py-1.5 text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-900 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                {isCopiedPatch ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                {isCopiedPatch ? 'Copied Patch' : 'Copy Patch'}
              </button>

              <button
                onClick={handleDownloadPatch}
                className="px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Download .diff
              </button>
            </div>
          </div>

          {/* Whitespace & Comparison Options */}
          <div className="pt-2 border-t border-zinc-100 dark:border-zinc-700/60 flex flex-wrap items-center gap-3 text-xs">
            <span className="font-semibold text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
              <Settings2 className="w-3.5 h-3.5" /> Comparison Options:
            </span>

            <label className="flex items-center gap-1.5 font-medium text-zinc-700 dark:text-zinc-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={ignoreWhitespace}
                onChange={(e) => setIgnoreWhitespace(e.target.checked)}
                className="rounded border-zinc-300 dark:border-zinc-600 text-emerald-600 focus:ring-emerald-500"
              />
              Ignore Whitespace
            </label>

            <label className="flex items-center gap-1.5 font-medium text-zinc-700 dark:text-zinc-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={ignoreTrimWhitespace}
                onChange={(e) => setIgnoreTrimWhitespace(e.target.checked)}
                className="rounded border-zinc-300 dark:border-zinc-600 text-emerald-600 focus:ring-emerald-500"
              />
              Trim Line Spaces
            </label>

            <label className="flex items-center gap-1.5 font-medium text-zinc-700 dark:text-zinc-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={ignoreBlankLines}
                onChange={(e) => setIgnoreBlankLines(e.target.checked)}
                className="rounded border-zinc-300 dark:border-zinc-600 text-emerald-600 focus:ring-emerald-500"
              />
              Ignore Blank Lines
            </label>

            <label className="flex items-center gap-1.5 font-medium text-zinc-700 dark:text-zinc-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={ignoreCase}
                onChange={(e) => setIgnoreCase(e.target.checked)}
                className="rounded border-zinc-300 dark:border-zinc-600 text-emerald-600 focus:ring-emerald-500"
              />
              Ignore Case
            </label>
          </div>
        </div>

        {/* Dual Text Input Panes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Left / Original Pane */}
          <div className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl p-4 shadow-xs flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-200">
                  Original (Left)
                </span>
                {leftFileName && (
                  <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 truncate max-w-[150px]">
                    {leftFileName}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => leftFileInputRef.current?.click()}
                  className="p-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-zinc-600 dark:text-zinc-300 text-xs font-medium flex items-center gap-1 cursor-pointer"
                  title="Upload text file for left side"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Upload</span>
                </button>
                <input
                  type="file"
                  ref={leftFileInputRef}
                  onChange={(e) => handleFileUpload(e, 'left')}
                  className="hidden"
                  accept=".txt,.md,.json,.csv,.js,.ts,.jsx,.tsx,.py,.html,.css,.diff,.patch,.log,.xml,.yaml"
                />

                <button
                  onClick={() => {
                    setLeftText('');
                    setLeftFileName(null);
                  }}
                  className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors cursor-pointer"
                  title="Clear original text"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <textarea
              value={leftText}
              onChange={(e) => setLeftText(e.target.value)}
              placeholder="Paste original text or drop file here..."
              rows={8}
              className="w-full p-3 font-mono text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-zinc-800 dark:text-zinc-200 resize-y"
            />

            {/* Statistics Badge Footer */}
            <div className="flex flex-wrap items-center justify-between text-[11px] font-mono text-zinc-500 dark:text-zinc-400 pt-1">
              <span>Lines: {leftStats.lines}</span>
              <span>Words: {leftStats.words}</span>
              <span>Chars: {leftStats.unicodeCodePoints}</span>
              <span>Bytes: {leftStats.utf8Bytes}</span>
            </div>
          </div>

          {/* Right / Modified Pane */}
          <div className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl p-4 shadow-xs flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-200">
                  Modified (Right)
                </span>
                {rightFileName && (
                  <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 truncate max-w-[150px]">
                    {rightFileName}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => rightFileInputRef.current?.click()}
                  className="p-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-zinc-600 dark:text-zinc-300 text-xs font-medium flex items-center gap-1 cursor-pointer"
                  title="Upload text file for right side"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Upload</span>
                </button>
                <input
                  type="file"
                  ref={rightFileInputRef}
                  onChange={(e) => handleFileUpload(e, 'right')}
                  className="hidden"
                  accept=".txt,.md,.json,.csv,.js,.ts,.jsx,.tsx,.py,.html,.css,.diff,.patch,.log,.xml,.yaml"
                />

                <button
                  onClick={() => {
                    setRightText('');
                    setRightFileName(null);
                  }}
                  className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors cursor-pointer"
                  title="Clear modified text"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <textarea
              value={rightText}
              onChange={(e) => setRightText(e.target.value)}
              placeholder="Paste modified text or drop file here..."
              rows={8}
              className="w-full p-3 font-mono text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-zinc-800 dark:text-zinc-200 resize-y"
            />

            {/* Statistics Badge Footer */}
            <div className="flex flex-wrap items-center justify-between text-[11px] font-mono text-zinc-500 dark:text-zinc-400 pt-1">
              <span>Lines: {rightStats.lines}</span>
              <span>Words: {rightStats.words}</span>
              <span>Chars: {rightStats.unicodeCodePoints}</span>
              <span>Bytes: {rightStats.utf8Bytes}</span>
            </div>
          </div>
        </div>

        {/* Diff Summary Metrics Bar */}
        <div className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl p-4 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                Diff Overview:
              </span>

              <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-bold font-mono">
                +{diffResult.stats.addedLines} Added
              </span>

              <span className="px-2.5 py-1 rounded-lg bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300 border border-red-200 dark:border-red-800 text-xs font-bold font-mono">
                -{diffResult.stats.removedLines} Removed
              </span>

              <span className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-xs font-bold font-mono">
                ~{diffResult.stats.modifiedLines} Modified
              </span>

              <span className="px-2.5 py-1 rounded-lg bg-zinc-100 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-600 text-xs font-bold font-mono">
                ={diffResult.stats.unchangedLines} Unchanged
              </span>
            </div>

            {/* Similarity Progress Indicator */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                Similarity:
              </span>
              <div className="w-24 bg-zinc-100 dark:bg-zinc-700 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${diffResult.stats.similarityPercentage}%` }}
                />
              </div>
              <span className="text-xs font-bold font-mono text-zinc-800 dark:text-zinc-200">
                {diffResult.stats.similarityPercentage}%
              </span>
            </div>
          </div>
        </div>

        {/* Diff Display View */}
        <div className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl shadow-xs overflow-hidden">
          <div className="bg-zinc-100 dark:bg-zinc-800/90 px-4 py-3 border-b border-zinc-200 dark:border-zinc-700 flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-200 flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              {diffViewMode === 'side-by-side' ? 'Side-by-Side Comparison' : 'Unified Diff View'}
            </h2>
            <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400">
              {diffResult.sideBySideLines.length} Total Lines
            </span>
          </div>

          <div className="overflow-x-auto">
            {diffViewMode === 'side-by-side' ? (
              /* Side-by-Side View Table */
              <table className="w-full text-left border-collapse font-mono text-xs">
                <thead>
                  <tr className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-700/80 text-zinc-500 dark:text-zinc-400 font-semibold select-none">
                    <th className="py-2 px-3 w-12 text-right border-r border-zinc-200 dark:border-zinc-800">
                      #
                    </th>
                    <th className="py-2 px-3 w-1/2 border-r border-zinc-200 dark:border-zinc-800">
                      Original
                    </th>
                    <th className="py-2 px-3 w-12 text-right border-r border-zinc-200 dark:border-zinc-800">
                      #
                    </th>
                    <th className="py-2 px-3 w-1/2">Modified</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                  {diffResult.sideBySideLines.map((item, idx) => {
                    const isRemoved = item.type === 'removed';
                    const isAdded = item.type === 'added';
                    const isUnchanged = item.type === 'unchanged';

                    return (
                      <tr key={idx} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/40">
                        {/* Left Line Number */}
                        <td className="py-1 px-3 text-right select-none text-zinc-400 dark:text-zinc-500 bg-zinc-50/80 dark:bg-zinc-900/60 border-r border-zinc-200 dark:border-zinc-800/80 w-12">
                          {item.leftLineNumber ?? ''}
                        </td>

                        {/* Left Content */}
                        <td
                          className={`py-1 px-3 border-r border-zinc-200 dark:border-zinc-800/80 whitespace-pre-wrap break-all ${
                            isRemoved
                              ? 'bg-red-500/10 dark:bg-red-950/30 text-red-900 dark:text-red-200'
                              : 'text-zinc-800 dark:text-zinc-200'
                          }`}
                        >
                          {item.leftTokens ? (
                            item.leftTokens.map((tok, tIdx) => (
                              <span
                                key={tIdx}
                                className={
                                  tok.isChanged
                                    ? 'bg-red-500/30 text-red-900 dark:text-red-100 rounded px-0.5 font-bold'
                                    : ''
                                }
                              >
                                {tok.text}
                              </span>
                            ))
                          ) : (
                            item.leftContent ?? ''
                          )}
                        </td>

                        {/* Right Line Number */}
                        <td className="py-1 px-3 text-right select-none text-zinc-400 dark:text-zinc-500 bg-zinc-50/80 dark:bg-zinc-900/60 border-r border-zinc-200 dark:border-zinc-800/80 w-12">
                          {item.rightLineNumber ?? ''}
                        </td>

                        {/* Right Content */}
                        <td
                          className={`py-1 px-3 whitespace-pre-wrap break-all ${
                            isAdded || (isRemoved && item.rightContent !== undefined)
                              ? 'bg-emerald-500/10 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200'
                              : 'text-zinc-800 dark:text-zinc-200'
                          }`}
                        >
                          {item.rightTokens ? (
                            item.rightTokens.map((tok, tIdx) => (
                              <span
                                key={tIdx}
                                className={
                                  tok.isChanged
                                    ? 'bg-emerald-500/30 text-emerald-900 dark:text-emerald-100 rounded px-0.5 font-bold'
                                    : ''
                                }
                              >
                                {tok.text}
                              </span>
                            ))
                          ) : (
                            item.rightContent ?? ''
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              /* Unified View List */
              <div className="font-mono text-xs divide-y divide-zinc-100 dark:divide-zinc-800/60">
                {diffResult.unifiedLines.map((line, idx) => {
                  const isAdded = line.type === 'added';
                  const isRemoved = line.type === 'removed';

                  return (
                    <div
                      key={idx}
                      className={`flex items-start ${
                        isAdded
                          ? 'bg-emerald-500/10 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200'
                          : isRemoved
                          ? 'bg-red-500/10 dark:bg-red-950/30 text-red-900 dark:text-red-200'
                          : 'text-zinc-800 dark:text-zinc-200'
                      }`}
                    >
                      <span className="w-12 py-1 px-2 text-right select-none text-zinc-400 dark:text-zinc-500 bg-zinc-50/80 dark:bg-zinc-900/60 border-r border-zinc-200 dark:border-zinc-800 shrink-0">
                        {line.oldLineNumber ?? ''}
                      </span>
                      <span className="w-12 py-1 px-2 text-right select-none text-zinc-400 dark:text-zinc-500 bg-zinc-50/80 dark:bg-zinc-900/60 border-r border-zinc-200 dark:border-zinc-800 shrink-0">
                        {line.newLineNumber ?? ''}
                      </span>
                      <span className="w-6 py-1 text-center select-none font-bold shrink-0">
                        {isAdded ? '+' : isRemoved ? '-' : ' '}
                      </span>
                      <span className="py-1 px-3 whitespace-pre-wrap break-all flex-1">
                        {line.tokens ? (
                          line.tokens.map((tok, tIdx) => (
                            <span
                              key={tIdx}
                              className={
                                tok.isChanged
                                  ? isAdded
                                    ? 'bg-emerald-500/30 text-emerald-900 dark:text-emerald-100 rounded px-0.5 font-bold'
                                    : 'bg-red-500/30 text-red-900 dark:text-red-100 rounded px-0.5 font-bold'
                                  : ''
                              }
                            >
                              {tok.text}
                            </span>
                          ))
                        ) : (
                          line.content
                        )}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Structured SEO Guide Content */}
      <SeoGuideContent seoData={seoData} onNavigate={onNavigate} />

      {/* Value Propositions / Why choose Zapixal */}
      <ValuePropsSection />
    </div>
  );
}
