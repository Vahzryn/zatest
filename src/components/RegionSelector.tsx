import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ImageFileItem } from '../types';
import {
  X,
  Trash2,
  Eye,
  ShieldAlert,
  Sparkles,
  Paintbrush,
  Check,
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCcw,
  Hand,
  Square,
  Maximize,
} from 'lucide-react';
import { cn } from '../lib/utils';

interface RegionSelectorProps {
  item: ImageFileItem;
  onClose: () => void;
  onSave: (
    id: string,
    regions: Array<{ x: number; y: number; width: number; height: number }> | undefined,
    mode: 'blur' | 'pixelate' | undefined
  ) => void;
}

export const RegionSelector: React.FC<RegionSelectorProps> = ({
  item,
  onClose,
  onSave,
}) => {
  const [regions, setRegions] = useState<Array<{ x: number; y: number; width: number; height: number }>>(
    item.blurRegions || []
  );
  const [blurMode, setBlurMode] = useState<'blur' | 'pixelate'>(item.blurMode || 'blur');
  const [interactMode, setInteractMode] = useState<'draw' | 'pan'>('draw');

  // Zoom and Pan states
  const [scale, setScale] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [panStart, setPanStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  
  // Drawing state
  const [drawStartRel, setDrawStartRel] = useState<{ x: number; y: number } | null>(null);
  const [currentDrag, setCurrentDrag] = useState<{ x: number; y: number; width: number; height: number } | null>(null);

  const [imgDimensions, setImgDimensions] = useState<{ width: number; height: number } | null>(
    item.dimensions || null
  );

  const viewportRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const touchPinchDistRef = useRef<number | null>(null);
  const touchStartScaleRef = useRef<number>(1);

  // Full resolution image URL for redaction editing
  const [fullResUrl, setFullResUrl] = useState<string>('');

  useEffect(() => {
    // If we have a fully converted URL (and we are editing the result), use it.
    // Otherwise, use the original high-res file rather than the 120px preview thumbnail.
    if (item.convertedUrl) {
      setFullResUrl(item.convertedUrl);
      return;
    }
    
    const url = URL.createObjectURL(item.file);
    setFullResUrl(url);
    
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [item.file, item.convertedUrl]);

  // Measure natural dimensions
  useEffect(() => {
    if (!fullResUrl) return;
    const img = new Image();
    img.src = fullResUrl;
    img.onload = () => {
      setImgDimensions({ width: img.naturalWidth, height: img.naturalHeight });
    };
  }, [fullResUrl]);

  // Compute container fit scale
  const getFitScale = useCallback(() => {
    if (!viewportRef.current || !imgDimensions) return 1;
    const { clientWidth, clientHeight } = viewportRef.current;
    if (clientWidth === 0 || clientHeight === 0) return 1;
    const pad = 32;
    const scaleX = (clientWidth - pad) / imgDimensions.width;
    const scaleY = (clientHeight - pad) / imgDimensions.height;
    return Math.min(scaleX, scaleY, 1);
  }, [imgDimensions]);

  // Reset view to Fit to Screen
  const handleFitToScreen = useCallback(() => {
    const fit = getFitScale();
    setScale(fit);
    setPan({ x: 0, y: 0 });
  }, [getFitScale]);

  // Reset view to 100% (1:1 actual pixels)
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

  // Auto-fit on initial dimensions load or viewport resize
  useEffect(() => {
    if (!imgDimensions || !viewportRef.current) return;
    
    // We only want to auto-fit on the very first valid measurement
    // to avoid resetting user's zoom/pan when they resize the window.
    let hasInitializedFit = false;

    const observer = new ResizeObserver(() => {
      const { clientWidth, clientHeight } = viewportRef.current!;
      if (clientWidth > 0 && clientHeight > 0 && !hasInitializedFit) {
        hasInitializedFit = true;
        handleFitToScreen();
      }
    });

    observer.observe(viewportRef.current);
    
    return () => observer.disconnect();
  }, [imgDimensions, handleFitToScreen]);

  // Non-passive wheel listener for smooth desktop trackpad/mouse zoom
  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.15 : 0.85;
      setScale((prev) => Math.max(0.05, Math.min(10, prev * zoomFactor)));
    };

    viewport.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      viewport.removeEventListener('wheel', onWheel);
    };
  }, []);

  // Keyboard hotkeys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
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
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, handleZoomIn, handleZoomOut, handleFitToScreen, handleSetActualSize]);

  // Pointer interactions for Drawing and Panning
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!imgRef.current) return;

    // Middle click (1), Right click (2), Shift key, or Pan mode -> Pan
    const isPan = interactMode === 'pan' || e.button === 1 || e.button === 2 || e.shiftKey;

    if (isPan) {
      setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY });
      setPanStart({ ...pan });
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch (_) {}
      return;
    }

    // Left click in Draw mode -> Draw Region
    if (e.button === 0) {
      const imgRect = imgRef.current.getBoundingClientRect();
      if (imgRect.width === 0 || imgRect.height === 0) return;

      const relX = Math.max(0, Math.min(1, (e.clientX - imgRect.left) / imgRect.width));
      const relY = Math.max(0, Math.min(1, (e.clientY - imgRect.top) / imgRect.height));

      setIsDragging(true);
      setDrawStartRel({ x: relX, y: relY });
      setCurrentDrag({ x: relX, y: relY, width: 0, height: 0 });
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch (_) {}
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || !imgRef.current) return;

    // Pan mode handling
    if (interactMode === 'pan' || e.button === 1 || e.button === 2 || e.shiftKey || !drawStartRel) {
      const dx = e.clientX - dragStart.x;
      const dy = e.clientY - dragStart.y;
      setPan({
        x: panStart.x + dx,
        y: panStart.y + dy,
      });
      return;
    }

    // Draw mode handling
    const imgRect = imgRef.current.getBoundingClientRect();
    if (imgRect.width === 0 || imgRect.height === 0) return;

    const currentRelX = Math.max(0, Math.min(1, (e.clientX - imgRect.left) / imgRect.width));
    const currentRelY = Math.max(0, Math.min(1, (e.clientY - imgRect.top) / imgRect.height));

    const x = Math.min(drawStartRel.x, currentRelX);
    const y = Math.min(drawStartRel.y, currentRelY);
    const width = Math.abs(currentRelX - drawStartRel.x);
    const height = Math.abs(currentRelY - drawStartRel.y);

    setCurrentDrag({ x, y, width, height });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;

    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch (_) {}

    setIsDragging(false);

    if (currentDrag && currentDrag.width > 0.005 && currentDrag.height > 0.005) {
      setRegions((prev) => [...prev, currentDrag]);
    }

    setDrawStartRel(null);
    setCurrentDrag(null);
  };

  // Touch gesture handlers for mobile pinch-to-zoom & 2-finger panning
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      setIsDragging(false);
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      touchPinchDistRef.current = dist;
      touchStartScaleRef.current = scale;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && touchPinchDistRef.current !== null) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      const factor = dist / touchPinchDistRef.current;
      setScale(Math.max(0.05, Math.min(10, touchStartScaleRef.current * factor)));
    }
  };

  const handleTouchEnd = () => {
    touchPinchDistRef.current = null;
  };

  // Double click toggle Fit ↔ 100%
  const handleDoubleClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    const fitScale = getFitScale();
    if (Math.abs(scale - fitScale) < 0.05) {
      handleSetActualSize();
    } else {
      handleFitToScreen();
    }
  };

  const handleDeleteRegion = (index: number) => {
    setRegions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleClearAll = () => {
    setRegions([]);
  };

  const handleSave = () => {
    onSave(item.id, regions.length > 0 ? regions : undefined, regions.length > 0 ? blurMode : undefined);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 md:p-6 bg-zinc-950/85 backdrop-blur-md animate-fade-in"
      id="region-selector-modal"
    >
      <div className="bg-white dark:bg-[#1f2023] rounded-2xl md:rounded-3xl w-full h-full max-w-7xl max-h-[94vh] flex flex-col overflow-hidden shadow-2xl border border-zinc-200 dark:border-zinc-800 animate-scale-in">
        
        {/* Header Bar */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-zinc-100 dark:border-zinc-800/60 shrink-0 bg-zinc-50/50 dark:bg-[#1a1b1e]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 dark:bg-[#21243a] text-indigo-600 dark:text-indigo-300 rounded-xl">
              <Paintbrush className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-zinc-800 dark:text-zinc-200">
                Blur & Pixelate Redaction Editor
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 hidden sm:block">
                Draw shapes on the image to obfuscate faces, licenses, names, or sensitive details before export.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-2 transition-colors rounded-xl text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-800 dark:hover:text-zinc-200 cursor-pointer"
              aria-label="Close modal"
              title="Close editor"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 flex flex-col md:flex-row min-h-0 w-full overflow-hidden">
          
          {/* Main Inspection & Redaction Viewport (Left / Center) */}
          <div className="flex-1 bg-zinc-950 relative flex flex-col min-h-0 overflow-hidden select-none">
            
            {/* Top Toolbar Controls Bar inside Viewport */}
            <div className="absolute top-3 left-3 right-3 z-30 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
              
              {/* Interaction Mode Switcher */}
              <div className="flex items-center gap-1 bg-zinc-900/90 dark:bg-zinc-950/90 backdrop-blur-md p-1 rounded-xl border border-zinc-700/60 shadow-lg pointer-events-auto">
                <button
                  onClick={() => setInteractMode('draw')}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                    interactMode === 'draw'
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "text-zinc-300 hover:text-white hover:bg-white/10"
                  )}
                  title="Draw redaction region"
                >
                  <Square className="w-3.5 h-3.5" />
                  <span>Draw Region</span>
                </button>
                <button
                  onClick={() => setInteractMode('pan')}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                    interactMode === 'pan'
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "text-zinc-300 hover:text-white hover:bg-white/10"
                  )}
                  title="Pan / move image view"
                >
                  <Hand className="w-3.5 h-3.5" />
                  <span>Pan View</span>
                </button>
              </div>
            </div>

            {/* Interactive Viewport Canvas Box */}
            <div
              ref={viewportRef}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onDoubleClick={handleDoubleClick}
              className={cn(
                "flex-1 w-full h-full flex items-center justify-center overflow-hidden relative touch-none bg-[radial-gradient(#2c2d30_1px,transparent_1px)] [background-size:16px_16px] bg-[#121316]",
                interactMode === 'pan' ? 'cursor-grab active:cursor-grabbing' : 'cursor-crosshair'
              )}
            >
              {/* Scaled & Panned Image Layer */}
              <div
                className="relative inline-block transition-transform duration-75 ease-out select-none"
                style={{
                  transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
                  transformOrigin: 'center center',
                }}
              >
                {/* Source Image */}
                <img
                  ref={imgRef}
                  src={fullResUrl}
                  alt="Redaction Target"
                  className="block max-w-none max-h-none select-none pointer-events-none rounded shadow-2xl"
                  referrerPolicy="no-referrer"
                  draggable={false}
                />

                {/* Existing Defined Redaction Regions */}
                {regions.map((region, idx) => (
                  <div
                    key={idx}
                    className="absolute border border-indigo-500 bg-indigo-500/10 group/item transition-all"
                    style={{
                      left: `${region.x * 100}%`,
                      top: `${region.y * 100}%`,
                      width: `${region.width * 100}%`,
                      height: `${region.height * 100}%`,
                    }}
                  >
                    {/* Simulated Blur or Pixelation in preview */}
                    {blurMode === 'blur' ? (
                      <div className="w-full h-full backdrop-blur-md" />
                    ) : (
                      <div
                        className="w-full h-full bg-black/20"
                        style={{
                          backgroundImage:
                            'repeating-conic-gradient(#808080 0% 25%, transparent 0% 50%)',
                          backgroundSize: '10px 10px',
                        }}
                      />
                    )}

                    {/* Quick Delete Overlay Button */}
                    <div className="absolute top-1 right-1 opacity-0 group-hover/item:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteRegion(idx);
                        }}
                        className="p-1 bg-red-600 hover:bg-red-700 text-white rounded shadow-md cursor-pointer"
                        title="Delete Region"
                      >
                        <X className="w-3 h-3" strokeWidth={3} />
                      </button>
                    </div>

                    <span className="absolute bottom-1 left-1 px-1 bg-black/80 text-white text-[9px] font-mono rounded select-none">
                      #{idx + 1}
                    </span>
                  </div>
                ))}

                {/* Current Drawing Box */}
                {currentDrag && (
                  <div
                    className="absolute border-2 border-dashed border-indigo-400 bg-indigo-500/25 pointer-events-none"
                    style={{
                      left: `${currentDrag.x * 100}%`,
                      top: `${currentDrag.y * 100}%`,
                      width: `${currentDrag.width * 100}%`,
                      height: `${currentDrag.height * 100}%`,
                    }}
                  >
                    {blurMode === 'blur' ? (
                      <div className="w-full h-full backdrop-blur-sm" />
                    ) : (
                      <div
                        className="w-full h-full bg-black/15"
                        style={{
                          backgroundImage:
                            'repeating-conic-gradient(#808080 0% 25%, transparent 0% 50%)',
                          backgroundSize: '8px 8px',
                        }}
                      />
                    )}
                  </div>
                )}
              </div>

              {/* Bottom Context Hint Overlay */}
              {regions.length === 0 && !isDragging && (
                <div className="absolute bottom-20 left-1/2 -translate-x-1/2 px-4 py-2 bg-zinc-900/90 text-zinc-200 text-xs font-semibold rounded-full shadow-2xl pointer-events-none border border-zinc-700/60 text-center max-w-sm">
                  {interactMode === 'draw'
                    ? 'Click & drag on the image to define redaction boxes'
                    : 'Click & drag to pan • Scroll to zoom'}
                </div>
              )}

              {/* Bottom Prominent Zoom Controls Toolbar */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1 sm:gap-2 bg-zinc-900/95 dark:bg-[#1a1b1e]/95 backdrop-blur-xl px-2 sm:px-3 py-2 rounded-2xl border border-zinc-700/60 shadow-2xl z-40 pointer-events-auto w-[95%] sm:w-max max-w-lg overflow-x-auto overflow-y-hidden hide-scrollbar">
                <button
                  onClick={handleZoomOut}
                  className="px-3 py-1.5 text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer font-mono font-bold text-lg active:scale-95 shrink-0"
                  title="Zoom Out (-)"
                >
                  −
                </button>

                <div className="flex items-center justify-center px-2 py-1.5 bg-zinc-800/80 rounded-lg min-w-[72px] cursor-default border border-zinc-700/50" title="Zoom Scale">
                  <span className="text-xs font-mono font-bold text-zinc-200 text-center select-none w-full">
                    {Math.round(scale * 100)}%
                  </span>
                </div>

                <button
                  onClick={handleZoomIn}
                  className="px-3 py-1.5 text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer font-mono font-bold text-lg active:scale-95 shrink-0"
                  title="Zoom In (+)"
                >
                  +
                </button>

                <div className="w-[1px] h-6 bg-zinc-700/60 mx-1 shrink-0" />

                <button
                  onClick={handleFitToScreen}
                  className="px-3 py-1.5 text-xs font-bold text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer active:scale-95 shrink-0"
                  title="Fit to Screen (0)"
                >
                  Fit
                </button>

                <button
                  onClick={handleSetActualSize}
                  className="px-3 py-1.5 text-xs font-bold text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer active:scale-95 shrink-0"
                  title="100% Actual Size (1)"
                >
                  100%
                </button>

                <button
                  onClick={handleFitToScreen}
                  className="px-3 py-1.5 text-xs font-bold text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer active:scale-95 shrink-0"
                  title="Reset View (R)"
                >
                  Reset
                </button>
              </div>

            </div>

          </div>

          {/* Right Sidebar Control Panel */}
          <div className="w-full md:w-80 border-t md:border-t-0 md:border-l border-zinc-200 dark:border-zinc-800/60 p-4 sm:p-5 flex flex-col min-h-0 bg-zinc-50 dark:bg-[#1a1b1e] shrink-0">
            
            {/* Redaction Mode Option */}
            <div className="mb-4">
              <span className="block mb-1.5 text-[10px] sm:text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                Redaction Effect
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setBlurMode('blur')}
                  className={cn(
                    "flex flex-col items-center justify-center p-2 sm:p-3 rounded-xl border-2 transition-all cursor-pointer text-center",
                    blurMode === 'blur'
                      ? "bg-indigo-50 dark:bg-[#1e2338] border-indigo-500 text-indigo-700 dark:text-indigo-300"
                      : "bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-200 hover:border-zinc-300"
                  )}
                >
                  <Eye className="w-4 h-4 sm:w-5 sm:h-5 mb-1 sm:mb-1.5" />
                  <span className="text-xs font-bold">Smooth Blur</span>
                </button>
                <button
                  type="button"
                  onClick={() => setBlurMode('pixelate')}
                  className={cn(
                    "flex flex-col items-center justify-center p-2 sm:p-3 rounded-xl border-2 transition-all cursor-pointer text-center",
                    blurMode === 'pixelate'
                      ? "bg-indigo-50 dark:bg-[#1e2338] border-indigo-500 text-indigo-700 dark:text-indigo-300"
                      : "bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-200 hover:border-zinc-300"
                  )}
                >
                  <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 mb-1 sm:mb-1.5" />
                  <span className="text-xs font-bold">Pixelate</span>
                </button>
              </div>
            </div>

            {/* List of Defined Active Regions */}
            <div className="flex-1 flex flex-col min-h-0 mb-4">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] sm:text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Defined Areas ({regions.length})
                </span>
                {regions.length > 0 && (
                  <button
                    onClick={handleClearAll}
                    className="text-[11px] font-bold text-red-600 dark:text-[#f28b82] hover:underline cursor-pointer"
                  >
                    Clear All
                  </button>
                )}
              </div>

              {regions.length === 0 ? (
                <div className="flex-1 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl flex flex-col items-center justify-center p-3 text-center text-zinc-400">
                  <ShieldAlert className="w-6 h-6 mb-1 text-zinc-300 dark:text-zinc-700" />
                  <span className="text-[11px] sm:text-xs font-medium">No redaction boxes created yet.</span>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 max-h-[18vh] md:max-h-none">
                  {regions.map((region, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800/80 rounded-xl text-xs hover:border-indigo-400 transition-colors shadow-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-md bg-zinc-100 dark:bg-zinc-900 text-[10px] font-bold text-zinc-600 dark:text-zinc-200 flex items-center justify-center font-mono">
                          #{idx + 1}
                        </span>
                        <div className="flex flex-col">
                          <span className="font-bold text-zinc-700 dark:text-zinc-200 text-[11px] sm:text-xs">
                            Area {Math.round(region.width * 100)}% × {Math.round(region.height * 100)}%
                          </span>
                          <span className="text-[9px] text-zinc-400 dark:text-zinc-400 font-mono">
                            x:{Math.round(region.x * 100)}% y:{Math.round(region.y * 100)}%
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteRegion(idx)}
                        className="p-1 transition-colors rounded-lg text-zinc-400 hover:bg-red-50 dark:hover:bg-[#3c1e1e] hover:text-red-600 dark:hover:text-[#f28b82] cursor-pointer"
                        title="Delete region"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer Action Buttons */}
            <div className="grid grid-cols-2 gap-2 shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-2 sm:py-3 text-xs font-bold rounded-xl border border-zinc-300 dark:border-zinc-800 text-zinc-700 dark:text-zinc-200 bg-white dark:bg-zinc-950 hover:bg-zinc-50 dark:hover:bg-[#303134] transition-colors cursor-pointer text-center"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="px-3 py-2 sm:py-3 text-xs font-bold rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:text-[#202124] dark:hover:bg-[#a8c7fa] shadow-sm transition-all flex items-center justify-center gap-1 cursor-pointer text-center"
              >
                <Check className="w-4 h-4 shrink-0" strokeWidth={2.5} />
                <span className="truncate">Save Regions</span>
              </button>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
