import React, { useState, useRef, useCallback } from 'react';
import { SeoRouteData } from '../lib/seoEngine';
import { Breadcrumbs } from './Breadcrumbs';
import { SeoGuideContent } from './Converter/SeoGuideContent';
import { 
  FileImage, Upload, Download, ShieldCheck, Zap, AlertTriangle, 
  Loader2, CheckCircle2, RefreshCw, Layers, Crop 
} from 'lucide-react';
import { formatBytes } from '../lib/utils';

interface SvgToPngPageProps {
  seoData: SeoRouteData;
  onNavigate: (path: string) => void;
}

interface SvgItem {
  id: string;
  file: File;
  name: string;
  svgText: string;
  originalWidth: number;
  originalHeight: number;
}

export function SvgToPngPage({ seoData, onNavigate }: SvgToPngPageProps) {
  const [item, setItem] = useState<SvgItem | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successResult, setSuccessResult] = useState<{ url: string; size: number; width: number; height: number } | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [targetScale, setTargetScale] = useState<number>(1);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleFilesAdded = async (files: FileList | File[]) => {
    setErrorMessage(null);
    setSuccessResult(null);
    setItem(null);
    setTargetScale(1);
    
    const file = Array.from(files).find(f => f.type === 'image/svg+xml' || f.name.toLowerCase().endsWith('.svg'));
    
    if (!file) {
      setErrorMessage('Please upload a valid SVG file.');
      return;
    }

    try {
      const text = await file.text();
      
      // Parse SVG to get native dimensions
      const parser = new DOMParser();
      const doc = parser.parseFromString(text, 'image/svg+xml');
      const svgEl = doc.documentElement;
      
      let width = parseFloat(svgEl.getAttribute('width') || '0');
      let height = parseFloat(svgEl.getAttribute('height') || '0');
      
      // Fallback to viewBox if width/height missing
      if (!width || !height) {
        const viewBox = svgEl.getAttribute('viewBox');
        if (viewBox) {
          const parts = viewBox.split(/\s+/).map(parseFloat);
          if (parts.length === 4) {
            width = parts[2];
            height = parts[3];
          }
        }
      }
      
      // Ultimate fallback
      if (!width || !height) {
        width = 800;
        height = 600;
      }

      setItem({
        id: Math.random().toString(36).substring(7),
        file,
        name: file.name,
        svgText: text,
        originalWidth: Math.round(width),
        originalHeight: Math.round(height)
      });
    } catch (err: any) {
      setErrorMessage('Failed to read the SVG file. It may be corrupted.');
    }
  };

  const handleConvert = async () => {
    if (!item || !canvasRef.current) return;
    setIsProcessing(true);
    setErrorMessage(null);

    try {
      // Create a Blob URL for the SVG to load into an Image
      const svgBlob = new Blob([item.svgText], { type: 'image/svg+xml;charset=utf-8' });
      const DOMURL = window.URL || window.webkitURL || window;
      const url = DOMURL.createObjectURL(svgBlob);
      
      const img = new Image();
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = () => reject(new Error('Failed to parse SVG graphics.'));
        img.src = url;
      });
      
      const targetWidth = Math.round(item.originalWidth * targetScale);
      const targetHeight = Math.round(item.originalHeight * targetScale);

      const canvas = canvasRef.current;
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not create canvas context');
      
      // Ensure transparent background (clearing just in case)
      ctx.clearRect(0, 0, targetWidth, targetHeight);
      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
      
      DOMURL.revokeObjectURL(url);
      
      // Export as PNG
      const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'));
      if (!blob) throw new Error('Failed to encode PNG data.');
      
      const resultUrl = URL.createObjectURL(blob);
      setSuccessResult({ 
        url: resultUrl, 
        size: blob.size,
        width: targetWidth,
        height: targetHeight
      });
      
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred during conversion.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Clean up object URLs on unmount
  React.useEffect(() => {
    return () => {
      if (successResult) URL.revokeObjectURL(successResult.url);
    };
  }, [successResult]);

  return (
    <div className="max-w-5xl mx-auto px-2 sm:px-4 py-2 sm:py-4 space-y-8">
      {/* Screen Reader Announcement */}
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {successResult 
          ? `PNG rendering complete. ${successResult.width} by ${successResult.height} pixels, ${formatBytes(successResult.size)} ready for download.` 
          : ''}
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-xl overflow-hidden p-6 sm:p-8 space-y-6">
        <canvas ref={canvasRef} className="hidden" />
        
        <div 
          className={`relative border-2 border-dashed rounded-2xl p-8 transition-smooth flex flex-col items-center justify-center gap-3 ${
            dragActive 
              ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/20' 
              : 'border-zinc-300 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
          }`}
          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragActive(false);
            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
              handleFilesAdded(e.dataTransfer.files);
            }
          }}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-2">
            <Upload className="w-6 h-6" />
          </div>
          <div className="text-center cursor-pointer space-y-1">
            <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
              Drag & drop an SVG file here, or <span className="text-indigo-600 dark:text-indigo-400 underline">browse</span>
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Preserves transparency. Scaled losslessly in browser memory.
            </p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".svg,image/svg+xml"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                handleFilesAdded(e.target.files);
                e.target.value = '';
              }
            }}
          />
        </div>

        {errorMessage && (
          <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 flex items-center gap-3 text-red-700 dark:text-red-300 text-xs sm:text-sm">
            <AlertTriangle className="w-5 h-5 shrink-0 text-red-500" />
            <span>{errorMessage}</span>
          </div>
        )}

        {item && !successResult && (
          <div className="space-y-6">
            <div className="p-4 sm:p-5 rounded-2xl bg-zinc-50 dark:bg-[#25282c] border border-zinc-200 dark:border-zinc-700/80 flex flex-col gap-4">
              <div className="flex items-center gap-4 border-b border-zinc-200 dark:border-zinc-700/50 pb-4">
                <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                  <FileImage className="w-6 h-6" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-zinc-900 dark:text-white truncate">
                    {item.name}
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                    Native size: {item.originalWidth} × {item.originalHeight} px • {formatBytes(item.file.size)}
                  </p>
                </div>
              </div>
              
              <div className="space-y-3 pt-1">
                <label className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
                  <Crop className="w-4 h-4 text-zinc-500" /> PNG Output Scale
                </label>
                <div className="flex flex-wrap gap-2">
                  {[0.5, 1, 2, 4, 8].map(scale => (
                    <button
                      key={scale}
                      onClick={() => setTargetScale(scale)}
                      className={`px-4 py-2 text-xs font-bold rounded-lg border transition-smooth cursor-pointer ${
                        targetScale === scale
                          ? 'bg-indigo-100 border-indigo-300 text-indigo-700 dark:bg-indigo-950/60 dark:border-indigo-700 dark:text-indigo-300'
                          : 'bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50 dark:bg-zinc-900 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800'
                      }`}
                    >
                      {scale}x ({Math.round(item.originalWidth * scale)} × {Math.round(item.originalHeight * scale)})
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>Local Privacy — Processed entirely in browser memory</span>
              </div>
              
              <button
                disabled={isProcessing}
                onClick={handleConvert}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-sm shadow-sm transition-smooth flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Rendering PNG...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    <span>Generate PNG</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {successResult && item && (
          <div className="flex flex-col items-center gap-6 py-4 max-w-lg mx-auto text-center animate-subtle-in">
            <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-xs">
              <CheckCircle2 className="w-8 h-8 stroke-[2.5]" />
            </div>

            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white">
                PNG Rendered Successfully
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">{successResult.width} × {successResult.height} px</span> • <span className="font-mono text-zinc-700 dark:text-zinc-300">{formatBytes(successResult.size)}</span>
              </p>
            </div>

            <div className="w-full space-y-3 pt-2">
              <a
                href={successResult.url}
                download={item.name.replace(/\.svg$/i, '.png')}
                className="w-full flex items-center justify-center gap-2.5 py-3.5 px-6 text-sm sm:text-base font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] rounded-2xl shadow-sm transition-smooth cursor-pointer"
                id="btn-download-svg-png"
              >
                <Download className="w-5 h-5" />
                <span>Download PNG Image</span>
              </a>

              <div className="flex items-center justify-center gap-4 pt-1">
                <button
                  onClick={() => {
                    setSuccessResult(null);
                    setItem(null);
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Convert Another SVG</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <SeoGuideContent seoData={seoData} onNavigate={onNavigate} />
    </div>
  );
}
