import React from 'react';
import { cn } from '../lib/utils';

interface AdSlotProps {
  /**
   * Placement context for future ad targeting/analytics.
   */
  placement?: 'homepage' | 'tool-result' | 'directory' | 'article';
  /**
   * Optional custom styling.
   */
  className?: string;
}

/**
 * Reusable layout container reserved for small, privacy-friendly future sponsorships/advertisements.
 * 
 * Design specifications:
 * - Positioned strictly AFTER primary useful interactions/results and BEFORE lower-priority supporting content.
 * - Normal document flow (strictly no sticky, floating, popup, or interstitial overlays).
 * - Explicit "Advertisement" label for full transparency.
 * - Visually distinct from Zapixal's own tool cards (neutral dashed border, muted surface).
 * - Layout-shift protected: fixed/min-height reserve guard prevents CLS.
 * - Client-side static placeholder: no third-party ad networks or tracking scripts loaded.
 */
export const AdSlot: React.FC<AdSlotProps> = React.memo(function AdSlot({
  placement = 'homepage',
  className,
}) {
  return (
    <aside
      aria-label="Advertisement"
      data-ad-placement={placement}
      className={cn(
        "w-full max-w-4xl mx-auto my-4 sm:my-5 rounded-xl border border-dashed border-zinc-200/90 dark:border-zinc-800/90 bg-zinc-50/50 dark:bg-zinc-900/30 p-2.5 sm:p-3 text-center transition-colors min-h-[90px] sm:min-h-[100px] flex flex-col items-center justify-center relative select-none",
        className
      )}
    >
      {/* Explicit Advertisement Header */}
      <div className="flex items-center justify-between w-full px-2 mb-1.5">
        <span className="text-[10px] font-semibold tracking-wider uppercase text-zinc-400 dark:text-zinc-500">
          Advertisement
        </span>
        <span className="text-[10px] text-zinc-400/80 dark:text-zinc-500/80 font-mono">
          Privacy-Friendly
        </span>
      </div>

      {/* Reserved Clean Slot Content Area (Modest height, non-shifting layout guard) */}
      <div className="w-full h-12 sm:h-14 flex items-center justify-center rounded-lg border border-dashed border-zinc-200/60 dark:border-zinc-800/60 bg-white/40 dark:bg-zinc-900/40 text-xs text-zinc-400 dark:text-zinc-500">
        <span className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500">
          Sponsored Space Reserved
        </span>
      </div>
    </aside>
  );
});
