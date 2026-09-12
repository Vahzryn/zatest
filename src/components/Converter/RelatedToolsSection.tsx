import React from 'react';
import { ArrowRight, Wrench } from 'lucide-react';

interface RelatedToolsSectionProps {
  title?: string;
  relatedRoutes?: Array<{ path: string; label: string }> | null;
  onNavigate?: (path: string) => void;
}

export const RelatedToolsSection: React.FC<RelatedToolsSectionProps> = ({
  title = 'Related Tools & Converters',
  relatedRoutes,
  onNavigate,
}) => {
  if (!relatedRoutes || relatedRoutes.length === 0) return null;

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, path: string) => {
    if (onNavigate) {
      e.preventDefault();
      onNavigate(path);
    }
  };

  return (
    <div className="mt-8 pt-6 border-t border-zinc-200/80 dark:border-zinc-800">
      <div className="flex items-center gap-2 mb-4">
        <Wrench className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
        <h3 className="text-base font-black text-zinc-900 dark:text-white">
          {title}
        </h3>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {relatedRoutes.map((route) => (
          <a
            key={route.path}
            href={route.path}
            onClick={(e) => handleClick(e, route.path)}
            className="group flex items-center justify-between p-3 rounded-2xl border border-zinc-200 bg-zinc-50/80 hover:bg-indigo-50/60 hover:border-indigo-200 dark:border-zinc-800 dark:bg-zinc-950/80 dark:hover:bg-indigo-950/30 dark:hover:border-indigo-800 transition-all text-xs font-semibold text-zinc-800 dark:text-zinc-200 hover:text-indigo-700 dark:hover:text-indigo-300"
          >
            <span className="truncate mr-2">{route.label}</span>
            <ArrowRight className="w-3.5 h-3.5 text-zinc-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 shrink-0 transition-transform group-hover:translate-x-0.5" />
          </a>
        ))}
      </div>
    </div>
  );
};

