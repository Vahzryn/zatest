import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Copy, 
  Check, 
  RefreshCw,
  Type,
  AlignLeft,
  Hash
} from 'lucide-react';

export function WordCharacterCounter() {
  const [text, setText] = useState('');
  const [isCopied, setIsCopied] = useState(false);

  const stats = {
    words: text.trim() ? text.trim().split(/\s+/).length : 0,
    characters: text.length,
    charactersNoSpaces: text.replace(/\s/g, '').length,
    paragraphs: text.trim() ? text.split(/\n+/).filter(p => p.trim().length > 0).length : 0,
    sentences: text.trim() ? text.split(/[.!?]+/).filter(s => s.trim().length > 0).length : 0,
    lines: text.trim() ? text.split(/\n/).length : 0
  };

  const handleCopy = async () => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text', err);
    }
  };

  const clearAll = () => setText('');

  return (
    <div className="max-w-5xl mx-auto px-2 sm:px-4 py-2 sm:py-4 space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mb-6">
        <StatCard icon={<Type />} label="Words" value={stats.words} color="blue" />
        <StatCard icon={<Hash />} label="Characters" value={stats.characters} color="sky" />
        <StatCard icon={<Hash />} label="No Spaces" value={stats.charactersNoSpaces} color="teal" />
        <StatCard icon={<AlignLeft />} label="Sentences" value={stats.sentences} color="emerald" />
        <StatCard icon={<FileText />} label="Paragraphs" value={stats.paragraphs} color="amber" />
        <StatCard icon={<AlignLeft />} label="Lines" value={stats.lines} color="indigo" />
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-xl overflow-hidden p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
            <FileText className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            Type or Paste Text
          </label>
          <div className="flex items-center gap-3">
            {text && (
              <>
                <button
                  onClick={clearAll}
                  className="text-xs font-semibold text-zinc-500 hover:text-zinc-900 dark:hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Clear
                </button>
                <button
                  onClick={handleCopy}
                  className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1 transition-colors cursor-pointer"
                >
                  {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {isCopied ? 'Copied!' : 'Copy Text'}
                </button>
              </>
            )}
          </div>
        </div>
        
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Start typing or paste your document here..."
          className="w-full h-64 sm:h-96 p-4 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 text-sm md:text-base text-zinc-800 dark:text-zinc-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-y transition-smooth leading-relaxed"
          spellCheck={false}
        />
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode, label: string, value: number, color: string }) {
  const colorMap: Record<string, string> = {
    blue: 'text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-950/60',
    sky: 'text-sky-600 dark:text-sky-400 bg-sky-100 dark:bg-sky-950/60',
    teal: 'text-teal-600 dark:text-teal-400 bg-teal-100 dark:bg-teal-950/60',
    emerald: 'text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/60',
    amber: 'text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/60',
    indigo: 'text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-950/60',
  };

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 shadow-sm p-4 flex flex-col items-center justify-center text-center space-y-2">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${colorMap[color]}`}>
        {React.cloneElement(icon as React.ReactElement<{className?: string}>, { className: 'w-4 h-4' })}
      </div>
      <div>
        <div className="text-2xl font-black text-zinc-900 dark:text-white leading-none mb-1">
          {value.toLocaleString()}
        </div>
        <div className="text-[10px] sm:text-xs font-semibold text-zinc-500 uppercase tracking-wider">
          {label}
        </div>
      </div>
    </div>
  );
}
