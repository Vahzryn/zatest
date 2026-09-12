import React from 'react';
import { SeoRouteData } from '../../lib/seoEngine';
import { RelatedToolsSection } from './RelatedToolsSection';

interface SeoGuideContentProps {
  seoData: SeoRouteData;
  onNavigate?: (path: string) => void;
}

export const SeoGuideContent: React.FC<SeoGuideContentProps> = ({ seoData, onNavigate }) => {
  const guide = seoData.guideContent;
  if (!guide && (!seoData.relatedRoutes || seoData.relatedRoutes.length === 0)) return null;

  return (
    <section className="w-full max-w-5xl mx-auto mb-8 rounded-3xl border border-zinc-200/80 bg-white/90 p-4 shadow-sm backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/90 sm:p-6">
      {guide && (
        <>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-6">
            <div className="max-w-3xl">
              <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400 mb-1">
                {guide.badge}
              </p>
              <h2 className="mt-2 text-lg font-black text-zinc-900 dark:text-white sm:text-xl">
                {guide.section1Title}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                {guide.section1Body}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-8">
            <div className="max-w-3xl">
              <h2 className="text-lg font-black text-zinc-900 dark:text-white sm:text-xl">
                {guide.section2Title}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                {guide.section2Body}
              </p>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5 dark:border-zinc-800 dark:bg-zinc-950">
              <h3 className="mb-4 text-base font-black text-zinc-900 dark:text-white">
                Step-by-step guide
              </h3>
              <ol className="list-decimal space-y-3 pl-5 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                {guide.steps.map((step: string, idx: number) => (
                  <li key={idx} className="pl-1">{step}</li>
                ))}
              </ol>
            </div>
            
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5 dark:border-zinc-800 dark:bg-zinc-950">
              <h3 className="mb-4 text-base font-black text-zinc-900 dark:text-white">
                Frequently Asked Questions
              </h3>
              <div className="space-y-3 text-sm">
                {guide.faqs.map((faq: { question: string; answer: string }, idx: number) => (
                  <details key={idx} className="group rounded-xl border border-zinc-200/60 bg-white p-3 dark:border-zinc-800/60 dark:bg-zinc-900 [&_summary::-webkit-details-marker]:hidden">
                    <summary className="flex cursor-pointer items-center justify-between font-bold text-zinc-800 dark:text-white">
                      <span>{faq.question}</span>
                      <span className="ml-4 flex-shrink-0 transition group-open:rotate-180">
                        <svg fill="none" height="20" shapeRendering="geometricPrecision" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="20"><path d="M6 9l6 6 6-6"></path></svg>
                      </span>
                    </summary>
                    <p className="mt-3 leading-relaxed text-zinc-600 dark:text-zinc-400">
                      {faq.answer}
                    </p>
                  </details>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Always-visible Related Tools and Articles links near the bottom of landing page content */}
      <RelatedToolsSection relatedRoutes={seoData.relatedRoutes} onNavigate={onNavigate} />
      
      {seoData.relatedArticles && seoData.relatedArticles.length > 0 && (
        <div className="mt-8 pt-6 border-t border-zinc-200/80 dark:border-zinc-800">
          <div className="flex items-center gap-2 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600 dark:text-emerald-400"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>
            <h3 className="text-base font-black text-zinc-900 dark:text-white">
              Related Guides & Articles
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
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
                className="group flex flex-col justify-center p-3 rounded-2xl border border-zinc-200 bg-zinc-50/80 hover:bg-emerald-50/60 hover:border-emerald-200 dark:border-zinc-800 dark:bg-zinc-950/80 dark:hover:bg-emerald-950/30 dark:hover:border-emerald-800 transition-all"
              >
                <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 group-hover:text-emerald-700 dark:group-hover:text-emerald-300 line-clamp-2">
                  {article.label}
                </span>
                <span className="mt-1 flex items-center text-[10px] font-medium text-zinc-500 dark:text-zinc-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                  Read article 
                  <svg className="ml-1 w-3 h-3 transition-transform group-hover:translate-x-0.5" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
                </span>
              </a>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};
