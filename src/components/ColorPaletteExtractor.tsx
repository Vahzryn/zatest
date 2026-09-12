import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  Upload,
  Copy,
  Check,
  Palette,
  RefreshCw,
  AlertTriangle,
  Pipette,
  CheckCircle2,
  ShieldCheck,
  Grid
} from 'lucide-react';

function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (c: number) => {
    const hex = Math.max(0, Math.min(255, c)).toString(16);
    return hex.length === 1 ? '0' : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

function hexToRgb(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

// Simple color distance using Euclidean distance in RGB space to ensure distinct swatches
function colorDistance(r1: number, g1: number, b1: number, r2: number, g2: number, b2: number): number {
  return Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2);
}

// Calculate perceived luminance to decide text color (black vs white text on swatch)
function getLuminance(r: number, g: number, b: number): number {
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

interface ColorPaletteExtractorProps {
  onNavigate?: (path: string) => void;
}

export function ColorPaletteExtractor({ onNavigate }: ColorPaletteExtractorProps) {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [extractedPalette, setExtractedPalette] = useState<string[]>([]);
  const [customColors, setCustomColors] = useState<string[]>([]);
  const [hoverColor, setHoverColor] = useState<string | null>(null);
  const [hoverCoord, setHoverCoord] = useState<{ x: number; y: number } | null>(null);
  const [pickedColor, setPickedColor] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedColor, setCopiedColor] = useState<string | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [isPipetteActive, setIsPipetteActive] = useState(true);

  const imageRef = useRef<HTMLImageElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Extract representative color palette using grid frequency sampling
  const extractPaletteFromImage = useCallback((imgElement: HTMLImageElement) => {
    try {
      const canvas = document.createElement('canvas');
      const sampleSize = 64; // High frequency sample grid to keep calculations responsive
      canvas.width = sampleSize;
      canvas.height = sampleSize;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.drawImage(imgElement, 0, 0, sampleSize, sampleSize);
      const imgData = ctx.getImageData(0, 0, sampleSize, sampleSize).data;

      // Group similar pixels
      const colorBins: { r: number; g: number; b: number; count: number }[] = [];
      const distanceThreshold = 45; // Minimum color distance to ensure variety

      for (let i = 0; i < imgData.length; i += 4) {
        const r = imgData[i];
        const g = imgData[i + 1];
        const b = imgData[i + 2];
        const a = imgData[i + 3];

        // Ignore fully transparent pixels
        if (a < 128) continue;

        let foundBin = false;
        for (const bin of colorBins) {
          if (colorDistance(r, g, b, bin.r, bin.g, bin.b) < distanceThreshold) {
            // Average into bin coordinates
            bin.r = Math.round((bin.r * bin.count + r) / (bin.count + 1));
            bin.g = Math.round((bin.g * bin.count + g) / (bin.count + 1));
            bin.b = Math.round((bin.b * bin.count + b) / (bin.count + 1));
            bin.count += 1;
            foundBin = true;
            break;
          }
        }

        if (!foundBin) {
          colorBins.push({ r, g, b, count: 1 });
        }
      }

      // Sort bins by occurrence weight
      const sortedColors = colorBins
        .sort((a, b) => b.count - a.count)
        .slice(0, 8)
        .map(bin => rgbToHex(bin.r, bin.g, bin.b));

      setExtractedPalette(sortedColors);
    } catch (err) {
      console.error('Palette extraction failed:', err);
    }
  }, []);

  const processImageFile = useCallback((selectedFile: File) => {
    if (!selectedFile.type.startsWith('image/')) {
      setErrorMessage('Please select a valid image file.');
      return;
    }

    setErrorMessage(null);
    setFile(selectedFile);
    setLoading(true);
    setExtractedPalette([]);
    setCustomColors([]);
    setPickedColor(null);

    const objectUrl = URL.createObjectURL(selectedFile);
    setPreviewUrl(objectUrl);
  }, []);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processImageFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processImageFile(e.target.files[0]);
    }
  };

  const handleImageLoaded = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    extractPaletteFromImage(img);
    
    // Set up sampling canvas for pixel extraction on mousemove/click
    const samplingCanvas = document.createElement('canvas');
    samplingCanvas.width = img.naturalWidth;
    samplingCanvas.height = img.naturalHeight;
    const ctx = samplingCanvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(img, 0, 0);
      canvasRef.current = samplingCanvas;
    }
    
    setLoading(false);
  };

  const handleReset = useCallback(() => {
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    setFile(null);
    setPreviewUrl(null);
    setExtractedPalette([]);
    setCustomColors([]);
    setHoverColor(null);
    setPickedColor(null);
    setErrorMessage(null);
    canvasRef.current = null;
  }, [previewUrl]);

  const copyColorToClipboard = (hex: string) => {
    navigator.clipboard.writeText(hex).then(() => {
      setCopiedColor(hex);
      setTimeout(() => setCopiedColor(null), 1500);
    });
  };

  // Extract pixel color under mouse coordinate
  const handleMouseMoveOnImage = (e: React.MouseEvent<HTMLImageElement>) => {
    if (!canvasRef.current || !imageRef.current) return;

    const img = imageRef.current;
    const canvas = canvasRef.current;
    const rect = img.getBoundingClientRect();
    
    // Scale client coordinate to matches native image canvas coordinates
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const x = Math.floor((e.clientX - rect.left) * scaleX);
    const y = Math.floor((e.clientY - rect.top) * scaleY);

    const ctx = canvas.getContext('2d');
    if (ctx) {
      try {
        const pixel = ctx.getImageData(x, y, 1, 1).data;
        const hex = rgbToHex(pixel[0], pixel[1], pixel[2]);
        setHoverColor(hex);
        setHoverCoord({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top
        });
      } catch (err) {
        console.warn('Canvas pixel query blocked:', err);
      }
    }
  };

  const handleMouseLeaveImage = () => {
    setHoverColor(null);
    setHoverCoord(null);
  };

  const handleImageClick = () => {
    if (hoverColor) {
      setPickedColor(hoverColor);
      // Append to custom swatch bucket if not already present
      if (!customColors.includes(hoverColor) && !extractedPalette.includes(hoverColor)) {
        setCustomColors(prev => [hoverColor, ...prev].slice(0, 8));
      }
    }
  };

  return (
    <div className="w-full bg-white dark:bg-[#292a2d] border border-zinc-200/80 dark:border-zinc-800 rounded-3xl p-4 sm:p-6 shadow-sm mb-6 animate-in fade-in duration-300">
      <div className="flex flex-col gap-4">
        {/* Header Block */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-100 dark:border-zinc-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl text-indigo-600 dark:text-indigo-400">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-white">Color Palette Extractor</h2>
              <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
                Inspect local pictures, extract representative colors, and copy precise HEX values.
              </p>
            </div>
          </div>
        </div>

        {/* Error Notification */}
        {errorMessage && (
          <div className="p-3.5 bg-amber-50 dark:bg-[#3d2b1f] border border-amber-200 dark:border-zinc-800 rounded-2xl flex items-start gap-3 text-amber-800 dark:text-[#fdd663] text-sm font-medium">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-[#fdd663] shrink-0 mt-0.5" />
            <div>
              <span>{errorMessage}</span>
            </div>
          </div>
        )}

        {/* Dropzone File Input */}
        {!file && (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center transition-all cursor-pointer flex flex-col items-center justify-center min-h-[300px] ${
              isDragActive
                ? 'border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/10'
                : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-zinc-50/30 dark:bg-zinc-800/20'
            }`}
            onClick={() => document.getElementById('palette-file-input')?.click()}
          >
            <input
              id="palette-file-input"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileInputChange}
            />
            <div className="p-4 bg-white dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 rounded-2xl shadow-sm mb-4">
              <Palette className="w-8 h-8 text-zinc-400 dark:text-zinc-500 animate-pulse" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-zinc-800 dark:text-white mb-1">
              Drag & Drop Image for Palette Extraction
            </h3>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 max-w-sm mb-4">
              Upload any digital scan, photographic capture, or artwork to map its color palette instantly.
            </p>
            <button className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-sm hover:shadow transition-all">
              Choose Local Image
            </button>
          </div>
        )}

        {/* Interactive Workspace */}
        {file && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-2">
            
            {/* Left Side: Interactive Preview Canvas */}
            <div className="lg:col-span-6 xl:col-span-7 flex flex-col gap-4">
              <div className="border border-zinc-150 dark:border-zinc-800/80 bg-zinc-50/20 dark:bg-zinc-800/10 p-4 rounded-3xl flex flex-col gap-3">
                <div className="flex items-center justify-between gap-3 border-b border-zinc-100 dark:border-zinc-800 pb-2">
                  <div className="flex items-center gap-1.5">
                    <Pipette className="w-3.5 h-3.5 text-indigo-500" />
                    <span className="text-xs font-bold text-zinc-700 dark:text-zinc-200">
                      Interactive Image Pipette
                    </span>
                  </div>
                  <span className="text-[10px] text-zinc-400">
                    Hover and click on the image below to sample precise custom hex codes.
                  </span>
                </div>

                {previewUrl && (
                  <div className="relative w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center select-none group min-h-[250px]">
                    <img
                      ref={imageRef}
                      src={previewUrl}
                      alt="Color palette source preview"
                      referrerPolicy="no-referrer"
                      onLoad={handleImageLoaded}
                      onMouseMove={handleMouseMoveOnImage}
                      onMouseLeave={handleMouseLeaveImage}
                      onClick={handleImageClick}
                      className={`max-h-[420px] max-w-full object-contain ${
                        isPipetteActive ? 'cursor-crosshair' : 'cursor-default'
                      }`}
                    />

                    {/* Custom Loupe Hover Pipette Preview */}
                    {hoverColor && hoverCoord && (
                      <div
                        className="absolute pointer-events-none rounded-full border-2 border-white shadow-lg flex items-center justify-center overflow-hidden"
                        style={{
                          left: `${hoverCoord.x - 28}px`,
                          top: `${hoverCoord.y - 28}px`,
                          width: '56px',
                          height: '56px',
                          backgroundColor: hoverColor,
                          boxShadow: '0 4px 14px rgba(0,0,0,0.3)'
                        }}
                      >
                        {/* Tiny coordinate target dot */}
                        <div className="w-1.5 h-1.5 rounded-full bg-white/70" />
                      </div>
                    )}
                  </div>
                )}

                {/* Loupe feedback label info */}
                <div className="flex items-center justify-between flex-wrap gap-2 text-xs text-zinc-500 pt-1">
                  <span>Coordinates: Hover image viewport</span>
                  {hoverColor && (
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-zinc-800 dark:text-white">Sampled Color:</span>
                      <div className="w-4 h-4 rounded-md border border-zinc-200/60" style={{ backgroundColor: hoverColor }} />
                      <span className="font-mono font-bold text-zinc-700 dark:text-indigo-300">{hoverColor}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Side: Swatches & Color Chips */}
            <div className="lg:col-span-6 xl:col-span-5 flex flex-col gap-5">
              
              {/* Representative Extracted Swatches */}
              <div className="border border-zinc-200/80 dark:border-zinc-800 rounded-3xl p-4 sm:p-5 flex flex-col gap-4 bg-zinc-50/10">
                <div className="flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-2.5">
                  <Palette className="w-4 h-4 text-indigo-500" />
                  <h3 className="text-sm font-bold text-zinc-800 dark:text-white">Extracted Representative Palette</h3>
                </div>

                {loading ? (
                  <div className="flex items-center gap-2.5 text-xs text-zinc-400 italic py-6">
                    <LoaderIcon className="w-4 h-4 text-indigo-600 animate-spin" />
                    <span>Analyzing color histogram distribution...</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {extractedPalette.map((hex, index) => {
                      const rgb = hexToRgb(hex);
                      const isDarkText = rgb ? getLuminance(rgb.r, rgb.g, rgb.b) > 0.5 : true;
                      return (
                        <button
                          key={`${hex}-${index}`}
                          onClick={() => copyColorToClipboard(hex)}
                          className="flex items-center justify-between p-2 rounded-2xl border border-zinc-150 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 hover:scale-[1.02] active:scale-[0.98] text-left transition-all cursor-pointer group"
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className="w-8 h-8 rounded-xl border border-zinc-200/60 flex items-center justify-center shrink-0"
                              style={{ backgroundColor: hex }}
                            />
                            <div className="flex flex-col">
                              <span className="font-mono text-xs font-bold text-zinc-800 dark:text-zinc-200">{hex}</span>
                              <span className="text-[10px] text-zinc-400 capitalize">Swatch {index + 1}</span>
                            </div>
                          </div>
                          
                          <div className="text-zinc-300 dark:text-zinc-600 group-hover:text-indigo-500 transition-colors p-1">
                            {copiedColor === hex ? (
                              <Check className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Pipette Clicked / Custom Sampled Swatches */}
              <div className="border border-zinc-200/80 dark:border-zinc-800 rounded-3xl p-4 sm:p-5 flex flex-col gap-4 bg-zinc-50/10">
                <div className="flex items-center justify-between gap-3 border-b border-zinc-100 dark:border-zinc-800 pb-2.5">
                  <div className="flex items-center gap-2">
                    <Pipette className="w-4 h-4 text-emerald-500" />
                    <h3 className="text-sm font-bold text-zinc-800 dark:text-white">Custom Clicked Colors</h3>
                  </div>
                  {customColors.length > 0 && (
                    <button
                      onClick={() => setCustomColors([])}
                      className="text-[10px] font-semibold text-zinc-400 hover:text-red-500 transition-colors cursor-pointer"
                    >
                      Clear custom
                    </button>
                  )}
                </div>

                {customColors.length === 0 ? (
                  <div className="text-center py-6 border border-dashed border-zinc-150 dark:border-zinc-800 rounded-2xl">
                    <p className="text-xs text-zinc-400 dark:text-zinc-500 italic">
                      No custom colors clicked yet. Click the image to register custom swatches.
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2.5">
                    {customColors.map((hex, index) => (
                      <button
                        key={`custom-${hex}-${index}`}
                        onClick={() => copyColorToClipboard(hex)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-zinc-150 dark:border-zinc-800 hover:border-indigo-300 transition-all cursor-pointer group hover:scale-[1.03]"
                      >
                        <div className="w-4 h-4 rounded-md border border-zinc-200/40 shrink-0" style={{ backgroundColor: hex }} />
                        <span className="font-mono text-xs font-bold text-zinc-700 dark:text-indigo-300">{hex}</span>
                        {copiedColor === hex ? (
                          <Check className="w-3 h-3 text-green-500" />
                        ) : (
                          <Copy className="w-3.5 h-3.5 text-zinc-300 dark:text-zinc-600 group-hover:text-indigo-400 transition-colors" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Bottom Actions and Image Swap */}
              <button
                onClick={handleReset}
                className="w-full flex items-center justify-center gap-2 py-3 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-white text-xs font-bold rounded-2xl transition-all"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Upload Different Image</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function LoaderIcon({ className }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  );
}
