import React from 'react';
import { Breadcrumbs } from '../Breadcrumbs';
import { SeoRouteData } from '../../lib/seoEngine';

interface HeroHeaderProps {
  seoData: SeoRouteData;
  onNavigate: (path: string) => void;
}

export const HeroHeader = React.memo<HeroHeaderProps>(function HeroHeader({ seoData, onNavigate }) {
  return (
    <div className="hero-container-cls-guard flex flex-col items-center mb-6 text-center px-4">
      <Breadcrumbs items={seoData.breadcrumbs} onNavigate={onNavigate} />
      <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-zinc-900 dark:text-white mb-2 max-w-3xl leading-tight">
        {seoData.h1Title}
      </h1>
      <p className="max-w-xl text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 font-normal leading-relaxed">
        {seoData.metaDescription}
      </p>
    </div>
  );
});
