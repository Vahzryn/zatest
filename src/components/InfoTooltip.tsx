import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Info, X } from 'lucide-react';
import { cn } from '../lib/utils';

export interface InfoTooltipProps {
  /** The text or ReactNode to display inside the tooltip/popover */
  content?: React.ReactNode;
  /** Plain string shorthand for content */
  text?: string;
  /** Alignment of the popover relative to the icon: 'left' | 'right' | 'center' (default: 'right') */
  align?: 'left' | 'right' | 'center';
  /** Accessible label for the trigger button */
  ariaLabel?: string;
  /** Custom trigger class names */
  className?: string;
  /** Optional title heading inside the popover */
  title?: string;
}

export function InfoTooltip({
  content,
  text,
  align = 'right',
  ariaLabel = 'More information',
  className,
  title,
}: InfoTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const isHoveredRef = useRef(false);

  const bodyContent = content || text;

  // Close on outside click / tap
  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown, { passive: true });
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleMouseEnter = () => {
    isHoveredRef.current = true;
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    isHoveredRef.current = false;
    setIsOpen(false);
  };

  const handleTriggerClick = (e: React.MouseEvent) => {
    // Crucial: prevent activating parent <label> if nested inside one
    e.preventDefault();
    e.stopPropagation();
    setIsOpen((prev) => !prev);
  };

  const handleFocus = () => {
    setIsOpen(true);
  };

  const handleBlur = (e: React.FocusEvent) => {
    // If focus moves to something inside container, do not close
    if (containerRef.current?.contains(e.relatedTarget as Node)) {
      return;
    }
    setIsOpen(false);
  };

  // Alignment classes
  const alignmentClass =
    align === 'left'
      ? 'left-0'
      : align === 'center'
      ? 'left-1/2 -translate-x-1/2'
      : 'right-0';

  return (
    <div
      ref={containerRef}
      className={cn('relative inline-flex items-center shrink-0', className)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        ref={triggerRef}
        type="button"
        onClick={handleTriggerClick}
        onFocus={handleFocus}
        onBlur={handleBlur}
        aria-label={ariaLabel}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        className="p-1 rounded-md text-zinc-400 hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 cursor-pointer"
      >
        <Info className="w-3.5 h-3.5" aria-hidden="true" />
      </button>

      {isOpen && (
        <div
          role="tooltip"
          className={cn(
            'absolute bottom-full mb-1.5 z-50 pointer-events-auto',
            'w-64 max-w-[calc(100vw-2.5rem)] sm:w-72',
            'p-2.5 sm:p-3 text-[11px] sm:text-xs leading-relaxed',
            'rounded-xl border shadow-lg',
            'bg-zinc-900 text-zinc-100 border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:border-zinc-700',
            'animate-in fade-in zoom-in-95 duration-150',
            alignmentClass
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start justify-between gap-1.5 mb-1">
            {title ? (
              <span className="font-semibold text-white tracking-tight">{title}</span>
            ) : (
              <span className="text-[10px] font-semibold tracking-wider uppercase text-zinc-400">
                Help & Details
              </span>
            )}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsOpen(false);
              }}
              className="sm:hidden -mr-1 -mt-1 p-1 text-zinc-400 hover:text-white rounded"
              aria-label="Close details"
            >
              <X className="w-3 h-3" />
            </button>
          </div>

          <div className="text-zinc-300 font-normal">{bodyContent}</div>
        </div>
      )}
    </div>
  );
}
