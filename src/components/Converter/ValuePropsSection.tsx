import React from 'react';
import { ShieldCheck, Lock, Activity, Wrench } from 'lucide-react';

export const ValuePropsSection = React.memo(function ValuePropsSection() {
  return (
    <section className="w-full max-w-5xl mx-auto mb-8 rounded-3xl border border-zinc-200/80 bg-white/60 p-6 dark:border-zinc-800 dark:bg-zinc-900/40 sm:p-8 shadow-sm hover:shadow-md transition-shadow">
      <div className="max-w-2xl mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">
          Why use Zapixal
        </h2>
        <p className="mt-1.5 text-sm sm:text-base text-zinc-600 dark:text-zinc-400 font-medium">
          Fast browser-based tools engineered for privacy, performance, and day-to-day workflow tasks.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-black/40 hover:border-emerald-500/50 dark:hover:border-emerald-500/50 transition-colors group">
          <div className="flex items-center gap-2.5 text-sm sm:text-base font-bold text-zinc-900 dark:text-white">
            <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
              <Lock className="h-4 w-4" />
            </div>
            In-browser processing
          </div>
          <p className="mt-2 text-xs sm:text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            Image compression, PDF manipulation, and developer parsing run locally in browser memory via WebAssembly and Web Workers.
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-black/40 hover:border-indigo-500/50 dark:hover:border-indigo-500/50 transition-colors group">
          <div className="flex items-center gap-2.5 text-sm sm:text-base font-bold text-zinc-900 dark:text-white">
            <div className="p-1.5 rounded-lg bg-indigo-100 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform">
              <Activity className="h-4 w-4" />
            </div>
            Zero software setup
          </div>
          <p className="mt-2 text-xs sm:text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            No desktop applications or account signups required. Load the tool and process files immediately with full batch capabilities.
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-black/40 hover:border-amber-500/50 dark:hover:border-amber-500/50 transition-colors group">
          <div className="flex items-center gap-2.5 text-sm sm:text-base font-bold text-zinc-900 dark:text-white">
            <div className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform">
              <Wrench className="h-4 w-4" />
            </div>
            Unified toolkit
          </div>
          <p className="mt-2 text-xs sm:text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            From HEIC conversions and PDF merges to JWT inspection and text diffing, access all essential tools in one clean environment.
          </p>
        </div>
      </div>
    </section>
  );
});

