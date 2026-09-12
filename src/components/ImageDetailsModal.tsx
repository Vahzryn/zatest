import React, { useEffect, useState, useRef, useCallback } from 'react';
import { ImageFileItem } from '../types';
import { formatBytes, cn } from '../lib/utils';
import {
  X,
  Info,
  Palette,
  Check,
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCcw,
  SlidersHorizontal,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Maximize,
} from 'lucide-react';

interface ImageDetailsModalProps {
  item: ImageFileItem;
  onClose: () => void;
}

export function ImageDetailsModal({ item, onClose }: ImageDetailsModalProps) {
  const [colors, setColors] = useState<string[]>([]);
  const [copiedColor, setCopiedColor] = useState<string | null>(null);
  const [imgDimensions, setImgDimensions] = useState<{ width: number; height: number } | null>(
    item.dimensions || null
  );

  const [previewUrl, setPreviewUrl] = useState<string>(item.convertedUrl || '');
  const [showInfoPanel, setShowInfoPanel] = useState<boolean>(true);

  // Zoom and Pan state
  const [scale, setScale] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [panStart, setPanStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const containerRef = useRef<HTMLDivElement>(null);
  const touchPinchDistRef = useRef<number | null>(null);
  const touchStartScaleRef = useRef<number>(1);

  // Derive preview URL safely
  useEffect(() => {
    if (item.convertedUrl) {
      setPreviewUrl(item.convertedUrl);
      return;
    }
    const url = URL.createObjectURL(item.file);
    setPreviewUrl(url);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [item.convertedUrl, item.file]);

  // Compute container fit scale helper
  const getFitScale = useCallback(() => {
    if (!containerRef.current || !imgDimensions) return 1;
    const { clientWidth, clientHeight } = containerRef.current;
    if (clientWidth === 0 || clientHeight === 0) return 1;

    // Apply rotation dimensions swap if rotated 90 or 270 deg
    const isRotated = (item.rotation || 0) % 180 !== 0;
    const w = isRotated ? imgDimensions.height : imgDimensions.width;
    const h = isRotated ? imgDimensions.width : imgDimensions.height;

    const pad = 32; // 16px padding on each side
    const scaleX = (clientWidth - pad) / w;
    const scaleY = (clientHeight - pad) / h;
    return Math.min(scaleX, scaleY, 1);
  }, [imgDimensions, item.rotation]);

  // Reset view to Fit to Screen
  const handleFitToScreen = useCallback(() => {
    const fit = getFitScale();
    setScale(fit);
    setPan({ x: 0, y: 0 });
  }, [getFitScale]);

  // Reset view to 100% (1:1 actual pixel size)
  const handleSetActualSize = useCallback(() => {
    setScale(1);
    setPan({ x: 0, y: 0 });
  }, []);

  const handleZoomIn = useCallback(() => {
    setScale((prev) => Math.min(10, prev * 1.25));
  }, []);

  const handleZoomOut = useCallback(() => {
    setScale((prev) => Math.max(0.05, prev / 1.25));
  }, []);

  // Extract color palette & measure natural dimensions
  useEffect(() => {
    const img = new Image();
    img.src = previewUrl;

    img.onload = () => {
      const dimensions = { width: img.naturalWidth, height: img.naturalHeight };
      setImgDimensions(dimensions);

      // Auto-fit on initial load if scale hasn't been set manually
      if (containerRef.current) {
        const isRotated = (item.rotation || 0) % 180 !== 0;
        const w = isRotated ? dimensions.height : dimensions.width;
        const h = isRotated ? dimensions.width : dimensions.height;
        const pad = 32;
        const scaleX = (containerRef.current.clientWidth - pad) / w;
        const scaleY = (containerRef.current.clientHeight - pad) / h;
        const fit = Math.min(scaleX, scaleY, 1);
        setScale(fit);
        setPan({ x: 0, y: 0 });
      }

      // Sample colors on small 24x24 canvas
      const canvas = document.createElement('canvas');
      canvas.width = 24;
      canvas.height = 24;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.drawImage(img, 0, 0, 24, 24);
      const imgData = ctx.getImageData(0, 0, 24, 24).data;

      const colorMap = new Map<string, number>();
      for (let i = 0; i < imgData.length; i += 4) {
        const r = imgData[i];
        const g = imgData[i + 1];
        const b = imgData[i + 2];
        const a = imgData[i + 3];

        if (a < 128) continue; // Skip transparent pixels

        const qr = Math.round(r / 32) * 32;
        const qg = Math.round(g / 32) * 32;
        const qb = Math.round(b / 32) * 32;

        const hex = `#${((1 << 24) + (qr << 16) + (qg << 8) + qb).toString(16).slice(1)}`;
        colorMap.set(hex, (colorMap.get(hex) || 0) + 1);
      }

      const sorted = Array.from(colorMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map((entry) => entry[0]);

      setColors(sorted);
    };
  }, [previewUrl, item.rotation]);

  // Non-passive wheel listener for smooth desktop trackpad/mouse zoom
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.15 : 0.85;
      setScale((prev) => Math.max(0.05, Math.min(10, prev * zoomFactor)));
    };

    container.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      container.removeEventListener('wheel', onWheel);
    };
  }, []);

  // Keyboard accessibility
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      // Ignore zoom hotkeys if user is focusing an input
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        handleZoomIn();
      } else if (e.key === '-' || e.key === '_') {
        e.preventDefault();
        handleZoomOut();
      } else if (e.key === '0') {
        e.preventDefault();
        handleFitToScreen();
      } else if (e.key === '1') {
        e.preventDefault();
        handleSetActualSize();
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        handleFitToScreen();
      } else if (e.key === 'ArrowLeft') {
        setPan((p) => ({ ...p, x: p.x + 30 }));
      } else if (e.key === 'ArrowRight') {
        setPan((p) => ({ ...p, x: p.x - 30 }));
      } else if (e.key === 'ArrowUp') {
        setPan((p) => ({ ...p, y: p.y + 30 }));
      } else if (e.key === 'ArrowDown') {
        setPan((p) => ({ ...p, y: p.y - 30 }));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, handleZoomIn, handleZoomOut, handleFitToScreen, handleSetActualSize]);

  // Mouse pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only left click
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setPanStart({ ...pan });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    setPan({
      x: panStart.x + dx,
      y: panStart.y + dy,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch pan & pinch-to-zoom handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
      setPanStart({ ...pan });
      touchPinchDistRef.current = null;
    } else if (e.touches.length === 2) {
      setIsDragging(false);
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      touchPinchDistRef.current = dist;
      touchStartScaleRef.current = scale;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && isDragging) {
      const dx = e.touches[0].clientX - dragStart.x;
      const dy = e.touches[0].clientY - dragStart.y;
      setPan({
        x: panStart.x + dx,
        y: panStart.y + dy,
      });
    } else if (e.touches.length === 2 && touchPinchDistRef.current !== null) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      const factor = dist / touchPinchDistRef.current;
      setScale(Math.max(0.05, Math.min(10, touchStartScaleRef.current * factor)));
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    touchPinchDistRef.current = null;
  };

  // Double click toggle between Fit and 100% / zoomed view
  const handleDoubleClick = () => {
    const fitScale = getFitScale();
    if (Math.abs(scale - fitScale) < 0.02) {
      setScale(1); // 100% natural pixel size
    } else {
      handleFitToScreen();
    }
  };

  const copyToClipboard = (hex: string) => {
    navigator.clipboard.writeText(hex);
    setCopiedColor(hex);
    setTimeout(() => setCopiedColor(null), 2000);
  };

  const calculateAspectRatio = (w: number, h: number) => {
    const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
    const divisor = gcd(w, h);
    const rw = w / divisor;
    const rh = h / divisor;
    if (rw > 20 || rh > 20) {
      return (w / h).toFixed(2) + ':1';
    }
    return `${rw}:${rh}`;
  };

  const zoomPercent = Math.round(scale * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative flex flex-col w-full max-w-6xl h-[95vh] max-h-[920px] bg-white dark:bg-zinc-950 rounded-2xl sm:rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        
        {/* Header with Title + Interactive Zoom Controls */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-3 sm:px-6 py-2 sm:py-3 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/90 dark:bg-[#28292c]/90 backdrop-blur-md z-10 shrink-0">
          
          {/* File Title Info */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 max-w-xs sm:max-w-md">
            <div className="p-1.5 sm:p-2 bg-indigo-50 dark:bg-[#21243a] text-indigo-600 dark:text-indigo-300 rounded-lg sm:rounded-xl shrink-0">
              <Info className="w-4.5 h-4.5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-lg font-bold text-zinc-900 dark:text-zinc-200 truncate">
                {item.file.name}
              </h3>
              <p className="text-[10px] sm:text-xs text-zinc-500 dark:text-zinc-400 truncate">
                {imgDimensions ? `${imgDimensions.width} × ${imgDimensions.height} px` : 'Loading specs...'} • {formatBytes(item.originalSize)}
              </p>
            </div>
          </div>
 
          {/* Zoom & Viewport Controls Toolbar */}
          <div className="flex items-center gap-1 sm:gap-1.5 bg-zinc-200/60 dark:bg-zinc-800/60 p-0.5 sm:p-1 rounded-xl sm:rounded-2xl border border-zinc-300/50 dark:border-zinc-700/50">
            
            <button
              onClick={handleZoomOut}
              className="p-1 sm:p-1.5 text-zinc-700 dark:text-zinc-200 hover:bg-white dark:hover:bg-[#202124] rounded-lg sm:rounded-xl transition-all active:scale-95 cursor-pointer"
              title="Zoom Out (-)"
              aria-label="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
 
            <span className="px-1.5 text-[10px] sm:text-xs font-mono font-bold text-zinc-800 dark:text-zinc-200 min-w-[2.25rem] sm:min-w-[3.25rem] text-center">
              {zoomPercent}%
            </span>
 
            <button
              onClick={handleZoomIn}
              className="p-1 sm:p-1.5 text-zinc-700 dark:text-zinc-200 hover:bg-white dark:hover:bg-[#202124] rounded-lg sm:rounded-xl transition-all active:scale-95 cursor-pointer"
              title="Zoom In (+)"
              aria-label="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
 
            <div className="w-px h-3 bg-zinc-300 dark:bg-zinc-700 mx-0.5" />
 
            <button
              onClick={handleFitToScreen}
              className="px-1.5 py-0.5 sm:px-2.5 sm:py-1 text-[10px] sm:text-xs font-bold text-zinc-700 dark:text-zinc-200 hover:bg-white dark:hover:bg-[#202124] rounded-lg sm:rounded-xl transition-all cursor-pointer flex items-center gap-0.5"
              title="Fit to Screen (0)"
              aria-label="Fit to Screen"
            >
              <Maximize className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span className="hidden sm:inline">Fit</span>
            </button>
 
            <button
              onClick={handleSetActualSize}
              className="px-1.5 py-0.5 sm:px-2.5 sm:py-1 text-[10px] sm:text-xs font-bold text-zinc-700 dark:text-zinc-200 hover:bg-white dark:hover:bg-[#202124] rounded-lg sm:rounded-xl transition-all cursor-pointer flex items-center gap-0.5"
              title="100% Actual Size (1)"
              aria-label="100% Actual Size"
            >
              <span>100%</span>
            </button>
 
            <button
              onClick={handleFitToScreen}
              className="p-1 sm:p-1.5 text-zinc-700 dark:text-zinc-200 hover:bg-white dark:hover:bg-[#202124] rounded-lg sm:rounded-xl transition-all active:scale-95 cursor-pointer"
              title="Reset View (R)"
              aria-label="Reset View"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
 
          {/* Action Buttons: Toggle Spec Panel & Close */}
          <div className="flex items-center gap-1 sm:gap-1.5">
            <button
              onClick={() => setShowInfoPanel((prev) => !prev)}
              className={cn(
                'p-1.5 sm:p-2 rounded-lg sm:rounded-xl transition-all cursor-pointer flex items-center gap-1 text-[11px] sm:text-xs font-bold border',
                showInfoPanel
                  ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800'
                  : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-200 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100'
              )}
              title="Toggle Details & Palette"
              aria-label="Toggle Details & Palette"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden md:inline">Details</span>
            </button>
 
            <button
              onClick={onClose}
              className="p-1.5 transition-all text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-full cursor-pointer"
              title="Close Inspector (Esc)"
              aria-label="Close Inspector"
              autoFocus
            >
              <X className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>
 
        {/* Main Content Area */}
        <div className="relative flex-1 flex flex-col lg:flex-row overflow-hidden bg-zinc-950">
          
          {/* Zoomable / Pannable Image Viewport Container */}
          <div
            ref={containerRef}
            className={cn(
              'relative flex-1 h-full w-full overflow-hidden flex items-center justify-center select-none touch-none',
              isDragging ? 'cursor-grabbing' : 'cursor-grab'
            )}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onDoubleClick={handleDoubleClick}
          >
            {/* Visual Grid Background Pattern for Alpha/Transparency */}
            <div
              className="absolute inset-0 pointer-events-none opacity-20 dark:opacity-10"
              style={{
                backgroundImage:
                  'radial-gradient(circle, #ffffff 1px, transparent 1px)',
                backgroundSize: '16px 16px',
              }}
            />
 
            <img
              src={previewUrl}
              alt="Inspection Preview"
              loading="lazy"
              decoding="async"
              referrerPolicy="no-referrer"
              className="max-w-none pointer-events-none select-none transition-transform duration-75 ease-out"
              style={{
                transform: `translate3d(${pan.x}px, ${pan.y}px, 0px) scale(${scale}) rotate(${item.rotation || 0}deg)`,
                transformOrigin: 'center center',
              }}
            />
 
            {/* Viewport Overlay Hints */}
            <div className="absolute bottom-3 left-3 z-10 px-3 py-1.5 bg-black/60 backdrop-blur-md text-white/80 text-[11px] font-medium rounded-xl pointer-events-none hidden sm:flex items-center gap-2 border border-white/10">
              <span>Scroll to Zoom</span>
              <span>•</span>
              <span>Drag to Pan</span>
              <span>•</span>
              <span>Double-click to Toggle 100%/Fit</span>
            </div>
          </div>
 
          {/* Details & Palette Side Drawer Panel */}
          {showInfoPanel && (
            <div className="w-full lg:w-80 border-t lg:border-t-0 lg:border-l border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4 sm:p-5 space-y-4 sm:space-y-5 overflow-y-auto shrink-0 max-h-[35vh] lg:max-h-none">
              
              <div className="flex items-center justify-between">
                <h4 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-200 flex items-center gap-2">
                  <Info className="w-4 h-4 text-indigo-600 dark:text-indigo-300" />
                  Technical Specifications
                </h4>
                <button
                  onClick={() => setShowInfoPanel(false)}
                  className="lg:hidden p-1 text-zinc-400 hover:text-zinc-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
 
              {/* Specs Grid */}
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl sm:rounded-2xl">
                  <span className="block text-[9px] font-bold text-zinc-400 dark:text-zinc-400 uppercase tracking-wider">File Size</span>
                  <span className="text-[11px] sm:text-xs font-black text-zinc-800 dark:text-zinc-200 mt-0.5 block">
                    {formatBytes(item.originalSize)}
                  </span>
                </div>
 
                <div className="p-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl sm:rounded-2xl">
                  <span className="block text-[9px] font-bold text-zinc-400 dark:text-zinc-400 uppercase tracking-wider">Dimensions</span>
                  <span className="text-[11px] sm:text-xs font-black text-zinc-800 dark:text-zinc-200 mt-0.5 block">
                    {imgDimensions ? `${imgDimensions.width} × ${imgDimensions.height}` : 'Loading...'}
                  </span>
                </div>
 
                <div className="p-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl sm:rounded-2xl">
                  <span className="block text-[9px] font-bold text-zinc-400 dark:text-zinc-400 uppercase tracking-wider">Aspect Ratio</span>
                  <span className="text-[11px] sm:text-xs font-black text-indigo-600 dark:text-indigo-400 mt-0.5 block">
                    {imgDimensions ? calculateAspectRatio(imgDimensions.width, imgDimensions.height) : '-'}
                  </span>
                </div>
 
                <div className="p-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl sm:rounded-2xl">
                  <span className="block text-[9px] font-bold text-zinc-400 dark:text-zinc-400 uppercase tracking-wider">MIME Type</span>
                  <span className="text-[11px] sm:text-xs font-black text-zinc-800 dark:text-zinc-200 mt-0.5 block uppercase truncate">
                    {item.file.type.replace('image/', '') || 'UNKNOWN'}
                  </span>
                </div>
              </div>
 
              {/* Converted Stats if available */}
              {item.convertedSize ? (
                <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl sm:rounded-2xl flex items-center justify-between">
                  <div>
                    <span className="block text-[9px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">Converted Size</span>
                    <span className="text-xs sm:text-sm font-black text-emerald-800 dark:text-emerald-300 mt-0.5 block">
                      {formatBytes(item.convertedSize)}
                    </span>
                  </div>
                  <span className="px-2 py-0.5 bg-emerald-600 text-white text-[10px] font-bold rounded-lg">
                    {Math.round(((item.originalSize - item.convertedSize) / item.originalSize) * 100)}% Saved
                  </span>
                </div>
              ) : null}
 
              {/* Color Palette Section */}
              <div className="p-3 sm:p-4 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl sm:rounded-2xl">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1">
                    <Palette className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-300" />
                    <h4 className="text-[11px] sm:text-xs font-bold text-zinc-800 dark:text-zinc-200">Extracted Palette</h4>
                  </div>
                  <span className="text-[9px] font-medium text-zinc-400">Click color</span>
                </div>
 
                {colors.length > 0 ? (
                  <div className="grid grid-cols-3 gap-1.5">
                    {colors.map((hex) => (
                      <button
                        key={hex}
                        onClick={() => copyToClipboard(hex)}
                        className="flex flex-col items-center p-1 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 hover:border-indigo-500 transition-all group cursor-pointer"
                      >
                        <div
                          className="w-full h-6 rounded shadow-inner mb-0.5 border border-black/10"
                          style={{ backgroundColor: hex }}
                        />
                        <span className="text-[9px] font-mono font-bold text-zinc-700 dark:text-zinc-200 group-hover:text-indigo-600 flex items-center gap-0.5">
                          {copiedColor === hex ? (
                            <>
                              <Check className="w-2.5 h-2.5 text-emerald-500" />
                              <span className="text-[8px]">Copied</span>
                            </>
                          ) : (
                            hex
                          )}
                        </span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-[10px] text-zinc-400 italic">Analyzing palette...</p>
                )}
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
}
