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
    <div className={`hero-container-cls-guard flex flex-col items-center text-center px-3 max-w-3xl mx-auto ${
      isHome ? 'mb-4 sm:mb-5' : 'mb-3.5 sm:mb-4'
    }`}>
      {seoData.breadcrumbs && seoData.breadcrumbs.length > 1 && (
        <div className="mb-2">
          <Breadcrumbs items={seoData.breadcrumbs} onNavigate={onNavigate} />
        </div>
      )}
      <h1 className={`font-bold tracking-tight text-zinc-900 dark:text-zinc-100 leading-snug ${
        isHome 
          ? 'text-xl sm:text-2xl md:text-3xl mb-1.5' 
          : 'text-lg sm:text-xl md:text-2xl mb-1'
      }`}>
        {seoData.h1Title}
      </h1>
      <p className="max-w-xl text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 font-normal leading-relaxed line-clamp-2 sm:line-clamp-none">
        {seoData.metaDescription}
      </p>
    </div>
  );
});
