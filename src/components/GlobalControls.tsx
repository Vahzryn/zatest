import React, { useState, useRef, useEffect } from 'react';
import { TargetFormat, ConversionSettings } from '../types';
import { 
  Minimize2, 
  Zap, 
  Loader2, 
  Maximize, 
  Crop, 
  Settings2, 
  Printer, 
  RotateCw, 
  Check, 
  Share2, 
  ChevronDown, 
  SlidersHorizontal 
} from 'lucide-react';
import { cn } from '../lib/utils';
import { SeoRouteData } from '../lib/seoEngine';
import { InfoTooltip } from './InfoTooltip';

interface GlobalControlsProps {
  settings: ConversionSettings;
  onChange: (settings: ConversionSettings) => void;
  seoData?: SeoRouteData;
  disabled?: boolean;
  onConvert?: () => void;
  onStop?: () => void;
  isProcessing?: boolean;
  isStopping?: boolean;
  pendingCount?: number;
  successCount?: number;
  onContinueToDownload?: () => void;
  onShareSettings?: () => void;
  isCopiedSettingsLink?: boolean;
}

function GlobalControlsComponent({
  settings,
  onChange,
  seoData,
  disabled,
  onConvert,
  onStop,
  isProcessing = false,
  isStopping = false,
  pendingCount = 0,
  successCount = 0,
  onContinueToDownload,
  onShareSettings,
  isCopiedSettingsLink = false
}: GlobalControlsProps) {
  const [localQuality, setLocalQuality] = React.useState(settings.quality);
  const [localMaxKB, setLocalMaxKB] = React.useState(settings.targetMaxKB ? String(settings.targetMaxKB) : '');
  const [useTargetSize, setUseTargetSize] = React.useState<boolean>(() => {
    return settings.targetMaxKB !== undefined && settings.targetMaxKB > 0;
  });
  const [showAdvanced, setShowAdvanced] = React.useState(false);
  const debounceTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  const modeContainerRef = useRef<HTMLDivElement>(null);
  const convertBtnRef = useRef<HTMLButtonElement>(null);
  const compressBtnRef = useRef<HTMLButtonElement>(null);

  const [localResizeWidth, setLocalResizeWidth] = React.useState<string>(
    settings.resize.maxWidth ? String(settings.resize.maxWidth) : ''
  );
  const [localResizeHeight, setLocalResizeHeight] = React.useState<string>(
    settings.resize.maxHeight ? String(settings.resize.maxHeight) : ''
  );

  const [customCropWidth, setCustomCropWidth] = React.useState<string>(
    settings.cropAspectRatio ? String(settings.cropAspectRatio.width) : '16'
  );
  const [customCropHeight, setCustomCropHeight] = React.useState<string>(
    settings.cropAspectRatio ? String(settings.cropAspectRatio.height) : '9'
  );
  const [customDpiInput, setCustomDpiInput] = React.useState<string>(
    settings.targetDPI ? String(settings.targetDPI) : '300'
  );

  React.useEffect(() => {
    setLocalQuality(settings.quality);
  }, [settings.quality]);

  React.useEffect(() => {
    if (settings.targetMaxKB !== undefined && settings.targetMaxKB > 0) {
      setLocalMaxKB(settings.targetMaxKB.toString());
      setUseTargetSize(true);
      setMode('compress');
    }
  }, [settings.targetMaxKB]);

  React.useEffect(() => {
    setLocalResizeWidth(settings.resize.maxWidth ? String(settings.resize.maxWidth) : '');
  }, [settings.resize.maxWidth]);

  React.useEffect(() => {
    setLocalResizeHeight(settings.resize.maxHeight ? String(settings.resize.maxHeight) : '');
  }, [settings.resize.maxHeight]);

  React.useEffect(() => {
    if (settings.cropAspectRatio) {
      setCustomCropWidth(String(settings.cropAspectRatio.width));
      setCustomCropHeight(String(settings.cropAspectRatio.height));
    }
  }, [settings.cropAspectRatio]);

  React.useEffect(() => {
    if (settings.targetDPI) {
      setCustomDpiInput(String(settings.targetDPI));
    }
  }, [settings.targetDPI]);

  React.useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const updateSettings = (updates: Partial<ConversionSettings>) => {
    onChange({ ...settings, ...updates });
  };

  const updateResize = (updates: Partial<ConversionSettings['resize']>) => {
    onChange({ ...settings, resize: { ...settings.resize, ...updates } });
  };

  const handleQualityChange = (val: number) => {
    setLocalQuality(val);
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      onChange({ ...settings, quality: val, targetMaxKB: undefined });
    }, 100);
  };

  const handleMaxKBChange = (val: string) => {
    setLocalMaxKB(val);
    const cleaned = val.trim();
    const parsed = parseInt(cleaned, 10);
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      const validVal = !isNaN(parsed) && parsed > 0 && /^\d+$/.test(cleaned) ? Math.min(parsed, 1000000) : undefined;
      onChange({ ...settings, targetMaxKB: validVal });
    }, 400);
  };

  const handleMaxKBBlur = () => {
    const cleaned = localMaxKB.trim();
    if (!cleaned) {
      setLocalMaxKB('');
      onChange({ ...settings, targetMaxKB: undefined });
      return;
    }
    const parsed = parseInt(cleaned, 10);
    if (isNaN(parsed) || parsed <= 0 || !/^\d+$/.test(cleaned)) {
      setLocalMaxKB('');
      onChange({ ...settings, targetMaxKB: undefined });
    } else {
      const sanitized = Math.min(parsed, 1000000);
      setLocalMaxKB(String(sanitized));
      onChange({ ...settings, targetMaxKB: sanitized });
    }
  };

  const handleResizeWidthChange = (val: string) => {
    setLocalResizeWidth(val);
    const cleaned = val.trim();
    const parsed = parseInt(cleaned, 10);
    if (!cleaned || isNaN(parsed) || parsed <= 0 || !/^\d+$/.test(cleaned)) {
      updateResize({ maxWidth: undefined });
    } else {
      updateResize({ maxWidth: Math.min(parsed, 50000) });
    }
  };

  const handleResizeWidthBlur = () => {
    const cleaned = localResizeWidth.trim();
    if (!cleaned) {
      setLocalResizeWidth('');
      updateResize({ maxWidth: undefined });
      return;
    }
    const parsed = parseInt(cleaned, 10);
    if (isNaN(parsed) || parsed <= 0 || !/^\d+$/.test(cleaned)) {
      setLocalResizeWidth('');
      updateResize({ maxWidth: undefined });
    } else {
      const sanitized = Math.min(parsed, 50000);
      setLocalResizeWidth(String(sanitized));
      updateResize({ maxWidth: sanitized });
    }
  };

  const handleResizeHeightChange = (val: string) => {
    setLocalResizeHeight(val);
    const cleaned = val.trim();
    const parsed = parseInt(cleaned, 10);
    if (!cleaned || isNaN(parsed) || parsed <= 0 || !/^\d+$/.test(cleaned)) {
      updateResize({ maxHeight: undefined });
    } else {
      updateResize({ maxHeight: Math.min(parsed, 50000) });
    }
  };

  const handleResizeHeightBlur = () => {
    const cleaned = localResizeHeight.trim();
    if (!cleaned) {
      setLocalResizeHeight('');
      updateResize({ maxHeight: undefined });
      return;
    }
    const parsed = parseInt(cleaned, 10);
    if (isNaN(parsed) || parsed <= 0 || !/^\d+$/.test(cleaned)) {
      setLocalResizeHeight('');
      updateResize({ maxHeight: undefined });
    } else {
      const sanitized = Math.min(parsed, 50000);
      setLocalResizeHeight(String(sanitized));
      updateResize({ maxHeight: sanitized });
    }
  };

  const handleCropWidthBlur = () => {
    const cleaned = customCropWidth.trim();
    const parsed = parseFloat(cleaned);
    if (isNaN(parsed) || parsed <= 0) {
      setCustomCropWidth('1');
      const h = parseFloat(customCropHeight) || 1;
      updateSettings({ cropAspectRatio: { width: 1, height: h } });
    } else {
      const sanitized = Math.min(parsed, 10000);
      setCustomCropWidth(String(sanitized));
      const h = parseFloat(customCropHeight) || 1;
      updateSettings({ cropAspectRatio: { width: sanitized, height: h } });
    }
  };

  const handleCropHeightBlur = () => {
    const cleaned = customCropHeight.trim();
    const parsed = parseFloat(cleaned);
    if (isNaN(parsed) || parsed <= 0) {
      setCustomCropHeight('1');
      const w = parseFloat(customCropWidth) || 1;
      updateSettings({ cropAspectRatio: { width: w, height: 1 } });
    } else {
      const sanitized = Math.min(parsed, 10000);
      setCustomCropHeight(String(sanitized));
      const w = parseFloat(customCropWidth) || 1;
      updateSettings({ cropAspectRatio: { width: w, height: sanitized } });
    }
  };

  const handleDpiChange = (val: string) => {
    setCustomDpiInput(val);
    const cleaned = val.trim();
    const parsed = parseInt(cleaned, 10);
    if (!cleaned || isNaN(parsed) || parsed <= 0 || !/^\d+$/.test(cleaned)) {
      updateSettings({ targetDPI: null });
    } else {
      updateSettings({ targetDPI: Math.min(parsed, 4800) });
    }
  };

  const handleDpiBlur = () => {
    const cleaned = customDpiInput.trim();
    if (!cleaned) {
      setCustomDpiInput('');
      updateSettings({ targetDPI: null });
      return;
    }
    const parsed = parseInt(cleaned, 10);
    if (isNaN(parsed) || parsed <= 0 || !/^\d+$/.test(cleaned)) {
      setCustomDpiInput('');
      updateSettings({ targetDPI: null });
    } else {
      const sanitized = Math.min(parsed, 4800);
      setCustomDpiInput(String(sanitized));
      updateSettings({ targetDPI: sanitized });
    }
  };

  const handleQualityCommit = (val: number) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    onChange({ ...settings, quality: val, targetMaxKB: undefined });
  };

  const path = seoData?.path || '';
  const isCompressionMode = seoData?.pageCategory === 'compression' || seoData?.targetMaxKB !== undefined || path.includes('compress') || (settings.targetMaxKB !== undefined && settings.targetMaxKB > 0);
  const [mode, setMode] = useState<'convert' | 'compress'>(isCompressionMode ? 'compress' : 'convert');

  React.useEffect(() => {
    setMode(isCompressionMode ? 'compress' : 'convert');
  }, [isCompressionMode]);

  // Keep active mode tab scrolled into view on mobile
  useEffect(() => {
    const container = modeContainerRef.current;
    const btn = mode === 'convert' ? convertBtnRef.current : compressBtnRef.current;
    if (container && btn && container.scrollWidth > container.clientWidth) {
      const btnLeft = btn.offsetLeft;
      const btnWidth = btn.offsetWidth;
      const containerWidth = container.clientWidth;
      const targetScroll = btnLeft - (containerWidth / 2) + (btnWidth / 2);
      container.scrollTo({
        left: Math.max(0, targetScroll),
        behavior: 'smooth'
      });
    }
  }, [mode]);

  const handleModeChange = (newMode: 'convert' | 'compress') => {
    setMode(newMode);
    if (newMode === 'convert') {
      setUseTargetSize(false);
      onChange({ ...settings, targetMaxKB: undefined });
    } else {
      if (useTargetSize) {
        const parsed = parseInt(localMaxKB.trim(), 10);
        if (!isNaN(parsed) && parsed > 0 && /^\d+$/.test(localMaxKB.trim())) {
          onChange({ ...settings, targetMaxKB: parsed });
        } else {
          onChange({ ...settings, targetMaxKB: undefined });
        }
      }
    }
  };

  const isCompress = mode === 'compress';
  const isLockedFormat = !!seoData?.toFormat;

  // Check if quality control is supported for current format
  const formatSupportsQuality = 
    settings.targetFormat === 'auto' ||
    settings.targetFormat === 'jpg' ||
    settings.targetFormat === 'webp' ||
    settings.targetFormat === 'avif';

  const isResizePrimary = seoData?.presetResize !== undefined || path.includes('resize') || path.includes('passport') || path.includes('size-reducer');
  const isCropPrimary = path.includes('crop');
  const isDpiPrimary = path.includes('dpi');
  const isRotationPrimary = path.includes('rotate') || path.includes('flip');

  const renderResizeControls = () => (
    <div className="flex flex-col gap-2 p-3 bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200/80 dark:border-zinc-800 rounded-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Maximize className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-400" />
          <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-200">Resize Dimensions</h4>
          <InfoTooltip text="Scales the pixel dimensions of your image while keeping proportions." />
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            className="sr-only peer"
            checked={settings.resize.enabled}
            onChange={(e) => updateResize({ enabled: e.target.checked })}
            disabled={disabled}
          />
          <div className="w-7 h-4 bg-zinc-300 dark:bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-indigo-600"></div>
        </label>
      </div>

      {settings.resize.enabled && (
        <div className="grid grid-cols-2 gap-2 pt-1">
          <div>
            <label className="block mb-0.5 text-[10px] font-medium text-zinc-500 dark:text-zinc-400">Width (px)</label>
            <input
              type="number"
              min="1"
              max="50000"
              value={localResizeWidth}
              onChange={(e) => handleResizeWidthChange(e.target.value)}
              onBlur={handleResizeWidthBlur}
              placeholder="Auto"
              disabled={disabled}
              className="w-full px-2 py-1 text-xs font-semibold border rounded-md bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 focus:border-indigo-500 focus:outline-none transition-colors"
            />
          </div>
          <div>
            <label className="block mb-0.5 text-[10px] font-medium text-zinc-500 dark:text-zinc-400">Height (px)</label>
            <input
              type="number"
              min="1"
              max="50000"
              value={localResizeHeight}
              onChange={(e) => handleResizeHeightChange(e.target.value)}
              onBlur={handleResizeHeightBlur}
              placeholder="Auto"
              disabled={disabled}
              className="w-full px-2 py-1 text-xs font-semibold border rounded-md bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 focus:border-indigo-500 focus:outline-none transition-colors"
            />
          </div>
          <label className="flex items-center gap-1.5 cursor-pointer col-span-2 pt-0.5">
            <input
              type="checkbox"
              checked={settings.resize.keepAspectRatio}
              onChange={(e) => updateResize({ keepAspectRatio: e.target.checked })}
              disabled={disabled}
              className="w-3.5 h-3.5 rounded text-indigo-600 border-zinc-300 dark:border-zinc-700 focus:ring-indigo-500 cursor-pointer"
            />
            <span className="text-[11px] font-medium text-zinc-700 dark:text-zinc-300">Lock aspect ratio</span>
          </label>
        </div>
      )}
    </div>
  );

  const renderCropControls = () => (
    <div className="flex flex-col gap-2 p-3 bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200/80 dark:border-zinc-800 rounded-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Crop className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-400" />
          <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-200">Crop Aspect Ratio</h4>
          <InfoTooltip text="Trims image edges to a fixed aspect ratio." />
        </div>
        {settings.cropAspectRatio && (
          <button
            type="button"
            onClick={() => updateSettings({ cropAspectRatio: null })}
            disabled={disabled}
            className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
          >
            Clear
          </button>
        )}
      </div>
      
      <div className="grid grid-cols-4 gap-1">
        {[
          { label: '1:1', value: { width: 1, height: 1 } },
          { label: '4:3', value: { width: 4, height: 3 } },
          { label: '16:9', value: { width: 16, height: 9 } },
          { label: '9:16', value: { width: 9, height: 16 } },
        ].map((preset) => {
          const isActive = settings.cropAspectRatio?.width === preset.value.width && settings.cropAspectRatio?.height === preset.value.height;
          return (
            <button
              key={preset.label}
              type="button"
              disabled={disabled}
              onClick={() => {
                updateSettings({ cropAspectRatio: preset.value });
                if (preset.value) {
                  setCustomCropWidth(String(preset.value.width));
                  setCustomCropHeight(String(preset.value.height));
                }
              }}
              className={cn(
                "py-1 text-[10px] font-semibold rounded border transition-all text-center cursor-pointer",
                isActive
                  ? "bg-indigo-600 text-white border-indigo-600 dark:bg-indigo-500"
                  : "bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:border-indigo-400"
              )}
            >
              {preset.label}
            </button>
          );
        })}
      </div>
    </div>
  );

  const renderDpiControls = () => (
    <div className="flex flex-col gap-2 p-3 bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200/80 dark:border-zinc-800 rounded-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Printer className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-400" />
          <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-200">Print DPI</h4>
          <InfoTooltip text="Sets print resolution metadata (dots per inch)." />
        </div>
        {settings.targetDPI !== null && settings.targetDPI !== undefined && (
          <button
            type="button"
            disabled={disabled}
            onClick={() => updateSettings({ targetDPI: null })}
            className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
          >
            Clear
          </button>
        )}
      </div>
      
      <div className="grid grid-cols-3 gap-1">
        {[
          { label: '72 (Web)', value: 72 },
          { label: '150', value: 150 },
          { label: '300 (Print)', value: 300 },
        ].map((preset) => {
          const isActive = settings.targetDPI === preset.value;
          return (
            <button
              key={preset.label}
              type="button"
              disabled={disabled}
              onClick={() => {
                updateSettings({ targetDPI: preset.value });
                if (preset.value) setCustomDpiInput(String(preset.value));
              }}
              className={cn(
                "py-1 text-[10px] font-semibold rounded border transition-all text-center cursor-pointer",
                isActive
                  ? "bg-indigo-600 text-white border-indigo-600 dark:bg-indigo-500"
                  : "bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:border-indigo-400"
              )}
            >
              {preset.label}
            </button>
          );
        })}
      </div>
    </div>
  );

  const renderRotationControls = () => (
    <div className="flex flex-col gap-2 p-3 bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200/80 dark:border-zinc-800 rounded-lg">
      <div className="flex items-center gap-1.5">
        <RotateCw className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-400" />
        <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-200">Rotation</h4>
        <InfoTooltip text="Rotates batch images clockwise by the chosen angle." />
      </div>
      
      <div className="grid grid-cols-4 gap-1">
        {[
          { label: '0°', value: 0 },
          { label: '90°', value: 90 },
          { label: '180°', value: 180 },
          { label: '270°', value: 270 },
        ].map((preset) => (
          <button
            key={preset.label}
            type="button"
            disabled={disabled}
            onClick={() => updateSettings({ rotation: preset.value })}
            className={cn(
              "py-1 text-[10px] font-semibold rounded border transition-all text-center cursor-pointer",
              settings.rotation === preset.value || (preset.value === 0 && !settings.rotation)
                ? "bg-indigo-600 text-white border-indigo-600 dark:bg-indigo-500"
                : "bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:border-indigo-400"
            )}
          >
            {preset.label}
          </button>
        ))}
      </div>
    </div>
  );

  const advancedControls = [
    { key: 'resize', render: renderResizeControls, isPrimary: isResizePrimary },
    { key: 'crop', render: renderCropControls, isPrimary: isCropPrimary && !isCompress },
    { key: 'dpi', render: renderDpiControls, isPrimary: isDpiPrimary && !isCompress },
    { key: 'rotation', render: renderRotationControls, isPrimary: isRotationPrimary && !isCompress },
  ];

  const primaryRenderers = advancedControls.filter(c => c.isPrimary);
  const secondaryRenderers = advancedControls.filter(c => !c.isPrimary);

  return (
    <div className="flex flex-col gap-2.5 sm:gap-3 bg-white dark:bg-zinc-900 p-3 sm:p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-2xs w-full relative z-30">
      
      {/* 1. Compact Mode Switch (Segmented control with horizontal scroll on small mobile) */}
      <div 
        ref={modeContainerRef}
        className="w-full overflow-x-auto no-scrollbar py-0.5 -my-0.5 touch-pan-x"
        role="region"
        aria-label="Processing mode switcher"
      >
        <div className="inline-flex sm:flex w-auto sm:w-full min-w-full bg-zinc-100 dark:bg-zinc-800/80 p-0.5 rounded-lg border border-zinc-200/60 dark:border-zinc-700/50">
          <button
            ref={convertBtnRef}
            type="button"
            onClick={() => handleModeChange('convert')}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 py-1 sm:py-1.5 px-3 text-xs font-semibold rounded-md transition-all duration-200 cursor-pointer select-none whitespace-nowrap",
              mode === 'convert'
                ? "bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 shadow-2xs font-bold"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
            )}
          >
            <Settings2 className="w-3.5 h-3.5 shrink-0" />
            <span>Convert</span>
          </button>
          <button
            ref={compressBtnRef}
            type="button"
            onClick={() => handleModeChange('compress')}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 py-1 sm:py-1.5 px-3 text-xs font-semibold rounded-md transition-all duration-200 cursor-pointer select-none whitespace-nowrap",
              mode === 'compress'
                ? "bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 shadow-2xs font-bold"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
            )}
          >
            <Minimize2 className="w-3.5 h-3.5 shrink-0" />
            <span>Compress</span>
          </button>
        </div>
      </div>

      {/* 2. Primary Form Controls: Format + Quality in a compact, efficient row */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5 sm:gap-3 w-full">
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 flex-1 w-full">
          {/* Output Format Select */}
          {!isLockedFormat && (
            <div className="flex flex-col gap-1 min-w-0">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
                  Format
                </label>
                <InfoTooltip text="Target file format for processed images." />
              </div>
              <div className="relative w-full">
                <select
                  disabled={disabled}
                  value={settings.targetFormat}
                  onChange={(e) => onChange({ ...settings, targetFormat: e.target.value as TargetFormat })}
                  className="w-full h-[38px] appearance-none bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-800 dark:hover:bg-zinc-700/80 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white text-xs sm:text-sm font-semibold rounded-lg px-3 pr-8 cursor-pointer focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors"
                  title="Select target format"
                >
                  <option value="auto">Auto</option>
                  <option value="webp">WebP (Recommended)</option>
                  <option value="jpg">JPG / JPEG</option>
                  <option value="png">PNG (Lossless)</option>
                  <option value="avif">AVIF</option>
                  <option value="bmp">BMP</option>
                  <option value="ico">ICO</option>
                  <option value="pdf">PDF</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-zinc-400">
                  <ChevronDown className="h-3.5 w-3.5" />
                </div>
              </div>
            </div>
          )}

          {/* Compact Unified Quality Control (Only shown when format supports quality) */}
          {formatSupportsQuality ? (
            <div className="flex flex-col gap-1 min-w-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <label className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
                    {useTargetSize ? 'Target Size' : 'Quality'}
                  </label>
                  {!useTargetSize && (
                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                      {Math.round(localQuality * 100)}%
                    </span>
                  )}
                </div>
                {/* Optional switch to Target Size in Compress mode */}
                {isCompress && (
                  <button
                    type="button"
                    onClick={() => {
                      const nextTarget = !useTargetSize;
                      setUseTargetSize(nextTarget);
                      if (nextTarget) {
                        const parsed = parseInt(localMaxKB, 10);
                        const kb = !isNaN(parsed) && parsed > 0 ? parsed : 200;
                        setLocalMaxKB(String(kb));
                        onChange({ ...settings, targetMaxKB: kb });
                      } else {
                        onChange({ ...settings, targetMaxKB: undefined, quality: localQuality });
                      }
                    }}
                    className="text-[10px] font-semibold text-zinc-500 hover:text-indigo-600 dark:text-zinc-400 dark:hover:text-indigo-400 transition-colors cursor-pointer"
                  >
                    {useTargetSize ? 'Use Quality %' : 'Set Max KB'}
                  </button>
                )}
              </div>

              {useTargetSize ? (
                <div className="flex items-center gap-2 h-[38px]">
                  <input
                    type="number"
                    min="1"
                    placeholder="200"
                    disabled={disabled}
                    value={localMaxKB}
                    onChange={(e) => handleMaxKBChange(e.target.value)}
                    onBlur={handleMaxKBBlur}
                    className="w-full h-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white text-xs sm:text-sm font-semibold rounded-lg px-3 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  <span className="text-xs font-bold text-zinc-500 shrink-0">KB</span>
                </div>
              ) : (
                <div className="flex items-center gap-2.5 h-[38px] px-1 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-700/60 rounded-lg">
                  <input
                    type="range"
                    min="0.1"
                    max="1"
                    step="0.05"
                    disabled={disabled}
                    value={localQuality}
                    onChange={(e) => handleQualityChange(parseFloat(e.target.value))}
                    onMouseUp={(e) => handleQualityCommit(parseFloat((e.target as HTMLInputElement).value))}
                    onTouchEnd={(e) => handleQualityCommit(parseFloat((e.target as HTMLInputElement).value))}
                    className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    aria-label="Image Quality Percentage"
                  />
                  <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 w-9 text-right shrink-0">
                    {Math.round(localQuality * 100)}%
                  </span>
                </div>
              )}
            </div>
          ) : isLockedFormat ? null : (
            <div className="hidden sm:flex flex-col justify-center px-3 py-2 bg-zinc-50/50 dark:bg-zinc-800/30 rounded-lg border border-dashed border-zinc-200 dark:border-zinc-800 text-[11px] text-zinc-500 dark:text-zinc-400">
              Lossless encoding format selected.
            </div>
          )}
        </div>

        {/* Primary Action Button (When batch files are present in queue) */}
        {onConvert && onStop && (
          <div className="shrink-0 w-full md:w-auto self-end md:self-center">
            {isProcessing ? (
              <button
                onClick={onStop}
                disabled={isStopping}
                className="w-full md:w-auto flex items-center justify-center gap-2 px-5 py-2 text-xs sm:text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors cursor-pointer min-h-[38px]"
              >
                {isStopping ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Stopping...</>
                ) : (
                  <><Zap className="w-4 h-4" /> Stop</>
                )}
              </button>
            ) : pendingCount === 0 && successCount > 0 && onContinueToDownload ? (
              <button
                onClick={onContinueToDownload}
                className="w-full md:w-auto flex items-center justify-center gap-2 px-5 py-2 text-xs sm:text-sm font-bold rounded-lg transition-colors bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer shadow-2xs min-h-[38px]"
              >
                <Check className="w-4 h-4" />
                Continue to Download
              </button>
            ) : (
              <button
                onClick={onConvert}
                disabled={pendingCount === 0}
                className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-2 text-xs sm:text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-zinc-200 dark:disabled:bg-zinc-800 disabled:text-zinc-400 rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed shadow-2xs min-h-[38px]"
              >
                <Zap className="w-4 h-4" />
                <span>{isCompress ? 'Compress' : (isResizePrimary ? 'Resize' : (isCropPrimary ? 'Crop' : 'Convert'))} {pendingCount > 0 ? `(${pendingCount})` : ''}</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* 3. Primary Context-Specific Controls (If page is a dedicated resize, crop, or dpi route) */}
      {primaryRenderers.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2.5 border-t border-zinc-100 dark:border-zinc-800">
          {primaryRenderers.map(r => (
            <React.Fragment key={r.key}>{r.render()}</React.Fragment>
          ))}
        </div>
      )}

      {/* 4. Utility Bar: Metadata Checkbox, Advanced Settings Toggle, and Share Settings */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800/80">
        
        {/* Directly Accessible Metadata Checkbox */}
        <label className="flex items-center gap-1.5 cursor-pointer select-none py-1 group">
          <input
            type="checkbox"
            checked={settings.stripExif !== false}
            onChange={(e) => updateSettings({ stripExif: e.target.checked })}
            disabled={disabled}
            className="w-3.5 h-3.5 text-indigo-600 rounded border-zinc-300 dark:border-zinc-700 focus:ring-indigo-500 cursor-pointer"
          />
          <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors">
            Metadata
          </span>
          <InfoTooltip
            title="Metadata Removal"
            text="Strips camera model, GPS coordinates, and EXIF metadata for privacy."
          />
        </label>

        {/* Right Actions: More Toggle & Share Settings */}
        <div className="flex items-center gap-2 ml-auto">
          {secondaryRenderers.length > 0 && (
            <button
              type="button"
              disabled={disabled}
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200/70 dark:hover:bg-zinc-700/70 rounded-md transition-colors cursor-pointer"
              aria-expanded={showAdvanced}
              id="btn-toggle-advanced-settings"
            >
              <SlidersHorizontal className="w-3 h-3 text-zinc-500" />
              <span>More</span>
              <ChevronDown className={cn("w-3 h-3 transition-transform duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]", showAdvanced && "rotate-180")} />
            </button>
          )}

          {onShareSettings && (
            <button
              type="button"
              onClick={onShareSettings}
              disabled={disabled}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200/70 dark:border-indigo-800/60 rounded-md transition-colors cursor-pointer disabled:opacity-50"
              title="Share configuration link"
              aria-label="Share current settings configuration"
              id="btn-share-settings-main"
            >
              {isCopiedSettingsLink ? (
                <>
                  <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-emerald-600 dark:text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3 h-3" />
                  <span className="hidden min-[380px]:inline">Share</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* 5. Collapsible Advanced Settings (Resize, Crop, DPI, Rotation) */}
      {showAdvanced && secondaryRenderers.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2.5 border-t border-zinc-100 dark:border-zinc-800 animate-in fade-in duration-200">
          {secondaryRenderers.map(r => (
            <React.Fragment key={r.key}>{r.render()}</React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
}

export const GlobalControls = React.memo(GlobalControlsComponent);
