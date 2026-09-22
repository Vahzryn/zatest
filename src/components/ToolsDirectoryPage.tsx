import React, { useState, useMemo, useRef, useEffect } from 'react';
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
  Layers,
  RotateCcw
} from 'lucide-react';
import { cn } from '../lib/utils';

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
    badge: 'All',
    description: 'Complete collection of secure, browser-based utilities.',
    icon: Grid,
  },
  images: {
    key: 'images',
    title: 'Images',
    badge: 'Images',
    description: 'Compress, convert, resize, crop, and isolate subjects locally in browser memory.',
    icon: FileImage,
  },
  documents: {
    key: 'documents',
    title: 'PDF & Documents',
    badge: 'PDF',
    description: 'Merge, split, extract pages, render images, and compress documents privately.',
    icon: FileText,
  },
  developer: {
    key: 'developer',
    title: 'Developer',
    badge: 'Code',
    description: 'Format JSON, convert CSV, decode JWT tokens, and test Regex expressions securely.',
    icon: Code,
  },
  text: {
    key: 'text',
    title: 'Text',
    badge: 'Text',
    description: 'Live Markdown previewer, side-by-side text diff, and string inspection tools.',
    icon: Layers,
  },
  utilities: {
    key: 'utilities',
    title: 'Utilities',
    badge: 'Tools',
    description: 'Extract color palettes, convert Base64 strings, and generate secure passwords.',
    icon: Sliders,
  },
};

const ALL_CATEGORY_KEYS: CategoryKey[] = ['all', 'images', 'documents', 'developer', 'text', 'utilities'];

export const ToolsDirectoryPage: React.FC<ToolsDirectoryPageProps> = ({ onNavigate, initialCategory = 'all' }) => {
  const [selectedCategory, setSelectedCategory] = useState<CategoryKey>(initialCategory);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const toolsSectionRef = useRef<HTMLDivElement>(null);
  const categoryNavContainerRef = useRef<HTMLDivElement>(null);
  const categoryButtonRefs = useRef<Record<CategoryKey, HTMLButtonElement | null>>({
    all: null,
    images: null,
    documents: null,
    developer: null,
    text: null,
    utilities: null,
  });

  // Synchronize state when initialCategory prop changes (e.g. browser back/forward or external navigation)
  useEffect(() => {
    setSelectedCategory(initialCategory);
  }, [initialCategory]);

  // Keep selected category visible in horizontally scrollable container on mobile
  useEffect(() => {
    const container = categoryNavContainerRef.current;
    const btn = categoryButtonRefs.current[selectedCategory];
    if (container && btn && container.scrollWidth > container.clientWidth) {
      const btnLeft = btn.offsetLeft;
      const btnWidth = btn.offsetWidth;
      const containerWidth = container.clientWidth;
      const targetScroll = btnLeft - (containerWidth / 2) + (btnWidth / 2);
      container.scrollTo({
        left: Math.max(0, targetScroll),
        behavior: 'smooth'
      });
    }
  }, [selectedCategory]);

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

  const handleSelectCategory = (catKey: CategoryKey) => {
    if (catKey === selectedCategory) return;
    
    // 1. Update state immediately
    setSelectedCategory(catKey);
    
    // 2. Update URL immediately
    if (catKey === 'all') {
      onNavigate('/tools');
    } else {
      onNavigate(`/tools/${catKey}`);
    }

    // 3. Only scroll if user had scrolled far below the category bar (avoid visual jump)
    if (typeof window !== 'undefined' && toolsSectionRef.current) {
      const rect = toolsSectionRef.current.getBoundingClientRect();
      const headerOffset = window.innerWidth < 640 ? 64 : 76;
      if (rect.top < headerOffset) {
        window.scrollTo({
          top: Math.max(0, window.scrollY + rect.top - headerOffset - 12),
          behavior: 'smooth',
        });
      }
    }
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    handleSelectCategory('all');
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 py-2 sm:py-6 animate-in fade-in duration-200">
      {/* Header & Breadcrumbs */}
      <div className="text-center space-y-1.5">
        <Breadcrumbs items={breadcrumbs} onNavigate={onNavigate} />
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">
          Tools Directory
        </h1>
        <p className="max-w-2xl mx-auto text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 font-normal leading-relaxed">
          Browser-based utilities for image optimization, PDF processing, developer formatting, and media extraction.
        </p>
      </div>

      {/* 1. Compact Category Navigation (Segmented toolbar on desktop, horizontally scrollable on mobile) */}
      <div 
        ref={categoryNavContainerRef}
        className="w-full overflow-x-auto no-scrollbar py-1 -my-1 touch-pan-x"
        role="region"
        aria-label="Filter tools by category"
      >
        <div 
          role="tablist"
          aria-label="Tool Categories"
          className="inline-flex sm:grid sm:grid-cols-6 items-center gap-1.5 p-1 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xs w-auto sm:w-full min-w-max sm:min-w-0"
        >
          {ALL_CATEGORY_KEYS.map((catKey) => {
            const cat = CATEGORY_DEFINITIONS[catKey];
            const Icon = cat.icon;
            const isActive = selectedCategory === catKey;
            const count = categoryCounts[catKey];

            return (
              <button
                key={catKey}
                ref={(el) => { categoryButtonRefs.current[catKey] = el; }}
                id={`category-filter-${catKey}`}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-controls="tools-results-section"
                aria-label={`${cat.title}, ${count} tools available`}
                onClick={() => handleSelectCategory(catKey)}
                className={cn(
                  "group relative flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] cursor-pointer select-none shrink-0 sm:shrink min-h-[36px] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 motion-reduce:transition-none motion-reduce:transform-none",
                  isActive
                    ? "bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30 dark:border-indigo-500/40 shadow-xs font-bold"
                    : "text-zinc-700 dark:text-zinc-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white/90 dark:hover:bg-zinc-800/70 border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700 hover:-translate-y-px"
                )}
              >
                <Icon className={cn(
                  "w-3.5 h-3.5 shrink-0 transition-colors duration-200",
                  isActive 
                    ? "text-indigo-600 dark:text-indigo-400" 
                    : "text-zinc-500 dark:text-zinc-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400"
                )} />
                <span className="whitespace-nowrap">{cat.badge || cat.title}</span>
                <span className={cn(
                  "text-[10px] px-1.5 py-0.2 rounded-full border transition-colors duration-200",
                  isActive
                    ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 border-indigo-200/60 dark:border-indigo-800/50 font-bold"
                    : "bg-zinc-200/70 dark:bg-zinc-800 border-zinc-300/40 dark:border-zinc-700/40 text-zinc-600 dark:text-zinc-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-300 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-950/40"
                )}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Search & Filter Bar */}
      <div className="p-2.5 sm:p-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="tools-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tools by name, format, or task (e.g. HEIC, PDF, JSON, Regex, Diff)..."
            aria-label="Search tools by name, format, or task"
            className="w-full pl-9 pr-14 py-2 text-xs sm:text-sm bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100 placeholder-zinc-500 dark:placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/50 transition-all duration-200"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
              aria-label="Clear search text"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* 3. Tools Results Section with Smooth Keyed Content Transitions */}
      <div 
        ref={toolsSectionRef} 
        id="tools-results-section" 
        tabIndex={-1} 
        className="space-y-4 pt-1 outline-none"
      >
        {/* Results Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-200/80 dark:border-zinc-800 pb-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded-md bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/60 dark:border-zinc-700/50 text-zinc-700 dark:text-zinc-300">
                <ActiveCategoryIcon className="w-4 h-4" />
              </div>
              <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <span>{activeCategoryMeta.title}</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/60 dark:border-zinc-700/50 text-zinc-600 dark:text-zinc-400">
                  {filteredTools.length}
                </span>
              </h2>
            </div>
            <p className="text-xs text-zinc-600 dark:text-zinc-400">
              {searchQuery 
                ? `Showing ${filteredTools.length} ${filteredTools.length === 1 ? 'tool' : 'tools'} matching "${searchQuery}" in ${activeCategoryMeta.title}`
                : activeCategoryMeta.description}
            </p>
          </div>

          {(selectedCategory !== 'all' || searchQuery) && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer self-start sm:self-center px-2.5 py-1 rounded-lg border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700 shadow-2xs"
              aria-label="Reset all filters and view all tools"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset to All Tools</span>
            </button>
          )}
        </div>

        {/* Animated Results Grid */}
        <div 
          key={`${selectedCategory}-${searchQuery ? 'search' : 'category'}`} 
          className="animate-subtle-in motion-reduce:animate-none"
        >
          {filteredTools.length === 0 ? (
            <div className="p-8 sm:p-12 text-center bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200/90 dark:border-zinc-800 shadow-xs space-y-3">
              <div className="mx-auto w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/70 dark:border-zinc-700/60 flex items-center justify-center text-zinc-400">
                <Search className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100">
                  No tools match the current filter criteria
                </h3>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 max-w-md mx-auto">
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
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {filteredTools.map((tool) => {
                const catDef = CATEGORY_DEFINITIONS[tool.category as CategoryKey] || CATEGORY_DEFINITIONS.images;
                const ToolIcon = catDef.icon;

                return (
                  <a
                    key={tool.route}
                    href={tool.route}
                    onClick={(e) => {
                      e.preventDefault();
                      onNavigate(tool.route);
                    }}
                    aria-label={`${tool.name}: ${tool.description}`}
                    className="group relative flex flex-col justify-between p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 shadow-xs text-left transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-sm hover:-translate-y-0.5 active:scale-[0.98] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 motion-reduce:transition-none motion-reduce:transform-none"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/70 dark:border-zinc-700/60 text-zinc-700 dark:text-zinc-300 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-950/50 group-hover:border-indigo-200 dark:group-hover:border-indigo-800/60 group-hover:text-indigo-600 dark:group-hover:text-indigo-300 flex items-center justify-center transition-colors duration-200 shrink-0">
                          <ToolIcon className="w-4 h-4" />
                        </div>
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/60 dark:border-zinc-700/50 px-2 py-0.5 rounded group-hover:text-indigo-600 dark:group-hover:text-indigo-300 group-hover:border-indigo-200/50 dark:group-hover:border-indigo-800/50 transition-colors duration-200">
                          {catDef.title}
                        </span>
                      </div>

                      <div className="space-y-1 mt-3">
                        <h3 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-200 leading-snug">
                          {tool.name}
                        </h3>
                        <p className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                          {tool.description}
                        </p>
                      </div>
                    </div>

                    <div className="pt-2.5 mt-3 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-200">
                      <span>Open tool</span>
                      <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform duration-200" />
                    </div>
                  </a>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Footer Banner Callout */}
      <div className="p-5 sm:p-6 rounded-2xl bg-zinc-900 dark:bg-zinc-900/90 border border-zinc-800 text-white flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-1 text-center sm:text-left">
          <h3 className="text-base sm:text-lg font-bold">Need to convert files right now?</h3>
          <p className="text-xs text-zinc-400">
            Drag and drop files directly on the Zapixal home workspace to start processing instantly.
          </p>
        </div>
        <button
          onClick={() => onNavigate('/')}
          className="shrink-0 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-2 active:scale-[0.98] shadow-xs"
        >
          <Zap className="w-4 h-4" />
          <span>Go to Workspace</span>
        </button>
      </div>
    </div>
  );
};
