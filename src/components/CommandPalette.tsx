import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Search, 
  X, 
  FileImage, 
  FileText, 
  Code, 
  Sparkles, 
  ArrowRight, 
  CornerDownLeft, 
  Palette, 
  Layers, 
  BookOpen,
  Sliders,
  Zap
} from 'lucide-react';
import { TOOL_REGISTRY, ToolDefinition } from '../lib/toolRegistry';
import { cn } from '../lib/utils';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (path: string) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onNavigate,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Focus input whenever modal opens
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Filter tools and guides based on search query
  const filteredResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      // Show top featured tools + quick links
      return TOOL_REGISTRY.slice(0, 12);
    }

    return TOOL_REGISTRY.filter((t) => {
      const matchName = t.name.toLowerCase().includes(q);
      const matchDesc = t.description.toLowerCase().includes(q);
      const matchCategory = t.category.toLowerCase().includes(q);
      const matchIntent = t.searchIntents?.some((intent) => intent.toLowerCase().includes(q));
      const matchCapabilities = t.capabilities?.some((cap) => cap.toLowerCase().includes(q));
      return matchName || matchDesc || matchCategory || matchIntent || matchCapabilities;
    }).slice(0, 15);
  }, [query]);

  // Keep selected index in range
  useEffect(() => {
    if (selectedIndex >= filteredResults.length) {
      setSelectedIndex(Math.max(0, filteredResults.length - 1));
    }
  }, [filteredResults, selectedIndex]);

  // Scroll active item into view
  useEffect(() => {
    if (!listRef.current) return;
    const activeEl = listRef.current.querySelector(`[data-index="${selectedIndex}"]`);
    if (activeEl) {
      activeEl.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  // Keyboard navigation inside modal
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredResults.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredResults.length) % Math.max(1, filteredResults.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredResults[selectedIndex]) {
        onNavigate(filteredResults[selectedIndex].route);
        onClose();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'images': return FileImage;
      case 'documents': return FileText;
      case 'developer': return Code;
      case 'text': return Layers;
      case 'utilities': return Palette;
      default: return Zap;
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div 
        className="w-full max-w-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-3.5 py-3 border-b border-zinc-200 dark:border-zinc-800 gap-2.5">
          <Search className="w-4 h-4 text-zinc-400 dark:text-zinc-500 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Search tools, formats, or tasks (e.g. JSON, PDF, HEIC)..."
            className="w-full bg-transparent text-sm text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 outline-none"
            aria-label="Search tools"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded-md text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono text-zinc-400 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div 
          ref={listRef}
          className="max-h-[60vh] overflow-y-auto p-1.5 space-y-0.5"
        >
          {filteredResults.length === 0 ? (
            <div className="py-8 px-4 text-center text-zinc-500 dark:text-zinc-400 text-xs">
              No tools matching &quot;{query}&quot;. Try &quot;PDF&quot;, &quot;JSON&quot;, &quot;HEIC&quot;, or &quot;Compress&quot;.
            </div>
          ) : (
            filteredResults.map((tool, idx) => {
              const isSelected = idx === selectedIndex;
              const CategoryIcon = getCategoryIcon(tool.category);

              return (
                <button
                  key={tool.id}
                  data-index={idx}
                  onClick={() => {
                    onNavigate(tool.route);
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors cursor-pointer group",
                    isSelected 
                      ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900" 
                      : "hover:bg-zinc-100 dark:hover:bg-zinc-800/70 text-zinc-800 dark:text-zinc-200"
                  )}
                >
                  <div className="flex items-center gap-2.5 min-w-0 pr-3">
                    <div className={cn(
                      "p-1.5 rounded-md shrink-0 transition-colors",
                      isSelected
                        ? "bg-white/20 text-white dark:bg-zinc-900/20 dark:text-zinc-900"
                        : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400"
                    )}>
                      <CategoryIcon className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0 flex items-baseline gap-2">
                      <span className="text-xs sm:text-sm font-semibold truncate">
                        {tool.name}
                      </span>
                      <span className={cn(
                        "text-[11px] truncate hidden sm:inline",
                        isSelected
                          ? "text-zinc-300 dark:text-zinc-600"
                          : "text-zinc-500 dark:text-zinc-400"
                      )}>
                        {tool.description}
                      </span>
                    </div>
                  </div>

                  <span className={cn(
                    "text-[10px] uppercase font-semibold tracking-wider shrink-0 px-1.5 py-0.5 rounded",
                    isSelected
                      ? "bg-white/20 text-white dark:bg-zinc-900/10 dark:text-zinc-900"
                      : "bg-zinc-100 dark:bg-zinc-800/80 text-zinc-500 dark:text-zinc-400"
                  )}>
                    {tool.category}
                  </span>
                </button>
              );
            })
          )}
        </div>

        {/* Footer shortcuts helper */}
        <div className="px-3.5 py-2 bg-zinc-50 dark:bg-[#1a1b1e] border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-zinc-200/80 dark:bg-zinc-800 rounded font-mono text-[10px]">↑↓</kbd>
              <span>navigate</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-zinc-200/80 dark:bg-zinc-800 rounded font-mono text-[10px]">↵</kbd>
              <span>select</span>
            </span>
          </div>
          <span className="text-zinc-400 dark:text-zinc-500 text-[10px]">
            {TOOL_REGISTRY.length} tools
          </span>
        </div>
      </div>
    </div>
  );
};
