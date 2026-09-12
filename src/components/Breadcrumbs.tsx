import React from 'react';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbsProps {
  items: { name: string; url: string }[];
  onNavigate: (path: string) => void;
}

export function Breadcrumbs({ items, onNavigate }: BreadcrumbsProps) {
  if (!items || items.length <= 1) return null;

  return (
    <nav aria-label="Breadcrumb" className="mb-4">
      <ol className="flex items-center flex-wrap gap-1.5 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          const isHome = index === 0;

          return (
            <li key={item.url + index} className="flex items-center gap-1.5">
              {index > 0 && <ChevronRight className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-700 shrink-0" />}
              {isLast ? (
                <span className="text-zinc-800 dark:text-zinc-200 font-bold" aria-current="page">
                  {item.name}
                </span>
              ) : (
                <button
                  onClick={() => onNavigate(item.url)}
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  {isHome && <Home className="w-3.5 h-3.5 shrink-0" />}
                  <span>{item.name}</span>
                </button>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
