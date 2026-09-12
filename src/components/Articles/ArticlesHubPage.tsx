import React, { useState } from 'react';
import { Breadcrumbs } from '../Breadcrumbs';
import { ALL_ARTICLES, ARTICLE_CATEGORIES, ArticleCategory } from '../../content/articles';
import { FileImage, ShieldCheck, Sliders, Cpu, ArrowRight, Clock, Calendar, Zap, BookOpen } from 'lucide-react';

interface ArticlesHubPageProps {
  onNavigate: (path: string) => void;
}

const CATEGORY_ICONS = {
  formats: FileImage,
  privacy: ShieldCheck,
  workflows: Sliders,
  performance: Cpu,
};

export const ArticlesHubPage: React.FC<ArticlesHubPageProps> = ({ onNavigate }) => {
  const [selectedCategory, setSelectedCategory] = useState<ArticleCategory | 'all'>('all');

  const filteredArticles = selectedCategory === 'all'
    ? ALL_ARTICLES
    : ALL_ARTICLES.filter((a) => a.category === selectedCategory);

  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: 'Articles', url: '/articles' },
  ];

  return (
    <div className="w-full max-w-5xl mx-auto space-y-10 py-2 sm:py-6 animate-in fade-in duration-300">
      {/* Header & Breadcrumbs */}
      <div className="text-center space-y-2">
        <Breadcrumbs items={breadcrumbs} onNavigate={onNavigate} />
        <h1 className="text-2xl sm:text-4xl font-bold text-zinc-900 dark:text-white tracking-tight">
          Articles & Technical Guides
        </h1>
        <p className="max-w-2xl mx-auto text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
          Analysis on image codecs, WebAssembly performance benchmarks, EXIF metadata privacy, and browser optimization.
        </p>
      </div>

      {/* Category Selection Hub Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
        {Object.values(ARTICLE_CATEGORIES).map((cat) => {
          const Icon = CATEGORY_ICONS[cat.id as ArticleCategory] || FileImage;
          const isActive = selectedCategory === cat.id;

          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(isActive ? 'all' : cat.id)}
              className={`flex flex-col items-start p-3 sm:p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                isActive
                  ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 border-zinc-900 dark:border-white shadow-xs'
                  : 'bg-white dark:bg-[#282a2e] border-zinc-200/80 dark:border-zinc-700/80 text-zinc-800 dark:text-zinc-200 hover:border-zinc-400 dark:hover:border-zinc-500'
              }`}
            >
              <div className={`p-1.5 rounded-lg mb-1.5 ${isActive ? 'bg-white/20 text-white dark:bg-zinc-900/20 dark:text-zinc-900' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'}`}>
                <Icon className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold leading-snug">{cat.shortTitle}</span>
              <span className={`text-[11px] mt-0.5 line-clamp-2 ${isActive ? 'text-zinc-300 dark:text-zinc-600' : 'text-zinc-500 dark:text-zinc-400'}`}>
                {cat.description}
              </span>
            </button>
          );
        })}
      </div>

      {/* Filter Tabs Header */}
      <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-2">
        <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
          {filteredArticles.length} {filteredArticles.length === 1 ? 'article' : 'articles'}
          {selectedCategory !== 'all' && ` in ${ARTICLE_CATEGORIES[selectedCategory]?.shortTitle}`}
        </span>
        {selectedCategory !== 'all' && (
          <button
            onClick={() => setSelectedCategory('all')}
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
          >
            Show All
          </button>
        )}
      </div>

      {/* Featured Research Benchmark Callout */}
      <div className="p-4 sm:p-5 rounded-xl bg-zinc-900 text-white dark:bg-[#1e2023] border border-zinc-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1.5 max-w-2xl">
          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">
            Featured Empirical Study
          </span>
          <h2 className="text-sm sm:text-base font-bold text-white leading-snug">
            Client-Side WebAssembly Image Codec Compression Benchmarks
          </h2>
          <p className="text-xs text-zinc-300 dark:text-zinc-400 leading-relaxed">
            Evaluates WebAssembly image codecs (MozJPEG, libwebp, libavif, UPNG) with execution times and size reduction metrics.
          </p>
        </div>
        <button
          onClick={() => onNavigate('/articles/benchmarks')}
          className="shrink-0 px-3.5 py-2 rounded-lg bg-white hover:bg-zinc-100 text-zinc-900 font-bold text-xs shadow-xs transition-all cursor-pointer flex items-center gap-1.5 group"
        >
          <span>View Report</span>
          <ArrowRight className="w-3.5 h-3.5 text-zinc-900 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      {/* Articles Grid */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filteredArticles.map((art) => {
          const catInfo = ARTICLE_CATEGORIES[art.category];

          return (
            <article
              key={art.slug}
              className="flex flex-col justify-between p-4 rounded-xl bg-white dark:bg-[#282a2e] border border-zinc-200/80 dark:border-zinc-700/80 hover:border-zinc-400 dark:hover:border-zinc-500 transition-all group"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded">
                    {catInfo?.shortTitle || art.category}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px]">
                    <Clock className="w-3 h-3 text-zinc-400" />
                    {art.readTime}
                  </span>
                </div>

                <h2 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors leading-snug">
                  <a href={`/articles/${art.slug}`} onClick={(e) => { e.preventDefault(); onNavigate(`/articles/${art.slug}`); }}>
                    {art.title}
                  </a>
                </h2>

                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed line-clamp-3">
                  {art.description}
                </p>
              </div>

              <div className="pt-3 mt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs">
                <span className="inline-flex items-center gap-1 text-[11px] text-zinc-400">
                  <Calendar className="w-3 h-3" />
                  {art.datePublished}
                </span>

                <button
                  onClick={() => onNavigate(`/articles/${art.slug}`)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-700 dark:text-zinc-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 cursor-pointer"
                >
                  <span>Read guide</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            </article>
          );
        })}
      </div>

      {/* Footer Banner Callout */}
      <div className="p-6 rounded-2xl bg-zinc-900 dark:bg-[#18191c] text-white flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-1 text-center sm:text-left">
          <h3 className="text-lg font-extrabold">Ready to process image files locally?</h3>
          <p className="text-xs text-zinc-400">Zapixal runs locally in browser memory via Web Workers and WebAssembly. Zero cloud uploads for image conversions.</p>
        </div>
        <button
          onClick={() => onNavigate('/')}
          className="shrink-0 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-2"
        >
          <Zap className="w-4 h-4" />
          <span>Launch Converter Engine</span>
        </button>
      </div>
    </div>
  );
};
