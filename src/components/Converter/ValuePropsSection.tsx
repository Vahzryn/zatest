import React from 'react';
import { Lock, Zap, Wrench } from 'lucide-react';
import { InfoTooltip } from '../InfoTooltip';

export const ValuePropsSection = React.memo(function ValuePropsSection() {
  return (
    <section className="w-full max-w-5xl mx-auto mb-6 rounded-2xl border border-zinc-200 bg-white p-4 sm:p-5 dark:border-zinc-800 dark:bg-zinc-900/60 shadow-2xs" id="value-props-section">
      <div className="max-w-2xl mb-3.5">
        <h2 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-white tracking-tight">
          Why use Zapixal
        </h2>
        <p className="mt-0.5 text-xs text-zinc-600 dark:text-zinc-400 font-normal">
          Simple, fast tools designed for your everyday file tasks.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {/* Value Prop 1: Private by design */}
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/90 p-3 sm:p-3.5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-1 mb-1">
              <div className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-zinc-900 dark:text-white">
                <div className="p-1 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                  <Lock className="h-3.5 w-3.5" />
                </div>
                <span>Private by design</span>
              </div>
              <InfoTooltip
                title="Browser Processing"
                text="Files stay on your local device and are processed directly in your browser. No files are uploaded to remote servers."
                align="right"
              />
            </div>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 font-normal leading-relaxed">
              Processed in your browser.
            </p>
          </div>
        </div>

        {/* Value Prop 2: No setup */}
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/90 p-3 sm:p-3.5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-1 mb-1">
              <div className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-zinc-900 dark:text-white">
                <div className="p-1 rounded-md bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                  <Zap className="h-3.5 w-3.5" />
                </div>
                <span>No setup</span>
              </div>
              <InfoTooltip
                title="Instant Access"
                text="Works immediately on desktop, tablet, and mobile. Process single files or batches without signing up or installing software."
                align="right"
              />
            </div>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 font-normal leading-relaxed">
              No account or software installation required.
            </p>
          </div>
        </div>

        {/* Value Prop 3: One toolkit */}
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/90 p-3 sm:p-3.5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-1 mb-1">
              <div className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-zinc-900 dark:text-white">
                <div className="p-1 rounded-md bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
                  <Wrench className="h-3.5 w-3.5" />
                </div>
                <span>One toolkit</span>
              </div>
              <InfoTooltip
                title="Integrated Utilities"
                text="Access image optimization, PDF manipulation, background removal, and developer tools in a single unified interface."
                align="right"
              />
            </div>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 font-normal leading-relaxed">
              Images, PDFs, and useful developer tools in one place.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
});
