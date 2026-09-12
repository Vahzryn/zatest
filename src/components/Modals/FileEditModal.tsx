import React, { useState, useEffect } from 'react';
import { ImageFileItem, TargetFormat } from '../../types';
import { formatBytes } from '../../lib/utils';
import { X, RotateCcw, RotateCw, EyeOff, Info, Eye, Check, Sliders } from 'lucide-react';

interface FileEditModalProps {
  item: ImageFileItem;
  onClose: () => void;
  onRotate?: (id: string, deltaDegrees: number) => void;
  onUpdateFormat?: (id: string, format: TargetFormat | undefined) => void;
  onReformatItem?: (id: string, format: TargetFormat) => void;
  onSelectRegions?: (item: ImageFileItem) => void;
  onInspectDetails?: (item: ImageFileItem) => void;
  onCompare?: (item: ImageFileItem) => void;
}

export function FileEditModal({
  item,
  onClose,
  onRotate,
  onUpdateFormat,
  onReformatItem,
  onSelectRegions,
  onInspectDetails,
  onCompare,
}: FileEditModalProps) {
  const [previewSrc, setPreviewSrc] = useState<string>(item.convertedUrl || item.previewUrl || '');

  useEffect(() => {
    if (item.convertedUrl) {
      setPreviewSrc(item.convertedUrl);
      return;
    }
    const url = URL.createObjectURL(item.file);
    setPreviewSrc(url);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [item.convertedUrl, item.file, item.previewUrl]);

  const rotation = item.rotation || 0;
  const isComplete = item.status === 'success';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative flex flex-col w-full max-w-lg bg-white dark:bg-zinc-950 rounded-2xl sm:rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-3.5 sm:p-5 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-xl shrink-0">
              <Sliders className="w-4.5 h-4.5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-200">Image Edit & Options</h3>
              <p className="text-[11px] sm:text-xs font-semibold text-zinc-500 dark:text-zinc-400 truncate">
                {item.file.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 transition-all text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full shrink-0 cursor-pointer"
            aria-label="Close edit dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-3.5 sm:p-5 space-y-3.5 sm:space-y-5 max-h-[70vh] sm:max-h-[80vh] overflow-y-auto">
          {/* Image Preview Canvas */}
          <div className="relative w-full h-32 sm:h-48 bg-zinc-900 rounded-xl sm:rounded-2xl overflow-hidden flex items-center justify-center border border-zinc-800">
            {previewSrc ? (
              <img
                src={previewSrc}
                alt={item.file.name}
                className="max-h-full max-w-full object-contain transition-transform duration-300"
                style={{ transform: `rotate(${rotation}deg)` }}
              />
            ) : (
              <div className="text-xs text-zinc-500">Preview loading...</div>
            )}
            {rotation !== 0 && (
              <span className="absolute bottom-2 right-2 bg-black/80 text-white text-[10px] sm:text-xs font-mono font-bold px-1.5 py-0.5 rounded-md">
                {rotation}° Rotated
              </span>
            )}
          </div>

          {/* Quick Technical Summary */}
          <div className="flex items-center justify-between p-2.5 sm:p-3 bg-zinc-50 dark:bg-zinc-900 rounded-xl sm:rounded-2xl border border-zinc-200 dark:border-zinc-800 text-[11px] sm:text-xs">
            <div>
              <span className="text-zinc-400 dark:text-zinc-400">Original Size: </span>
              <span className="font-bold text-zinc-800 dark:text-zinc-200">{formatBytes(item.originalSize)}</span>
            </div>
            {isComplete && item.convertedSize && (
              <div>
                <span className="text-zinc-400 dark:text-zinc-400">Output Size: </span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatBytes(item.convertedSize)}</span>
              </div>
            )}
          </div>

          {/* Format Settings */}
          <div className="space-y-1.5">
            <label className="text-[10px] sm:text-xs font-bold text-zinc-700 dark:text-zinc-200 uppercase tracking-wider block">
              Per-File Target Format
            </label>
            <select
              value={item.customTargetFormat || ''}
              onChange={(e) => {
                const val = e.target.value as TargetFormat;
                if (isComplete && onReformatItem && val) {
                  onReformatItem(item.id, val);
                } else if (onUpdateFormat) {
                  onUpdateFormat(item.id, val ? val : undefined);
                }
              }}
              className="w-full px-3 py-1.5 sm:px-3.5 sm:py-2 text-xs sm:text-sm font-bold border-2 rounded-lg sm:rounded-xl bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="">Auto (Use Global Format Setting)</option>
              <option value="webp">WebP (Optimized & Responsive)</option>
              <option value="avif">AVIF (Next-Gen Compression)</option>
              <option value="jpg">JPEG (Universal Compatibility)</option>
              <option value="png">PNG (Lossless Transparency)</option>
              <option value="bmp">BMP (Uncompressed Bitmap)</option>
              <option value="ico">ICO (Favicon Icon)</option>
            </select>
            <p className="text-[10px] sm:text-[11px] text-zinc-500 dark:text-zinc-400">
              {item.customTargetFormat ? `Custom format ${item.customTargetFormat.toUpperCase()} active for this file.` : 'Defaulting to global batch conversion format.'}
            </p>
          </div>

          {/* Rotation Controls */}
          {onRotate && (
            <div className="space-y-1.5">
              <label className="text-[10px] sm:text-xs font-bold text-zinc-700 dark:text-zinc-200 uppercase tracking-wider block">
                Rotation Angle
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => onRotate(item.id, -90)}
                  className="px-2 py-1.5 sm:px-3 sm:py-2 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold text-zinc-800 dark:text-zinc-200 flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Left (-90°)</span>
                </button>
                <button
                  type="button"
                  onClick={() => onRotate(item.id, 90)}
                  className="px-2 py-1.5 sm:px-3 sm:py-2 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold text-zinc-800 dark:text-zinc-200 flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                >
                  <RotateCw className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Right (+90°)</span>
                </button>
              </div>
            </div>
          )}

          {/* Special Tools */}
          <div className="space-y-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
            <label className="text-[10px] sm:text-xs font-bold text-zinc-700 dark:text-zinc-200 uppercase tracking-wider block">
              Advanced Image Tools
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {onSelectRegions && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onSelectRegions(item);
                  }}
                  className="p-2.5 sm:p-3 border border-zinc-200 dark:border-zinc-800 hover:bg-amber-50 dark:hover:bg-[#322312] hover:border-amber-300 dark:hover:border-amber-700 rounded-xl sm:rounded-2xl text-left transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-1.5 font-bold text-[11px] sm:text-xs text-zinc-800 dark:text-zinc-200 group-hover:text-amber-700 dark:group-hover:text-amber-300">
                    <EyeOff className="w-3.5 h-3.5 text-amber-500" />
                    <span>Redact / Blur Areas</span>
                  </div>
                  <p className="text-[9px] sm:text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                    {item.blurRegions?.length ? `${item.blurRegions.length} region(s) redacted` : 'Hide sensitive information'}
                  </p>
                </button>
              )}

              {onInspectDetails && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onInspectDetails(item);
                  }}
                  className="p-2.5 sm:p-3 border border-zinc-200 dark:border-zinc-800 hover:bg-indigo-50 dark:hover:bg-[#21243a] hover:border-indigo-300 dark:hover:border-indigo-700 rounded-xl sm:rounded-2xl text-left transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-1.5 font-bold text-[11px] sm:text-xs text-zinc-800 dark:text-zinc-200 group-hover:text-indigo-700 dark:group-hover:text-indigo-300">
                    <Info className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Inspect Spec & Palette</span>
                  </div>
                  <p className="text-[9px] sm:text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                    Dimensions, EXIF & dominant colors
                  </p>
                </button>
              )}

              {isComplete && onCompare && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onCompare(item);
                  }}
                  className="p-2.5 sm:p-3 border border-zinc-200 dark:border-zinc-800 hover:bg-indigo-50 dark:hover:bg-zinc-800 hover:border-indigo-300 dark:hover:border-indigo-700 rounded-xl sm:rounded-2xl text-left transition-colors cursor-pointer group col-span-1 sm:col-span-2"
                >
                  <div className="flex items-center gap-1.5 font-bold text-[11px] sm:text-xs text-zinc-800 dark:text-zinc-200 group-hover:text-indigo-700 dark:group-hover:text-indigo-300">
                    <Eye className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Compare Original vs Converted</span>
                  </div>
                  <p className="text-[9px] sm:text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                    Side-by-side quality comparison slider
                  </p>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 bg-zinc-50 dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 sm:px-6 sm:py-2.5 bg-indigo-600 text-white font-bold text-xs sm:text-sm rounded-lg sm:rounded-xl hover:bg-indigo-700 transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Check className="w-3.5 h-3.5" /> Done
          </button>
        </div>
      </div>
    </div>
  );
}
