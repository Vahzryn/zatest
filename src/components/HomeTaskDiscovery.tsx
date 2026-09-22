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
import { InfoTooltip } from './InfoTooltip';

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

const PRIMARY_IMAGE_TOOLS: TaskItem[] = [
  {
    id: 'compress',
    name: 'Compress Image',
    shortDesc: 'Reduce file size while keeping visual quality',
    route: '/client-side-private-image-compressor',
    icon: Minimize2,
    badge: 'Popular',
  },
  {
    id: 'bg-remover',
    name: 'Remove Background',
    shortDesc: 'Cut out image backgrounds automatically in your browser',
    route: '/background-remover',
    icon: Wand2,
    badge: 'Instant',
  },
  {
    id: 'convert',
    name: 'Convert Image',
    shortDesc: 'Convert between HEIC, PNG, JPG, WebP, and other formats',
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
    shortDesc: 'Convert WebP to PNG or PNG to WebP',
    route: '/convert-webp-to-png-transparent',
    icon: Sparkles,
  },
  {
    id: 'privacy',
    name: 'Remove Metadata',
    shortDesc: 'Scrub GPS location and camera data from photos',
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
    <section className="w-full mb-4 space-y-3.5 sm:space-y-4 animate-in fade-in duration-200 max-w-full overflow-hidden" id="home-task-discovery">
      {/* Top Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1 border-b border-zinc-200/80 dark:border-zinc-800 pb-2">
        <div>
          <h2 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100 tracking-tight flex items-center gap-2">
            <span>What do you want to do?</span>
          </h2>
          <div className="flex items-center gap-1.5 mt-0.5">
            <p className="text-[11px] sm:text-xs text-zinc-600 dark:text-zinc-400">
              Your files are processed in your browser.
            </p>
            <InfoTooltip
              title="Privacy Notice"
              text="All conversions and edits execute directly on your device. Your files never leave your computer or get uploaded to a cloud server."
              align="left"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={() => onNavigate('/tools')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer group shrink-0 px-2.5 py-1 rounded-lg border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700 shadow-2xs self-start sm:self-auto active:scale-[0.98]"
        >
          <span>All 30+ Tools</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform duration-200" />
        </button>
      </div>

      {/* 1. PRIMARY IMAGE TOOLS (Calm refined resting state -> Interactive accent) */}
      <div className="space-y-2">
        <div className="flex items-center gap-1.5 px-1">
          <div className="p-1 rounded-md bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/60 dark:border-zinc-700/50 text-zinc-600 dark:text-zinc-300 shrink-0">
            <ImageIcon className="w-3.5 h-3.5" />
          </div>
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
            Primary Image Tools
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-2.5">
          {PRIMARY_IMAGE_TOOLS.map((task) => {
            const Icon = task.icon;
            const isFeatured = task.id === 'bg-remover';
            return (
              <button
                key={task.id}
                type="button"
                onClick={() => onNavigate(task.route)}
                className={cn(
                  "group relative flex flex-col justify-between p-3 sm:p-3.5 rounded-xl border bg-white dark:bg-zinc-900 shadow-xs hover:shadow-sm hover:-translate-y-0.5 text-left transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 active:scale-[0.98] min-w-0 motion-reduce:transition-none motion-reduce:transform-none",
                  isFeatured
                    ? "border-zinc-200/90 dark:border-zinc-800 hover:border-indigo-400/80 dark:hover:border-indigo-500/60"
                    : "border-zinc-200/90 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
                )}
              >
                <div>
                  <div className="flex items-center justify-between w-full">
                    <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/70 dark:border-zinc-700/60 text-zinc-700 dark:text-zinc-200 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-950/50 group-hover:border-indigo-200 dark:group-hover:border-indigo-800/60 group-hover:text-indigo-600 dark:group-hover:text-indigo-300 flex items-center justify-center transition-all duration-200 shrink-0">
                      <Icon className="w-4 h-4" />
                    </div>
                    {task.badge && (
                      <span className={cn(
                        "text-[10px] font-semibold px-2 py-0.5 rounded-full border transition-colors duration-200",
                        isFeatured
                          ? "bg-indigo-50/80 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-200/70 dark:border-indigo-800/60 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/60"
                          : "bg-zinc-100 dark:bg-zinc-800 border-zinc-200/70 dark:border-zinc-700/60 text-zinc-600 dark:text-zinc-300 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-950/50 group-hover:text-indigo-600 dark:group-hover:text-indigo-300 group-hover:border-indigo-200 dark:group-hover:border-indigo-800/60"
                      )}>
                        {task.badge}
                      </span>
                    )}
                  </div>

                  <span className="block text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100 tracking-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-200 mt-2 truncate w-full">
                    {task.name}
                  </span>
                  <span className="block text-[11px] sm:text-xs text-zinc-600 dark:text-zinc-400 font-normal leading-relaxed line-clamp-2 mt-0.5">
                    {task.shortDesc}
                  </span>
                </div>

                <div className="mt-2 pt-1.5 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-200">
                  <span>Open tool</span>
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform duration-200" />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. PDF & DOCUMENT TOOLS (Resting neutral -> Interacting emerald accent) */}
      <div className="space-y-2 pt-0.5">
        <div className="flex items-center gap-1.5 px-1">
          <div className="p-1 rounded-md bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/60 dark:border-zinc-700/50 text-zinc-600 dark:text-zinc-300 shrink-0">
            <FileText className="w-3.5 h-3.5" />
          </div>
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
            PDF & Document Tools
          </h3>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-1.5 sm:gap-2.5">
          {PDF_TOOLS.map((task) => {
            const Icon = task.icon;
            return (
              <button
                key={task.id}
                type="button"
                onClick={() => onNavigate(task.route)}
                className="group flex flex-col justify-between p-2.5 sm:p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-sm hover:-translate-y-0.5 text-left transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 active:scale-[0.98] min-w-0 motion-reduce:transition-none motion-reduce:transform-none"
              >
                <div>
                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/70 dark:border-zinc-700/60 text-zinc-700 dark:text-zinc-300 group-hover:bg-emerald-50 dark:group-hover:bg-emerald-950/50 group-hover:border-emerald-200 dark:group-hover:border-emerald-800/60 group-hover:text-emerald-600 dark:group-hover:text-emerald-300 flex items-center justify-center transition-colors duration-200 shrink-0 mb-1.5">
                    <Icon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  </div>
                  <span className="block text-xs font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors duration-200 truncate w-full">
                    {task.name}
                  </span>
                  <span className="block text-[10px] sm:text-[11px] text-zinc-600 dark:text-zinc-400 font-normal leading-tight line-clamp-1 mt-0.5">
                    {task.shortDesc}
                  </span>
                </div>

                <div className="mt-1.5 pt-1 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors duration-200">
                  <span>Open tool</span>
                  <ArrowRight className="w-2.5 h-2.5 group-hover:translate-x-0.5 transition-transform duration-200" />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. QUICK UTILITIES (Resting neutral -> Interacting indigo accent) */}
      <div className="space-y-2 pt-0.5">
        <div className="flex items-center gap-1.5 px-1">
          <div className="p-1 rounded-md bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/60 dark:border-zinc-700/50 text-zinc-600 dark:text-zinc-300 shrink-0">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
            Quick Utilities
          </h3>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2.5">
          {UTILITY_TOOLS.map((task) => {
            const Icon = task.icon;
            return (
              <button
                key={task.id}
                type="button"
                onClick={() => onNavigate(task.route)}
                className="group flex flex-col justify-between p-2.5 sm:p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-sm hover:-translate-y-0.5 text-left transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 active:scale-[0.98] min-w-0 motion-reduce:transition-none motion-reduce:transform-none"
              >
                <div>
                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/70 dark:border-zinc-700/60 text-zinc-700 dark:text-zinc-300 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-950/50 group-hover:border-indigo-200 dark:group-hover:border-indigo-800/60 group-hover:text-indigo-600 dark:group-hover:text-indigo-300 flex items-center justify-center transition-colors duration-200 shrink-0 mb-1.5">
                    <Icon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  </div>
                  <span className="block text-xs font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-200 truncate w-full">
                    {task.name}
                  </span>
                  <span className="block text-[10px] sm:text-[11px] text-zinc-600 dark:text-zinc-400 font-normal leading-tight line-clamp-1 mt-0.5">
                    {task.shortDesc}
                  </span>
                </div>

                <div className="mt-1.5 pt-1 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-200">
                  <span>Open tool</span>
                  <ArrowRight className="w-2.5 h-2.5 group-hover:translate-x-0.5 transition-transform duration-200" />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
};
