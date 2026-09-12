import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  renderMarkdownToHtml,
  extractPlainTextFromMarkdown,
  calculateMarkdownStats,
  generateStandaloneHtmlDocument,
  insertMarkdownSyntax,
  MARKDOWN_PRESETS,
  MarkdownSyntaxAction,
  MarkdownRenderOptions,
  DEFAULT_MARKDOWN_OPTIONS,
  MarkdownPreset,
} from '../lib/markdownEngine';
import { SeoRouteData } from '../lib/seoEngine';
import { SeoGuideContent } from './Converter/SeoGuideContent';
import { ValuePropsSection } from './Converter/ValuePropsSection';
import {
  FileText,
  Copy,
  Check,
  RotateCcw,
  Download,
  Eye,
  Columns,
  Maximize2,
  Minimize2,
  Bold,
  Italic,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  Quote,
  Code,
  FileCode,
  Link as LinkIcon,
  Image as ImageIcon,
  List,
  ListOrdered,
  CheckSquare,
  Table as TableIcon,
  Minus,
  Sparkles,
  ShieldCheck,
  Clock,
  Hash,
  Layers,
  HelpCircle,
  Upload,
  Info,
  ChevronDown,
} from 'lucide-react';

interface MarkdownLivePreviewPageProps {
  seoData: SeoRouteData;
  onNavigate: (path: string) => void;
}

export const MarkdownLivePreviewPage: React.FC<MarkdownLivePreviewPageProps> = ({
  seoData,
  onNavigate,
}) => {
  // State
  const [markdown, setMarkdown] = useState<string>(MARKDOWN_PRESETS[0].content);
  const [selectedPresetId, setSelectedPresetId] = useState<string>('gfm-showcase');
  const [viewMode, setViewMode] = useState<'split' | 'editor' | 'preview'>('split');
  const [options, setOptions] = useState<MarkdownRenderOptions>(DEFAULT_MARKDOWN_OPTIONS);
  const [activeTab, setActiveTab] = useState<'preview' | 'html-source' | 'plain-text' | 'stats'>('preview');
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [showCheatSheet, setShowCheatSheet] = useState<boolean>(false);
  const [showPresetsModal, setShowPresetsModal] = useState<boolean>(false);
  const [cursorPosition, setCursorPosition] = useState<{ line: number; col: number }>({ line: 1, col: 1 });

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const previewRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Rendered HTML output
  const renderedHtml = useMemo(() => {
    return renderMarkdownToHtml(markdown, options);
  }, [markdown, options]);

  // Plain text extraction
  const plainText = useMemo(() => {
    return extractPlainTextFromMarkdown(markdown);
  }, [markdown]);

  // Statistical & Unicode analysis
  const stats = useMemo(() => {
    return calculateMarkdownStats(markdown);
  }, [markdown]);

  // Track cursor position in textarea
  const handleTextareaSelectionChange = () => {
    if (!textareaRef.current) return;
    const text = textareaRef.current.value;
    const pos = textareaRef.current.selectionStart;
    const lines = text.substring(0, pos).split('\n');
    const currentLine = lines.length;
    const currentCol = lines[lines.length - 1].length + 1;
    setCursorPosition({ line: currentLine, col: currentCol });
  };

  // Keyboard shortcuts handler in textarea
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Tab key handling (2 spaces)
    if (e.key === 'Tab') {
      e.preventDefault();
      if (!textareaRef.current) return;
      const start = textareaRef.current.selectionStart;
      const end = textareaRef.current.selectionEnd;
      const val = textareaRef.current.value;
      const newText = val.substring(0, start) + '  ' + val.substring(end);
      setMarkdown(newText);
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = start + 2;
          textareaRef.current.selectionEnd = start + 2;
        }
      }, 0);
      return;
    }

    // Ctrl/Cmd + B: Bold
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
      e.preventDefault();
      applySyntaxAction('bold');
      return;
    }

    // Ctrl/Cmd + I: Italic
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'i') {
      e.preventDefault();
      applySyntaxAction('italic');
      return;
    }

    // Ctrl/Cmd + K: Link
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      applySyntaxAction('link');
      return;
    }
  };

  // Apply Toolbar Syntax Insertion
  const applySyntaxAction = (action: MarkdownSyntaxAction) => {
    if (!textareaRef.current) return;
    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const { newText, newSelectionStart, newSelectionEnd } = insertMarkdownSyntax(
      markdown,
      start,
      end,
      action
    );
    setMarkdown(newText);
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.selectionStart = newSelectionStart;
        textareaRef.current.selectionEnd = newSelectionEnd;
      }
    }, 0);
  };

  // Preset loader
  const handleSelectPreset = (preset: MarkdownPreset) => {
    setMarkdown(preset.content);
    setSelectedPresetId(preset.id);
    setShowPresetsModal(false);
  };

  // Copy helper
  const handleCopy = useCallback((textToCopy: string, sectionId: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(textToCopy).then(() => {
        setCopiedSection(sectionId);
        setTimeout(() => setCopiedSection(null), 2000);
      });
    }
  }, []);

  // Download Markdown file (.md)
  const handleDownloadMarkdown = () => {
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'document.md';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Download Standalone Styled HTML file (.html)
  const handleDownloadHtml = () => {
    const fullHtml = generateStandaloneHtmlDocument(renderedHtml, 'Markdown Export - Zapixal');
    const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'document.html';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // File Upload Handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content !== undefined) {
        setMarkdown(content);
        setSelectedPresetId('custom');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="w-full py-2 sm:py-4 px-2 sm:px-4 max-w-7xl mx-auto flex flex-col gap-6">
      {/* Action Toolbar */}
      <header className="flex flex-wrap items-center justify-between gap-3 p-3 sm:p-4 bg-white dark:bg-[#1e1f20] border border-zinc-200/80 dark:border-zinc-800 rounded-2xl">
        <span className="text-xs sm:text-sm font-bold text-zinc-800 dark:text-zinc-200">
          GitHub-Flavored Markdown (GFM) Live Editor & HTML Renderer
        </span>

        <div className="flex flex-wrap items-center gap-2">
          <button
            id="markdown-presets-btn"
            onClick={() => setShowPresetsModal(true)}
            className="px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 text-xs font-medium hover:bg-zinc-50 dark:hover:bg-zinc-700 transition flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Templates</span>
            <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
          </button>

          <button
            id="markdown-cheatsheet-btn"
            onClick={() => setShowCheatSheet(!showCheatSheet)}
            className="px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 text-xs font-medium hover:bg-zinc-50 dark:hover:bg-zinc-700 transition flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <HelpCircle className="w-3.5 h-3.5 text-indigo-500" />
            <span>Syntax Guide</span>
          </button>
        </div>
      </header>

      {/* Syntax Cheat Sheet Drawer if open */}
      {showCheatSheet && (
        <section className="p-4 sm:p-6 rounded-3xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-950/20 shadow-sm animate-in fade-in duration-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <Code className="w-4 h-4 text-indigo-500" />
              GFM Syntax Quick Reference
            </h3>
            <button
              onClick={() => setShowCheatSheet(false)}
              className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-white font-medium"
            >
              Close
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
            <div className="p-3 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
              <span className="font-bold text-zinc-900 dark:text-white block mb-1">Headings & Rules</span>
              <code className="text-pink-600 dark:text-pink-400 font-mono block"># Heading 1</code>
              <code className="text-pink-600 dark:text-pink-400 font-mono block">## Heading 2</code>
              <code className="text-pink-600 dark:text-pink-400 font-mono block">--- (Horizontal Rule)</code>
            </div>

            <div className="p-3 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
              <span className="font-bold text-zinc-900 dark:text-white block mb-1">Emphasis & Inline</span>
              <code className="text-pink-600 dark:text-pink-400 font-mono block">**bold** or *italic*</code>
              <code className="text-pink-600 dark:text-pink-400 font-mono block">~~strikethrough~~</code>
              <code className="text-pink-600 dark:text-pink-400 font-mono block">`inline code`</code>
            </div>

            <div className="p-3 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
              <span className="font-bold text-zinc-900 dark:text-white block mb-1">Lists & Tasks</span>
              <code className="text-pink-600 dark:text-pink-400 font-mono block">- Bullet item</code>
              <code className="text-pink-600 dark:text-pink-400 font-mono block">1. Numbered item</code>
              <code className="text-pink-600 dark:text-pink-400 font-mono block">- [ ] Task / - [x] Done</code>
            </div>

            <div className="p-3 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
              <span className="font-bold text-zinc-900 dark:text-white block mb-1">Links & Images</span>
              <code className="text-pink-600 dark:text-pink-400 font-mono block">[Link Text](url)</code>
              <code className="text-pink-600 dark:text-pink-400 font-mono block">![Alt text](image_url)</code>
              <code className="text-pink-600 dark:text-pink-400 font-mono block">&lt;https://example.com&gt;</code>
            </div>

            <div className="p-3 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
              <span className="font-bold text-zinc-900 dark:text-white block mb-1">Blockquotes & Code</span>
              <code className="text-pink-600 dark:text-pink-400 font-mono block">&gt; Blockquote text</code>
              <code className="text-pink-600 dark:text-pink-400 font-mono block">```ts ... ```</code>
            </div>

            <div className="p-3 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
              <span className="font-bold text-zinc-900 dark:text-white block mb-1">GFM Tables</span>
              <code className="text-pink-600 dark:text-pink-400 font-mono block">| Header | Header |</code>
              <code className="text-pink-600 dark:text-pink-400 font-mono block">| :--- | :---: |</code>
              <code className="text-pink-600 dark:text-pink-400 font-mono block">| Cell 1 | Cell 2 |</code>
            </div>
          </div>
        </section>
      )}

      {/* Editor & View Control Bar */}
      <section className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-3 sm:p-4 flex flex-col gap-3">
        {/* Top Control Bar: Formatting Toolbar + View Mode Selector */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-3">
          {/* Formatting Syntax Buttons */}
          <div className="flex flex-wrap items-center gap-1">
            <button
              onClick={() => applySyntaxAction('h1')}
              title="Heading 1 (#)"
              className="p-1.5 rounded-lg text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
            >
              <Heading1 className="w-4 h-4" />
            </button>
            <button
              onClick={() => applySyntaxAction('h2')}
              title="Heading 2 (##)"
              className="p-1.5 rounded-lg text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
            >
              <Heading2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => applySyntaxAction('h3')}
              title="Heading 3 (###)"
              className="p-1.5 rounded-lg text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
            >
              <Heading3 className="w-4 h-4" />
            </button>

            <div className="w-px h-5 bg-zinc-200 dark:bg-zinc-800 mx-1" />

            <button
              onClick={() => applySyntaxAction('bold')}
              title="Bold (**text** or Ctrl+B)"
              className="p-1.5 rounded-lg text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
            >
              <Bold className="w-4 h-4" />
            </button>
            <button
              onClick={() => applySyntaxAction('italic')}
              title="Italic (*text* or Ctrl+I)"
              className="p-1.5 rounded-lg text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
            >
              <Italic className="w-4 h-4" />
            </button>
            <button
              onClick={() => applySyntaxAction('strikethrough')}
              title="Strikethrough (~~text~~)"
              className="p-1.5 rounded-lg text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
            >
              <Strikethrough className="w-4 h-4" />
            </button>

            <div className="w-px h-5 bg-zinc-200 dark:bg-zinc-800 mx-1" />

            <button
              onClick={() => applySyntaxAction('quote')}
              title="Blockquote (>)"
              className="p-1.5 rounded-lg text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
            >
              <Quote className="w-4 h-4" />
            </button>
            <button
              onClick={() => applySyntaxAction('inline-code')}
              title="Inline Code (`code`)"
              className="p-1.5 rounded-lg text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
            >
              <Code className="w-4 h-4" />
            </button>
            <button
              onClick={() => applySyntaxAction('code-block')}
              title="Fenced Code Block (```)"
              className="p-1.5 rounded-lg text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
            >
              <FileCode className="w-4 h-4" />
            </button>

            <div className="w-px h-5 bg-zinc-200 dark:bg-zinc-800 mx-1" />

            <button
              onClick={() => applySyntaxAction('link')}
              title="Link ([title](url) or Ctrl+K)"
              className="p-1.5 rounded-lg text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
            >
              <LinkIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => applySyntaxAction('image')}
              title="Image (![alt](url))"
              className="p-1.5 rounded-lg text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
            >
              <ImageIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => applySyntaxAction('bullet-list')}
              title="Bullet List (-)"
              className="p-1.5 rounded-lg text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => applySyntaxAction('numbered-list')}
              title="Numbered List (1.)"
              className="p-1.5 rounded-lg text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
            >
              <ListOrdered className="w-4 h-4" />
            </button>
            <button
              onClick={() => applySyntaxAction('task-list')}
              title="GFM Task List (- [ ])"
              className="p-1.5 rounded-lg text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
            >
              <CheckSquare className="w-4 h-4" />
            </button>
            <button
              onClick={() => applySyntaxAction('table')}
              title="GFM Table"
              className="p-1.5 rounded-lg text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
            >
              <TableIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => applySyntaxAction('hr')}
              title="Horizontal Rule (---)"
              className="p-1.5 rounded-lg text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
            >
              <Minus className="w-4 h-4" />
            </button>
          </div>

          {/* View Mode Switcher */}
          <div className="flex items-center bg-zinc-100 dark:bg-zinc-800 rounded-xl p-1 text-xs">
            <button
              onClick={() => setViewMode('split')}
              className={`px-2.5 py-1 rounded-lg font-medium transition flex items-center gap-1.5 ${
                viewMode === 'split'
                  ? 'bg-white dark:bg-zinc-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              <Columns className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Split View</span>
            </button>
            <button
              onClick={() => setViewMode('editor')}
              className={`px-2.5 py-1 rounded-lg font-medium transition flex items-center gap-1.5 ${
                viewMode === 'editor'
                  ? 'bg-white dark:bg-zinc-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Editor Only</span>
            </button>
            <button
              onClick={() => setViewMode('preview')}
              className={`px-2.5 py-1 rounded-lg font-medium transition flex items-center gap-1.5 ${
                viewMode === 'preview'
                  ? 'bg-white dark:bg-zinc-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Preview Only</span>
            </button>
          </div>
        </div>

        {/* Main Work Area: Editor & Preview Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch min-h-[560px]">
          {/* EDITOR COLUMN */}
          {(viewMode === 'split' || viewMode === 'editor') && (
            <div
              className={`flex flex-col rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/40 p-3 sm:p-4 ${
                viewMode === 'editor' ? 'lg:col-span-2' : ''
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-indigo-500" />
                    Markdown Source
                  </span>
                  <span className="text-[11px] font-mono text-zinc-400">
                    Ln {cursorPosition.line}, Col {cursorPosition.col}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept=".md,.markdown,.txt"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    title="Upload .md file"
                    className="px-2 py-1 rounded-lg text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition flex items-center gap-1"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Open</span>
                  </button>

                  <button
                    onClick={() => handleCopy(markdown, 'markdown-source')}
                    title="Copy Raw Markdown"
                    className="px-2 py-1 rounded-lg text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition flex items-center gap-1"
                  >
                    {copiedSection === 'markdown-source' ? (
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span className="hidden sm:inline">Copy</span>
                  </button>

                  <button
                    onClick={() => setMarkdown('')}
                    title="Clear editor"
                    className="px-2 py-1 rounded-lg text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition flex items-center gap-1"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Clear</span>
                  </button>
                </div>
              </div>

              {/* Textarea */}
              <div className="flex-1 relative min-h-[480px]">
                <textarea
                  id="markdown-source-editor"
                  ref={textareaRef}
                  value={markdown}
                  onChange={(e) => setMarkdown(e.target.value)}
                  onSelect={handleTextareaSelectionChange}
                  onClick={handleTextareaSelectionChange}
                  onKeyUp={handleTextareaSelectionChange}
                  onKeyDown={handleKeyDown}
                  placeholder="Type or paste Markdown content here..."
                  spellCheck="false"
                  className="w-full h-full min-h-[480px] p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 font-mono text-xs sm:text-sm leading-relaxed resize-y focus:outline-hidden focus:ring-2 focus:ring-indigo-500 shadow-inner"
                />
              </div>

              {/* Character / Word count footer */}
              <div className="mt-2 pt-2 border-t border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 gap-2">
                <div className="flex items-center gap-3">
                  <span>{stats.wordCount.toLocaleString()} words</span>
                  <span>•</span>
                  <span>{stats.codeUnits.toLocaleString()} chars</span>
                  <span>•</span>
                  <span>{stats.lineCount.toLocaleString()} lines</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleDownloadMarkdown}
                    className="text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 font-medium"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download .md
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* PREVIEW / HTML / METRICS COLUMN */}
          {(viewMode === 'split' || viewMode === 'preview') && (
            <div
              className={`flex flex-col rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/40 p-3 sm:p-4 ${
                viewMode === 'preview' ? 'lg:col-span-2' : ''
              }`}
            >
              {/* Output Tabs */}
              <div className="flex flex-wrap items-center justify-between mb-2 gap-2">
                <div className="flex items-center bg-zinc-200/70 dark:bg-zinc-800/80 rounded-xl p-1 text-xs">
                  <button
                    onClick={() => setActiveTab('preview')}
                    className={`px-2.5 py-1 rounded-lg font-medium transition flex items-center gap-1.5 ${
                      activeTab === 'preview'
                        ? 'bg-white dark:bg-zinc-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                        : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Preview
                  </button>
                  <button
                    onClick={() => setActiveTab('html-source')}
                    className={`px-2.5 py-1 rounded-lg font-medium transition flex items-center gap-1.5 ${
                      activeTab === 'html-source'
                        ? 'bg-white dark:bg-zinc-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                        : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                    }`}
                  >
                    <Code className="w-3.5 h-3.5" />
                    Sanitized HTML
                  </button>
                  <button
                    onClick={() => setActiveTab('plain-text')}
                    className={`px-2.5 py-1 rounded-lg font-medium transition flex items-center gap-1.5 ${
                      activeTab === 'plain-text'
                        ? 'bg-white dark:bg-zinc-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                        : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    Plain Text
                  </button>
                  <button
                    onClick={() => setActiveTab('stats')}
                    className={`px-2.5 py-1 rounded-lg font-medium transition flex items-center gap-1.5 ${
                      activeTab === 'stats'
                        ? 'bg-white dark:bg-zinc-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                        : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                    }`}
                  >
                    <Hash className="w-3.5 h-3.5" />
                    Stats
                  </button>
                </div>

                <div className="flex items-center gap-1.5">
                  {activeTab === 'preview' && (
                    <button
                      onClick={handleDownloadHtml}
                      title="Download styled HTML document"
                      className="px-2.5 py-1 rounded-lg text-xs font-medium bg-indigo-600 text-white hover:bg-indigo-700 transition flex items-center gap-1 shadow-xs"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Export HTML
                    </button>
                  )}

                  {activeTab === 'html-source' && (
                    <button
                      onClick={() => handleCopy(renderedHtml, 'html-output')}
                      className="px-2.5 py-1 rounded-lg text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition flex items-center gap-1"
                    >
                      {copiedSection === 'html-output' ? (
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                      Copy HTML
                    </button>
                  )}

                  {activeTab === 'plain-text' && (
                    <button
                      onClick={() => handleCopy(plainText, 'plain-text-output')}
                      className="px-2.5 py-1 rounded-lg text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition flex items-center gap-1"
                    >
                      {copiedSection === 'plain-text-output' ? (
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                      Copy Plain Text
                    </button>
                  )}
                </div>
              </div>

              {/* Tab Contents */}
              <div className="flex-1 min-h-[480px] bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 overflow-y-auto max-h-[700px] shadow-inner">
                {/* 1. Live Rendered Preview */}
                {activeTab === 'preview' && (
                  <div ref={previewRef} className="markdown-preview-root w-full">
                    {renderedHtml ? (
                      <div
                        id="markdown-rendered-view"
                        dangerouslySetInnerHTML={{ __html: renderedHtml }}
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center min-h-[300px] text-zinc-400 text-center">
                        <FileText className="w-12 h-12 stroke-[1.5] mb-2 opacity-40" />
                        <p className="text-sm font-medium">No Markdown content</p>
                        <p className="text-xs text-zinc-500 mt-1">
                          Start typing in the editor on the left or select a template above.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* 2. Sanitized HTML Source View */}
                {activeTab === 'html-source' && (
                  <pre className="font-mono text-xs sm:text-sm text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap break-all leading-relaxed">
                    {renderedHtml || '<!-- No HTML generated -->'}
                  </pre>
                )}

                {/* 3. Extracted Plain Text View */}
                {activeTab === 'plain-text' && (
                  <div className="font-sans text-xs sm:text-sm text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap leading-relaxed">
                    {plainText || 'No text extracted.'}
                  </div>
                )}

                {/* 4. Statistical & Unicode Diagnostics View */}
                {activeTab === 'stats' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="p-3 bg-zinc-50 dark:bg-zinc-800/60 rounded-xl border border-zinc-200 dark:border-zinc-700">
                        <span className="text-[11px] text-zinc-500 dark:text-zinc-400 uppercase font-bold block">
                          Word Count
                        </span>
                        <span className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white">
                          {stats.wordCount.toLocaleString()}
                        </span>
                      </div>

                      <div className="p-3 bg-zinc-50 dark:bg-zinc-800/60 rounded-xl border border-zinc-200 dark:border-zinc-700">
                        <span className="text-[11px] text-zinc-500 dark:text-zinc-400 uppercase font-bold block">
                          Unicode Points
                        </span>
                        <span className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white">
                          {stats.codePoints.toLocaleString()}
                        </span>
                      </div>

                      <div className="p-3 bg-zinc-50 dark:bg-zinc-800/60 rounded-xl border border-zinc-200 dark:border-zinc-700">
                        <span className="text-[11px] text-zinc-500 dark:text-zinc-400 uppercase font-bold block">
                          UTF-8 Bytes
                        </span>
                        <span className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white">
                          {stats.utf8Bytes.toLocaleString()} B
                        </span>
                      </div>

                      <div className="p-3 bg-zinc-50 dark:bg-zinc-800/60 rounded-xl border border-zinc-200 dark:border-zinc-700">
                        <span className="text-[11px] text-zinc-500 dark:text-zinc-400 uppercase font-bold block">
                          Reading Time
                        </span>
                        <span className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white">
                          ~{stats.readingTimeMinutes} min
                        </span>
                      </div>
                    </div>

                    {/* Structural Breakdown */}
                    <div className="p-4 bg-zinc-50 dark:bg-zinc-800/40 rounded-2xl border border-zinc-200 dark:border-zinc-700">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-3 flex items-center gap-2">
                        <Layers className="w-4 h-4 text-indigo-500" />
                        Document Structure
                      </h4>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                        <div className="flex justify-between py-1 border-b border-zinc-200 dark:border-zinc-700">
                          <span className="text-zinc-500">Lines</span>
                          <span className="font-bold text-zinc-900 dark:text-white">{stats.lineCount}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-zinc-200 dark:border-zinc-700">
                          <span className="text-zinc-500">Paragraphs</span>
                          <span className="font-bold text-zinc-900 dark:text-white">{stats.paragraphCount}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-zinc-200 dark:border-zinc-700">
                          <span className="text-zinc-500">Headings</span>
                          <span className="font-bold text-zinc-900 dark:text-white">{stats.headingCount}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-zinc-200 dark:border-zinc-700">
                          <span className="text-zinc-500">Links</span>
                          <span className="font-bold text-zinc-900 dark:text-white">{stats.linkCount}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-zinc-200 dark:border-zinc-700">
                          <span className="text-zinc-500">Images</span>
                          <span className="font-bold text-zinc-900 dark:text-white">{stats.imageCount}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-zinc-200 dark:border-zinc-700">
                          <span className="text-zinc-500">Code Blocks</span>
                          <span className="font-bold text-zinc-900 dark:text-white">{stats.codeBlockCount}</span>
                        </div>
                      </div>
                    </div>

                    {/* Task Progress */}
                    {stats.taskCount.total > 0 && (
                      <div className="p-4 bg-zinc-50 dark:bg-zinc-800/40 rounded-2xl border border-zinc-200 dark:border-zinc-700">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                            Checklist Progress
                          </span>
                          <span className="text-xs font-mono text-zinc-500">
                            {stats.taskCount.completed} / {stats.taskCount.total} completed (
                            {Math.round((stats.taskCount.completed / stats.taskCount.total) * 100)}%)
                          </span>
                        </div>
                        <div className="w-full h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 transition-all duration-300"
                            style={{
                              width: `${(stats.taskCount.completed / stats.taskCount.total) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Preview Footer / Status */}
              <div className="mt-2 pt-2 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
                <span className="flex items-center gap-1.5 text-[11px]">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  XSS Protected • Safe Protocols & Referrer Blocked
                </span>
                <span className="text-[11px]">Live AST</span>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Preset Templates Modal */}
      {showPresetsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 max-w-xl w-full p-5 sm:p-6 shadow-xl flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                Select a Markdown Template
              </h3>
              <button
                onClick={() => setShowPresetsModal(false)}
                className="text-zinc-400 hover:text-zinc-900 dark:hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 gap-2.5 max-h-[380px] overflow-y-auto pr-1">
              {MARKDOWN_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => handleSelectPreset(preset)}
                  className={`p-3.5 rounded-2xl border text-left transition flex flex-col gap-1 ${
                    selectedPresetId === preset.id
                      ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30'
                      : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-zinc-50/40 dark:bg-zinc-800/40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs sm:text-sm text-zinc-900 dark:text-white">
                      {preset.name}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 uppercase font-semibold">
                      {preset.category}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                    {preset.description}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Value Propositions / Trust Section */}
      <ValuePropsSection />

      {/* SEO Guide & FAQ Section */}
      {seoData && <SeoGuideContent seoData={seoData} onNavigate={onNavigate} />}
    </div>
  );
};
