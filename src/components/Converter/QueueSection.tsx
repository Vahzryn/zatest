import React, { useRef, useState } from 'react';
import { Trash2, Loader2, Zap, AlertTriangle, ShieldCheck, X, Plus, Download, FolderDown, Archive, ChevronDown } from 'lucide-react';
import { GlobalControls } from '../GlobalControls';
import { VirtualFileList } from '../VirtualFileList';
import { ImageFileItem, ConversionSettings, TargetFormat } from '../../types';
import { SeoRouteData } from '../../lib/seoEngine';
import { cn, formatBytes } from '../../lib/utils';

interface QueueSectionProps {
  files: ImageFileItem[];
  selectedFileIds: Set<string>;
  settings: ConversionSettings;
  setSettings: React.Dispatch<React.SetStateAction<ConversionSettings>>;
  seoData?: SeoRouteData;
  isProcessing: boolean;
  isStopping: boolean;
  etaText: string;
  pendingCount: number;
  processedCount: number;
  totalCount: number;
  progressPercent: number;
  successCount: number;
  onFilesAdded?: (files: File[]) => void;
  onDownloadAll?: () => void;
  onDownloadDirect?: () => void;
  onDownloadToDirectory?: () => void;
  hasDirectoryPicker?: boolean;
  onConvert: () => void;
  onStop: () => void;
  onClearAll: () => void;
  onToggleSelect: (id: string) => void;
  onRemoveFile: (id: string) => void;
  onRetryFile: (id: string) => void;
  onDownloadSingle: (file: ImageFileItem) => void;
  onRotateItem: (id: string, delta: number) => void;
  onCompare: (item: ImageFileItem) => void;
  onInspectDetails: (item: ImageFileItem) => void;
  onUpdateFileFormat?: (id: string, format: TargetFormat | undefined) => void;
  onReformatItems?: (ids: string[], format: TargetFormat) => void;
  onReformatItem?: (id: string, format: TargetFormat) => void;
  onSelectRegions?: (item: ImageFileItem) => void;
  onEditItem?: (item: ImageFileItem) => void;
  concurrencyProfile?: string;
  showLargeBatchBanner?: boolean;
  onDismissLargeBatchBanner?: () => void;
  showAutoChunkedBanner?: boolean;
  onDismissAutoChunkedBanner?: () => void;
  totalPendingBytes?: number;
  onContinueToDownload?: () => void;
  directoryHandle?: any | null;
  onSelectDirectory?: () => void;
  onDisconnectDirectory?: () => void;
}

export const QueueSection = React.memo<QueueSectionProps>(function QueueSection({
  files,
  selectedFileIds,
  settings,
  setSettings,
  isProcessing,
  isStopping,
  etaText,
  pendingCount,
  processedCount,
  totalCount,
  progressPercent,
  successCount,
  onFilesAdded,
  onDownloadAll,
  onDownloadDirect,
  onDownloadToDirectory,
  hasDirectoryPicker,
  directoryHandle,
  onSelectDirectory,
  onDisconnectDirectory,
  onConvert,
  onStop,
  onClearAll,
  onToggleSelect,
  onRemoveFile,
  onRetryFile,
  onDownloadSingle,
  onRotateItem,
  onCompare,
  onInspectDetails,
  onUpdateFileFormat,
  onReformatItems,
  onReformatItem,
  onSelectRegions,
  onEditItem,
  concurrencyProfile,
  showLargeBatchBanner,
  onDismissLargeBatchBanner,
  showAutoChunkedBanner,
  onDismissAutoChunkedBanner,
  totalPendingBytes,
  seoData,
  onContinueToDownload
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const added = Array.from(e.target.files).filter(f => f.type.startsWith('image/') || /\.heic$/i.test(f.name));
      if (added.length > 0 && onFilesAdded) {
        onFilesAdded(added);
      }
      e.target.value = '';
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-8 duration-500">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInputChange}
        multiple
        accept="image/*,.heic,.heif,.webp,.avif,.bmp,.ico,.png,.jpg,.jpeg,.svg"
        className="hidden"
        id="queue-add-files-input"
      />
      {/* Large Batch Non-Blocking Banner */}
      {showLargeBatchBanner && (
        <div 
          className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-2xl flex items-center justify-between gap-3 text-amber-900 dark:text-amber-200 animate-in slide-in-from-top-2 duration-200"
          id="large-batch-warning-banner"
        >
          <div className="flex items-center gap-2.5 text-sm font-semibold text-left">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>Large batch detected — processing in smaller memory-safe batches for this device.</span>
          </div>
          {onDismissLargeBatchBanner && (
            <button
              onClick={onDismissLargeBatchBanner}
              className="p-1.5 rounded-xl text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors cursor-pointer shrink-0"
              aria-label="Dismiss banner"
              id="btn-dismiss-large-batch-banner"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* Auto-Chunked Notice Banner */}
      {showAutoChunkedBanner && (
        <div 
          className="p-4 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 rounded-2xl flex items-center justify-between gap-3 text-indigo-900 dark:text-indigo-200 animate-in slide-in-from-top-2 duration-200"
          id="auto-chunked-notice-banner"
        >
          <div className="flex items-center gap-2.5 text-sm font-semibold text-left">
            <ShieldCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <span>
              Large batch detected — processing in smaller memory-safe batches for this device.
            </span>
          </div>
          {onDismissAutoChunkedBanner && (
            <button
              onClick={onDismissAutoChunkedBanner}
              className="p-1.5 rounded-xl text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors cursor-pointer shrink-0"
              aria-label="Dismiss notice"
              id="btn-dismiss-auto-chunked-banner"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* Direct Folder Save UI Panel (Clean & quiet) */}
      {hasDirectoryPicker && (
        <div 
          className="p-3.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left"
          id="direct-folder-save-panel"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 shrink-0">
              <FolderDown className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-zinc-900 dark:text-white">Direct Folder Save</span>
                {directoryHandle && (
                  <span className="px-1.5 py-0.2 text-[10px] bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 rounded font-medium">
                    Active: {directoryHandle.name}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate max-w-md">
                {directoryHandle 
                  ? "Files stream directly to your selected directory with zero RAM overhead." 
                  : "Save processed images directly to a folder on your machine."
                }
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            {directoryHandle ? (
              <button
                onClick={onDisconnectDirectory}
                disabled={isProcessing}
                className="px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                id="btn-disconnect-folder"
              >
                Disconnect
              </button>
            ) : (
              <button
                onClick={onSelectDirectory}
                disabled={isProcessing}
                className="px-3 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-200 bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                id="btn-choose-folder"
              >
                Choose Folder
              </button>
            )}
          </div>
        </div>
      )}

      <GlobalControls 
        settings={settings} 
        onChange={setSettings} 
        seoData={seoData}
        disabled={isProcessing}
        onConvert={onConvert}
        onStop={onStop}
        isProcessing={isProcessing}
        isStopping={isStopping}
        pendingCount={pendingCount}
        successCount={successCount}
        onContinueToDownload={onContinueToDownload}
      />

      <div className="flex flex-col bg-white dark:bg-zinc-900 border rounded-2xl border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-5 py-3.5 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/60">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-zinc-900 dark:text-white text-sm">Files ({files.length})</span>
            {successCount > 0 && (
              <span className="px-2 py-0.5 text-[11px] font-medium rounded-md bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60">
                {successCount} ready
              </span>
            )}
            {pendingCount > 0 && (
              <span className="px-2 py-0.5 text-[11px] font-medium rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                {pendingCount} pending
              </span>
            )}
            {isProcessing && etaText && (
              <span className="px-2 py-0.5 text-[11px] font-medium rounded-md bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300">
                {etaText}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-zinc-100 hover:bg-zinc-200/70 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 transition-colors disabled:opacity-50 cursor-pointer"
              title="Add more images to the queue"
              id="btn-add-more-images"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Images</span>
            </button>

            <button 
              onClick={onClearAll}
              disabled={isProcessing}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-zinc-500 hover:text-red-600 dark:text-zinc-400 dark:hover:text-red-400 transition-colors disabled:opacity-50 cursor-pointer"
              title="Clear all files from workspace"
            >
              <Trash2 className="w-3.5 h-3.5" /> Clear
            </button>
          </div>
        </div>

        {selectedFileIds.size > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-3 border-b border-indigo-100 dark:border-indigo-900/30 bg-indigo-50/30 dark:bg-indigo-950/20 text-sm font-bold">
            <div className="flex items-center gap-2 text-indigo-800 dark:text-indigo-300">
              <span className="inline-flex items-center justify-center w-5 h-5 text-xs rounded-full bg-indigo-600 text-white dark:bg-indigo-500 dark:text-zinc-900">
                {selectedFileIds.size}
              </span>
              <span>selected</span>
            </div>
            
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="text-xs text-zinc-400 dark:text-zinc-400">Bulk Reformat:</span>
              <select
                disabled={isProcessing}
                value=""
                onChange={(e) => {
                  const format = e.target.value as TargetFormat;
                  if (format && onReformatItems) {
                    onReformatItems(Array.from(selectedFileIds), format);
                  }
                }}
                className="px-2.5 py-1.5 text-xs font-bold border-2 rounded-xl bg-white dark:bg-zinc-950 border-indigo-200 dark:border-[#384c6c] text-indigo-700 dark:text-indigo-400 focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="" disabled>Select Format...</option>
                <option value="webp">WebP (Recommended)</option>
                <option value="avif">AVIF</option>
                <option value="jpg">JPEG</option>
                <option value="png">PNG (Lossless)</option>
                <option value="bmp">BMP</option>
                <option value="ico">ICO</option>
              </select>
            </div>
          </div>
        )}
        
        {/* Screen reader aria-live progress region */}
        <div className="sr-only" aria-live="polite" aria-atomic="true">
          {isProcessing
            ? `Converting batch: ${processedCount} of ${totalCount} files processed (${progressPercent}% complete).`
            : successCount > 0 && successCount === totalCount
            ? `Batch conversion complete. ${successCount} files converted.`
            : ''}
        </div>

        <div className="p-4">
          <VirtualFileList
            files={files}
            selectedFileIds={selectedFileIds}
            onToggleSelect={onToggleSelect}
            onRemove={onRemoveFile}
            onRetry={onRetryFile}
            onDownload={onDownloadSingle}
            onRotate={onRotateItem}
            onCompare={onCompare}
            onInspectDetails={onInspectDetails}
            onUpdateFormat={onUpdateFileFormat}
            onReformatItem={onReformatItem}
            onSelectRegions={onSelectRegions}
            onEditItem={onEditItem}
          />
        </div>
      </div>

      {/* Mobile Floating Action Widget */}
      <div className="md:hidden fixed bottom-6 right-5 z-40 flex justify-end animate-in slide-in-from-bottom-4 fade-in duration-300">
        {isProcessing ? (
          <button
            onClick={onStop}
            disabled={isStopping}
            className={cn(
              "flex items-center gap-2 px-5 py-3 text-sm font-black text-white transition-all rounded-full shadow-xl border border-red-400 dark:border-red-600",
              isStopping
                ? "bg-amber-500 cursor-not-allowed opacity-90 border-amber-400 shadow-md"
                : "bg-red-500 hover:bg-red-600 active:scale-95 shadow-lg"
            )}
            aria-label="Stop Processing"
          >
            {isStopping ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Stopping...</>
            ) : (
              <><Zap className="w-4 h-4 animate-pulse" /> Stop</>
            )}
          </button>
        ) : pendingCount === 0 && successCount > 0 && onContinueToDownload ? (
          <button
            onClick={onContinueToDownload}
            className="flex items-center gap-2 px-5 py-3 text-sm font-black text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 transition-all rounded-full shadow-xl border border-emerald-800"
            aria-label="Continue to Download"
          >
            <span>Continue to Download</span>
          </button>
        ) : pendingCount > 0 ? (
          <button
            onClick={onConvert}
            className="flex items-center gap-2 px-5 py-3 text-sm font-black text-zinc-900 bg-[#fdd663] hover:bg-[#fbbc04] active:scale-95 transition-all rounded-full shadow-xl border border-[#e3a800]"
            aria-label="Convert Files"
          >
            <Zap className="w-4 h-4 fill-current text-zinc-900" />
            <span>{(seoData?.pageCategory === 'compression' || settings.targetMaxKB !== undefined || seoData?.path?.includes('compress')) ? 'Compress' : 'Convert'} ({pendingCount})</span>
          </button>
        ) : null}
      </div>
    </div>
  );
});
