import React, { useState, useCallback, useRef, useEffect } from 'react';
import { 
  FileImage, 
  Upload, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  Download, 
  ShieldCheck, 
  Zap, 
  AlertTriangle, 
  Loader2, 
  CheckCircle2, 
  RefreshCw,
  Layers,
  Settings,
  X
} from 'lucide-react';
import { Breadcrumbs } from './Breadcrumbs';
import { SeoRouteData } from '../lib/seoEngine';
import { SeoGuideContent } from './Converter/SeoGuideContent';
import { PDFDocument } from 'pdf-lib';
import { formatBytes } from '../lib/utils';
import JSZip from 'jszip';

interface ImageToPdfPageProps {
  seoData: SeoRouteData;
  onNavigate: (path: string) => void;
}

interface ImageItem {
  id: string;
  file: File;
  previewUrl: string;
}

const isSupportedImageForPdf = (file: File): boolean => {
  const mime = (file.type || '').toLowerCase().trim();
  if (mime === 'image/jpeg' || mime === 'image/jpg' || mime === 'image/png') {
    return true;
  }
  const name = (file.name || '').toLowerCase().trim();
  return /\.(jpe?g|png)$/i.test(name);
};

export const ImageToPdfPage: React.FC<ImageToPdfPageProps> = ({ seoData, onNavigate }) => {
  const [items, setItems] = useState<ImageItem[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successResult, setSuccessResult] = useState<{ url: string, filename: string, size: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const itemsRef = useRef<ImageItem[]>([]);
  const successResultRef = useRef<{ url: string, filename: string, size: number } | null>(null);
  const activeProcessIdRef = useRef<number>(0);

  const [mergeMode, setMergeMode] = useState<'single' | 'multiple'>('single');
  const [pageSize, setPageSize] = useState<'fit' | 'a4'>('fit');

  const cleanupItems = useCallback(() => {
    itemsRef.current.forEach(item => {
      if (item.previewUrl && item.previewUrl.startsWith('blob:')) {
        try {
          URL.revokeObjectURL(item.previewUrl);
        } catch (e) {}
      }
    });
    itemsRef.current = [];
    setItems([]);
  }, []);

  const cleanupSuccessResult = useCallback(() => {
    if (successResultRef.current?.url && successResultRef.current.url.startsWith('blob:')) {
      try {
        URL.revokeObjectURL(successResultRef.current.url);
      } catch (e) {}
    }
    successResultRef.current = null;
    setSuccessResult(null);
  }, []);

  useEffect(() => {
    return () => {
      activeProcessIdRef.current += 1;
      cleanupSuccessResult();
      cleanupItems();
    };
  }, [cleanupSuccessResult, cleanupItems]);

  const handleFilesAdded = useCallback((newFiles: FileList | File[]) => {
    cleanupSuccessResult();

    const incomingFiles = Array.from(newFiles);
    const validFiles = incomingFiles.filter(isSupportedImageForPdf);
    const rejectedFiles = incomingFiles.filter(f => !isSupportedImageForPdf(f));

    if (rejectedFiles.length > 0) {
      setErrorMessage(
        rejectedFiles.length === 1
          ? `"${rejectedFiles[0].name}" was skipped. Only JPG and PNG image files are supported for PDF conversion.`
          : `${rejectedFiles.length} files were skipped because only JPG and PNG images are supported for PDF conversion.`
      );
    } else {
      setErrorMessage(null);
    }

    if (validFiles.length === 0) {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    const newItems: ImageItem[] = validFiles.map(file => ({
      id: Math.random().toString(36).substring(2, 9),
      file,
      previewUrl: URL.createObjectURL(file)
    }));

    setItems(prev => {
      const updated = [...prev, ...newItems];
      itemsRef.current = updated;
      return updated;
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [cleanupSuccessResult]);

  const removeItem = (id: string) => {
    setItems(prev => {
      const item = prev.find(i => i.id === id);
      if (item?.previewUrl && item.previewUrl.startsWith('blob:')) {
        try {
          URL.revokeObjectURL(item.previewUrl);
        } catch (e) {}
      }
      const updated = prev.filter(i => i.id !== id);
      itemsRef.current = updated;
      return updated;
    });
  };

  const moveItem = (index: number, direction: 'up' | 'down') => {
    const newItems = [...items];
    if (direction === 'up' && index > 0) {
      [newItems[index - 1], newItems[index]] = [newItems[index], newItems[index - 1]];
    } else if (direction === 'down' && index < newItems.length - 1) {
      [newItems[index + 1], newItems[index]] = [newItems[index], newItems[index + 1]];
    }
    itemsRef.current = newItems;
    setItems(newItems);
  };

  const processImagesToPdf = async () => {
    if (items.length === 0 || isProcessing) return;
    
    const currentProcessId = ++activeProcessIdRef.current;
    setIsProcessing(true);
    setErrorMessage(null);
    cleanupSuccessResult();

    try {
      if (mergeMode === 'single') {
        const pdfDoc = await PDFDocument.create();

        for (const item of items) {
          if (activeProcessIdRef.current !== currentProcessId) return;
          const imageBytes = await item.file.arrayBuffer();
          let image;
          
          if (item.file.type === 'image/jpeg' || item.file.type === 'image/jpg' || /\.(jpe?g)$/i.test(item.file.name)) {
            image = await pdfDoc.embedJpg(imageBytes);
          } else if (item.file.type === 'image/png' || /\.png$/i.test(item.file.name)) {
            image = await pdfDoc.embedPng(imageBytes);
          } else {
            try {
              image = await pdfDoc.embedJpg(imageBytes);
            } catch {
              image = await pdfDoc.embedPng(imageBytes);
            }
          }

          const { width, height } = image.scale(1);
          
          if (pageSize === 'fit') {
            const page = pdfDoc.addPage([width, height]);
            page.drawImage(image, { x: 0, y: 0, width, height });
          } else {
            // A4 is 595.28 x 841.89 points
            const page = pdfDoc.addPage([595.28, 841.89]);
            const scale = Math.min(595.28 / width, 841.89 / height);
            const scaledWidth = width * scale;
            const scaledHeight = height * scale;
            page.drawImage(image, { 
              x: (595.28 - scaledWidth) / 2, 
              y: (841.89 - scaledHeight) / 2, 
              width: scaledWidth, 
              height: scaledHeight 
            });
          }
        }

        const pdfBytes = await pdfDoc.save();
        if (activeProcessIdRef.current !== currentProcessId) return;

        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        if (activeProcessIdRef.current !== currentProcessId) {
          URL.revokeObjectURL(url);
          return;
        }
        
        const result = {
          url,
          filename: items.length === 1 ? `${items[0].file.name.replace(/\.[^/.]+$/, '')}.pdf` : `Merged_Images_${Date.now()}.pdf`,
          size: blob.size
        };
        successResultRef.current = result;
        setSuccessResult(result);
      } else {
        // Multiple PDFs (ZIP)
        const zip = new JSZip();
        
        for (const item of items) {
          if (activeProcessIdRef.current !== currentProcessId) return;
          const pdfDoc = await PDFDocument.create();
          const imageBytes = await item.file.arrayBuffer();
          let image;
          
          if (item.file.type === 'image/jpeg' || item.file.type === 'image/jpg' || /\.(jpe?g)$/i.test(item.file.name)) {
            image = await pdfDoc.embedJpg(imageBytes);
          } else if (item.file.type === 'image/png' || /\.png$/i.test(item.file.name)) {
            image = await pdfDoc.embedPng(imageBytes);
          } else {
            try {
              image = await pdfDoc.embedJpg(imageBytes);
            } catch {
              image = await pdfDoc.embedPng(imageBytes);
            }
          }

          const { width, height } = image.scale(1);
          
          if (pageSize === 'fit') {
            const page = pdfDoc.addPage([width, height]);
            page.drawImage(image, { x: 0, y: 0, width, height });
          } else {
            const page = pdfDoc.addPage([595.28, 841.89]);
            const scale = Math.min(595.28 / width, 841.89 / height);
            page.drawImage(image, { 
              x: (595.28 - width * scale) / 2, 
              y: (841.89 - height * scale) / 2, 
              width: width * scale, 
              height: height * scale 
            });
          }

          const pdfBytes = await pdfDoc.save();
          const filename = `${item.file.name.replace(/\.[^/.]+$/, '')}.pdf`;
          zip.file(filename, pdfBytes);
        }
        
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        if (activeProcessIdRef.current !== currentProcessId) return;

        const url = URL.createObjectURL(zipBlob);
        if (activeProcessIdRef.current !== currentProcessId) {
          URL.revokeObjectURL(url);
          return;
        }
        
        const result = {
          url,
          filename: `Converted_PDFs_${Date.now()}.zip`,
          size: zipBlob.size
        };
        successResultRef.current = result;
        setSuccessResult(result);
      }
    } catch (err: any) {
      if (activeProcessIdRef.current !== currentProcessId) return;
      console.error(err);
      setErrorMessage(err.message || 'Failed to convert images to PDF. Make sure they are standard JPG or PNG files.');
    } finally {
      if (activeProcessIdRef.current === currentProcessId) {
        setIsProcessing(false);
      }
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-2 sm:px-4 py-2 sm:py-3 space-y-4 sm:space-y-5">
      {/* Screen Reader Live Region */}
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {successResult 
          ? `PDF creation complete. ${successResult.filename} is ready for download (${formatBytes(successResult.size)}).` 
          : ''}
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-2xs overflow-hidden p-3.5 sm:p-5 space-y-4">
        {!successResult && (
          <div 
            className={`relative border-2 border-dashed rounded-xl p-5 sm:p-6 transition-colors flex flex-col items-center justify-center gap-2 cursor-pointer ${
              dragActive 
                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' 
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
            <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Upload className="w-5 h-5" />
            </div>
            <div className="text-center space-y-0.5">
              <p className="text-xs sm:text-sm font-bold text-zinc-800 dark:text-zinc-200">
                Drag & drop images here, or <span className="text-indigo-600 dark:text-indigo-400 underline">browse</span>
              </p>
              <p className="text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400">
                Supports JPG and PNG. Processed securely in your browser.
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/jpeg,image/png"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  handleFilesAdded(e.target.files);
                  e.target.value = '';
                }
              }}
            />
          </div>
        )}

        {errorMessage && (
          <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 flex items-center gap-2.5 text-red-700 dark:text-red-300 text-xs">
            <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
            <span>{errorMessage}</span>
          </div>
        )}

        {items.length > 0 && !successResult && (
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 flex flex-col gap-3">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 space-y-1">
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">Output Mode</label>
                  <select 
                    value={mergeMode}
                    onChange={(e) => setMergeMode(e.target.value as any)}
                    className="w-full bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs sm:text-sm text-zinc-900 dark:text-white"
                  >
                    <option value="single">Merge into a single PDF</option>
                    <option value="multiple">Convert to individual PDFs (ZIP)</option>
                  </select>
                </div>
                <div className="flex-1 space-y-1">
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">Page Size</label>
                  <select 
                    value={pageSize}
                    onChange={(e) => setPageSize(e.target.value as any)}
                    className="w-full bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs sm:text-sm text-zinc-900 dark:text-white"
                  >
                    <option value="fit">Fit exactly to image dimensions</option>
                    <option value="a4">Standard A4 (Centered)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              {items.map((item, index) => (
                <div key={item.id} className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white dark:bg-[#25282c] border border-zinc-200 dark:border-zinc-700/80 group transition-all hover:shadow-2xs">
                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-zinc-100 dark:bg-zinc-800 shrink-0 border border-zinc-200 dark:border-zinc-700">
                    <img src={item.previewUrl} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-white truncate">
                      {item.file.name}
                    </p>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                      {formatBytes(item.file.size)}
                    </p>
                  </div>
                  
                  {mergeMode === 'single' && (
                    <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                      <button
                        disabled={index === 0}
                        onClick={() => moveItem(index, 'up')}
                        className="p-1 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 disabled:opacity-30 disabled:hover:text-zinc-500 rounded bg-zinc-100 dark:bg-zinc-800"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        disabled={index === items.length - 1}
                        onClick={() => moveItem(index, 'down')}
                        className="p-1 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 disabled:opacity-30 disabled:hover:text-zinc-500 rounded bg-zinc-100 dark:bg-zinc-800"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                  
                  <button
                    onClick={() => removeItem(item.id)}
                    className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors ml-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Processed entirely in browser</span>
              </div>
              
              <button
                disabled={isProcessing}
                onClick={processImagesToPdf}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs sm:text-sm shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    <span>Convert</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {successResult && (
          <div className="flex flex-col items-center gap-4 py-2 max-w-lg mx-auto text-center animate-in fade-in zoom-in-98 duration-300">
            <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-2xs">
              <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
            </div>

            <div className="space-y-0.5">
              <h2 className="text-lg sm:text-xl font-black text-zinc-900 dark:text-white">
                PDF Created Successfully
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Combined <span className="font-semibold text-zinc-800 dark:text-zinc-200">{items.length} {items.length === 1 ? 'image' : 'images'}</span> into <span className="font-mono text-zinc-700 dark:text-zinc-300">{successResult.filename}</span> ({formatBytes(successResult.size)}).
              </p>
            </div>

            <div className="w-full space-y-2.5 pt-1">
              <a
                href={successResult.url}
                download={successResult.filename}
                className="w-full flex items-center justify-center gap-2 py-3 px-5 text-sm sm:text-base font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] rounded-xl shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
                id="btn-download-created-pdf"
              >
                <Download className="w-4 h-4" />
                <span>Download PDF</span>
              </a>

              <div className="flex items-center justify-center gap-4 pt-0.5">
                <button
                  onClick={() => {
                    activeProcessIdRef.current += 1;
                    cleanupSuccessResult();
                    cleanupItems();
                    setErrorMessage(null);
                    if (fileInputRef.current) {
                      fileInputRef.current.value = '';
                    }
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>New files</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <SeoGuideContent seoData={seoData} onNavigate={onNavigate} />
    </div>
  );
};
