import React, { useState, useMemo, useCallback } from 'react';
import {
  analyzeRegex,
  buildHighlightSegments,
  executeReplacement,
  extractMatches,
  getSupportedFlags,
  REGEX_PRESETS,
  REGEX_CHEAT_SHEET,
  RegexPreset
} from '../lib/regexEngine';
import { SeoRouteData } from '../lib/seoEngine';
import { SeoGuideContent } from './Converter/SeoGuideContent';
import { ValuePropsSection } from './Converter/ValuePropsSection';
import {
  Code,
  Copy,
  Check,
  RotateCcw,
  Sparkles,
  AlertCircle,
  Clock,
  Layers,
  ArrowRightLeft,
  FileText,
  Sliders,
  HelpCircle,
  Hash,
  Download,
  Info,
  ChevronDown,
  ChevronRight,
  ExternalLink
} from 'lucide-react';

interface RegexTesterPageProps {
  seoData: SeoRouteData;
  onNavigate: (path: string) => void;
}

export const RegexTesterPage: React.FC<RegexTesterPageProps> = ({ seoData, onNavigate }) => {
  // State
  const [pattern, setPattern] = useState<string>('(?<user>[a-zA-Z0-9._%+-]+)@(?<domain>[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,})');
  const [flags, setFlags] = useState<string>('g');
  const [testString, setTestString] = useState<string>(
    `Contact the core engineering team at dev@zapixal.com or alex.morgan+dev@example.co.uk.\nBilling inquiries: billing@company.org\nTest edge cases: user@, @domain.com, plainaddress.`
  );
  const [replacementPattern, setReplacementPattern] = useState<string>('[$<user> on $<domain>]');
  const [extractionMode, setExtractionMode] = useState<'full' | 'group1' | 'group2' | 'named' | 'json'>('full');
  const [namedGroupExtract, setNamedGroupExtract] = useState<string>('user');
  const [extractDelimiter, setExtractDelimiter] = useState<string>('\n');
  const [customDelimiter, setCustomDelimiter] = useState<string>(', ');
  
  const [activeTab, setActiveTab] = useState<'highlighter' | 'matches' | 'replacement' | 'extraction' | 'diagnostics'>('highlighter');
  const [showPresetsModal, setShowPresetsModal] = useState<boolean>(false);
  const [showFlagsMenu, setShowFlagsMenu] = useState<boolean>(false);
  const [showCheatSheet, setShowCheatSheet] = useState<boolean>(false);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [selectedPresetId, setSelectedPresetId] = useState<string>('email');

  const supportedFlagsList = useMemo(() => getSupportedFlags(), []);

  // Analysis result computed with performance tracking and safety
  const analysis = useMemo(() => {
    return analyzeRegex(pattern, flags, testString);
  }, [pattern, flags, testString]);

  // Safe non-XSS highlight segments
  const highlightSegments = useMemo(() => {
    return buildHighlightSegments(testString, analysis.matches);
  }, [testString, analysis.matches]);

  // Replacement result
  const replacementResult = useMemo(() => {
    return executeReplacement(testString, pattern, flags, replacementPattern);
  }, [testString, pattern, flags, replacementPattern]);

  // Extraction output
  const extractedText = useMemo(() => {
    const actualDelimiter = extractDelimiter === 'custom' ? customDelimiter : extractDelimiter;
    return extractMatches(analysis.matches, extractionMode, namedGroupExtract, actualDelimiter);
  }, [analysis.matches, extractionMode, namedGroupExtract, extractDelimiter, customDelimiter]);

  // Copy helper
  const handleCopy = useCallback((textToCopy: string, sectionId: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(textToCopy).then(() => {
        setCopiedSection(sectionId);
        setTimeout(() => setCopiedSection(null), 2000);
      });
    }
  }, []);

  // Toggle flag
  const handleToggleFlag = useCallback((flagChar: string) => {
    setFlags((prev) => {
      if (prev.includes(flagChar)) {
        return prev.replace(new RegExp(flagChar, 'g'), '');
      } else {
        return prev + flagChar;
      }
    });
  }, []);

  // Apply preset
  const handleApplyPreset = useCallback((preset: RegexPreset) => {
    setPattern(preset.pattern);
    setFlags(preset.flags);
    setTestString(preset.sampleText);
    if (preset.replacementPattern) {
      setReplacementPattern(preset.replacementPattern);
    }
    setSelectedPresetId(preset.id);
    setShowPresetsModal(false);
  }, []);

  // Reset to empty
  const handleReset = useCallback(() => {
    setPattern('');
    setTestString('');
    setReplacementPattern('');
    setSelectedPresetId('');
  }, []);

  // Preset quick change
  const handlePresetSelectChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const pId = e.target.value;
    const found = REGEX_PRESETS.find((p) => p.id === pId);
    if (found) {
      handleApplyPreset(found);
    }
  }, [handleApplyPreset]);

  return (
    <div className="w-full max-w-6xl mx-auto px-2 sm:px-4 py-2 sm:py-4 flex flex-col gap-6" id="regex-tester-container">
      {/* Quick Actions Toolbar */}
      <div className="flex items-center justify-between gap-3 p-3 sm:p-4 bg-white dark:bg-[#1e1f20] border border-zinc-200/80 dark:border-zinc-800 rounded-2xl">
        <span className="text-xs sm:text-sm font-bold text-zinc-800 dark:text-zinc-200">
          JavaScript RegExp Tester & Capture Inspector
        </span>
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <button
            onClick={() => setShowPresetsModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 rounded-lg transition-colors cursor-pointer"
            id="btn-open-presets-modal"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>Presets</span>
          </button>

          <button
            onClick={() => setShowCheatSheet(!showCheatSheet)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 rounded-lg transition-colors cursor-pointer"
            id="btn-toggle-cheatsheet"
          >
            <HelpCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>Cheat Sheet</span>
          </button>

          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-zinc-100 hover:bg-rose-50 dark:bg-zinc-800 dark:hover:bg-rose-950/40 text-zinc-600 hover:text-rose-600 dark:text-zinc-300 dark:hover:text-rose-300 rounded-lg transition-colors cursor-pointer"
            title="Clear all fields"
            id="btn-reset-regex-tester"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>
        </div>
      </div>

      {/* REGEX PATTERN INPUT & FLAGS BAR */}
      <div className="p-4 sm:p-5 bg-white dark:bg-[#1e1f20] border border-zinc-200/80 dark:border-zinc-800 rounded-3xl shadow-sm flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <label htmlFor="regex-pattern-input" className="text-xs sm:text-sm font-bold text-zinc-700 dark:text-zinc-200 flex items-center gap-1.5">
            <span>Regular Expression Pattern</span>
          </label>

          <div className="flex items-center gap-2">
            {/* Preset Selector Dropdown */}
            <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
              <span>Preset:</span>
              <select
                value={selectedPresetId}
                onChange={handlePresetSelectChange}
                className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 rounded-lg text-xs font-medium border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                id="select-regex-preset"
                aria-label="Select Regex Preset"
              >
                <option value="">Custom Pattern</option>
                {REGEX_PRESETS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Performance Execution Badge */}
            <div className="flex items-center gap-1 px-2.5 py-1 bg-zinc-100 dark:bg-zinc-800/80 rounded-lg text-xs font-medium text-zinc-600 dark:text-zinc-300" title="Client-side engine evaluation time">
              <Clock className="w-3.5 h-3.5 text-zinc-400" />
              <span>{analysis.executionTimeMs} ms</span>
            </div>
          </div>
        </div>

        {/* Pattern Input Box with Slash Delimiters */}
        <div className="flex items-center bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-2xl focus-within:ring-2 focus-within:ring-indigo-500/50 focus-within:border-indigo-500 transition-all overflow-hidden">
          <span className="pl-3.5 pr-1 text-lg font-mono font-bold text-indigo-600 dark:text-indigo-400 select-none">
            /
          </span>
          <input
            id="regex-pattern-input"
            type="text"
            value={pattern}
            onChange={(e) => {
              setPattern(e.target.value);
              setSelectedPresetId('');
            }}
            placeholder="e.g. ([a-z0-9._%+-]+)@([a-z0-9.-]+\.[a-z]{2,})"
            className="flex-1 py-3 px-1 text-sm sm:text-base font-mono bg-transparent text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none"
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
          />
          <span className="px-1 text-lg font-mono font-bold text-indigo-600 dark:text-indigo-400 select-none">
            /
          </span>

          {/* Flags Segment */}
          <div className="pr-2 flex items-center gap-1">
            <span className="font-mono text-sm font-bold text-amber-600 dark:text-amber-400 mr-1">
              {flags || '—'}
            </span>
            <button
              onClick={() => setShowFlagsMenu(!showFlagsMenu)}
              className="px-2 py-1 text-xs font-semibold bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
              title="Toggle Regex Flags"
              id="btn-toggle-flags-menu"
              aria-expanded={showFlagsMenu}
            >
              <Sliders className="w-3 h-3" />
              <span>Flags</span>
              <ChevronDown className={`w-3 h-3 transition-transform ${showFlagsMenu ? 'rotate-180' : ''}`} />
            </button>

            <button
              onClick={() => handleCopy(`/${pattern}/${flags}`, 'pattern')}
              className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-200/50 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
              title="Copy Complete Regular Expression"
              id="btn-copy-pattern"
            >
              {copiedSection === 'pattern' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Quick Flags Toggle Badges */}
        <div className="flex items-center gap-1.5 flex-wrap pt-1">
          <span className="text-xs font-medium text-zinc-400 dark:text-zinc-500 mr-1">Active Flags:</span>
          {supportedFlagsList.map((f) => {
            const isActive = flags.includes(f.char);
            return (
              <button
                key={f.char}
                onClick={() => f.supported && handleToggleFlag(f.char)}
                disabled={!f.supported}
                className={`px-2.5 py-1 text-xs font-mono font-bold rounded-lg border transition-all cursor-pointer flex items-center gap-1 ${
                  isActive
                    ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300 shadow-xs'
                    : 'bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800'
                } ${!f.supported ? 'opacity-40 cursor-not-allowed' : ''}`}
                title={`${f.name} (${f.char}): ${f.description}${!f.supported ? ' (Not supported in this engine)' : ''}`}
                id={`flag-toggle-${f.char}`}
              >
                <span>{f.char}</span>
                <span className="text-[10px] font-sans font-normal opacity-80">{f.name}</span>
              </button>
            );
          })}
        </div>

        {/* Detailed Flags Dropdown Menu */}
        {showFlagsMenu && (
          <div className="p-4 mt-2 bg-zinc-50 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 rounded-2xl flex flex-col gap-2.5 animate-in fade-in-50 duration-200">
            <div className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
              JavaScript Regex Flags Reference
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {supportedFlagsList.map((f) => (
                <div
                  key={f.char}
                  onClick={() => f.supported && handleToggleFlag(f.char)}
                  className={`p-2.5 rounded-xl border flex items-start gap-2.5 cursor-pointer transition-all ${
                    flags.includes(f.char)
                      ? 'bg-white dark:bg-[#25272a] border-indigo-300 dark:border-indigo-700'
                      : 'bg-zinc-100/60 dark:bg-zinc-900/40 border-zinc-200 dark:border-zinc-800 hover:bg-white dark:hover:bg-zinc-800'
                  } ${!f.supported ? 'opacity-40 cursor-not-allowed' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={flags.includes(f.char)}
                    onChange={() => {}}
                    disabled={!f.supported}
                    className="mt-0.5 text-indigo-600 rounded cursor-pointer"
                    id={`checkbox-flag-${f.char}`}
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-sm text-zinc-900 dark:text-white">{f.char}</span>
                      <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">{f.name}</span>
                    </div>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-snug mt-0.5">
                      {f.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Syntax Error Diagnostics Banner */}
        {!analysis.valid && analysis.error && (
          <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-2xl flex items-start gap-3 text-rose-800 dark:text-rose-200 animate-in fade-in duration-200" id="regex-syntax-error-banner">
            <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1 text-xs sm:text-sm">
              <div className="font-bold flex items-center gap-2">
                <span>Invalid Regular Expression Syntax</span>
                {analysis.errorOffset !== null && (
                  <span className="px-2 py-0.5 bg-rose-200 dark:bg-rose-900/60 rounded text-[11px] font-mono font-semibold">
                    Position: {analysis.errorOffset}
                  </span>
                )}
              </div>
              <p className="font-mono text-xs mt-1 text-rose-700 dark:text-rose-300 break-all">
                {analysis.error}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* COLLAPSIBLE CHEAT SHEET DRAWER */}
      {showCheatSheet && (
        <div className="p-5 bg-white dark:bg-[#1e1f20] border border-amber-200 dark:border-amber-900/40 rounded-3xl shadow-sm flex flex-col gap-4 animate-in fade-in-50 duration-200" id="regex-cheatsheet-drawer">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              <h2 className="text-base font-bold text-zinc-900 dark:text-white">
                Regex Tokens & Syntax Quick Reference
              </h2>
            </div>
            <button
              onClick={() => setShowCheatSheet(false)}
              className="text-xs font-semibold text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 cursor-pointer"
            >
              Close
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {REGEX_CHEAT_SHEET.map((sec) => (
              <div key={sec.category} className="p-3.5 bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-2xl">
                <h3 className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-2.5">
                  {sec.category}
                </h3>
                <div className="flex flex-col gap-1.5">
                  {sec.items.map((item, idx) => (
                    <div key={idx} className="flex items-start justify-between gap-2 text-xs">
                      <code className="px-1.5 py-0.5 font-mono font-bold bg-zinc-200/80 dark:bg-zinc-800 text-indigo-700 dark:text-indigo-300 rounded shrink-0">
                        {item.code}
                      </code>
                      <span className="text-zinc-600 dark:text-zinc-400 text-[11px] text-right">
                        {item.desc}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MAIN WORKSPACE TABS */}
      <div className="flex items-center gap-1.5 border-b border-zinc-200 dark:border-zinc-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('highlighter')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'highlighter'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
          }`}
          id="tab-highlighter"
        >
          <FileText className="w-4 h-4" />
          <span>Test String & Highlights</span>
          <span className={`px-2 py-0.5 rounded-full text-[11px] ${
            activeTab === 'highlighter' ? 'bg-indigo-700 text-indigo-100' : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-200'
          }`}>
            {analysis.matchCount}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('matches')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'matches'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
          }`}
          id="tab-matches-inspector"
        >
          <Layers className="w-4 h-4" />
          <span>Match & Group Details</span>
        </button>

        <button
          onClick={() => setActiveTab('replacement')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'replacement'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
          }`}
          id="tab-replacement"
        >
          <ArrowRightLeft className="w-4 h-4" />
          <span>Replace & Transform</span>
        </button>

        <button
          onClick={() => setActiveTab('extraction')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'extraction'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
          }`}
          id="tab-extraction"
        >
          <Download className="w-4 h-4" />
          <span>Extract Matches</span>
        </button>

        <button
          onClick={() => setActiveTab('diagnostics')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'diagnostics'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
          }`}
          id="tab-diagnostics"
        >
          <Hash className="w-4 h-4" />
          <span>String Diagnostics</span>
        </button>
      </div>

      {/* TAB 1: TEST STRING & HIGHLIGHTS */}
      {activeTab === 'highlighter' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5" id="panel-highlighter-view">
          {/* Left Column: Editable Test String Textarea */}
          <div className="p-4 sm:p-5 bg-white dark:bg-[#1e1f20] border border-zinc-200/80 dark:border-zinc-800 rounded-3xl shadow-sm flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <label htmlFor="test-string-textarea" className="text-xs sm:text-sm font-bold text-zinc-700 dark:text-zinc-200 flex items-center gap-2">
                <span>Test String Input</span>
                <span className="text-xs font-normal text-zinc-400">({analysis.diagnostics.codeUnits} chars)</span>
              </label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setTestString('')}
                  className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 font-medium cursor-pointer"
                  id="btn-clear-test-string"
                >
                  Clear Text
                </button>
              </div>
            </div>

            <textarea
              id="test-string-textarea"
              value={testString}
              onChange={(e) => setTestString(e.target.value)}
              placeholder="Paste or type test string here..."
              rows={12}
              className="w-full p-3.5 font-mono text-xs sm:text-sm bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-2xl text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y"
              spellCheck={false}
            />

            <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 px-1">
              <span>Lines: {analysis.diagnostics.lineCount} | Words: {analysis.diagnostics.wordCount}</span>
              <span>UTF-8: {analysis.diagnostics.utf8Bytes} bytes</span>
            </div>
          </div>

          {/* Right Column: Safe Match Highlighting Canvas */}
          <div className="p-4 sm:p-5 bg-white dark:bg-[#1e1f20] border border-zinc-200/80 dark:border-zinc-800 rounded-3xl shadow-sm flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="text-xs sm:text-sm font-bold text-zinc-700 dark:text-zinc-200">
                  Visual Match Highlights
                </h3>
                <span className="px-2 py-0.5 text-xs font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300 rounded-full">
                  {analysis.matchCount} {analysis.matchCount === 1 ? 'match' : 'matches'}
                </span>
              </div>
              <button
                onClick={() => handleCopy(testString, 'testString')}
                className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 font-medium cursor-pointer"
                id="btn-copy-test-string"
              >
                {copiedSection === 'testString' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>Copy Text</span>
              </button>
            </div>

            <div
              className="w-full min-h-[260px] max-h-[420px] overflow-y-auto p-3.5 font-mono text-xs sm:text-sm bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-2xl text-zinc-900 dark:text-zinc-100 leading-relaxed whitespace-pre-wrap break-all select-text"
              id="match-highlighter-output"
            >
              {highlightSegments.length === 0 || testString.length === 0 ? (
                <span className="text-zinc-400 italic">No text provided to highlight.</span>
              ) : (
                highlightSegments.map((seg, sIdx) => {
                  if (!seg.isMatch) {
                    return <span key={sIdx}>{seg.text}</span>;
                  }

                  const mIdx = seg.matchIndex ?? 0;
                  const isEven = mIdx % 2 === 0;

                  return (
                    <mark
                      key={sIdx}
                      className={`px-1 py-0.5 rounded-sm font-semibold transition-all inline cursor-pointer ${
                        isEven
                          ? 'bg-amber-200 text-amber-950 dark:bg-amber-500/30 dark:text-amber-200 border-b-2 border-amber-500'
                          : 'bg-sky-200 text-sky-950 dark:bg-sky-500/30 dark:text-sky-200 border-b-2 border-sky-500'
                      }`}
                      title={`Match #${mIdx + 1}`}
                    >
                      {seg.text}
                    </mark>
                  );
                })
              )}
            </div>

            {/* Quick Match Count & Truncation notice */}
            {analysis.truncated && (
              <div className="p-2.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2">
                <Info className="w-4 h-4 shrink-0" />
                <span>Match limit cap reached (5,000 matches) to prevent browser unresponsiveness.</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: MATCHES & CAPTURE GROUPS INSPECTOR */}
      {activeTab === 'matches' && (
        <div className="p-4 sm:p-5 bg-white dark:bg-[#1e1f20] border border-zinc-200/80 dark:border-zinc-800 rounded-3xl shadow-sm flex flex-col gap-4" id="panel-matches-inspector">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <span>Capture Groups & Match Breakdown</span>
                <span className="px-2.5 py-0.5 text-xs font-bold bg-indigo-100 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-200 rounded-full">
                  {analysis.matchCount} Total
                </span>
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Inspect exact match coordinates, zero-length anchors, numbered capturing groups ($1), and named groups (?&lt;name&gt;).
              </p>
            </div>

            <button
              onClick={() => handleCopy(JSON.stringify(analysis.matches, null, 2), 'matchesJson')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 rounded-xl transition-colors cursor-pointer"
              id="btn-copy-matches-json"
            >
              {copiedSection === 'matchesJson' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>Copy Matches JSON</span>
            </button>
          </div>

          {analysis.matches.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-zinc-400 gap-2 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl">
              <Layers className="w-8 h-8 opacity-40" />
              <p className="text-sm font-medium">No matches found with the current pattern and test string.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {analysis.matches.map((m) => (
                <div
                  key={m.matchIndex}
                  className="p-4 bg-zinc-50 dark:bg-zinc-900/70 border border-zinc-200 dark:border-zinc-800 rounded-2xl flex flex-col gap-3"
                >
                  <div className="flex items-center justify-between flex-wrap gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 bg-indigo-600 text-white rounded-lg text-xs font-bold font-mono">
                        #{m.matchIndex + 1}
                      </span>
                      <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                        Line {m.line}, Col {m.column}
                      </span>
                      <span className="text-xs font-mono text-zinc-400">
                        [{m.index}..{m.endIndex}] ({m.length} chars)
                      </span>
                    </div>

                    <button
                      onClick={() => handleCopy(m.text, `match-${m.matchIndex}`)}
                      className="text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 flex items-center gap-1 font-medium cursor-pointer"
                    >
                      {copiedSection === `match-${m.matchIndex}` ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                      <span>Copy Match</span>
                    </button>
                  </div>

                  {/* Full Match Text */}
                  <div className="flex items-start gap-2">
                    <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 w-24 shrink-0">
                      Full Match ($&):
                    </span>
                    <code className="px-2 py-1 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs font-mono text-indigo-700 dark:text-indigo-300 font-semibold break-all">
                      {m.text || '<zero-length match>'}
                    </code>
                  </div>

                  {/* Capturing Groups if any */}
                  {m.groups.length > 0 && (
                    <div className="flex flex-col gap-1.5 pt-1">
                      <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400">
                        Capture Groups:
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {m.groups.map((g, gIdx) => (
                          <div
                            key={gIdx}
                            className="p-2 bg-white dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/80 rounded-xl flex items-center justify-between gap-2 text-xs"
                          >
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                                {g.name ? `$<${g.name}>` : `$${g.index}`}
                              </span>
                              {g.name && (
                                <span className="text-[10px] bg-zinc-100 dark:bg-zinc-700 px-1.5 py-0.5 rounded text-zinc-600 dark:text-zinc-300">
                                  named
                                </span>
                              )}
                            </div>
                            <code className="font-mono text-zinc-800 dark:text-zinc-200 truncate max-w-[200px]" title={g.value}>
                              {g.value !== '' ? g.value : '<empty>'}
                            </code>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: REPLACEMENT & TRANSFORM */}
      {activeTab === 'replacement' && (
        <div className="p-4 sm:p-5 bg-white dark:bg-[#1e1f20] border border-zinc-200/80 dark:border-zinc-800 rounded-3xl shadow-sm flex flex-col gap-4" id="panel-replacement-view">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-white">
              Regular Expression Replacement Studio
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Replace matches using standard JavaScript substitution patterns ($1, $2, $&, $&lt;name&gt;, $`, $').
            </p>
          </div>

          {/* Replacement Pattern Input */}
          <div className="flex flex-col gap-2">
            <label htmlFor="replacement-pattern-input" className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
              Substitution String / Replacement Pattern
            </label>
            <div className="flex items-center bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-2xl p-2.5">
              <input
                id="replacement-pattern-input"
                type="text"
                value={replacementPattern}
                onChange={(e) => setReplacementPattern(e.target.value)}
                placeholder="e.g. [$<user> on $<domain>] or <a href='$1'>$&</a>"
                className="w-full text-xs sm:text-sm font-mono bg-transparent text-zinc-900 dark:text-zinc-100 focus:outline-none"
              />
            </div>
          </div>

          {/* Replacement Result Preview */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                Transformation Preview
              </span>
              <button
                onClick={() => handleCopy(replacementResult.result, 'replacementResult')}
                className="flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline cursor-pointer"
                id="btn-copy-replacement"
              >
                {copiedSection === 'replacementResult' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>Copy Replacement Output</span>
              </button>
            </div>

            <textarea
              readOnly
              value={replacementResult.result}
              rows={8}
              className="w-full p-3.5 font-mono text-xs sm:text-sm bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-2xl text-zinc-900 dark:text-zinc-100 focus:outline-none"
              id="replacement-output-textarea"
            />
          </div>
        </div>
      )}

      {/* TAB 4: EXTRACTION UTILITY */}
      {activeTab === 'extraction' && (
        <div className="p-4 sm:p-5 bg-white dark:bg-[#1e1f20] border border-zinc-200/80 dark:border-zinc-800 rounded-3xl shadow-sm flex flex-col gap-4" id="panel-extraction-view">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-white">
                Match & Group Extraction Studio
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Extract full matches, specific capture groups, or structured JSON formatted data.
              </p>
            </div>

            <button
              onClick={() => handleCopy(extractedText, 'extractedText')}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors cursor-pointer"
              id="btn-copy-extracted"
            >
              {copiedSection === 'extractedText' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>Copy Extracted Data</span>
            </button>
          </div>

          {/* Extraction Mode Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label htmlFor="select-extract-target" className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1.5">
                Target to Extract
              </label>
              <select
                id="select-extract-target"
                value={extractionMode}
                onChange={(e) => setExtractionMode(e.target.value as any)}
                className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-xl text-xs font-medium text-zinc-800 dark:text-zinc-200 focus:outline-none"
              >
                <option value="full">Full Match ($&)</option>
                <option value="group1">Capture Group 1 ($1)</option>
                <option value="group2">Capture Group 2 ($2)</option>
                <option value="named">Named Capture Group</option>
                <option value="json">Structured JSON Array</option>
              </select>
            </div>

            {extractionMode === 'named' && (
              <div>
                <label htmlFor="input-named-group-extract" className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1.5">
                  Group Name
                </label>
                <input
                  id="input-named-group-extract"
                  type="text"
                  value={namedGroupExtract}
                  onChange={(e) => setNamedGroupExtract(e.target.value)}
                  placeholder="e.g. user, domain, year"
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-xl text-xs font-medium text-zinc-800 dark:text-zinc-200 focus:outline-none"
                />
              </div>
            )}

            {extractionMode !== 'json' && (
              <div>
                <label htmlFor="select-extract-delimiter" className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1.5">
                  Delimiter
                </label>
                <select
                  id="select-extract-delimiter"
                  value={extractDelimiter}
                  onChange={(e) => setExtractDelimiter(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-xl text-xs font-medium text-zinc-800 dark:text-zinc-200 focus:outline-none"
                >
                  <option value={'\n'}>New Line (\n)</option>
                  <option value={', '}>Comma Space (, )</option>
                  <option value={' '}>Single Space ( )</option>
                  <option value={'\t'}>Tab (\t)</option>
                  <option value="custom">Custom Delimiter</option>
                </select>
              </div>
            )}

            {extractDelimiter === 'custom' && extractionMode !== 'json' && (
              <div>
                <label htmlFor="input-custom-delimiter" className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1.5">
                  Custom Separator
                </label>
                <input
                  id="input-custom-delimiter"
                  type="text"
                  value={customDelimiter}
                  onChange={(e) => setCustomDelimiter(e.target.value)}
                  placeholder="e.g. | or ;"
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-xl text-xs font-medium text-zinc-800 dark:text-zinc-200 focus:outline-none"
                />
              </div>
            )}
          </div>

          <textarea
            readOnly
            value={extractedText}
            rows={10}
            placeholder="Extracted items will appear here..."
            className="w-full p-3.5 font-mono text-xs sm:text-sm bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-2xl text-zinc-900 dark:text-zinc-100 focus:outline-none"
            id="extracted-matches-textarea"
          />
        </div>
      )}

      {/* TAB 5: STRING DIAGNOSTICS */}
      {activeTab === 'diagnostics' && (
        <div className="p-4 sm:p-5 bg-white dark:bg-[#1e1f20] border border-zinc-200/80 dark:border-zinc-800 rounded-3xl shadow-sm flex flex-col gap-4" id="panel-string-diagnostics">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-white">
              Unicode & String Structure Diagnostics
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Detailed UTF-16 vs Unicode code-point counts, UTF-8 byte calculations, and line-ending classifications.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            <div className="p-3.5 bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-2xl flex flex-col">
              <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">UTF-16 Code Units</span>
              <span className="text-xl font-bold font-mono text-zinc-900 dark:text-white mt-1">
                {analysis.diagnostics.codeUnits}
              </span>
              <span className="text-[10px] text-zinc-500 mt-0.5">String.length in JS</span>
            </div>

            <div className="p-3.5 bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-2xl flex flex-col">
              <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Unicode Code Points</span>
              <span className="text-xl font-bold font-mono text-indigo-600 dark:text-indigo-400 mt-1">
                {analysis.diagnostics.codePoints}
              </span>
              <span className="text-[10px] text-zinc-500 mt-0.5">Handles emojis & surrogates</span>
            </div>

            <div className="p-3.5 bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-2xl flex flex-col">
              <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">UTF-8 Byte Size</span>
              <span className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
                {analysis.diagnostics.utf8Bytes}
              </span>
              <span className="text-[10px] text-zinc-500 mt-0.5">Encoded network payload</span>
            </div>

            <div className="p-3.5 bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-2xl flex flex-col">
              <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Line Ending Format</span>
              <span className="text-xl font-bold font-mono text-indigo-600 dark:text-indigo-400 mt-1">
                {analysis.diagnostics.lineEndings.dominant}
              </span>
              <span className="text-[10px] text-zinc-500 mt-0.5">
                LF: {analysis.diagnostics.lineEndings.lfCount} | CRLF: {analysis.diagnostics.lineEndings.crlfCount}
              </span>
            </div>

            <div className="p-3.5 bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-2xl flex flex-col">
              <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Line Count</span>
              <span className="text-xl font-bold font-mono text-zinc-900 dark:text-white mt-1">
                {analysis.diagnostics.lineCount}
              </span>
            </div>

            <div className="p-3.5 bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-2xl flex flex-col">
              <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Word Count</span>
              <span className="text-xl font-bold font-mono text-zinc-900 dark:text-white mt-1">
                {analysis.diagnostics.wordCount}
              </span>
            </div>

            <div className="p-3.5 bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-2xl flex flex-col">
              <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Whitespace Chars</span>
              <span className="text-xl font-bold font-mono text-zinc-900 dark:text-white mt-1">
                {analysis.diagnostics.whitespaceCount}
              </span>
            </div>

            <div className="p-3.5 bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-2xl flex flex-col">
              <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Digits / Letters</span>
              <span className="text-xl font-bold font-mono text-zinc-900 dark:text-white mt-1">
                {analysis.diagnostics.digitCount} / {analysis.diagnostics.letterCount}
              </span>
            </div>
          </div>

          {/* Leading & Trailing whitespace breakdown */}
          <div className="p-3.5 bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div>
              <span className="font-bold text-zinc-700 dark:text-zinc-300">Leading Whitespace: </span>
              <span className="font-mono font-semibold text-zinc-600 dark:text-zinc-400">
                {analysis.diagnostics.whitespaceDetails.leadingCount} characters
              </span>
            </div>
            <div>
              <span className="font-bold text-zinc-700 dark:text-zinc-300">Trailing Whitespace: </span>
              <span className="font-mono font-semibold text-zinc-600 dark:text-zinc-400">
                {analysis.diagnostics.whitespaceDetails.trailingCount} characters
              </span>
            </div>
            <div>
              <span className="font-bold text-zinc-700 dark:text-zinc-300">State: </span>
              <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                {analysis.diagnostics.isEmpty ? 'Empty String' : analysis.diagnostics.isBlank ? 'Blank (Whitespace Only)' : 'Populated'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* PRESETS MODAL */}
      {showPresetsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200" id="regex-presets-modal">
          <div className="w-full max-w-2xl bg-white dark:bg-[#1e1f20] border border-zinc-200 dark:border-zinc-800 rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col gap-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white">
                  Built-in Regex Presets & Patterns
                </h3>
              </div>
              <button
                onClick={() => setShowPresetsModal(false)}
                className="text-xs font-semibold text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 p-1 cursor-pointer"
              >
                ✕ Close
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {REGEX_PRESETS.map((p) => (
                <div
                  key={p.id}
                  onClick={() => handleApplyPreset(p)}
                  className="p-4 bg-zinc-50 dark:bg-zinc-900/80 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 border border-zinc-200 dark:border-zinc-800 hover:border-indigo-300 dark:hover:border-indigo-700 rounded-2xl transition-all cursor-pointer flex flex-col gap-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-zinc-900 dark:text-white">{p.name}</span>
                      <span className="px-2 py-0.5 text-[10px] font-semibold bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-md">
                        {p.category}
                      </span>
                    </div>
                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                      Load Pattern →
                    </span>
                  </div>

                  <code className="p-2 bg-white dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs font-mono text-indigo-700 dark:text-indigo-300 break-all">
                    /{p.pattern}/{p.flags}
                  </code>

                  <p className="text-xs text-zinc-600 dark:text-zinc-400">
                    {p.description}
                  </p>
                  <p className="text-[11px] text-amber-700 dark:text-amber-400/90 italic">
                    {p.disclaimer}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SEO Technical Guide & Educational Content */}
      <SeoGuideContent seoData={seoData} onNavigate={onNavigate} />

      {/* Value Props */}
      <ValuePropsSection />
    </div>
  );
};

export default RegexTesterPage;
