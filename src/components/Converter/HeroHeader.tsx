import React from 'react';
import { Breadcrumbs } from '../Breadcrumbs';
import { SeoRouteData } from '../../lib/seoEngine';

interface HeroHeaderProps {
  seoData: SeoRouteData;
  onNavigate: (path: string) => void;
}

export const HeroHeader = React.memo<HeroHeaderProps>(function HeroHeader({ seoData, onNavigate }) {
  const isHome = seoData.pageCategory === 'home';

  return (
    <div className={`hero-container-cls-guard flex flex-col items-center text-center px-2 max-w-2xl mx-auto ${
      isHome ? 'mb-2.5 sm:mb-3.5' : 'mb-2 sm:mb-3'
    }`}>
      {seoData.breadcrumbs && seoData.breadcrumbs.length > 1 && (
        <div className="mb-1.5">
          <Breadcrumbs items={seoData.breadcrumbs} onNavigate={onNavigate} />
        </div>
      )}
      <h1 className={`font-bold tracking-tight text-zinc-900 dark:text-zinc-100 leading-snug ${
        isHome 
          ? 'text-sm sm:text-xl md:text-2xl mb-0.5 sm:mb-1' 
          : 'text-sm sm:text-lg md:text-xl mb-0.5'
      }`}>
        {seoData.h1Title}
      </h1>
      <p className="max-w-lg text-[11px] sm:text-xs text-zinc-600 dark:text-zinc-400 font-normal leading-normal line-clamp-2 sm:line-clamp-none">
        {seoData.metaDescription}
      </p>
    </div>
  );
});
