import React, { useState, useRef, useEffect, useCallback } from 'react';
import { SeoRouteData } from '../lib/seoEngine';
import { Breadcrumbs } from './Breadcrumbs';
import { SeoGuideContent } from './Converter/SeoGuideContent';
import { AdSlot } from './AdSlot';
import { 
  Upload, Download, RefreshCw, AlertTriangle, Loader2, 
  Layers, Palette, SlidersHorizontal, ChevronDown, 
  ChevronUp, Sparkles, Check, Image as ImageIcon, ArrowLeftRight,
  Maximize2, HardDrive
} from 'lucide-react';
import { formatBytes } from '../lib/utils';
import { 
  removeBackground, 
  recompositeCutout,
  BgRemovalOptions,
  BgRemovalProgress,
  BgRemovalResult,
  BackgroundMode,
  BgTargetFormat
} from '../features/background-remover';
import { TargetFormat } from '../types';

interface BackgroundRemoverPageProps {
  seoData: SeoRouteData;
  onNavigate: (path: string) => void;
}

type QuickPreset = 'default' | 'product' | 'portrait' | 'profile' | 'sticker';

const COLOR_PRESETS = [
  { label: 'White', color: '#ffffff' },
  { label: 'Off-White', color: '#f8fafc' },
  { label: 'Light Gray', color: '#e2e8f0' },
  { label: 'Black', color: '#09090b' },
  { label: 'Studio Blue', color: '#2563eb' },
  { label: 'Pastel Rose', color: '#f43f5e' },
  { label: 'Mint', color: '#10b981' },
  { label: 'Amber', color: '#f59e0b' },
];

export function BackgroundRemoverPage({ seoData, onNavigate }: BackgroundRemoverPageProps) {
  // Application Stage: 'upload' | 'ready' | 'processing' | 'result'
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [originalPreviewUrl, setOriginalPreviewUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressState, setProgressState] = useState<BgRemovalProgress | null>(null);
  const [result, setResult] = useState<BgRemovalResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  // Settings
  const [backgroundMode, setBackgroundMode] = useState<BackgroundMode>('transparent');
  const [backgroundColor, setBackgroundColor] = useState<string>('#ffffff');
  const [featherRadius, setFeatherRadius] = useState<number>(0);
  const [targetFormat, setTargetFormat] = useState<TargetFormat>('png');
  const [quality, setQuality] = useState<number>(0.92);
  const [targetMaxKB, setTargetMaxKB] = useState<number | undefined>(undefined);
  const [resizeWidth, setResizeWidth] = useState<number | undefined>(undefined);
  const [resizeHeight, setResizeHeight] = useState<number | undefined>(undefined);
  const [activePreset, setActivePreset] = useState<QuickPreset>('default');
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Comparison Slider State
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDraggingSlider, setIsDraggingSlider] = useState(false);
  const [viewMode, setViewMode] = useState<'slider' | 'cutout'>('slider');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const sliderContainerRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      if (originalPreviewUrl) URL.revokeObjectURL(originalPreviewUrl);
      if (result?.previewUrl) URL.revokeObjectURL(result.previewUrl);
    };
  }, [originalPreviewUrl, result]);

  // Global Paste Handler for instant clipboard image drop
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (selectedFile || isProcessing) return;
      if (!e.clipboardData) return;
      const items = Array.from(e.clipboardData.items);
      for (const item of items) {
        if (item.type.indexOf('image') !== -1) {
          const file = item.getAsFile();
          if (file) {
            e.preventDefault();
            handleFileSelect([file]);
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [selectedFile, isProcessing]);

  // Core Processing Invocation (fast re-compositing if mask is already computed)
  const runRemoval = useCallback(async (
    fileToProcess: File, 
    customOptions?: Partial<BgRemovalOptions>
  ) => {
    setErrorMessage(null);
    setIsProcessing(true);

    const removalOpts: BgRemovalOptions = {
      backgroundMode: customOptions?.backgroundMode ?? backgroundMode,
      backgroundColor: customOptions?.backgroundColor ?? backgroundColor,
      featherRadius: customOptions?.featherRadius ?? featherRadius,
      targetFormat: customOptions?.targetFormat ?? targetFormat,
      quality: customOptions?.quality ?? quality,
      targetMaxKB: customOptions?.targetMaxKB !== undefined ? customOptions.targetMaxKB : targetMaxKB,
      resize: (customOptions?.resize?.enabled || (resizeWidth || resizeHeight)) ? {
        enabled: true,
        maxWidth: customOptions?.resize?.maxWidth ?? resizeWidth,
        maxHeight: customOptions?.resize?.maxHeight ?? resizeHeight,
        keepAspectRatio: true,
      } : undefined,
    };

    // FAST PATH: If we already have the segmentation mask cached for this exact file, recomposite in <20ms
    if (result?.maskData?.rawBuffer && fileToProcess === selectedFile) {
      try {
        const res = await recompositeCutout(
          fileToProcess,
          result.maskData.rawBuffer,
          result.maskData.width,
          result.maskData.height,
          removalOpts,
          {
            operationId: result.operationId,
            backendUsed: result.backendUsed,
            inferenceTimeMs: result.inferenceTimeMs,
          }
        );

        if (result.previewUrl && result.previewUrl !== res.previewUrl) {
          URL.revokeObjectURL(result.previewUrl);
        }

        setResult(res);
        setIsProcessing(false);
        return;
      } catch (err) {
        console.warn('Fast recomposite failed, falling back to full pipeline:', err);
      }
    }

    // FULL INFERENCE PATH
    setProgressState({
      operationId: 'start',
      stage: 'preprocessing',
      progress: 5,
      message: 'Preparing image...',
    });

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      const res = await removeBackground(
        fileToProcess,
        removalOpts,
        (p) => setProgressState(p),
        abortController.signal
      );

      // Revoke old result preview if any
      if (result?.previewUrl && result.previewUrl !== res.previewUrl) {
        URL.revokeObjectURL(result.previewUrl);
      }

      setResult(res);
      setIsProcessing(false);
      setProgressState(null);
    } catch (err: any) {
      if (err?.name === 'AbortError' || err?.message?.includes('aborted')) {
        setIsProcessing(false);
        setProgressState(null);
        return;
      }
      console.error('Background removal failed:', err);
      setErrorMessage(err?.message || 'Failed to remove background. Please try again with another image.');
      setIsProcessing(false);
      setProgressState(null);
    }
  }, [backgroundMode, backgroundColor, featherRadius, targetFormat, quality, targetMaxKB, resizeWidth, resizeHeight, result, selectedFile]);

  // File Select Handler
  const handleFileSelect = (files: FileList | File[]) => {
    const file = Array.from(files).find(f => 
      f.type.startsWith('image/') || 
      /\.(png|jpe?g|webp|avif|heic|heif|bmp)$/i.test(f.name)
    );
    if (!file) {
      setErrorMessage('Please upload a valid image file (PNG, JPEG, WebP, AVIF, HEIC, BMP).');
      return;
    }

    if (originalPreviewUrl) {
      URL.revokeObjectURL(originalPreviewUrl);
    }
    if (result?.previewUrl) {
      URL.revokeObjectURL(result.previewUrl);
    }

    const preview = URL.createObjectURL(file);
    setSelectedFile(file);
    setOriginalPreviewUrl(preview);
    setResult(null);
    setErrorMessage(null);
    setActivePreset('default');
    setSliderPosition(50);
  };

  // Preset Selection
  const applyPreset = (preset: QuickPreset) => {
    setActivePreset(preset);
    let newMode: BackgroundMode = 'transparent';
    let newColor = '#ffffff';
    let newFormat: BgTargetFormat = 'png';
    let newFeather = 0;

    switch (preset) {
      case 'product':
        newMode = 'color';
        newColor = '#ffffff';
        newFormat = 'jpg';
        newFeather = 0;
        break;
      case 'portrait':
        newMode = 'transparent';
        newFormat = 'png';
        newFeather = 1;
        break;
      case 'profile':
        newMode = 'color';
        newColor = '#f8fafc';
        newFormat = 'jpg';
        newFeather = 0;
        break;
      case 'sticker':
        newMode = 'transparent';
        newFormat = 'png';
        newFeather = 0;
        break;
      case 'default':
      default:
        newMode = 'transparent';
        newFormat = 'png';
        newFeather = 0;
        break;
    }

    setBackgroundMode(newMode);
    setBackgroundColor(newColor);
    setTargetFormat(newFormat);
    setFeatherRadius(newFeather);

    if (result && selectedFile) {
      runRemoval(selectedFile, {
        backgroundMode: newMode,
        backgroundColor: newColor,
        targetFormat: newFormat,
        featherRadius: newFeather
      });
    }
  };

  // Cancellation
  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsProcessing(false);
    setProgressState(null);
  };

  // Reset to initial state
  const handleReset = () => {
    handleCancel();
    if (originalPreviewUrl) URL.revokeObjectURL(originalPreviewUrl);
    if (result?.previewUrl) URL.revokeObjectURL(result.previewUrl);
    setSelectedFile(null);
    setOriginalPreviewUrl(null);
    setResult(null);
    setErrorMessage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Download Output
  const handleDownload = () => {
    if (!result || !selectedFile) return;
    const baseName = selectedFile.name.replace(/\.[^/.]+$/, '');
    const extension = result.format;
    const fileName = `${baseName}-no-bg.${extension}`;
    
    const a = document.createElement('a');
    a.href = result.previewUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Comparison Slider Pointer / Touch Move Handler
  const updateSliderFromClientX = (clientX: number) => {
    if (!sliderContainerRef.current) return;
    const rect = sliderContainerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const pct = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(pct);
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDraggingSlider(true);
    updateSliderFromClientX(e.clientX);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isDraggingSlider) {
      updateSliderFromClientX(e.clientX);
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDraggingSlider(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // Ignore
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-2 sm:px-4 py-1 sm:py-2 space-y-3.5 sm:space-y-4 animate-in fade-in duration-200">
      {seoData.breadcrumbs && seoData.breadcrumbs.length > 0 && (
        <Breadcrumbs items={seoData.breadcrumbs} onNavigate={onNavigate} />
      )}

      {/* Hero Header */}
      <div className="text-center max-w-xl mx-auto space-y-1 mb-1 sm:mb-2">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
          Background Remover
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400 text-xs sm:text-sm leading-relaxed">
          Remove image backgrounds instantly in your browser. Private, free, and runs entirely on your device.
        </p>
      </div>

      {/* Main Card */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3.5 sm:p-5 shadow-2xs space-y-4">
        
        {/* ========================================================= */}
        {/* STATE 1: UPLOAD DROPZONE                                  */}
        {/* ========================================================= */}
        {!selectedFile && (
          <div
            onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
            onDragLeave={() => setDragActive(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragActive(false);
              if (e.dataTransfer.files?.length) {
                handleFileSelect(e.dataTransfer.files);
              }
            }}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl py-10 sm:py-14 px-6 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-3 min-h-[180px] sm:min-h-[220px] ${
              dragActive 
                ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30 ring-2 ring-indigo-500/20' 
                : 'border-zinc-300 dark:border-zinc-700 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30'
            }`}
          >
            <input 
              ref={fileInputRef}
              type="file" 
              accept="image/*,.heic,.heif,.avif,.webp" 
              className="hidden" 
              onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
            />
            <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/60 dark:border-indigo-800/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-2xs">
              <Upload className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <p className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100">
                Click to upload, drag and drop, or <span className="text-indigo-600 dark:text-indigo-400">paste</span>
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                PNG, JPG, WebP, AVIF, HEIC • Runs 100% locally on your device
              </p>
              <div className="pt-1.5 flex items-center justify-center gap-1 text-[11px] font-medium text-zinc-400 dark:text-zinc-500">
                <kbd className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 font-mono text-[10px] text-zinc-600 dark:text-zinc-400">Ctrl+V</kbd>
                <span>or</span>
                <kbd className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 font-mono text-[10px] text-zinc-600 dark:text-zinc-400">⌘+V</kbd>
                <span>to paste image</span>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* STATE 2: READY STATE (Image Selected, One-Click Action)   */}
        {/* ========================================================= */}
        {selectedFile && !result && !isProcessing && (
          <div className="space-y-5 animate-in fade-in duration-200">
            {/* Image Preview & Meta */}
            <div className="flex flex-col sm:flex-row items-center gap-4 p-3 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl border border-zinc-200 dark:border-zinc-800">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg overflow-hidden bg-zinc-200 dark:bg-zinc-800 shrink-0 flex items-center justify-center border border-zinc-200 dark:border-zinc-700">
                {originalPreviewUrl && (
                  <img 
                    src={originalPreviewUrl} 
                    alt="Preview" 
                    className="w-full h-full object-cover" 
                  />
                )}
              </div>
              <div className="flex-1 min-w-0 text-center sm:text-left space-y-1">
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {formatBytes(selectedFile.size)} • Ready for instant removal
                </p>
              </div>
              <button
                type="button"
                onClick={handleReset}
                className="px-3 py-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg transition-colors cursor-pointer"
              >
                Change Image
              </button>
            </div>

            {/* Quick Presets (Optional) */}
            <div className="space-y-2">
              <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                Preset (Optional):
              </span>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'default', label: 'Transparent' },
                  { id: 'product', label: 'Product (White)' },
                  { id: 'portrait', label: 'Portrait' },
                  { id: 'profile', label: 'Profile Photo' },
                  { id: 'sticker', label: 'Sticker Cutout' },
                ].map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => applyPreset(preset.id as QuickPreset)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer border ${
                      activePreset === preset.id
                        ? 'bg-zinc-900 text-white border-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 dark:border-zinc-100'
                        : 'bg-zinc-50 dark:bg-zinc-800/60 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-700'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Obvious One-Click Action Button */}
            <button
              type="button"
              onClick={() => runRemoval(selectedFile)}
              className="w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-sm font-semibold rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>Remove Background</span>
            </button>
          </div>
        )}

        {/* ========================================================= */}
        {/* STATE 3: PROCESSING STATE                                 */}
        {/* ========================================================= */}
        {isProcessing && (
          <div className="py-10 px-4 flex flex-col items-center justify-center space-y-4 max-w-sm mx-auto text-center animate-in fade-in duration-200">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
            <div className="space-y-1.5 w-full">
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {progressState?.message || 'Processing background removal...'}
              </p>
              <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-indigo-600 h-2 rounded-full transition-all duration-200"
                  style={{ width: `${progressState?.progress || 10}%` }}
                />
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Processing directly in your browser.
              </p>
            </div>
            <button
              type="button"
              onClick={handleCancel}
              className="px-3 py-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 bg-zinc-100 dark:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </div>
        )}

        {/* ========================================================= */}
        {/* STATE 4: RESULT VIEW                                      */}
        {/* ========================================================= */}
        {selectedFile && !isProcessing && result && (
          <div className="space-y-5 animate-in fade-in duration-200">
            {/* Top Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400">
                <span className="font-semibold text-zinc-900 dark:text-zinc-100 truncate max-w-[180px] sm:max-w-xs">
                  {selectedFile.name}
                </span>
                <span>•</span>
                <span>{result.width}×{result.height}px</span>
                <span>•</span>
                <span>{formatBytes(result.sizeBytes)}</span>
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 p-0.5 rounded-lg border border-zinc-200 dark:border-zinc-700">
                <button
                  type="button"
                  onClick={() => setViewMode('slider')}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                    viewMode === 'slider' 
                      ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-2xs' 
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                  }`}
                >
                  Slider
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('cutout')}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                    viewMode === 'cutout' 
                      ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-2xs' 
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                  }`}
                >
                  Cutout
                </button>
              </div>
            </div>

            {/* Comparison / Cutout Stage */}
            <div className="relative w-full h-72 sm:h-96 md:h-[420px] bg-zinc-900 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 flex items-center justify-center select-none">
              
              {/* Mode: Cutout Only */}
              {viewMode === 'cutout' && (
                <div 
                  className="w-full h-full flex items-center justify-center p-3 relative"
                  style={{
                    backgroundImage: backgroundMode === 'transparent' 
                      ? 'linear-gradient(45deg, #e5e7eb 25%, transparent 25%), linear-gradient(-45deg, #e5e7eb 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e5e7eb 75%), linear-gradient(-45deg, transparent 75%, #e5e7eb 75%)'
                      : undefined,
                    backgroundSize: '16px 16px',
                    backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px',
                    backgroundColor: backgroundMode === 'color' ? backgroundColor : '#f9fafb'
                  }}
                >
                  <img 
                    src={result.previewUrl} 
                    alt="Result Cutout" 
                    className="max-h-full max-w-full object-contain pointer-events-none"
                  />
                </div>
              )}

              {/* Mode: Before / After Slider */}
              {viewMode === 'slider' && (
                <div
                  ref={sliderContainerRef}
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  className="relative w-full h-full flex items-center justify-center cursor-ew-resize overflow-hidden touch-none"
                >
                  {/* Layer 1: Converted Cutout (Right / Full Backing) */}
                  <div 
                    className="absolute inset-0 w-full h-full flex items-center justify-center"
                    style={{
                      backgroundImage: backgroundMode === 'transparent' 
                        ? 'linear-gradient(45deg, #e5e7eb 25%, transparent 25%), linear-gradient(-45deg, #e5e7eb 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e5e7eb 75%), linear-gradient(-45deg, transparent 75%, #e5e7eb 75%)'
                        : undefined,
                      backgroundSize: '16px 16px',
                      backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px',
                      backgroundColor: backgroundMode === 'color' ? backgroundColor : '#f9fafb'
                    }}
                  >
                    <img 
                      src={result.previewUrl} 
                      alt="Cutout" 
                      className="max-h-full max-w-full object-contain pointer-events-none p-2"
                    />
                  </div>

                  {/* Badge: Cutout */}
                  <div className="absolute top-3 right-3 z-10 px-2 py-1 bg-zinc-900/80 text-white text-[11px] font-medium rounded-md backdrop-blur-xs shadow-2xs">
                    Removed
                  </div>

                  {/* Layer 2: Original Image (Left side clipped) */}
                  <div 
                    className="absolute inset-0 w-full h-full flex items-center justify-center bg-zinc-950/80"
                    style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
                  >
                    {originalPreviewUrl && (
                      <img 
                        src={originalPreviewUrl} 
                        alt="Original" 
                        className="max-h-full max-w-full object-contain pointer-events-none p-2"
                      />
                    )}
                  </div>

                  {/* Badge: Original */}
                  <div 
                    className="absolute top-3 left-3 z-10 px-2 py-1 bg-zinc-900/80 text-white text-[11px] font-medium rounded-md backdrop-blur-xs shadow-2xs"
                    style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
                  >
                    Original
                  </div>

                  {/* Divider Line & Handle */}
                  <div 
                    className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg pointer-events-none z-20"
                    style={{ left: `${sliderPosition}%` }}
                  >
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-7 h-7 bg-white text-zinc-900 rounded-full shadow-md flex items-center justify-center border border-zinc-300">
                      <ArrowLeftRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Background Choices */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Background:
                </span>
                <span className="text-xs text-zinc-500 dark:text-zinc-400">
                  {backgroundMode === 'transparent' ? 'Transparent Alpha' : backgroundMode === 'color' && backgroundColor === '#ffffff' ? 'Solid White' : 'Custom Color'}
                </span>
              </div>

              {/* Background Mode Buttons */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setBackgroundMode('transparent');
                    setTargetFormat('png');
                    runRemoval(selectedFile, { backgroundMode: 'transparent', targetFormat: 'png' });
                  }}
                  className={`py-2 px-3 rounded-lg border text-xs font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                    backgroundMode === 'transparent'
                      ? 'bg-zinc-900 text-white border-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 dark:border-zinc-100'
                      : 'bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Transparent</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setBackgroundMode('color');
                    setBackgroundColor('#ffffff');
                    runRemoval(selectedFile, { backgroundMode: 'color', backgroundColor: '#ffffff' });
                  }}
                  className={`py-2 px-3 rounded-lg border text-xs font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                    backgroundMode === 'color' && backgroundColor === '#ffffff'
                      ? 'bg-zinc-900 text-white border-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 dark:border-zinc-100'
                      : 'bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700'
                  }`}
                >
                  <div className="w-3 h-3 rounded-full border border-zinc-400 bg-white" />
                  <span>White</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setBackgroundMode('color');
                    if (backgroundColor === '#ffffff') setBackgroundColor('#09090b');
                    runRemoval(selectedFile, { backgroundMode: 'color', backgroundColor: backgroundColor === '#ffffff' ? '#09090b' : backgroundColor });
                  }}
                  className={`py-2 px-3 rounded-lg border text-xs font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                    backgroundMode === 'color' && backgroundColor !== '#ffffff'
                      ? 'bg-zinc-900 text-white border-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 dark:border-zinc-100'
                      : 'bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700'
                  }`}
                >
                  <Palette className="w-3.5 h-3.5" />
                  <span>Custom Color</span>
                </button>
              </div>

              {/* Color Swatches if Color Mode is active */}
              {backgroundMode === 'color' && (
                <div className="flex flex-wrap items-center gap-2 pt-1 animate-in fade-in duration-150">
                  {COLOR_PRESETS.map((preset) => (
                    <button
                      key={preset.color}
                      type="button"
                      onClick={() => {
                        setBackgroundColor(preset.color);
                        runRemoval(selectedFile, { backgroundMode: 'color', backgroundColor: preset.color });
                      }}
                      className={`w-7 h-7 rounded-full border transition-transform cursor-pointer ${
                        backgroundColor === preset.color 
                          ? 'border-zinc-900 dark:border-white scale-110 shadow-xs' 
                          : 'border-zinc-300 dark:border-zinc-700 hover:scale-105'
                      }`}
                      style={{ backgroundColor: preset.color }}
                      title={preset.label}
                    />
                  ))}
                  
                  {/* Native Color Picker */}
                  <div className="relative flex items-center">
                    <input
                      type="color"
                      value={backgroundColor}
                      onChange={(e) => {
                        setBackgroundColor(e.target.value);
                        runRemoval(selectedFile, { backgroundMode: 'color', backgroundColor: e.target.value });
                      }}
                      className="w-7 h-7 rounded-full border border-zinc-300 dark:border-zinc-700 cursor-pointer overflow-hidden p-0"
                      title="Choose Custom Color"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons: Download + Replace */}
            <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={handleDownload}
                className="w-full sm:flex-1 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-sm font-semibold rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span>Download {result.format.toUpperCase()} ({formatBytes(result.sizeBytes)})</span>
              </button>

              <button
                type="button"
                onClick={handleReset}
                className="w-full sm:w-auto py-3 px-4 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-sm font-medium rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <RefreshCw className="w-4 h-4" />
                <span>New file</span>
              </button>
            </div>

            {/* Collapsible Advanced Options (Secondary) */}
            <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="w-full py-2 text-xs font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 flex items-center justify-between cursor-pointer"
              >
                <span className="flex items-center gap-1.5">
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>More</span>
                </span>
                {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {showAdvanced && (
                <div className="pt-3 pb-2 space-y-4 text-xs animate-in fade-in duration-150 border-t border-zinc-100 dark:border-zinc-800">
                  {/* Format Choice */}
                  <div className="space-y-1.5">
                    <label className="font-medium text-zinc-700 dark:text-zinc-300">
                      Output Format
                    </label>
                    <div className="flex gap-2">
                      {(['png', 'webp', 'jpg', 'avif'] as TargetFormat[]).map((fmt) => (
                        <button
                          key={fmt}
                          type="button"
                          disabled={backgroundMode === 'transparent' && (fmt === 'jpg' || fmt === 'bmp')}
                          onClick={() => {
                            setTargetFormat(fmt);
                            runRemoval(selectedFile, { targetFormat: fmt });
                          }}
                          className={`px-3 py-1.5 rounded-lg border font-medium uppercase transition-colors cursor-pointer ${
                            targetFormat === fmt
                              ? 'bg-zinc-900 text-white border-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 dark:border-zinc-100'
                              : 'bg-zinc-50 dark:bg-zinc-800/60 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700'
                          } ${backgroundMode === 'transparent' && (fmt === 'jpg' || fmt === 'bmp') ? 'opacity-40 cursor-not-allowed' : ''}`}
                        >
                          {fmt}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Resize Dimensions */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                        <Maximize2 className="w-3.5 h-3.5" />
                        <span>Resize Dimensions (Optional)</span>
                      </label>
                      {(resizeWidth || resizeHeight) && (
                        <button
                          type="button"
                          onClick={() => {
                            setResizeWidth(undefined);
                            setResizeHeight(undefined);
                            runRemoval(selectedFile, { resize: { enabled: false, keepAspectRatio: true } });
                          }}
                          className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
                        >
                          Reset
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        placeholder={`Width (e.g. ${result?.width || 1200})`}
                        value={resizeWidth || ''}
                        onChange={(e) => {
                          const val = e.target.value ? parseInt(e.target.value, 10) : undefined;
                          setResizeWidth(val);
                          runRemoval(selectedFile, { 
                            resize: { 
                              enabled: !!(val || resizeHeight), 
                              maxWidth: val, 
                              maxHeight: resizeHeight, 
                              keepAspectRatio: true 
                            } 
                          });
                        }}
                        className="w-full px-2.5 py-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs"
                      />
                      <input
                        type="number"
                        placeholder={`Height (e.g. ${result?.height || 800})`}
                        value={resizeHeight || ''}
                        onChange={(e) => {
                          const val = e.target.value ? parseInt(e.target.value, 10) : undefined;
                          setResizeHeight(val);
                          runRemoval(selectedFile, { 
                            resize: { 
                              enabled: !!(resizeWidth || val), 
                              maxWidth: resizeWidth, 
                              maxHeight: val, 
                              keepAspectRatio: true 
                            } 
                          });
                        }}
                        className="w-full px-2.5 py-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs"
                      />
                    </div>
                  </div>

                  {/* Target File Size (Compress to target KB) */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                        <HardDrive className="w-3.5 h-3.5" />
                        <span>Compress to Max Size (KB)</span>
                      </label>
                      {targetMaxKB && (
                        <button
                          type="button"
                          onClick={() => {
                            setTargetMaxKB(undefined);
                            runRemoval(selectedFile, { targetMaxKB: undefined });
                          }}
                          className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        placeholder="Target KB (e.g. 100)"
                        value={targetMaxKB || ''}
                        onChange={(e) => {
                          const val = e.target.value ? parseInt(e.target.value, 10) : undefined;
                          setTargetMaxKB(val);
                          runRemoval(selectedFile, { targetMaxKB: val });
                        }}
                        className="w-32 px-2.5 py-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs"
                      />
                      <div className="flex gap-1">
                        {[50, 100, 200, 500].map((kb) => (
                          <button
                            key={kb}
                            type="button"
                            onClick={() => {
                              setTargetMaxKB(kb);
                              runRemoval(selectedFile, { targetMaxKB: kb });
                            }}
                            className={`px-2 py-1 rounded-md text-[11px] font-medium border cursor-pointer ${
                              targetMaxKB === kb 
                                ? 'bg-indigo-50 border-indigo-300 text-indigo-700 dark:bg-indigo-950/50 dark:border-indigo-700 dark:text-indigo-300' 
                                : 'bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400'
                            }`}
                          >
                            {kb}KB
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Edge Feathering Slider */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between">
                      <label className="font-medium text-zinc-700 dark:text-zinc-300">
                        Edge Softness (Feathering)
                      </label>
                      <span className="text-zinc-500">{featherRadius}px</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="6"
                      step="1"
                      value={featherRadius}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        setFeatherRadius(val);
                        runRemoval(selectedFile, { featherRadius: val });
                      }}
                      className="w-full accent-indigo-600"
                    />
                  </div>

                  {/* Quality Slider */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between">
                      <label className="font-medium text-zinc-700 dark:text-zinc-300">
                        Image Quality
                      </label>
                      <span className="text-zinc-500">{Math.round(quality * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.6"
                      max="1.0"
                      step="0.05"
                      value={quality}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        setQuality(val);
                        runRemoval(selectedFile, { quality: val });
                      }}
                      className="w-full accent-indigo-600"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* ERROR STATE                                               */}
        {/* ========================================================= */}
        {errorMessage && (
          <div className="p-3.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 rounded-xl text-red-700 dark:text-red-300 text-xs flex items-center justify-between gap-3 animate-in fade-in duration-150">
            <div className="flex items-center gap-2 min-w-0">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span className="truncate">{errorMessage}</span>
            </div>
            {selectedFile && (
              <button
                type="button"
                onClick={() => runRemoval(selectedFile)}
                className="px-2.5 py-1 text-xs font-semibold bg-red-100 dark:bg-red-900/60 hover:bg-red-200 dark:hover:bg-red-800 text-red-800 dark:text-red-200 rounded-md transition-colors shrink-0 cursor-pointer"
              >
                Retry
              </button>
            )}
          </div>
        )}
      </div>

      {/* Ad Slot: Reserved privacy-friendly ad placement after primary interaction/result */}
      <AdSlot placement="tool-result" />

      {/* SEO Guide & Informational Content */}
      <SeoGuideContent seoData={seoData} onNavigate={onNavigate} />
    </div>
  );
}
