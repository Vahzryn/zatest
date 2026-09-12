import React from 'react';
import { 
  Minimize2, 
  Smartphone, 
  Repeat, 
  FileText, 
  Braces, 
  Sparkles, 
  ShieldCheck, 
  GitCompare, 
  ArrowRight 
} from 'lucide-react';
import { cn } from '../lib/utils';

interface HomeTaskDiscoveryProps {
  onNavigate: (path: string) => void;
}

interface TaskItem {
  id: string;
  name: string;
  shortDesc: string;
  route: string;
  badge?: string;
  icon: React.ComponentType<{ className?: string }>;
}

const PRIMARY_TASKS: TaskItem[] = [
  {
    id: 'compress',
    name: 'Compress Images',
    shortDesc: 'Target KB limits & WebAssembly shrink',
    route: '/client-side-private-image-compressor',
    icon: Minimize2,
  },
  {
    id: 'heic',
    name: 'HEIC to JPG',
    shortDesc: 'Apple iPhone photos to standard JPEG',
    route: '/convert-heic-to-jpg-locally',
    icon: Smartphone,
  },
  {
    id: 'convert',
    name: 'Convert Formats',
    shortDesc: 'PNG, JPG, WebP, AVIF, SVG & ICO',
    route: '/bulk-image-compressor-offline',
    icon: Repeat,
  },
  {
    id: 'pdf',
    name: 'PDF Suite',
    shortDesc: 'Merge, split, compress & PDF to JPG',
    route: '/tools/documents',
    icon: FileText,
  },
  {
    id: 'dev',
    name: 'JSON & Dev Tools',
    shortDesc: 'JSON formatter, JWT decoder & Regex',
    route: '/tools/developer',
    icon: Braces,
  },
  {
    id: 'webp-png',
    name: 'WebP ↔ PNG',
    shortDesc: 'Lossless conversion with alpha intact',
    route: '/convert-webp-to-png-transparent',
    icon: Sparkles,
  },
  {
    id: 'privacy',
    name: 'Metadata & Privacy',
    shortDesc: 'Strip GPS EXIF tags & pixelate data',
    route: '/strip-exif-metadata-online-private',
    icon: ShieldCheck,
  },
  {
    id: 'diff',
    name: 'Text Diff & Markdown',
    shortDesc: 'Side-by-side diff & live GFM preview',
    route: '/tools/text',
    icon: GitCompare,
  },
];

export const HomeTaskDiscovery: React.FC<HomeTaskDiscoveryProps> = ({ onNavigate }) => {
  return (
    <section className="w-full mb-4 animate-in fade-in duration-200" id="home-task-discovery">
      {/* Header Bar */}
      <div className="flex items-center justify-between gap-3 mb-3 px-1">
        <div>
          <h2 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-white tracking-tight">
            What do you need to do?
          </h2>
          <p className="text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400">
            Select a task or drop files below for client-side processing
          </p>
        </div>

        <button
          type="button"
          onClick={() => onNavigate('/tools')}
          className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors cursor-pointer group shrink-0 px-2 py-1 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950/40"
        >
          <span>All 30+ Tools</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      {/* Compact Interactive Task Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {PRIMARY_TASKS.map((task) => {
          const Icon = task.icon;
          return (
            <button
              key={task.id}
              type="button"
              onClick={() => onNavigate(task.route)}
              className={cn(
                "group relative flex flex-col p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-zinc-200/90 dark:border-zinc-800 bg-white/60 dark:bg-zinc-900/40 hover:border-indigo-400 dark:hover:border-indigo-500/80 hover:bg-gradient-to-br hover:from-white hover:to-indigo-50/50 dark:hover:from-zinc-900 dark:hover:to-indigo-950/20 shadow-sm hover:shadow-lg text-left transition-all duration-300 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/40 active:scale-[0.97]"
              )}
            >
              <div className="flex items-center justify-between w-full">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 group-hover:bg-indigo-600 group-hover:text-white dark:group-hover:bg-indigo-600 dark:group-hover:text-white group-hover:shadow-[0_0_15px_rgba(79,70,229,0.4)] flex items-center justify-center transition-all duration-300 shrink-0">
                  <Icon className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
                </div>
                {task.badge && (
                  <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 bg-zinc-100 dark:bg-zinc-800/80 px-2 py-0.5 rounded-full shadow-xs">
                    {task.badge}
                  </span>
                )}
              </div>
              <span className="text-sm sm:text-base font-bold text-zinc-900 dark:text-white tracking-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors mt-3.5 truncate w-full">
                {task.name}
              </span>
              <span className="text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400 font-medium leading-snug line-clamp-2 mt-1">
                {task.shortDesc}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
};
