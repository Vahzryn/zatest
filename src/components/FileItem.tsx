import React, { useState } from 'react';
import { ImageFileItem, TargetFormat } from '../types';
import { formatBytes } from '../lib/utils';
import { CheckCircle2, AlertCircle, Loader2, Download, Trash2, ArrowRight, Eye, GripVertical, RotateCcw, RotateCw, Copy, Check, Info, Image as ImageIcon, RefreshCw, EyeOff, Sliders, FolderDown } from 'lucide-react';
import { cn } from '../lib/utils';

interface FileItemProps {
  item: ImageFileItem;
  index: number;
  isSelected?: boolean;
  onToggleSelect?: (id: string, multi: boolean) => void;
  onRemove: (id: string) => void;
  onRetry?: (id: string) => void;
  onDownload: (item: ImageFileItem) => void;
  onRotate?: (id: string, deltaDegrees: number) => void;
  onCompare?: (item: ImageFileItem) => void;
  onInspectDetails?: (item: ImageFileItem) => void;
  onUpdateFormat?: (id: string, format: TargetFormat | undefined) => void;
  onReformatItem?: (id: string, format: TargetFormat) => void;
  onSelectRegions?: (item: ImageFileItem) => void;
  onEditItem?: (item: ImageFileItem) => void;
  onDragStart?: (e: React.DragEvent, index: number) => void;
  onDragOver?: (e: React.DragEvent, index: number) => void;
  onDrop?: (e: React.DragEvent, index: number) => void;
  onDragEnd?: (e: React.DragEvent) => void;
  isDragging?: boolean;
}

function FileItemComponent({ 
  item, 
  index,
  isSelected = false,
  onToggleSelect,
  onRemove, 
  onRetry,
  onDownload, 
  onRotate,
  onCompare,
  onInspectDetails,
  onUpdateFormat,
  onReformatItem,
  onSelectRegions,
  onEditItem,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  isDragging,
}: FileItemProps) {
  const [isCopied, setIsCopied] = useState(false);
  const [hasImgError, setHasImgError] = useState(false);
  const isComplete = item.status === 'success';
  const isError = item.status === 'error';
  const isProcessing = item.status === 'processing';

  const rotation = item.rotation || 0;
  const previewSrc = item.convertedUrl || item.previewUrl;

  const handleCopyToClipboard = async () => {
    try {
      const blobToCopy = item.blob || item.file;
      let pngBlob = blobToCopy;

      // Clipboard API requires PNG for image copy in standard web browsers
      if (blobToCopy.type !== 'image/png') {
        const img = new Image();
        const url = URL.createObjectURL(blobToCopy);
        await new Promise((resolve) => {
          img.onload = resolve;
          img.src = url;
        });
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0);
        pngBlob = (await new Promise((res) => canvas.toBlob((b) => res(b!), 'image/png')))!;
        URL.revokeObjectURL(url);
      }

      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': pngBlob })
      ]);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy image to clipboard:', err);
    }
  };

  const compressionRatio = (item.convertedSize && item.originalSize)
    ? Math.round((1 - item.convertedSize / item.originalSize) * 100)
    : 0;

  return (
    <div 
      draggable={!isProcessing}
      onDragStart={(e) => onDragStart?.(e, index)}
      onDragOver={(e) => onDragOver?.(e, index)}
      onDrop={(e) => onDrop?.(e, index)}
      onDragEnd={onDragEnd}
      onClick={(e) => {
        if (onToggleSelect) {
          onToggleSelect(item.id, e.metaKey || e.ctrlKey || e.shiftKey);
        }
      }}
      className={cn(
        "flex flex-col p-2.5 sm:p-3 transition-all duration-300 bg-white dark:bg-[#101012] border-2 rounded-xl sm:rounded-2xl group shadow-sm hover:shadow-md select-none gap-1.5 sm:gap-2 min-w-0 w-full",
        !isProcessing && "cursor-grab active:cursor-grabbing hover:-translate-y-0.5",
        isSelected && "border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/40 shadow-lg shadow-indigo-500/10",
        !isSelected && isDragging && "opacity-40 border-dashed border-indigo-500 bg-indigo-50/50 dark:bg-black",
        !isSelected && isError 
          ? "border-red-300 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/30" 
          : !isSelected && isComplete 
          ? "border-emerald-200 dark:border-emerald-900/40 hover:border-emerald-300 dark:hover:border-emerald-800 bg-emerald-50/30 dark:bg-emerald-950/20" 
          : !isSelected ? "border-zinc-200 dark:border-zinc-800 hover:border-indigo-300 dark:hover:border-indigo-600/60" : ""
      )}
    >
      {/* Top / Main File Identity Row */}
      <div className="flex items-center justify-between min-w-0 w-full gap-2">
        <div className="flex items-center flex-1 min-w-0 gap-2">
          {/* Checkbox for Selection */}
          {onToggleSelect && (
            <div className="shrink-0 flex items-center justify-center pl-0.5">
              <div 
                className={cn(
                  "w-4 h-4 rounded-md border-2 flex items-center justify-center transition-all cursor-pointer",
                  isSelected 
                    ? "bg-indigo-600 border-indigo-600 dark:bg-indigo-500 dark:border-indigo-500 shadow-sm" 
                    : "bg-white dark:bg-black border-zinc-300 dark:border-zinc-700 group-hover:border-indigo-400"
                )}
              >
                {isSelected && <Check className="w-3 h-3 text-white dark:text-zinc-950" strokeWidth={3} />}
              </div>
            </div>
          )}

          {/* Grip Drag Handle */}
          <div 
            className="flex items-center justify-center shrink-0 text-zinc-300 dark:text-zinc-700 group-hover:text-zinc-500 dark:group-hover:text-zinc-400 transition-colors cursor-grab active:cursor-grabbing"
            title="Drag to reorder priority in queue"
          >
            <GripVertical className="w-4 h-4 shrink-0" />
          </div>

          {/* Preview Thumbnail with Rotation */}
          <div className="relative shrink-0 w-12 h-12 sm:w-14 sm:h-14 overflow-hidden rounded-xl sm:rounded-2xl bg-zinc-50 dark:bg-[#0a0a0c] border border-zinc-200/80 dark:border-zinc-800 shadow-sm flex items-center justify-center font-sans">
            {previewSrc && !hasImgError ? (
              <img 
                src={previewSrc} 
                alt={item.file.name}
                width="48"
                height="48"
                loading="lazy"
                decoding="async"
                referrerPolicy="no-referrer"
                onError={() => setHasImgError(true)}
                className="block object-cover w-full h-full transition-transform duration-300 ease-out"
                style={{ transform: `rotate(${rotation}deg)` }}
              />
            ) : (
              <div className="flex flex-col items-center justify-center w-full h-full bg-indigo-50 dark:bg-[#1a1a20] text-indigo-600 dark:text-indigo-400">
                <ImageIcon className="w-5 h-5 sm:w-6 sm:h-6 shrink-0 opacity-80" />
                <span className="text-[8px] sm:text-[9px] font-bold uppercase tracking-wider mt-1 max-w-[32px] sm:max-w-[40px] truncate opacity-90">
                  {item.file.name.split('.').pop() || 'IMG'}
                </span>
              </div>
            )}
            {rotation !== 0 && (
              <span className="absolute bottom-0.5 right-0.5 bg-black/75 text-white text-[8px] sm:text-[9px] font-mono font-bold px-0.5 sm:px-1 py-0.2 rounded backdrop-blur-xs">
                {rotation}°
              </span>
            )}
          </div>

          {/* File Name & Metric Info */}
          <div className="flex flex-col min-w-0 flex-1 justify-center font-sans">
            <span className="text-sm sm:text-base font-bold tracking-tight truncate text-zinc-900 dark:text-zinc-100 mb-0.5" title={item.file.name}>
              {item.file.name}
            </span>

            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs font-semibold text-zinc-500 dark:text-zinc-400">
              <span className="shrink-0">{formatBytes(item.originalSize)}</span>
              {rotation !== 0 && (
                <span className="text-[10px] sm:text-[11px] font-bold text-indigo-600 dark:text-indigo-400 shrink-0">
                  • {rotation}°
                </span>
              )}
              {isComplete && item.convertedSize && (
                <>
                  <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0 text-zinc-400 dark:text-zinc-500" />
                  <span className={cn("shrink-0 font-bold", compressionRatio > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-600 dark:text-zinc-300")}>
                    {formatBytes(item.convertedSize)}
                  </span>
                  {item.blob && (
                    <span className="px-1.5 py-0.5 text-[9px] sm:text-[10px] rounded bg-indigo-100 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-bold shrink-0 uppercase border border-indigo-200 dark:border-indigo-800/50">
                      {item.blob.type === 'image/jpeg' ? 'JPEG' : item.blob.type.split('/').pop()?.toUpperCase() || 'OUT'}
                    </span>
                  )}
                  {compressionRatio > 0 && (
                    <span className="px-1 py-0.5 text-[9px] sm:text-[10px] rounded bg-emerald-100 dark:bg-[#1e3427] text-emerald-700 dark:text-emerald-400 font-bold shrink-0 border border-emerald-200 dark:border-[#2d523c]">
                      -{compressionRatio}%
                    </span>
                  )}
                  {compressionRatio === 0 && (
                    <span 
                      className="px-1 py-0.5 text-[9px] sm:text-[10px] rounded bg-amber-50 dark:bg-[#322312] text-amber-700 dark:text-[#fdd663] font-bold shrink-0 border border-amber-200 dark:border-[#523d24]"
                      title="PNG format is lossless. Select WebP or JPG format in Output Format to save ~80% space!"
                    >
                      0% (Try WebP format)
                    </span>
                  )}
                  {compressionRatio < 0 && (
                    <span className="px-1 py-0.5 text-[9px] sm:text-[10px] rounded bg-red-100 dark:bg-[#3c1e1e] text-red-700 dark:text-[#f28b82] font-bold shrink-0 border border-red-200 dark:border-[#5c2828]">
                      +{Math.abs(compressionRatio)}%
                    </span>
                  )}
                </>
              )}
              {isError && (
                <span className="text-red-600 dark:text-[#f28b82] font-bold truncate shrink-0">{item.error}</span>
              )}
            </div>
          </div>
        </div>

        {/* Status Indicator Badge */}
        <div className="shrink-0 flex items-center pl-1">
          {isProcessing && (
            <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin text-indigo-500 dark:text-indigo-400 shrink-0" />
          )}
          {isComplete && (
            <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500 dark:text-emerald-400 shrink-0" />
          )}
          {isError && (
            <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-500 dark:text-[#f28b82] shrink-0" />
          )}
        </div>
      </div>

      {/* Bottom / Action Controls Bar */}
      <div className="flex flex-col gap-1.5 sm:gap-2 pt-1.5 sm:pt-2 border-t border-zinc-100 dark:border-zinc-800/60 min-w-0 w-full mt-0">
        {/* Row 1: Primary Controls */}
        <div className="flex flex-wrap items-center justify-between gap-1.5 w-full min-w-0">
          {/* Left: Reformat / Edit */}
          <div className="flex flex-wrap items-center gap-1 sm:gap-1.5 min-w-0" onClick={(e) => e.stopPropagation()}>
            {onUpdateFormat && !isProcessing && !isComplete && (
              <div className="flex items-center gap-1 shrink-0">
                <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-400 select-none">To:</span>
                <select
                  value={item.customTargetFormat || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    onUpdateFormat(item.id, val ? (val as TargetFormat) : undefined);
                  }}
                  className="px-1 py-0.5 text-[10px] font-bold border rounded bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-200 focus:outline-none focus:border-indigo-500 cursor-pointer font-sans"
                  title="Auto uses the global format, or matches the original if 'Original Format' is selected."
                >
                  <option value="">Auto</option>
                  <option value="webp">WebP</option>
                  <option value="avif">AVIF</option>
                  <option value="jpg">JPEG</option>
                  <option value="png">PNG</option>
                  <option value="bmp">BMP</option>
                  <option value="ico">ICO</option>
                  <option value="pdf">PDF</option>
                </select>
              </div>
            )}

            {onReformatItem && isComplete && !isProcessing && (
              <div className="flex items-center gap-1 shrink-0">
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 select-none">To:</span>
                <select
                  value={item.customTargetFormat || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val) {
                      onReformatItem(item.id, val as TargetFormat);
                    }
                  }}
                  className="px-1 py-0.5 text-[10px] font-bold border rounded bg-emerald-50 dark:bg-[#1a2c20]/50 border-emerald-200 dark:border-[#2d523c] text-emerald-800 dark:text-emerald-400 focus:outline-none focus:border-emerald-500 cursor-pointer font-sans"
                >
                  <option value="" disabled>Format</option>
                  <option value="webp">WebP</option>
                  <option value="avif">AVIF</option>
                  <option value="jpg">JPEG</option>
                  <option value="png">PNG</option>
                  <option value="bmp">BMP</option>
                  <option value="ico">ICO</option>
                  <option value="pdf">PDF</option>
                </select>
              </div>
            )}

            {!isProcessing && (onEditItem || onInspectDetails) && (
              <button
                onClick={(e) => { 
                  e.stopPropagation(); 
                  if (onEditItem) {
                    onEditItem(item);
                  } else if (onInspectDetails) {
                    onInspectDetails(item);
                  }
                }}
                className="px-1.5 py-0.5 transition-all rounded text-[10px] font-bold text-zinc-600 dark:text-zinc-200 bg-zinc-100 dark:bg-zinc-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 hover:text-indigo-600 dark:hover:text-indigo-400 border border-zinc-200/80 dark:border-zinc-700 flex items-center gap-1 shrink-0 cursor-pointer"
                title="Edit per-file options"
                aria-label="Edit image options"
              >
                <Sliders className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                <span>Edit</span>
              </button>
            )}
          </div>

          {/* Right: Primary Core Actions */}
          <div className="flex flex-wrap items-center gap-1.5 ml-auto justify-end">
            {isComplete && item.savedToFolder && (
              <span 
                className="px-1.5 py-0.5 text-[9px] font-black rounded bg-emerald-50 dark:bg-[#1a2c20] text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-[#2d523c] flex items-center gap-1 cursor-default shrink-0"
                title={`Saved to local disk as: ${item.folderSavePath}`}
              >
                <FolderDown className="w-3 h-3" />
                <span>Saved</span>
              </span>
            )}

            {isComplete && !item.savedToFolder && onCompare && (
              <button
                onClick={(e) => { e.stopPropagation(); onCompare(item); }}
                className="p-1 transition-all rounded hover:bg-indigo-50 dark:hover:bg-zinc-800 hover:text-indigo-600 dark:hover:text-indigo-400 shrink-0 cursor-pointer"
                title="Compare Original vs Converted Quality"
                aria-label="Compare original and converted image quality side-by-side"
              >
                <Eye className="w-3.5 h-3.5 shrink-0" />
              </button>
            )}

            {isComplete && !item.savedToFolder && (
              <button
                onClick={(e) => { e.stopPropagation(); onDownload(item); }}
                className="p-1 transition-all rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 shrink-0 cursor-pointer"
                title="Download"
                aria-label="Download converted image file"
              >
                <Download className="w-3.5 h-3.5 shrink-0" />
              </button>
            )}

            {isError && onRetry && (
              <button
                onClick={(e) => { e.stopPropagation(); onRetry(item.id); }}
                className="p-1 transition-all rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-indigo-600 dark:hover:text-indigo-400 shrink-0 cursor-pointer"
                title="Retry Conversion"
                aria-label="Retry converting this image"
              >
                <RefreshCw className="w-3.5 h-3.5 shrink-0" />
              </button>
            )}

            {(item.status === 'pending' || item.status === 'error' || isComplete) && (
              <button
                onClick={(e) => { e.stopPropagation(); onRemove(item.id); }}
                className={cn(
                  "p-1 transition-all rounded shrink-0 cursor-pointer",
                  isComplete ? "sm:opacity-0 sm:group-hover:opacity-100 text-zinc-400 hover:bg-red-50 dark:hover:bg-[#3c1e1e] hover:text-red-600 dark:hover:text-[#f28b82]" : "text-zinc-400 hover:bg-red-50 dark:hover:bg-[#3c1e1e] hover:text-red-600 dark:hover:text-[#f28b82]"
                )}
                title="Remove"
                aria-label="Remove this image from the batch list"
              >
                <Trash2 className="w-3.5 h-3.5 shrink-0" />
              </button>
            )}
          </div>
        </div>

        {/* Row 2: Secondary Tools (Rotate, Inspect, Blur, Copy) */}
        {!isProcessing && (onRotate || onInspectDetails || onSelectRegions) && (
          <div className="flex flex-wrap items-center justify-between gap-1.5 pt-1 sm:pt-1.5 border-t border-dashed border-zinc-100 dark:border-zinc-800/40 w-full">
            <span className="text-[9px] font-extrabold text-zinc-400 dark:text-zinc-400 tracking-wider uppercase select-none hidden min-[360px]:inline-block">Quick Tools</span>
            <div className="flex flex-wrap items-center gap-1.5 justify-end">
              {onRotate && (
                <div className="flex items-center gap-0.5">
                  <button
                    onClick={(e) => { e.stopPropagation(); onRotate(item.id, -90); }}
                    className="p-1 transition-all rounded text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-indigo-600 dark:hover:text-indigo-300 shrink-0 cursor-pointer"
                    title="Rotate Left (-90°)"
                    aria-label="Rotate image 90 degrees counter-clockwise"
                  >
                    <RotateCcw className="w-3 h-3 shrink-0" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onRotate(item.id, 90); }}
                    className="p-1 transition-all rounded text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-indigo-600 dark:hover:text-indigo-300 shrink-0 cursor-pointer"
                    title="Rotate Right (+90°)"
                    aria-label="Rotate image 90 degrees clockwise"
                  >
                    <RotateCw className="w-3 h-3 shrink-0" />
                  </button>
                </div>
              )}

              {onInspectDetails && (
                <button
                  onClick={(e) => { e.stopPropagation(); onInspectDetails(item); }}
                  className="p-1 transition-all rounded text-zinc-400 hover:bg-indigo-50 dark:hover:bg-[#21243a] hover:text-indigo-600 dark:hover:text-indigo-300 shrink-0 cursor-pointer"
                  title="Inspect Specifications"
                  aria-label="Inspect image specifications"
                >
                  <Info className="w-3 h-3 shrink-0" />
                </button>
              )}

              {onSelectRegions && (
                <button
                  onClick={(e) => { e.stopPropagation(); onSelectRegions(item); }}
                  className={cn(
                    "p-1 transition-all rounded shrink-0 cursor-pointer relative border border-transparent",
                    item.blurRegions && item.blurRegions.length > 0
                      ? "bg-amber-50 dark:bg-[#322312] text-amber-600 dark:text-[#fdd663] border-amber-200 dark:border-[#523d24]"
                      : "text-zinc-400 hover:bg-amber-50 dark:hover:bg-[#322312] hover:text-amber-600 dark:hover:text-[#fdd663]"
                  )}
                  title={
                    item.blurRegions && item.blurRegions.length > 0
                      ? `Redact Regions (${item.blurRegions.length} Active)`
                      : "Redact (Blur/Pixelate) Regions"
                  }
                  aria-label="Blur or pixelate custom regions of the image"
                >
                  <EyeOff className="w-3 h-3 shrink-0" />
                  {item.blurRegions && item.blurRegions.length > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-1 h-1 rounded-full bg-amber-500 animate-pulse" />
                  )}
                </button>
              )}

              <button
                onClick={(e) => { e.stopPropagation(); handleCopyToClipboard(); }}
                className="p-1 transition-all rounded text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-800 dark:hover:text-zinc-200 shrink-0 cursor-pointer"
                title={isCopied ? "Copied!" : "Copy"}
                aria-label={isCopied ? "Image successfully copied to clipboard" : "Copy image to clipboard"}
              >
                {isCopied ? (
                  <Check className="w-3 text-emerald-500 shrink-0" />
                ) : (
                  <Copy className="w-3 h-3 shrink-0" />
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export const FileItem = React.memo(FileItemComponent);


