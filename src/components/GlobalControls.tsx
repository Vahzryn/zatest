import React, { useState } from 'react';
import { TargetFormat, ConversionSettings } from '../types';
import { Globe, Smartphone, Minimize2, Zap, Loader2, Maximize, Crop, Settings2, ShieldCheck, Printer, RotateCw, Check, FolderDown, Archive } from 'lucide-react';
import { cn } from '../lib/utils';
import { SeoRouteData } from '../lib/seoEngine';

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
  onContinueToDownload
}: GlobalControlsProps) {
  const [localQuality, setLocalQuality] = React.useState(settings.quality);
  const [localMaxKB, setLocalMaxKB] = React.useState(settings.targetMaxKB?.toString() || '');
  const [showAdvanced, setShowAdvanced] = React.useState(false);
  const debounceTimerRef = React.useRef<NodeJS.Timeout | null>(null);

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
    setLocalMaxKB(settings.targetMaxKB?.toString() || '');
  }, [settings.targetMaxKB]);

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
      onChange({ ...settings, quality: val });
    }, 100);
  };

  const handleMaxKBChange = (val: string) => {
    setLocalMaxKB(val);
    const parsed = parseInt(val, 10);
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      onChange({ ...settings, targetMaxKB: !isNaN(parsed) && parsed > 0 ? parsed : undefined });
    }, 500);
  };

  const handleQualityCommit = (val: number) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    onChange({ ...settings, quality: val });
  };

  const path = seoData?.path || '';
  const isCompressionMode = seoData?.pageCategory === 'compression' || seoData?.targetMaxKB !== undefined || path.includes('compress');
  const [mode, setMode] = useState<'convert' | 'compress'>(isCompressionMode ? 'compress' : 'convert');

  React.useEffect(() => {
    setMode(isCompressionMode ? 'compress' : 'convert');
  }, [isCompressionMode]);

  const handleModeChange = (newMode: 'convert' | 'compress') => {
    setMode(newMode);
    if (newMode === 'convert') {
      onChange({ ...settings, targetMaxKB: undefined });
    }
  };

  const isCompress = mode === 'compress';
  const isLockedFormat = !!seoData?.toFormat;

  const isResizePrimary = seoData?.presetResize !== undefined || path.includes('resize') || path.includes('passport') || path.includes('size-reducer');
  const isCropPrimary = path.includes('crop');
  const isDpiPrimary = path.includes('dpi');
  const isRotationPrimary = path.includes('rotate') || path.includes('flip');
  const isPrivacyPrimary = path.includes('exif') || path.includes('metadata');

  const renderResizeControls = () => (
    <div className="flex flex-col gap-2.5 p-3 sm:p-4 bg-white dark:bg-zinc-950 border border-emerald-100 dark:border-[#2d523c] rounded-xl">
      <div className="flex items-center justify-between mb-0.5">
        <div className="flex items-center gap-1.5">
          <div className="p-1 bg-emerald-100 dark:bg-[#1e3427] text-emerald-600 dark:text-emerald-400 rounded-lg">
            <Maximize className="w-3.5 h-3.5" />
          </div>
          <h4 className="text-xs sm:text-sm font-bold text-zinc-800 dark:text-zinc-200">Dimension Resizing</h4>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            className="sr-only peer"
            checked={settings.resize.enabled}
            onChange={(e) => updateResize({ enabled: e.target.checked })}
            disabled={disabled}
          />
          <div className="w-8 h-5 sm:w-10 sm:h-6 bg-zinc-300 dark:bg-zinc-900 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white dark:after:bg-zinc-200 after:border-zinc-300 dark:after:border-zinc-800 after:border after:rounded-full after:h-4 after:w-4 sm:after:h-5 sm:after:w-5 after:transition-all peer-checked:bg-emerald-500 dark:peer-checked:bg-emerald-400"></div>
        </label>
      </div>

      {settings.resize.enabled && (
        <div className="grid grid-cols-2 gap-2 sm:gap-3 animate-in fade-in slide-in-from-top-1">
          <div>
            <label className="block mb-1 text-[10px] sm:text-xs font-bold text-zinc-600 dark:text-zinc-400">Max Width (px)</label>
            <input
              type="number"
              value={settings.resize.maxWidth || ''}
              onChange={(e) => updateResize({ maxWidth: e.target.value ? parseInt(e.target.value) : undefined })}
              placeholder="e.g. 1920"
              disabled={disabled}
              className="w-full px-2 py-1 sm:px-3 sm:py-1.5 text-xs font-semibold border-2 rounded-lg sm:rounded-xl bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 focus:border-emerald-500 focus:outline-none transition-colors shadow-2xs"
            />
          </div>
          <div>
            <label className="block mb-1 text-[10px] sm:text-xs font-bold text-zinc-600 dark:text-zinc-400">Max Height (px)</label>
            <input
              type="number"
              value={settings.resize.maxHeight || ''}
              onChange={(e) => updateResize({ maxHeight: e.target.value ? parseInt(e.target.value) : undefined })}
              placeholder="e.g. 1080"
              disabled={disabled}
              className="w-full px-2 py-1 sm:px-3 sm:py-1.5 text-xs font-semibold border-2 rounded-lg sm:rounded-xl bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 focus:border-emerald-500 focus:outline-none transition-colors shadow-2xs"
            />
          </div>
          <label className="flex items-center gap-1.5 cursor-pointer mt-0.5 col-span-2">
            <input
              type="checkbox"
              checked={settings.resize.keepAspectRatio}
              onChange={(e) => updateResize({ keepAspectRatio: e.target.checked })}
              disabled={disabled}
              className="w-3.5 h-3.5 rounded text-emerald-500 border-zinc-300 focus:ring-emerald-500"
            />
            <span className="text-[11px] sm:text-xs font-semibold text-zinc-700 dark:text-zinc-200">Keep aspect ratio</span>
          </label>
        </div>
      )}
    </div>
  );

  const renderCropControls = () => (
    <div className="flex flex-col gap-2.5 p-3 sm:p-4 bg-white dark:bg-zinc-950 border border-indigo-100 dark:border-[#282d4a] rounded-xl">
      <div className="flex items-center justify-between mb-0.5">
        <div className="flex items-center gap-1.5">
          <div className="p-1 bg-indigo-100 dark:bg-[#1e2338] text-indigo-600 dark:text-indigo-300 rounded-lg">
            <Crop className="w-3.5 h-3.5" />
          </div>
          <h4 className="text-xs sm:text-sm font-bold text-zinc-800 dark:text-zinc-200">Crop Aspect Ratio</h4>
        </div>
        {settings.cropAspectRatio && (
          <button
            type="button"
            onClick={() => updateSettings({ cropAspectRatio: null })}
            disabled={disabled}
            className="text-[10px] sm:text-[11px] font-bold text-indigo-600 dark:text-indigo-300 hover:underline cursor-pointer"
          >
            Clear Crop
          </button>
        )}
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1">
        {[
          { label: '1:1 (Square)', value: { width: 1, height: 1 } },
          { label: '4:3 (Classic)', value: { width: 4, height: 3 } },
          { label: '16:9 (Widescreen)', value: { width: 16, height: 9 } },
          { label: '9:16 (Story)', value: { width: 9, height: 16 } },
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
                "px-1.5 py-1 text-[10px] sm:text-[11px] font-bold rounded-lg border transition-all text-center truncate cursor-pointer",
                isActive
                  ? "bg-indigo-600 text-white border-indigo-600 dark:bg-indigo-500 dark:text-[#202124] dark:border-indigo-400"
                  : "bg-zinc-50 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-200 border-zinc-200 dark:border-zinc-800 hover:border-indigo-400"
              )}
            >
              {preset.label}
            </button>
          );
        })}
      </div>
      
      <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800">
        <label className="block mb-1 text-[10px] sm:text-xs font-bold text-zinc-600 dark:text-zinc-400">
          Custom Ratio (W : H)
        </label>
        <div className="flex items-center gap-1.5">
          <input
            type="number"
            min="1"
            max="1000"
            disabled={disabled}
            value={customCropWidth}
            onChange={(e) => {
              const val = e.target.value;
              setCustomCropWidth(val);
              const w = parseFloat(val);
              const h = parseFloat(customCropHeight);
              if (!isNaN(w) && w > 0 && !isNaN(h) && h > 0) {
                updateSettings({ cropAspectRatio: { width: w, height: h } });
              }
            }}
            className="w-16 sm:w-20 px-2 py-1 sm:px-3 sm:py-1.5 text-xs font-semibold border-2 rounded-lg sm:rounded-xl bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 focus:border-indigo-500 focus:outline-none transition-colors"
          />
          <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400">:</span>
          <input
            type="number"
            min="1"
            max="1000"
            disabled={disabled}
            value={customCropHeight}
            onChange={(e) => {
              const val = e.target.value;
              setCustomCropHeight(val);
              const w = parseFloat(customCropWidth);
              const h = parseFloat(val);
              if (!isNaN(w) && w > 0 && !isNaN(h) && h > 0) {
                updateSettings({ cropAspectRatio: { width: w, height: h } });
              }
            }}
            className="w-16 sm:w-20 px-2 py-1 sm:px-3 sm:py-1.5 text-xs font-semibold border-2 rounded-lg sm:rounded-xl bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 focus:border-indigo-500 focus:outline-none transition-colors"
          />
        </div>
      </div>
    </div>
  );

  const renderDpiControls = () => (
    <div className="flex flex-col gap-2.5 p-3 sm:p-4 bg-white dark:bg-zinc-950 border border-indigo-100 dark:border-[#2d3a4e] rounded-xl">
      <div className="flex items-center justify-between mb-0.5">
        <div className="flex items-center gap-1.5">
          <div className="p-1 bg-indigo-100 dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 rounded-lg">
            <Printer className="w-3.5 h-3.5" />
          </div>
          <h4 className="text-xs sm:text-sm font-bold text-zinc-800 dark:text-zinc-200">Target DPI</h4>
        </div>
        {settings.targetDPI !== null && settings.targetDPI !== undefined && (
          <button
            type="button"
            disabled={disabled}
            onClick={() => updateSettings({ targetDPI: null })}
            className="text-[10px] sm:text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
          >
            Clear DPI
          </button>
        )}
      </div>
      
      <div className="grid grid-cols-3 gap-1">
        {[
          { label: '72 (Web)', value: 72 },
          { label: '150 (Draft)', value: 150 },
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
                "px-1.5 py-1 text-[10px] sm:text-[11px] font-bold rounded-lg border transition-all text-center truncate cursor-pointer",
                isActive
                  ? "bg-indigo-600 text-white border-indigo-600 dark:bg-indigo-500 dark:text-[#202124] dark:border-indigo-400"
                  : "bg-zinc-50 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-200 border-zinc-200 dark:border-zinc-800 hover:border-indigo-400"
              )}
            >
              {preset.label}
            </button>
          );
        })}
      </div>
      
      <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
        <label className="text-[11px] sm:text-xs font-bold text-zinc-600 dark:text-zinc-400">
          Custom DPI
        </label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min="1"
            max="2400"
            disabled={disabled}
            value={customDpiInput}
            onChange={(e) => {
              const val = e.target.value;
              setCustomDpiInput(val);
              const num = parseInt(val, 10);
              if (!isNaN(num) && num > 0) {
                updateSettings({ targetDPI: num });
              }
            }}
            className="w-20 sm:w-24 px-2 py-1 sm:px-3 sm:py-1.5 text-xs font-semibold border-2 rounded-lg sm:rounded-xl bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 focus:border-indigo-500 focus:outline-none transition-colors"
          />
        </div>
      </div>
    </div>
  );

  const renderRotationControls = () => (
    <div className="flex flex-col gap-2.5 p-3 sm:p-4 bg-white dark:bg-zinc-950 border border-amber-100 dark:border-[#3a2818] rounded-xl">
      <div className="flex items-center justify-between mb-0.5">
        <div className="flex items-center gap-1.5">
          <div className="p-1 bg-amber-100 dark:bg-[#3a2818] text-amber-600 dark:text-[#fdd663] rounded-lg">
            <RotateCw className="w-3.5 h-3.5" />
          </div>
          <h4 className="text-xs sm:text-sm font-bold text-zinc-800 dark:text-zinc-200">Batch Rotation</h4>
        </div>
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
              "px-1.5 py-1 text-[10px] sm:text-[11px] font-bold rounded-lg border transition-all text-center cursor-pointer",
              settings.rotation === preset.value || (preset.value === 0 && !settings.rotation)
                ? "bg-amber-500 text-white border-amber-500 dark:bg-[#fdd663] dark:text-[#202124] dark:border-[#fdd663]"
                : "bg-zinc-50 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-200 border-zinc-200 dark:border-zinc-800 hover:border-amber-400"
            )}
          >
            {preset.label}
          </button>
        ))}
      </div>
    </div>
  );

  const renderPrivacyControls = () => (
    <div className="flex flex-col gap-2.5 p-3 sm:p-4 bg-white dark:bg-zinc-950 border border-rose-100 dark:border-[#381e26] rounded-xl">
      <div className="flex items-center justify-between mb-0.5">
        <div className="flex items-center gap-1.5">
          <div className="p-1 bg-rose-100 dark:bg-[#381e26] text-rose-600 dark:text-[#f28b82] rounded-lg">
            <ShieldCheck className="w-3.5 h-3.5" />
          </div>
          <h4 className="text-xs sm:text-sm font-bold text-zinc-800 dark:text-zinc-200">Metadata & Privacy</h4>
        </div>
      </div>
      
      <label className="flex items-start gap-2.5 p-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl cursor-pointer hover:border-rose-300 dark:hover:border-rose-800 transition-colors">
        <input
          type="checkbox"
          checked={settings.stripExif !== false}
          onChange={(e) => updateSettings({ stripExif: e.target.checked })}
          disabled={disabled}
          className="mt-0.5 w-3.5 h-3.5 text-rose-500 rounded border-zinc-300 dark:border-zinc-700 dark:bg-zinc-950 focus:ring-rose-500 cursor-pointer"
        />
        <div>
          <span className="block text-[11px] sm:text-xs font-bold text-zinc-800 dark:text-zinc-200">
            Strip EXIF & Location Data
          </span>
          <span className="block text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5 leading-normal">
            Removes camera metadata, GPS location, and other identifiable info.
          </span>
        </div>
      </label>
    </div>
  );

  // Filter which secondary controls to display based on what is already primary
  const advancedControls = [
    { key: 'resize', render: renderResizeControls, isPrimary: isResizePrimary },
    { key: 'crop', render: renderCropControls, isPrimary: isCropPrimary && !isCompress },
    { key: 'dpi', render: renderDpiControls, isPrimary: isDpiPrimary && !isCompress },
    { key: 'rotation', render: renderRotationControls, isPrimary: isRotationPrimary && !isCompress },
    { key: 'privacy', render: renderPrivacyControls, isPrimary: isPrivacyPrimary || isCompress },
  ];

  const primaryRenderers = advancedControls.filter(c => c.isPrimary);
  const secondaryRenderers = advancedControls.filter(c => !c.isPrimary);

  return (
    <div className="flex flex-col gap-3 sm:gap-4 bg-white dark:bg-zinc-900 p-4 sm:p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs w-full relative z-30">
      
      {/* Segmented Mode Switcher */}
      <div className="flex w-full bg-zinc-100 dark:bg-zinc-800/80 p-1 rounded-xl">
        <button
          type="button"
          onClick={() => handleModeChange('convert')}
          className={cn(
            "flex-1 flex items-center justify-center gap-1.5 py-1.5 sm:py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer",
            mode === 'convert'
              ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs"
              : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
          )}
        >
          <Settings2 className="w-3.5 h-3.5" />
          <span>Convert Format</span>
        </button>
        <button
          type="button"
          onClick={() => handleModeChange('compress')}
          className={cn(
            "flex-1 flex items-center justify-center gap-1.5 py-1.5 sm:py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer",
            mode === 'compress'
              ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs"
              : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
          )}
        >
          <Minimize2 className="w-3.5 h-3.5" />
          <span>Compress Size</span>
        </button>
      </div>

      {/* 1. Primary Task Controls & Main Action */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 w-full">
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full lg:w-auto flex-1">
          {/* Format Selection */}
          {!isLockedFormat && (
            <div className="flex flex-col gap-1 w-full sm:w-auto">
              <label className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                Output Format
              </label>
              <div className="relative inline-block min-w-[150px] w-full sm:w-auto">
                <select
                  disabled={disabled}
                  value={settings.targetFormat}
                  onChange={(e) => onChange({ ...settings, targetFormat: e.target.value as TargetFormat })}
                  className="w-full appearance-none bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-800 dark:hover:bg-zinc-700/80 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white text-xs sm:text-sm font-medium rounded-lg px-3 py-2 pr-8 cursor-pointer focus:outline-none transition-colors"
                  title="Select output format"
                >
                  <option value="auto">Auto — Keep original</option>
                  <option value="webp">WebP (Recommended)</option>
                  <option value="jpg">JPG</option>
                  <option value="png">PNG (Lossless)</option>
                  <option value="avif">AVIF</option>
                  <option value="bmp">BMP</option>
                  <option value="ico">ICO</option>
                  <option value="pdf">PDF</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-zinc-400">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                </div>
              </div>
            </div>
          )}

          {/* Context-aware primary control: Target Size OR Quality */}
          {mode === 'compress' ? (
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full flex-1">
              <div className="flex flex-col gap-1 w-full sm:w-auto">
                <label className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                  Compression Mode
                </label>
                <div className="relative inline-block min-w-[140px] w-full sm:w-auto">
                  <select
                    disabled={disabled}
                    value={settings.targetMaxKB ? 'target' : (localQuality > 0.95 ? 'lossless' : 'quality')}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === 'target') {
                        handleMaxKBChange(localMaxKB || '200');
                      } else if (val === 'lossless') {
                        handleQualityChange(1);
                        onChange({ ...settings, targetMaxKB: undefined, quality: 1 });
                      } else {
                        handleQualityChange(0.8);
                        onChange({ ...settings, targetMaxKB: undefined, quality: 0.8 });
                      }
                    }}
                    className="w-full appearance-none bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-800 dark:hover:bg-zinc-700/80 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white text-xs sm:text-sm font-medium rounded-lg px-3 py-2 pr-8 cursor-pointer focus:outline-none transition-colors"
                  >
                    <option value="quality">Quality Slider</option>
                    <option value="target">Target Max KB</option>
                    <option value="lossless">Lossless</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-zinc-400">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                  </div>
                </div>
              </div>

              {settings.targetMaxKB !== undefined ? (
                <div className="flex flex-col gap-1 flex-1 w-full">
                  <label className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                    Max File Size Limit
                  </label>
                  <div className="flex items-center gap-2 w-full">
                    <input
                      type="number"
                      min="1"
                      placeholder="200"
                      disabled={disabled}
                      value={localMaxKB}
                      onChange={(e) => handleMaxKBChange(e.target.value)}
                      className="w-full sm:w-28 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white text-sm font-medium rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                    <span className="text-xs font-semibold text-zinc-500">KB</span>
                  </div>
                </div>
              ) : (
                (localQuality <= 0.95) && (
                  <div className="flex flex-col gap-1 flex-1 w-full">
                    <label className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                      Quality: {Math.round(localQuality * 100)}%
                    </label>
                    <div className="flex items-center h-[38px] w-full">
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
                        className="w-full h-2 bg-zinc-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                      />
                    </div>
                  </div>
                )
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-1 flex-1 min-w-[150px] w-full sm:w-auto">
              <label className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                Quality: {Math.round(localQuality * 100)}%
              </label>
              <div className="flex items-center h-[38px] w-full">
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
                  className="w-full h-2 bg-zinc-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>
            </div>
          )}
        </div>

        {/* Action Button - Desktop/Tablet */}
        {onConvert && onStop && (
          <div className="hidden md:block shrink-0 w-full lg:w-auto">
            {isProcessing ? (
              <button
                onClick={onStop}
                disabled={isStopping}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors cursor-pointer"
              >
                {isStopping ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Stopping...</>
                ) : (
                  <><Zap className="w-4 h-4" /> Stop</>
                )}
              </button>
            ) : pendingCount === 0 && successCount > 0 && onContinueToDownload ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={onContinueToDownload}
                  className="flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-semibold rounded-xl transition-colors bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer shadow-xs"
                >
                  <Check className="w-4 h-4" />
                  Continue to Download
                </button>
              </div>
            ) : (
              <button
                onClick={onConvert}
                disabled={pendingCount === 0}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-7 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-zinc-300 dark:disabled:bg-zinc-800 disabled:text-zinc-500 rounded-xl transition-colors cursor-pointer disabled:cursor-not-allowed shadow-xs"
              >
                <Zap className="w-4 h-4" />
                {mode === 'compress' ? 'Compress' : (isResizePrimary ? 'Resize' : (isCropPrimary ? 'Crop' : 'Convert'))} {pendingCount} {pendingCount === 1 ? 'Image' : 'Images'}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Primary Dynamic Specific Controls */}
      {primaryRenderers.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
          {primaryRenderers.map(r => (
            <React.Fragment key={r.key}>{r.render()}</React.Fragment>
          ))}
        </div>
      )}

      {/* Presets and Advanced Options Toggle Row */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 pt-2.5 border-t border-zinc-100 dark:border-zinc-800 w-full">
        <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
          {!isLockedFormat && !isCompress && (
            <>
              <button
                disabled={disabled}
                onClick={() => onChange({ ...settings, targetFormat: 'webp', quality: 0.8, targetMaxKB: undefined })}
                className="px-2.5 py-1 text-xs font-medium text-zinc-600 dark:text-zinc-300 bg-zinc-100 hover:bg-zinc-200/70 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded-md transition-colors cursor-pointer disabled:opacity-50"
              >
                WebP Standard
              </button>
              <button
                disabled={disabled}
                onClick={() => onChange({ ...settings, targetFormat: 'jpg', quality: 0.85, targetMaxKB: undefined })}
                className="px-2.5 py-1 text-xs font-medium text-zinc-600 dark:text-zinc-300 bg-zinc-100 hover:bg-zinc-200/70 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded-md transition-colors cursor-pointer disabled:opacity-50"
              >
                JPG Standard
              </button>
              <button
                disabled={disabled}
                onClick={() => onChange({ ...settings, targetFormat: 'webp', quality: 0.6, targetMaxKB: 100 })}
                className="px-2.5 py-1 text-xs font-medium text-zinc-600 dark:text-zinc-300 bg-zinc-100 hover:bg-zinc-200/70 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded-md transition-colors cursor-pointer disabled:opacity-50"
              >
                Max Compression
              </button>
            </>
          )}
        </div>

        {secondaryRenderers.length > 0 && (
          <button
            disabled={disabled}
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center justify-center gap-1.5 cursor-pointer w-full sm:w-auto px-3 py-1 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
            aria-expanded={showAdvanced}
          >
            <Settings2 className="w-3.5 h-3.5" />
            <span>{showAdvanced ? "Hide options" : "More options (Resize, Crop, Metadata)"}</span>
          </button>
        )}
      </div>

      {/* Advanced Collapsible Content */}
      {showAdvanced && secondaryRenderers.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
          {secondaryRenderers.map(r => (
            <React.Fragment key={r.key}>{r.render()}</React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
}

export const GlobalControls = React.memo(GlobalControlsComponent);
