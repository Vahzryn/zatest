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
  icon: React.ComponentType<{ className?: string }>;
}

const PRIMARY_IMAGE_TOOLS: TaskItem[] = [
  {
    id: 'compress',
    name: 'Compress Image',
    shortDesc: 'Reduce file size with visual quality controls',
    route: '/client-side-private-image-compressor',
    icon: Minimize2,
  },
  {
    id: 'bg-remover',
    name: 'Remove Background',
    shortDesc: 'Cut out subjects automatically in browser',
    route: '/background-remover',
    icon: Wand2,
  },
  {
    id: 'convert',
    name: 'Convert Image',
    shortDesc: 'Batch convert HEIC, PNG, JPG, WebP, AVIF',
    route: '/bulk-image-compressor-offline',
    icon: Repeat,
  },
];

const PDF_TOOLS: TaskItem[] = [
  {
    id: 'pdf-merge',
    name: 'Merge PDF',
    shortDesc: 'Combine multiple documents into one',
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
    shortDesc: 'Export pages as images',
    route: '/convert-pdf-pages-to-jpg-images',
    icon: FileImage,
  },
  {
    id: 'pdf-compress',
    name: 'Compress PDF',
    shortDesc: 'Reduce document size',
    route: '/secure-document-compressor-pdf',
    icon: FileArchive,
  },
  {
    id: 'img-to-pdf',
    name: 'Images to PDF',
    shortDesc: 'Convert photos to PDF',
    route: '/convert-image-to-pdf',
    icon: ImagePlus,
  },
];

const UTILITY_TOOLS: TaskItem[] = [
  {
    id: 'heic',
    name: 'HEIC to JPG',
    shortDesc: 'iPhone photos to JPEG',
    route: '/convert-heic-to-jpg-locally',
    icon: Smartphone,
  },
  {
    id: 'webp-png',
    name: 'WebP ↔ PNG',
    shortDesc: 'Convert transparent formats',
    route: '/convert-webp-to-png-transparent',
    icon: Sparkles,
  },
  {
    id: 'privacy',
    name: 'Remove Metadata',
    shortDesc: 'Scrub GPS and EXIF data',
    route: '/strip-exif-metadata-online-private',
    icon: ShieldCheck,
  },
  {
    id: 'dev',
    name: 'Developer Tools',
    shortDesc: 'JSON, JWT & Regex tools',
    route: '/tools/developer',
    icon: Braces,
  },
];

export const HomeTaskDiscovery: React.FC<HomeTaskDiscoveryProps> = ({ onNavigate }) => {
  return (
    <section className="w-full mb-3 space-y-3 animate-in fade-in duration-200 max-w-full overflow-hidden" id="home-task-discovery">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-2 px-0.5 pb-1 border-b border-zinc-200/80 dark:border-zinc-800">
        <h2 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
          What do you want to do?
        </h2>

        <button
          type="button"
          onClick={() => onNavigate('/tools')}
          className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors cursor-pointer group shrink-0"
        >
          <span>All 30+ tools</span>
          <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      {/* 1. Image tools */}
      <div className="space-y-1.5">
        <h3 className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 px-0.5">
          Image tools
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-2.5">
          {PRIMARY_IMAGE_TOOLS.map((task) => {
            const Icon = task.icon;
            return (
              <button
                key={task.id}
                type="button"
                onClick={() => onNavigate(task.route)}
                className="group flex sm:flex-col items-center sm:items-start text-left gap-3 sm:gap-2.5 p-3 sm:p-3.5 rounded-xl border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs hover:border-indigo-300 dark:hover:border-indigo-600/60 hover:shadow-xs hover:-translate-y-0.5 transition-all duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 active:scale-[0.98] min-w-0"
              >
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-indigo-50/80 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-900/60 text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white dark:group-hover:bg-indigo-500 transition-all duration-150 flex items-center justify-center shrink-0">
                  <Icon className="w-4.5 h-4.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="block text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">
                    {task.name}
                  </span>
                  <span className="block text-[11px] text-zinc-500 dark:text-zinc-400 leading-snug line-clamp-1 mt-0.5">
                    {task.shortDesc}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. PDF tools */}
      <div className="space-y-1.5">
        <h3 className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 px-0.5">
          PDF tools
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
          {PDF_TOOLS.map((task) => {
            const Icon = task.icon;
            return (
              <button
                key={task.id}
                type="button"
                onClick={() => onNavigate(task.route)}
                className="group flex flex-col items-center text-center justify-center p-2.5 sm:p-3 rounded-xl border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs hover:border-emerald-300 dark:hover:border-emerald-600/60 hover:shadow-xs hover:-translate-y-0.5 transition-all duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 active:scale-[0.98] min-w-0 min-h-[82px] sm:min-h-[88px]"
              >
                <div className="w-7 h-7 rounded-lg bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white dark:group-hover:bg-emerald-500 transition-colors flex items-center justify-center shrink-0 mb-1.5">
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <div className="w-full min-w-0">
                  <span className="block text-xs font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors truncate">
                    {task.name}
                  </span>
                  <span className="block text-[10px] text-zinc-400 dark:text-zinc-500 leading-tight truncate mt-0.5">
                    {task.shortDesc}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Utilities */}
      <div className="space-y-1.5">
        <h3 className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 px-0.5">
          Utilities
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {UTILITY_TOOLS.map((task) => {
            const Icon = task.icon;
            return (
              <button
                key={task.id}
                type="button"
                onClick={() => onNavigate(task.route)}
                className="group flex flex-col items-center text-center justify-center p-2.5 sm:p-3 rounded-xl border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs hover:border-indigo-300 dark:hover:border-indigo-600/60 hover:shadow-xs hover:-translate-y-0.5 transition-all duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 active:scale-[0.98] min-w-0 min-h-[82px] sm:min-h-[88px]"
              >
                <div className="w-7 h-7 rounded-lg bg-indigo-50/80 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white dark:group-hover:bg-indigo-500 transition-colors flex items-center justify-center shrink-0 mb-1.5">
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <div className="w-full min-w-0">
                  <span className="block text-xs font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">
                    {task.name}
                  </span>
                  <span className="block text-[10px] text-zinc-400 dark:text-zinc-500 leading-tight truncate mt-0.5">
                    {task.shortDesc}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
};

