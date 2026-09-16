import React, { useState, useEffect } from 'react';
import { UploadCloud, CheckCircle, AlertCircle, ExternalLink, Loader2, Download, Settings, Shield } from 'lucide-react';
import { convertSingleImage } from '../../lib/conversionOrchestrator';
import { isSupportedImageFile } from '../../lib/utils';
import { ConversionSettings, TargetFormat } from '../../types';

export default function EmbedWidget() {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ blob: Blob; originalSize: number; name: string; width?: number; height?: number } | null>(null);
  const [progress, setProgress] = useState(0);

  // Parse URL query parameters immediately on initial mount
  const [targetFormat, setTargetFormat] = useState<TargetFormat>(() => {
    if (typeof window !== 'undefined') {
      const query = window.location.search || (window.location.hash.includes('?') ? window.location.hash.split('?')[1] : '');
      const params = new URLSearchParams(query);
      const fmt = params.get('format')?.toLowerCase();
      if (fmt === 'jpeg' || fmt === 'jpg') return 'jpg';
      if (fmt === 'png') return 'png';
      if (fmt === 'webp') return 'webp';
      if (fmt === 'avif') return 'avif';
    }
    return 'webp';
  });

  const [quality, setQuality] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const query = window.location.search || (window.location.hash.includes('?') ? window.location.hash.split('?')[1] : '');
      const params = new URLSearchParams(query);
      const q = parseInt(params.get('quality') || '', 10);
      if (!isNaN(q) && q >= 10 && q <= 100) return q;
    }
    return 80;
  });

  const [showSettings, setShowSettings] = useState(false);

  // Manage object URL lifecycle cleanly
  const downloadUrl = React.useMemo(() => {
    if (result?.blob) {
      return URL.createObjectURL(result.blob);
    }
    return '';
  }, [result?.blob]);

  useEffect(() => {
    return () => {
      if (downloadUrl) {
        URL.revokeObjectURL(downloadUrl);
      }
    };
  }, [downloadUrl]);

  useEffect(() => {
    // Apply noindex tag to iframe host
    let meta = document.querySelector('meta[name="robots"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'robots');
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', 'noindex, nofollow');
    document.title = 'Zapixal Client-Side Image Processor Widget';
  }, []);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelection(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelection = async (selectedFile: File) => {
    if (!isSupportedImageFile(selectedFile) && !selectedFile.name.toLowerCase().match(/\.(tif|tiff)$/)) {
      setError('Unsupported file type. Please upload a JPEG, PNG, WebP, HEIC, HEIF, AVIF, TIFF, or BMP image.');
      return;
    }
    
    // Check reasonable size safety limit (50MB)
    if (selectedFile.size > 50 * 1024 * 1024) {
      setError('File size exceeds 50MB. Please use the full Zapixal app for large files.');
      return;
    }

    setFile(selectedFile);
    setError(null);
    setResult(null);
    setIsProcessing(true);
    setProgress(20);

    const settings: ConversionSettings = {
      targetFormat,
      quality: quality / 100,
      resize: { enabled: false, keepAspectRatio: true },
      stripExif: true,
      grayscale: false,
      filenamePrefix: '',
      filenameSuffix: '',
    };

    try {
      setProgress(45);
      const fileId = Math.random().toString(36).substring(7);
      
      const processed = await convertSingleImage({
        id: fileId,
        file: selectedFile,
        originalSize: selectedFile.size,
        status: 'pending',
        progress: 45,
      }, settings);

      setProgress(95);

      let outExtension = targetFormat === 'jpg' ? 'jpg' : targetFormat;
      let outName = selectedFile.name;
      const lastDot = outName.lastIndexOf('.');
      if (lastDot > 0) outName = outName.substring(0, lastDot);
      outName = `${outName}.${outExtension}`;

      // Get image dimensions for confirmation
      let width: number | undefined;
      let height: number | undefined;
      try {
        const img = new Image();
        const url = URL.createObjectURL(selectedFile);
        await new Promise((res) => {
          img.onload = () => {
            width = img.width;
            height = img.height;
            URL.revokeObjectURL(url);
            res(true);
          };
          img.onerror = () => res(false);
          img.src = url;
        });
      } catch {
        // Dimension reading failure is non-fatal
      }

      setResult({
        blob: processed.blob,
        originalSize: selectedFile.size,
        name: outName,
        width,
        height
      });
      setProgress(100);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'In-browser processing failed. Please try another image.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-transparent p-2 sm:p-3 flex flex-col justify-center items-center font-sans text-zinc-900 dark:text-white box-border overflow-x-hidden" style={{ background: 'transparent' }}>
      <style>{`
        body { background: transparent !important; }
      `}</style>
      
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm flex flex-col overflow-hidden max-w-[420px] mx-auto w-full box-border min-w-0 transition-all">
        {/* Widget Header */}
        <div className="px-3 sm:px-3.5 py-2.5 sm:py-3 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center bg-zinc-50/80 dark:bg-zinc-800/50 backdrop-blur-sm min-w-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <div className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse shrink-0" />
            <h3 className="font-bold text-xs uppercase tracking-wider text-zinc-800 dark:text-zinc-200 truncate">
              Zapixal Embed
            </h3>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-200/70 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 font-mono shrink-0">
              WASM
            </span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => setShowSettings(!showSettings)}
              aria-label="Toggle conversion settings"
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                showSettings 
                  ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400' 
                  : 'text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-700'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
            </button>
            <a 
              href="https://zapixal.com" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5 ml-0.5 px-1.5 py-0.5 rounded hover:bg-indigo-50 dark:hover:bg-indigo-950/40"
              title="Open full Zapixal application"
            >
              <span className="hidden min-[330px]:inline">Full App</span> <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* Quick Settings Drawer */}
        {showSettings && (
          <div className="p-3 bg-zinc-50 dark:bg-zinc-800/80 border-b border-zinc-200 dark:border-zinc-700 text-xs space-y-2.5 animate-subtle-in min-w-0">
            <div className="flex justify-between items-center gap-2">
              <label className="font-semibold text-zinc-600 dark:text-zinc-300 text-[11px] shrink-0">Target Format:</label>
              <select
                value={targetFormat}
                onChange={(e) => setTargetFormat(e.target.value as TargetFormat)}
                className="bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-600 rounded-lg px-2 py-1 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500 min-w-0"
              >
                <option value="webp">WebP (Smallest)</option>
                <option value="jpg">JPEG (Universal)</option>
                <option value="png">PNG (Lossless)</option>
                <option value="avif">AVIF (Next-Gen)</option>
              </select>
            </div>
            {targetFormat !== 'png' && (
              <div className="space-y-1">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="font-semibold text-zinc-600 dark:text-zinc-300">Quality:</span>
                  <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{quality}%</span>
                </div>
                <input
                  type="range"
                  min="30"
                  max="100"
                  value={quality}
                  onChange={(e) => setQuality(parseInt(e.target.value, 10))}
                  className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-lg accent-indigo-600 cursor-pointer"
                />
              </div>
            )}
          </div>
        )}

        {/* Main Interactive Zone */}
        <div className="p-3 sm:p-4 flex-1 flex flex-col justify-center min-w-0">
          {!file && !isProcessing && !result && (
            <label
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              tabIndex={0}
              role="button"
              aria-label="Upload or drag image file"
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  document.getElementById('zapixal-widget-input')?.click();
                }
              }}
              className="group flex flex-col items-center justify-center p-5 sm:p-6 border-2 border-dashed border-zinc-200 dark:border-zinc-700/80 rounded-2xl hover:border-indigo-500 dark:hover:border-indigo-400 hover:bg-indigo-50/30 dark:hover:bg-indigo-950/20 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer transition-smooth text-center min-w-0"
            >
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-2 group-hover:scale-105 transition-smooth shrink-0">
                <UploadCloud className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <span className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-white mb-0.5">
                Drop image to compress
              </span>
              <span className="text-[10px] sm:text-[11px] text-zinc-500 font-medium px-1 leading-tight">
                Supports JPEG, PNG, WebP, HEIC/HEIF, AVIF
              </span>
              <input 
                id="zapixal-widget-input"
                type="file" 
                className="hidden" 
                accept="image/*,.heic,.heif,image/heic,image/heif,image/heic-sequence,image/heif-sequence,.tif,.tiff,.bmp"
                onChange={(e) => e.target.files && e.target.files[0] && handleFileSelection(e.target.files[0])}
              />
            </label>
          )}

          {isProcessing && (
            <div className="flex flex-col items-center justify-center py-6 text-center animate-subtle-in min-w-0" role="status" aria-live="polite">
              <Loader2 className="w-8 h-8 text-indigo-600 dark:text-indigo-400 animate-spin mb-2" />
              <div className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-white">Compressing Locally...</div>
              <div className="text-[10px] sm:text-[11px] text-zinc-500 mt-0.5">WebAssembly RAM buffer processing</div>
              <div className="w-full max-w-xs bg-zinc-100 dark:bg-zinc-800 h-1.5 rounded-full mt-3.5 overflow-hidden">
                <div 
                  className="bg-indigo-600 h-full transition-all duration-300 ease-out"
                  style={{ width: `${Math.max(20, progress)}%` }}
                />
              </div>
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center justify-center py-4 text-center animate-subtle-in min-w-0">
              <AlertCircle className="w-8 h-8 text-red-500 mb-2" />
              <div className="text-xs sm:text-sm font-bold text-red-600 dark:text-red-400 mb-1">Processing Error</div>
              <div className="text-[11px] text-zinc-600 dark:text-zinc-400 mb-3 px-2 leading-relaxed">{error}</div>
              <button 
                type="button"
                onClick={() => { setFile(null); setError(null); }}
                className="text-xs px-3.5 py-1.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl font-bold transition-smooth cursor-pointer"
              >
                Try Another File
              </button>
            </div>
          )}

          {result && !isProcessing && (
            <div className="flex flex-col items-center justify-center py-1 text-center animate-subtle-in min-w-0">
              <div className="w-9 h-9 sm:w-10 sm:h-10 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mb-1.5 border border-emerald-200 dark:border-emerald-800/40 shrink-0">
                <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="text-xs sm:text-sm font-bold truncate w-full px-2 mb-0.5 text-zinc-900 dark:text-white" title={result.name}>
                {result.name}
              </div>
              {result.width && result.height && (
                <div className="text-[10px] text-zinc-500 font-mono mb-2">{result.width} × {result.height} px</div>
              )}

              <div className="grid grid-cols-3 gap-1.5 w-full mb-3 bg-zinc-50 dark:bg-zinc-800/60 p-2 sm:p-2.5 rounded-xl text-[10px] sm:text-[11px] border border-zinc-200/70 dark:border-zinc-700/50">
                <div className="min-w-0">
                  <span className="block text-[9px] uppercase text-zinc-400 font-bold truncate">Original</span>
                  <span className="font-mono text-zinc-500 truncate block">{(result.originalSize / 1024).toFixed(1)} KB</span>
                </div>
                <div className="min-w-0">
                  <span className="block text-[9px] uppercase text-zinc-400 font-bold truncate">Result</span>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 truncate block">{(result.blob.size / 1024).toFixed(1)} KB</span>
                </div>
                <div className="min-w-0">
                  <span className="block text-[9px] uppercase text-zinc-400 font-bold truncate">Saved</span>
                  <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 truncate block">
                    {Math.max(0, ((1 - (result.blob.size / result.originalSize)) * 100)).toFixed(0)}%
                  </span>
                </div>
              </div>

              <div className="flex gap-2 w-full">
                <button 
                  type="button"
                  onClick={() => { setFile(null); setResult(null); }}
                  className="flex-1 py-2 text-xs font-bold bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 rounded-xl transition-smooth cursor-pointer"
                >
                  New File
                </button>
                <a
                  href={downloadUrl}
                  download={result.name}
                  className="flex-[1.5] flex items-center justify-center gap-1.5 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-smooth shadow-xs cursor-pointer active:scale-95"
                >
                  <Download className="w-3.5 h-3.5" /> Download
                </a>
              </div>

              {/* Clean, subtle one-line guidance for batch processing */}
              <p className="mt-2.5 text-[11px] text-zinc-500 dark:text-zinc-400 text-center">
                Need batch processing?{' '}
                <a
                  href="https://zapixal.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  Visit Zapixal &rarr;
                </a>
              </p>
            </div>
          )}
        </div>
        
        {/* Attribution & Trust Footer */}
        <div className="px-3 py-2 bg-zinc-50/90 dark:bg-zinc-800/90 border-t border-zinc-100 dark:border-zinc-800 text-[10px] text-center text-zinc-500 flex items-center justify-center gap-1">
          <Shield className="w-3 h-3 text-emerald-500" />
          <span>100% Client-Side Private • <a href="https://zapixal.com" target="_blank" rel="noopener noreferrer" className="font-bold underline hover:text-zinc-700 dark:hover:text-zinc-300">Zapixal</a></span>
        </div>
      </div>
    </div>
  );
}


