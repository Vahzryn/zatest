import React from 'react';
import { Breadcrumbs } from '../Breadcrumbs';
import { CategoryInfo, Article } from '../../content/articles/types';
import { ARTICLE_CATEGORIES, getArticlesByCategory } from '../../content/articles';
import { FileImage, ShieldCheck, Sliders, Cpu, ArrowRight, Clock, Calendar, Zap, ChevronRight } from 'lucide-react';

interface ArticleCategoryPageProps {
  category: CategoryInfo;
  onNavigate: (path: string) => void;
}

const CATEGORY_ICONS = {
  formats: FileImage,
  privacy: ShieldCheck,
  workflows: Sliders,
  performance: Cpu,
};

export const ArticleCategoryPage: React.FC<ArticleCategoryPageProps> = ({ category, onNavigate }) => {
  const articles: Article[] = getArticlesByCategory(category.id);
  const Icon = CATEGORY_ICONS[category.id] || FileImage;

  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: 'Articles', url: '/articles' },
    { name: category.title, url: `/articles/${category.slug}` },
  ];

  return (
    <div className="w-full max-w-5xl mx-auto space-y-10 py-2 sm:py-6 animate-in fade-in duration-300">
      {/* Header & Breadcrumbs */}
      <div className="text-center space-y-2">
        <Breadcrumbs items={breadcrumbs} onNavigate={onNavigate} />

        <h1 className="text-2xl sm:text-4xl font-bold text-zinc-900 dark:text-white tracking-tight">
          {category.title}
        </h1>

        <p className="max-w-2xl mx-auto text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
          {category.description}
        </p>
      </div>

      {/* Category Switcher Tabs */}
      <div className="flex items-center justify-center gap-1.5 border-b border-zinc-200 dark:border-zinc-800 pb-3 overflow-x-auto">
        <button
          onClick={() => onNavigate('/articles')}
          className="px-3 py-1 text-xs font-semibold rounded-lg text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer shrink-0"
        >
          All Guides
        </button>
        {Object.values(ARTICLE_CATEGORIES).map((cat) => {
          const isCurrent = cat.id === category.id;
          return (
            <button
              key={cat.id}
              onClick={() => onNavigate(`/articles/${cat.slug}`)}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer shrink-0 ${
                isCurrent
                  ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-2xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
            >
              {cat.shortTitle}
            </button>
          );
        })}
      </div>

      {/* Articles List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            {articles.length} {articles.length === 1 ? 'guide' : 'guides'} available
          </span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {articles.map((art) => (
            <article
              key={art.slug}
              className="flex flex-col justify-between p-4 rounded-xl bg-white dark:bg-[#282a2e] border border-zinc-200/80 dark:border-zinc-700/80 hover:border-zinc-400 dark:hover:border-zinc-500 transition-all group"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
                  <span className="inline-flex items-center gap-1 font-medium text-[11px]">
                    <Clock className="w-3 h-3 text-zinc-400" />
                    {art.readTime}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] text-zinc-400">
                    <Calendar className="w-3 h-3" />
                    {art.datePublished}
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

              <div className="pt-3 mt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-end">
                <button
                  onClick={() => onNavigate(`/articles/${art.slug}`)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-700 dark:text-zinc-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors cursor-pointer"
                >
                  <span>Read guide</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>

      {/* Category Related Tools Section */}
      {category.relatedTools && category.relatedTools.length > 0 && (
        <div className="p-4 rounded-xl bg-zinc-50 dark:bg-[#1e2023] border border-zinc-200/80 dark:border-zinc-800 space-y-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-900 dark:text-white">
            <Zap className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>Tools for {category.shortTitle}</span>
          </div>

          <div className="grid gap-2.5 sm:grid-cols-3">
            {category.relatedTools.map((tool) => (
              <button
                key={tool.path}
                onClick={() => onNavigate(tool.path)}
                className="flex flex-col items-start p-3 rounded-lg bg-white dark:bg-[#282a2e] border border-zinc-200/80 dark:border-zinc-700/80 hover:border-zinc-400 dark:hover:border-zinc-500 transition-all text-left group cursor-pointer"
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-xs font-bold text-zinc-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">
                    {tool.label}
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-zinc-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2">
                  {tool.description}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
