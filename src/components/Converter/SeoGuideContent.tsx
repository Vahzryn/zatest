import React, { useState } from 'react';
import { SeoRouteData } from '../../lib/seoEngine';
import { RelatedToolsSection } from './RelatedToolsSection';
import { ChevronDown, BookOpen, HelpCircle } from 'lucide-react';

interface SeoGuideContentProps {
  seoData: SeoRouteData;
  onNavigate?: (path: string) => void;
}

export const SeoGuideContent: React.FC<SeoGuideContentProps> = ({ seoData, onNavigate }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const guide = seoData.guideContent;
  if (!guide && (!seoData.relatedRoutes || seoData.relatedRoutes.length === 0)) return null;

  return (
    <section className="w-full max-w-5xl mx-auto mb-6 rounded-2xl border border-zinc-200/80 bg-white/90 p-3.5 sm:p-5 shadow-2xs backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/90 text-left">
      {guide && (
        <div className="space-y-3">
          {/* Header trigger for collapsible guide */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-100 dark:border-zinc-800">
            <div className="min-w-0 space-y-1">
              {guide.badge && (
                <div>
                  <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-md border border-indigo-200/50 dark:border-indigo-800/50 inline-block">
                    {guide.badge}
                  </span>
                </div>
              )}
              <h2 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-white leading-snug">
                {guide.section1Title}
              </h2>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-2 sm:line-clamp-1 leading-normal">
                {guide.section1Body}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              aria-expanded={isExpanded}
              aria-controls="seo-guide-collapsible-panel"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/80 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 text-xs font-semibold shrink-0 cursor-pointer transition-all duration-150 self-start sm:self-center"
            >
              <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
              <span>{isExpanded ? 'Collapse Guide' : 'Read Guide & FAQs'}</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Collapsible Panel */}
          {isExpanded && (
            <div 
              id="seo-guide-collapsible-panel"
              className="space-y-5 pt-2 animate-in fade-in duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]"
            >
              <div>
                <p className="text-xs sm:text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                  {guide.section1Body}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
                  {guide.section2Title}
                </h3>
                <p className="mt-1.5 text-xs sm:text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                  {guide.section2Body}
                </p>
              </div>

              <div className="grid gap-4 lg:grid-cols-2 pt-1">
                <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-950 p-4">
                  <h4 className="mb-2.5 text-xs sm:text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Step-by-step guide</span>
                  </h4>
                  <ol className="list-decimal space-y-2 pl-4 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                    {guide.steps.map((step: string, idx: number) => (
                      <li key={idx} className="pl-0.5">{step}</li>
                    ))}
                  </ol>
                </div>
                
                <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-950 p-4">
                  <h4 className="mb-2.5 text-xs sm:text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
                    <HelpCircle className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Frequently Asked Questions</span>
                  </h4>
                  <div className="space-y-2 text-xs">
                    {guide.faqs.map((faq: { question: string; answer: string }, idx: number) => (
                      <details key={idx} className="group rounded-lg border border-zinc-200/60 bg-white p-2.5 dark:border-zinc-800/60 dark:bg-zinc-900 [&_summary::-webkit-details-marker]:hidden">
                        <summary className="flex cursor-pointer items-center justify-between font-bold text-zinc-800 dark:text-white">
                          <span>{faq.question}</span>
                          <span className="ml-2 flex-shrink-0 transition-transform duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] group-open:rotate-180">
                            <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
                          </span>
                        </summary>
                        <p className="mt-2 leading-relaxed text-zinc-600 dark:text-zinc-400">
                          {faq.answer}
                        </p>
                      </details>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Always-visible Related Tools and Articles links near the bottom of landing page content */}
      <div className={guide ? "mt-4 pt-3.5 border-t border-zinc-100 dark:border-zinc-800" : ""}>
        <RelatedToolsSection relatedRoutes={seoData.relatedRoutes} onNavigate={onNavigate} />
      </div>
      
      {seoData.relatedArticles && seoData.relatedArticles.length > 0 && (
        <div className="mt-5 pt-4 border-t border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-2 mb-3">
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600 dark:text-emerald-400"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>
            <h3 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-white">
              Related Guides & Articles
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {seoData.relatedArticles.map((article) => (
              <a
                key={article.path}
                href={article.path}
                onClick={(e) => {
                  if (onNavigate) {
                    e.preventDefault();
                    onNavigate(article.path);
                  }
                }}
                className="group flex flex-col justify-center p-2.5 rounded-xl border border-zinc-200 bg-zinc-50/80 hover:bg-emerald-50/60 hover:border-emerald-200 dark:border-zinc-800 dark:bg-zinc-950/80 dark:hover:bg-emerald-950/30 dark:hover:border-emerald-800 transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]"
              >
                <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 group-hover:text-emerald-700 dark:group-hover:text-emerald-300 line-clamp-1">
                  {article.label}
                </span>
                <span className="mt-1 flex items-center text-[10px] font-medium text-zinc-500 dark:text-zinc-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                  Read article 
                  <svg className="ml-1 w-3 h-3 transition-transform duration-200 group-hover:translate-x-0.5" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
                </span>
              </a>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};
