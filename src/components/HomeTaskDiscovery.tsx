import React from 'react';
import { 
  Minimize2, 
  Wand2, 
  Repeat, 
  Merge, 
  Split, 
  FileImage, 
  FileArchive, 
  ImagePlus, 
  Smartphone, 
  Sparkles, 
  ShieldCheck, 
  Braces, 
  ArrowRight,
  FileText,
  Image as ImageIcon
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
  highlight?: boolean;
}

const PRIMARY_IMAGE_TOOLS: TaskItem[] = [
  {
    id: 'compress',
    name: 'Compress Image',
    shortDesc: 'Reduce file size under target KB limits with WASM quality control',
    route: '/client-side-private-image-compressor',
    icon: Minimize2,
    badge: 'Popular',
  },
  {
    id: 'bg-remover',
    name: 'Remove Background',
    shortDesc: 'AI subject isolation & automatic background eraser in your browser',
    route: '/background-remover',
    icon: Wand2,
    badge: 'Client AI',
    highlight: true,
  },
  {
    id: 'convert',
    name: 'Convert Image',
    shortDesc: 'Batch convert HEIC, PNG, JPG, WebP & AVIF formats locally',
    route: '/bulk-image-compressor-offline',
    icon: Repeat,
    badge: 'Batch',
  },
];

const PDF_TOOLS: TaskItem[] = [
  {
    id: 'pdf-merge',
    name: 'Merge PDF',
    shortDesc: 'Combine multiple PDF files into one',
    route: '/merge-pdf',
    icon: Merge,
  },
  {
    id: 'pdf-split',
    name: 'Split PDF',
    shortDesc: 'Extract pages or split document',
    route: '/split-pdf',
    icon: Split,
  },
  {
    id: 'pdf-to-jpg',
    name: 'PDF to JPG',
    shortDesc: 'Export PDF pages as images',
    route: '/convert-pdf-pages-to-jpg-images',
    icon: FileImage,
  },
  {
    id: 'pdf-compress',
    name: 'Compress PDF',
    shortDesc: 'Reduce document size securely',
    route: '/secure-document-compressor-pdf',
    icon: FileArchive,
  },
  {
    id: 'img-to-pdf',
    name: 'Images to PDF',
    shortDesc: 'Convert photos to PDF document',
    route: '/convert-image-to-pdf',
    icon: ImagePlus,
  },
];

const UTILITY_TOOLS: TaskItem[] = [
  {
    id: 'heic',
    name: 'HEIC to JPG',
    shortDesc: 'Apple iPhone photos to standard JPEG',
    route: '/convert-heic-to-jpg-locally',
    icon: Smartphone,
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
    name: 'Metadata & EXIF',
    shortDesc: 'Strip GPS location & pixelate data',
    route: '/strip-exif-metadata-online-private',
    icon: ShieldCheck,
  },
  {
    id: 'dev',
    name: 'JSON & Dev Tools',
    shortDesc: 'JSON formatter, JWT decoder & Regex',
    route: '/tools/developer',
    icon: Braces,
  },
];

export const HomeTaskDiscovery: React.FC<HomeTaskDiscoveryProps> = ({ onNavigate }) => {
  return (
    <section className="w-full mb-6 space-y-6 animate-in fade-in duration-200" id="home-task-discovery">
      {/* Top Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 px-1 border-b border-zinc-200/80 dark:border-zinc-800 pb-3">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white tracking-tight flex items-center gap-2">
            <span>What do you want to do?</span>
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Select a task or drop files below for private client-side processing
          </p>
        </div>

        <button
          type="button"
          onClick={() => onNavigate('/tools')}
          className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors cursor-pointer group shrink-0 px-2.5 py-1.5 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-950/40 self-start sm:self-auto"
        >
          <span>All 30+ Tools</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      {/* 1. PRIMARY IMAGE TOOLS (Prominent Grid) */}
      <div className="space-y-2.5">
        <div className="flex items-center gap-2 px-1">
          <ImageIcon className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Primary Image Tools
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {PRIMARY_IMAGE_TOOLS.map((task) => {
            const Icon = task.icon;
            return (
              <button
                key={task.id}
                type="button"
                onClick={() => onNavigate(task.route)}
                className={cn(
                  "group relative flex flex-col p-4 sm:p-5 rounded-2xl border bg-white dark:bg-zinc-900/60 shadow-xs hover:shadow-md text-left transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/40 active:scale-[0.98]",
                  task.highlight
                    ? "border-indigo-300 dark:border-indigo-800/80 hover:border-indigo-500 dark:hover:border-indigo-500 bg-gradient-to-b from-indigo-50/40 via-white to-white dark:from-indigo-950/20 dark:via-zinc-900/60 dark:to-zinc-900/60"
                    : "border-zinc-200/90 dark:border-zinc-800 hover:border-indigo-400 dark:hover:border-indigo-500/80"
                )}
              >
                <div className="flex items-center justify-between w-full">
                  <div className={cn(
                    "w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition-all duration-200 shrink-0",
                    task.highlight
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 group-hover:bg-indigo-600 group-hover:text-white"
                  )}>
                    <Icon className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
                  </div>
                  {task.badge && (
                    <span className={cn(
                      "text-[10px] font-bold px-2 py-0.5 rounded-full shadow-2xs",
                      task.highlight
                        ? "bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300"
                        : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300"
                    )}>
                      {task.badge}
                    </span>
                  )}
                </div>

                <span className="text-sm sm:text-base font-bold text-zinc-900 dark:text-white tracking-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors mt-3 truncate w-full">
                  {task.name}
                </span>
                <span className="text-xs text-zinc-500 dark:text-zinc-400 font-normal leading-snug line-clamp-2 mt-1">
                  {task.shortDesc}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. PDF TOOLS (Dedicated Section) */}
      <div className="space-y-2.5 pt-1">
        <div className="flex items-center gap-2 px-1">
          <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            PDF & Document Tools
          </h3>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5 sm:gap-3">
          {PDF_TOOLS.map((task) => {
            const Icon = task.icon;
            return (
              <button
                key={task.id}
                type="button"
                onClick={() => onNavigate(task.route)}
                className="group flex flex-col p-3 sm:p-3.5 rounded-xl border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 hover:border-emerald-400 dark:hover:border-emerald-500/80 hover:bg-emerald-50/30 dark:hover:bg-emerald-950/20 text-left transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500/40 active:scale-[0.98]"
              >
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white flex items-center justify-center transition-colors shrink-0 mb-2">
                  <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
                <span className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors truncate w-full">
                  {task.name}
                </span>
                <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-normal leading-tight line-clamp-2 mt-0.5">
                  {task.shortDesc}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. SECONDARY UTILITIES */}
      <div className="space-y-2.5 pt-1">
        <div className="flex items-center gap-2 px-1">
          <Sparkles className="w-4 h-4 text-indigo-500 shrink-0" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Quick Utilities
          </h3>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
          {UTILITY_TOOLS.map((task) => {
            const Icon = task.icon;
            return (
              <button
                key={task.id}
                type="button"
                onClick={() => onNavigate(task.route)}
                className="group flex flex-col p-3 sm:p-3.5 rounded-xl border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 hover:border-indigo-400 dark:hover:border-indigo-500/80 text-left transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/40 active:scale-[0.98]"
              >
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 group-hover:bg-indigo-600 group-hover:text-white flex items-center justify-center transition-colors shrink-0 mb-2">
                  <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
                <span className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate w-full">
                  {task.name}
                </span>
                <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-normal leading-tight line-clamp-2 mt-0.5">
                  {task.shortDesc}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
};

