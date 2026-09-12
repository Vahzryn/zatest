import React, { useState, useRef } from 'react';
import { ImageFileItem } from '../types';
import { formatBytes, cn } from '../lib/utils';
import { X, SlidersHorizontal, ArrowLeftRight, Check, Eye } from 'lucide-react';

interface CompareModalProps {
  item: ImageFileItem;
  onClose: () => void;
}

export function CompareModal({ item, onClose }: CompareModalProps) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const [originalUrl, setOriginalUrl] = useState<string>('');

  React.useEffect(() => {
    const url = URL.createObjectURL(item.file);
    setOriginalUrl(url);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [item.file]);

  const handleMove = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isDragging) {
      handleMove(e.touches[0].clientX);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      handleMove(e.clientX);
    }
  };

  const savings = (item.originalSize && item.convertedSize)
    ? Math.round(((item.originalSize - item.convertedSize) / item.originalSize) * 100)
    : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative flex flex-col w-full max-w-4xl h-[95vh] sm:h-auto max-h-[95vh] sm:max-h-[90vh] bg-white dark:bg-zinc-950 rounded-2xl sm:rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-2 bg-indigo-50 dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 rounded-xl sm:rounded-2xl">
              <Eye className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base sm:text-xl font-bold text-zinc-900 dark:text-zinc-200 leading-tight">Comparison Inspector</h3>
              <p className="text-[10px] sm:text-xs font-semibold text-zinc-500 dark:text-zinc-400 truncate max-w-[160px] sm:max-w-md">
                {item.file.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 sm:p-2.5 transition-all text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full cursor-pointer"
          >
            <X className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Comparison Canvas Area */}
        <div className="relative flex-1 min-h-[200px] sm:min-h-[350px] p-2 sm:p-6 bg-zinc-900 flex items-center justify-center overflow-hidden select-none">
          <div
            ref={containerRef}
            onMouseDown={() => setIsDragging(true)}
            onMouseUp={() => setIsDragging(false)}
            onMouseLeave={() => setIsDragging(false)}
            onMouseMove={handleMouseMove}
            onTouchStart={() => setIsDragging(true)}
            onTouchEnd={() => setIsDragging(false)}
            onTouchMove={handleTouchMove}
            className="relative w-full h-full max-h-[50vh] sm:max-h-[60vh] md:max-h-[70vh] flex items-center justify-center cursor-ew-resize overflow-hidden rounded-xl border border-zinc-800"
          >
            {/* Converted Image (Right side / Full background) */}
            <img
              src={item.convertedUrl}
              alt="Converted"
              width="800"
              height="500"
              loading="lazy"
              decoding="async"
              referrerPolicy="no-referrer"
              className="absolute inset-0 w-full h-full object-contain pointer-events-none"
            />
            
            {/* Label Right - Converted */}
            <div className="absolute top-2 sm:top-4 right-2 sm:right-4 z-10 px-2 sm:px-3 py-1 sm:py-1.5 bg-emerald-600/90 text-white text-[9px] sm:text-xs font-bold rounded-lg sm:rounded-xl shadow-lg backdrop-blur-md">
              Converted ({formatBytes(item.convertedSize || 0)})
            </div>

            {/* Original Image (Left side clipped) */}
            <img
              src={originalUrl}
              alt="Original"
              width="800"
              height="500"
              loading="lazy"
              decoding="async"
              referrerPolicy="no-referrer"
              className="absolute inset-0 w-full h-full object-contain pointer-events-none"
              style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
            />
            
            {/* Label Left - Original */}
            <div 
              className="absolute top-2 sm:top-4 left-2 sm:left-4 z-10 px-2 sm:px-3 py-1 sm:py-1.5 bg-zinc-900/90 text-white text-[9px] sm:text-xs font-bold rounded-lg sm:rounded-xl shadow-lg backdrop-blur-md"
              style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
            >
              Original ({formatBytes(item.originalSize)})
            </div>

            {/* Drag Handle Bar */}
            <div
              style={{ left: `${sliderPosition}%` }}
              className="absolute top-0 bottom-0 z-20 w-8 flex flex-col items-center justify-center pointer-events-none -ml-4"
            >
              <div className="absolute top-0 bottom-0 w-0.5 bg-white dark:bg-indigo-500 shadow-2xl" />
              <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-white dark:bg-zinc-950 text-zinc-800 dark:text-indigo-400 shadow-xl border-2 border-indigo-500 flex items-center justify-center z-10">
                <ArrowLeftRight className="w-3 h-3 sm:w-4 sm:h-4" />
              </div>
            </div>
          </div>
        </div>

        {/* Stats Footer */}
        <div className="grid grid-cols-3 gap-1.5 sm:gap-4 p-3 sm:p-6 bg-zinc-50 dark:bg-[#171717] border-t border-zinc-200 dark:border-zinc-800">
          <div className="p-2 sm:p-3 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl sm:rounded-2xl min-w-0">
            <span className="block text-[9px] sm:text-xs font-semibold text-zinc-400 dark:text-zinc-400 truncate">Original Size</span>
            <span className="text-xs sm:text-base font-bold text-zinc-800 dark:text-zinc-200 truncate block">
              {formatBytes(item.originalSize)}
            </span>
          </div>

          <div className="p-2 sm:p-3 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl sm:rounded-2xl min-w-0">
            <span className="block text-[9px] sm:text-xs font-semibold text-zinc-400 dark:text-zinc-400 truncate">New Size</span>
            <span className="text-xs sm:text-base font-bold text-emerald-600 dark:text-emerald-400 truncate block">
              {formatBytes(item.convertedSize || 0)}
            </span>
          </div>

          <div className="p-2 sm:p-3 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl sm:rounded-2xl min-w-0">
            <span className="block text-[9px] sm:text-xs font-semibold text-zinc-400 dark:text-zinc-400 truncate">Savings</span>
            <span className={cn("text-xs sm:text-base font-bold truncate block", savings >= 0 ? "text-indigo-600 dark:text-indigo-400" : "text-amber-600 dark:text-[#fdd663]")}>
              {savings >= 0 ? `-${savings}%` : `+${Math.abs(savings)}%`}
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}
