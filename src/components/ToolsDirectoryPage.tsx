import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { Breadcrumbs } from './Breadcrumbs';
import { TOOL_REGISTRY } from '../lib/toolRegistry';
import { 
  Zap, 
  Sliders, 
  FileImage, 
  ShieldCheck, 
  Search, 
  ArrowRight, 
  Grid,
  FileText,
  Code,
  RotateCcw
} from 'lucide-react';

interface ToolsDirectoryPageProps {
  onNavigate: (path: string) => void;
  initialCategory?: CategoryKey;
}

type CategoryKey = 'all' | 'images' | 'documents' | 'developer' | 'text' | 'utilities';

interface CategoryMeta {
  key: CategoryKey;
  title: string;
  badge: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

const CATEGORY_DEFINITIONS: Record<CategoryKey, CategoryMeta> = {
  all: {
    key: 'all',
    title: 'All Tools',
    badge: 'Directory',
    description: 'Complete collection of secure, browser-based utilities.',
    icon: Grid,
  },
  images: {
    key: 'images',
    title: 'Image Tools',
    badge: 'Optimization & Codecs',
    description: 'Compress, convert, resize, crop, and strip metadata from image files locally.',
    icon: FileImage,
  },
  documents: {
    key: 'documents',
    title: 'PDF & Documents',
    badge: 'Local Documents',
    description: 'Extract PDF pages, render images, and compress documents in browser memory.',
    icon: FileText,
  },
  developer: {
    key: 'developer',
    title: 'Developer Tools',
    badge: 'Code, Formats & Tokens',
    description: 'Format JSON, convert CSV, decode JWT tokens, and test Regex securely.',
    icon: Code,
  },
  text: {
    key: 'text',
    title: 'Text Tools',
    badge: 'Markdown & Comparison',
    description: 'Live Markdown previewer, side-by-side text diff, and text analysis utilities.',
    icon: FileText,
  },
  utilities: {
    key: 'utilities',
    title: 'Utilities & Design',
    badge: 'Color & Analysis',
    description: 'Extract color palettes, analyze HEX codes, and inspect visual assets.',
    icon: ShieldCheck,
  },
};

const ALL_CATEGORY_KEYS: CategoryKey[] = ['all', 'images', 'documents', 'developer', 'text', 'utilities'];

export const ToolsDirectoryPage: React.FC<ToolsDirectoryPageProps> = ({ onNavigate, initialCategory = 'all' }) => {
  const [selectedCategory, setSelectedCategory] = useState<CategoryKey>(initialCategory);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const toolsSectionRef = useRef<HTMLDivElement>(null);

  // Synchronize state when initialCategory prop changes (e.g. browser back/forward or external navigation)
  useEffect(() => {
    setSelectedCategory(initialCategory);
  }, [initialCategory]);

  const activeCategoryMeta = CATEGORY_DEFINITIONS[selectedCategory] || CATEGORY_DEFINITIONS.all;
  const ActiveCategoryIcon = activeCategoryMeta.icon;

  const breadcrumbs = useMemo(() => {
    const list = [
      { name: 'Home', url: '/' },
      { name: 'Tools Directory', url: '/tools' },
    ];
    if (selectedCategory !== 'all') {
      list.push({ name: activeCategoryMeta.title, url: `/tools/${selectedCategory}` });
    }
    return list;
  }, [selectedCategory, activeCategoryMeta]);

  const filteredTools = useMemo(() => {
    return TOOL_REGISTRY.filter((tool) => {
      const matchesCategory = selectedCategory === 'all' || tool.category === selectedCategory;
      const query = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !query ||
        tool.name.toLowerCase().includes(query) ||
        tool.description.toLowerCase().includes(query) ||
        tool.route.toLowerCase().includes(query) ||
        tool.searchIntents.some(intent => intent.toLowerCase().includes(query));
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  const categoryCounts = useMemo(() => {
    const counts: Record<CategoryKey, number> = {
      all: TOOL_REGISTRY.length,
      images: 0,
      documents: 0,
      developer: 0,
      text: 0,
      utilities: 0,
    };
    TOOL_REGISTRY.forEach((t) => {
      if (counts[t.category as CategoryKey] !== undefined) {
        counts[t.category as CategoryKey]++;
      }
    });
    return counts;
  }, []);

  const scrollToToolList = useCallback((options?: { force?: boolean }) => {
    if (typeof window === 'undefined' || !toolsSectionRef.current) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const behavior: ScrollBehavior = prefersReducedMotion ? 'auto' : 'smooth';

    // Header is h-14 (56px) on mobile (<640px), h-16 (64px) on sm+.
    // Add clearance so section header is comfortably visible below the sticky header.
    const headerOffset = window.innerWidth < 640 ? 64 : 76;
    const rect = toolsSectionRef.current.getBoundingClientRect();

    // Avoid jumping if results section is already positioned at target below the header
    const isAlreadyAtTarget = Math.abs(rect.top - headerOffset) < 16;
    if (!options?.force && isAlreadyAtTarget) {
      return;
    }

    const targetY = window.scrollY + rect.top - headerOffset;

    window.scrollTo({
      top: Math.max(0, targetY),
      behavior,
    });
  }, []);

  const handleSelectCategory = (catKey: CategoryKey) => {
    setSelectedCategory(catKey);
    if (catKey === 'all') {
      onNavigate('/tools');
    } else {
      onNavigate(`/tools/${catKey}`);
    }
    // Defer scrolling so state update & DOM re-render compute accurate coordinates
    requestAnimationFrame(() => {
      scrollToToolList({ force: true });
    });
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    handleSelectCategory('all');
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8 py-2 sm:py-6 animate-in fade-in duration-300">
      {/* Header & Breadcrumbs */}
      <div className="text-center space-y-2">
        <Breadcrumbs items={breadcrumbs} onNavigate={onNavigate} />
        <h1 className="text-2xl sm:text-4xl font-black text-zinc-900 dark:text-white tracking-tight">
          Tools Directory
        </h1>
        <p className="max-w-2xl mx-auto text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 font-medium leading-relaxed">
          Browser-based utilities for image optimization, PDF processing, developer formatting, and media extraction.
        </p>
      </div>

      {/* Category Overview Cards (All 6 Categories with visible selection) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3">
        {ALL_CATEGORY_KEYS.map((catKey) => {
          const cat = CATEGORY_DEFINITIONS[catKey];
          const Icon = cat.icon;
          const isActive = selectedCategory === catKey;
          const count = categoryCounts[catKey];

          return (
            <button
              key={catKey}
              id={`category-filter-${catKey}`}
              type="button"
              onClick={() => handleSelectCategory(catKey)}
              aria-pressed={isActive}
              aria-label={`${cat.title}, ${count} tools available`}
              className={`flex flex-col items-start p-3 sm:p-3.5 rounded-xl border text-left transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                isActive
                  ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 border-zinc-900 dark:border-white shadow-xs'
                  : 'bg-white dark:bg-[#282a2e] border-zinc-200/80 dark:border-zinc-700/80 text-zinc-800 dark:text-zinc-200 hover:border-zinc-400 dark:hover:border-zinc-500'
              }`}
            >
              <div className="w-full flex items-center justify-between mb-1.5">
                <div className={`p-1.5 rounded-lg ${isActive ? 'bg-white/20 text-white dark:bg-zinc-900/20 dark:text-zinc-900' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'}`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded ${isActive ? 'bg-white/20 text-white dark:bg-zinc-900/10 dark:text-zinc-900' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300'}`}>
                  {count}
                </span>
              </div>
              <span className="text-xs font-bold leading-snug">{cat.title}</span>
              <span className={`text-[11px] mt-0.5 font-normal line-clamp-2 ${isActive ? 'text-zinc-300 dark:text-zinc-600' : 'text-zinc-500 dark:text-zinc-400'}`}>
                {cat.description}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search & Filter Bar */}
      <div className="p-3 sm:p-4 rounded-xl bg-white dark:bg-[#282a2e] border border-zinc-200/80 dark:border-zinc-700/80">
        <div className="relative">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="tools-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const rect = toolsSectionRef.current?.getBoundingClientRect();
                const headerOffset = window.innerWidth < 640 ? 64 : 76;
                const isVisibleInViewport = rect && rect.top >= headerOffset && rect.top <= window.innerHeight * 0.5;
                if (!isVisibleInViewport) {
                  scrollToToolList({ force: true });
                }
              }
            }}
            placeholder="Search tools by name, format, or task (e.g. HEIC, PDF, JSON, Regex, Diff)..."
            aria-label="Search tools by name, format, or task"
            className="w-full pl-10 pr-14 py-2 text-xs sm:text-sm bg-zinc-50 dark:bg-[#1a1b1e] border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
              aria-label="Clear search text"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Tools List Results */}
      <div 
        ref={toolsSectionRef} 
        id="tools-results-section" 
        tabIndex={-1} 
        className="space-y-4 pt-1 outline-none"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-200/80 dark:border-zinc-800 pb-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                <ActiveCategoryIcon className="w-4 h-4" />
              </div>
              <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <span>{activeCategoryMeta.title}</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                  {filteredTools.length}
                </span>
              </h2>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {searchQuery 
                ? `Showing ${filteredTools.length} ${filteredTools.length === 1 ? 'tool' : 'tools'} matching "${searchQuery}" in ${activeCategoryMeta.title}`
                : activeCategoryMeta.description}
            </p>
          </div>

          {(selectedCategory !== 'all' || searchQuery) && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors cursor-pointer self-start sm:self-center"
              aria-label="Reset all filters and view all tools"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset to All Tools</span>
            </button>
          )}
        </div>

        {filteredTools.length === 0 ? (
          <div className="p-8 sm:p-12 text-center bg-white dark:bg-[#282a2e] rounded-xl border border-zinc-200/80 dark:border-zinc-700/80 space-y-3">
            <div className="mx-auto w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400">
              <Search className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-white">
                No tools match the current filter criteria
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-md mx-auto">
                {searchQuery && selectedCategory !== 'all'
                  ? `Showing 0 tools matching "${searchQuery}" in ${activeCategoryMeta.title}. You can clear your search query, view all tools, or reset all filters.`
                  : searchQuery
                  ? `Showing 0 tools matching "${searchQuery}". Try searching for a different file format, task, or keyword.`
                  : 'No tools match the current filter criteria.'}
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="px-3.5 py-1.5 text-xs font-semibold bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 rounded-lg transition-colors cursor-pointer"
                >
                  Clear Search
                </button>
              )}
              {selectedCategory !== 'all' && (
                <button
                  type="button"
                  onClick={() => handleSelectCategory('all')}
                  className="px-3.5 py-1.5 text-xs font-semibold bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 rounded-lg transition-colors cursor-pointer"
                >
                  View All Tools
                </button>
              )}
              {(searchQuery && selectedCategory !== 'all') && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="px-3.5 py-1.5 text-xs font-bold bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg hover:opacity-90 transition-opacity cursor-pointer"
                >
                  Reset Filters
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filteredTools.map((tool) => {
              const catDef = CATEGORY_DEFINITIONS[tool.category as CategoryKey] || CATEGORY_DEFINITIONS.images;

              return (
                <a
                  key={tool.route}
                  href={tool.route}
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigate(tool.route);
                  }}
                  aria-label={`${tool.name}: ${tool.description}`}
                  className="group p-4 rounded-xl bg-white dark:bg-[#282a2e] border border-zinc-200/80 dark:border-zinc-700/80 hover:border-zinc-400 dark:hover:border-zinc-500 transition-all flex flex-col justify-between h-full cursor-pointer hover:shadow-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded">
                        {catDef.title}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-zinc-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors transform group-hover:translate-x-0.5" />
                    </div>

                    <h3 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors leading-snug">
                      {tool.name}
                    </h3>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-2">
                      {tool.description}
                    </p>
                  </div>
                </a>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer Banner Callout */}
      <div className="p-6 rounded-2xl bg-zinc-900 dark:bg-[#18191c] text-white flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-1 text-center sm:text-left">
          <h3 className="text-lg font-extrabold">Need to convert files right now?</h3>
          <p className="text-xs text-zinc-400">
            Drag and drop files directly on the Zapixal home workspace to start processing directly.
          </p>
        </div>
        <button
          onClick={() => onNavigate('/')}
          className="shrink-0 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-2"
        >
          <Zap className="w-4 h-4" />
          <span>Go to Workspace</span>
        </button>
      </div>
    </div>
  );
};


