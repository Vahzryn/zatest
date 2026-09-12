import React, { useState } from 'react';
import { Breadcrumbs } from '../Breadcrumbs';
import { Article } from '../../content/articles/types';
import { ARTICLE_CATEGORIES, getRelatedArticles } from '../../content/articles';
import { ToolCalloutCard } from './ToolCalloutCard';
import { Calendar, Clock, ArrowRight, List, Share2, Check, FileText, CheckCircle2, AlertTriangle, Info, Zap } from 'lucide-react';

interface ArticleViewPageProps {
  article: Article;
  onNavigate: (path: string) => void;
}

export const ArticleViewPage: React.FC<ArticleViewPageProps> = ({ article, onNavigate }) => {
  const [copied, setCopied] = useState(false);
  const categoryInfo = ARTICLE_CATEGORIES[article.category];
  const relatedArticles = getRelatedArticles(article.relatedArticleSlugs);

  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: 'Articles', url: '/articles' },
    { name: categoryInfo?.shortTitle || article.category, url: `/articles/${article.category}` },
  ];

  const handleShare = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6 py-2 sm:py-4 animate-in fade-in duration-300">
      {/* Top Header & Breadcrumbs */}
      <div className="space-y-3">
        <Breadcrumbs items={breadcrumbs} onNavigate={onNavigate} />

        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-zinc-900 dark:text-white tracking-tight leading-snug">
          {article.title}
        </h1>

        <p className="text-xs sm:text-sm md:text-base text-zinc-600 dark:text-zinc-400 font-normal leading-relaxed">
          {article.description}
        </p>

        <div className="flex items-center justify-between gap-3 pt-2 pb-3 border-b border-zinc-200/80 dark:border-zinc-800 text-xs text-zinc-500 dark:text-zinc-400">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="font-semibold text-zinc-700 dark:text-zinc-300">
              {article.author}
            </span>
            <span>·</span>
            <span className="inline-flex items-center gap-1">
              <Calendar className="w-3 h-3 text-zinc-400" />
              {article.datePublished}
            </span>
            <span>·</span>
            <span className="inline-flex items-center gap-1">
              <Clock className="w-3 h-3 text-zinc-400" />
              {article.readTime}
            </span>
          </div>

          <button
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-semibold transition-colors cursor-pointer shrink-0"
            title="Copy link to clipboard"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5" />
                <span>Share</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Table of Contents Accordion / Summary Box */}
      {article.headings && article.headings.length > 0 && (
        <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-[#1e2023] border border-zinc-200/80 dark:border-zinc-800 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">
            <List className="w-3.5 h-3.5 text-zinc-500" />
            <span>Table of Contents</span>
          </div>
          <ul className="space-y-1 text-xs">
            {article.headings.map((h) => (
              <li key={h.id} style={{ paddingLeft: h.level === 3 ? '0.75rem' : '0rem' }}>
                <a
                  href={`#${h.id}`}
                  className="text-zinc-600 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors inline-block"
                >
                  {h.text}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Main Body Content Sections */}
      <article className="prose dark:prose-invert max-w-none space-y-5 text-zinc-800 dark:text-zinc-200 text-xs sm:text-sm leading-relaxed">
        {article.sections.map((sec, idx) => {
          if (sec.type === 'paragraph') {
            return (
              <p key={idx} className="leading-relaxed text-zinc-700 dark:text-zinc-300">
                {sec.text}
              </p>
            );
          }

          if (sec.type === 'heading') {
            if (sec.level === 2) {
              return (
                <h2
                  key={idx}
                  id={sec.id}
                  className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-white pt-4 pb-1 border-b border-zinc-200/80 dark:border-zinc-800 tracking-tight"
                >
                  {sec.text}
                </h2>
              );
            }
            return (
              <h3
                key={idx}
                id={sec.id}
                className="text-base font-bold text-zinc-900 dark:text-white pt-2 tracking-tight"
              >
                {sec.text}
              </h3>
            );
          }

          if (sec.type === 'list') {
            if (sec.ordered) {
              return (
                <ol key={idx} className="list-decimal list-inside space-y-1.5 pl-2 text-zinc-700 dark:text-zinc-300">
                  {sec.items.map((item, i) => (
                    <li key={i} className="leading-relaxed">
                      {item}
                    </li>
                  ))}
                </ol>
              );
            }
            return (
              <ul key={idx} className="space-y-1.5 text-zinc-700 dark:text-zinc-300">
                {sec.items.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 leading-relaxed">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            );
          }

          if (sec.type === 'callout') {
            const isWarning = sec.variant === 'warning';
            const isTip = sec.variant === 'tip';
            return (
              <div
                key={idx}
                className={`p-3.5 rounded-xl border flex items-start gap-2.5 my-3 ${
                  isWarning
                    ? 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-200'
                    : isTip
                    ? 'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/60 text-emerald-900 dark:text-emerald-200'
                    : 'bg-indigo-50/80 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800/60 text-indigo-900 dark:text-indigo-200'
                }`}
              >
                {isWarning ? (
                  <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                ) : (
                  <Info className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                )}
                <div className="space-y-0.5 text-xs">
                  <span className="font-bold block text-xs">{sec.title}</span>
                  <p className="leading-relaxed">{sec.text}</p>
                </div>
              </div>
            );
          }

          if (sec.type === 'toolCallout') {
            return (
              <ToolCalloutCard key={idx} tool={sec.tool} onNavigate={onNavigate} />
            );
          }

          if (sec.type === 'table') {
            return (
              <div key={idx} className="my-4 overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-100 dark:bg-[#1e2023] text-zinc-900 dark:text-white font-bold uppercase tracking-wider text-[10px] border-b border-zinc-200 dark:border-zinc-800">
                    <tr>
                      {sec.headers.map((h, i) => (
                        <th key={i} className="p-3">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200/60 dark:divide-zinc-800/60">
                    {sec.rows.map((row, rIdx) => (
                      <tr key={rIdx} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                        {row.map((cell, cIdx) => (
                          <td key={cIdx} className="p-3 text-zinc-700 dark:text-zinc-300">
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          }

          return null;
        })}
      </article>

      {/* Recommended Tools Section */}
      {article.relatedTools && article.relatedTools.length > 0 && (
        <div className="p-4 rounded-xl bg-zinc-50 dark:bg-[#1e2023] border border-zinc-200/80 dark:border-zinc-800 space-y-3 my-6">
          <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-900 dark:text-white">
            <Zap className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>Related Tools</span>
          </div>

          <div className="grid gap-2.5 sm:grid-cols-3">
            {article.relatedTools.map((tool) => (
              <button
                key={tool.path}
                onClick={() => onNavigate(tool.path)}
                className="flex flex-col items-start p-3 rounded-lg bg-white dark:bg-[#282a2e] border border-zinc-200/80 dark:border-zinc-700/80 hover:border-zinc-400 dark:hover:border-zinc-500 transition-all text-left group cursor-pointer"
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-xs font-bold text-zinc-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">
                    {tool.label}
                  </span>
                  <ArrowRight className="w-3 h-3 text-zinc-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2">
                  {tool.description}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Related Articles Section */}
      {relatedArticles.length > 0 && (
        <div className="space-y-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-zinc-400" />
            <span>Further Reading</span>
          </h3>

          <div className="grid gap-3 sm:grid-cols-2">
            {relatedArticles.map((rel) => (
              <div
                key={rel.slug}
                onClick={() => onNavigate(`/articles/${rel.slug}`)}
                className="p-3.5 rounded-xl bg-white dark:bg-[#282a2e] border border-zinc-200/80 dark:border-zinc-700/80 hover:border-zinc-400 dark:hover:border-zinc-500 transition-all cursor-pointer group space-y-1"
              >
                <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
                  {rel.category}
                </span>
                <h4 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {rel.title}
                </h4>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2">
                  {rel.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
