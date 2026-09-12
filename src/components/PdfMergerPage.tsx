import React, { useState, useCallback, useRef } from 'react';
import { 
  FileText, 
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
  Layers
} from 'lucide-react';
import { Breadcrumbs } from './Breadcrumbs';
import { SeoRouteData } from '../lib/seoEngine';
import { mergePdfFiles } from '../lib/pdfSplitMerge';
import { loadPdfDocument } from '../lib/pdfProcessor';
import { SeoGuideContent } from './Converter/SeoGuideContent';

interface PdfMergerPageProps {
  seoData: SeoRouteData;
  onNavigate: (path: string) => void;
}

interface PdfItem {
  id: string;
  file: File;
  pageCount?: number;
  loadingInfo?: boolean;
}

export function PdfMergerPage({ seoData, onNavigate }: PdfMergerPageProps) {
  const [items, setItems] = useState<PdfItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successResult, setSuccessResult] = useState<{ url: string; filename: string; size: number } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragActive, setIsDragActive] = useState(false);

  const handleFilesAdded = useCallback(async (newFiles: FileList | File[]) => {
    setErrorMessage(null);
    setSuccessResult(null);

    const validFiles: PdfItem[] = [];
    for (let i = 0; i < newFiles.length; i++) {
      const f = newFiles[i];
      if (!f.type.includes('pdf') && !f.name.toLowerCase().endsWith('.pdf')) {
        setErrorMessage(`File "${f.name}" is not a valid PDF file.`);
        continue;
      }
      validFiles.push({
        id: Math.random().toString(36).substring(2, 9),
        file: f,
        loadingInfo: true,
      });
    }

    if (validFiles.length === 0) return;

    setItems((prev) => [...prev, ...validFiles]);

    // Asynchronously load page count for each file
    validFiles.forEach(async (item) => {
      try {
        const buffer = await item.file.arrayBuffer();
        const doc = await loadPdfDocument(buffer);
        const count = doc.numPages;
        setItems((current) =>
          current.map((it) => (it.id === item.id ? { ...it, pageCount: count, loadingInfo: false } : it))
        );
      } catch (e) {
        setItems((current) =>
          current.map((it) => (it.id === item.id ? { ...it, loadingInfo: false } : it))
        );
      }
    });
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
      handleFilesAdded(e.dataTransfer.files);
    }
  };

  const moveItem = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= items.length) return;
    const updated = [...items];
    const temp = updated[index];
    updated[index] = updated[newIndex];
    updated[newIndex] = temp;
    setItems(updated);
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
    setSuccessResult(null);
  };

  const handleMerge = async () => {
    if (items.length < 2) {
      setErrorMessage('Please add at least 2 PDF files to merge.');
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);
    setSuccessResult(null);

    try {
      const filesToMerge = items.map((it) => it.file);
      const mergedBytes = await mergePdfFiles(filesToMerge);
      const blob = new Blob([mergedBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const filename = `merged-${Date.now()}.pdf`;

      setSuccessResult({
        url,
        filename,
        size: blob.size,
      });
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to merge PDF files.');
    } finally {
      setIsProcessing(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="max-w-5xl mx-auto px-2 sm:px-4 py-2 sm:py-4 space-y-8">
      {/* Screen Reader Announcement */}
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {successResult ? `PDF merge complete. Merged document size is ${formatBytes(successResult.size)}.` : ''}
      </div>

      {/* Main Workspace Card */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-xl overflow-hidden p-6 sm:p-8 space-y-6">
        
        {/* Success Result View */}
        {successResult ? (
          <div className="flex flex-col items-center gap-6 py-4 max-w-lg mx-auto text-center animate-in fade-in zoom-in-98 duration-300">
            <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-xs">
              <CheckCircle2 className="w-8 h-8 stroke-[2.5]" />
            </div>

            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white">
                PDFs Merged Successfully
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Combined {items.length} PDF documents into a single document ({formatBytes(successResult.size)}).
              </p>
            </div>

            <div className="w-full space-y-3 pt-2">
              <a
                href={successResult.url}
                download="merged-document.pdf"
                className="w-full flex items-center justify-center gap-2.5 py-3.5 px-6 text-sm sm:text-base font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] rounded-2xl shadow-lg shadow-indigo-600/25 transition-all cursor-pointer"
                id="btn-download-merged-pdf"
              >
                <Download className="w-5 h-5" />
                <span>Download Merged PDF</span>
              </a>

              <div className="flex items-center justify-center gap-4 pt-1">
                <button
                  onClick={() => {
                    setSuccessResult(null);
                    setItems([]);
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Merge More Documents</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Dropzone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 ${
                isDragActive
                  ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20'
                  : 'border-zinc-300 dark:border-zinc-700 hover:border-indigo-400 dark:hover:border-indigo-500 bg-zinc-50/50 dark:bg-zinc-900/30'
              }`}
            >
              <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <Upload className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <p className="text-sm sm:text-base font-bold text-zinc-800 dark:text-zinc-200">
                  Drag & drop PDF files here, or <span className="text-indigo-600 dark:text-indigo-400 underline">browse</span>
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Select multiple PDF documents. Processed securely offline in browser memory.
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf,.pdf"
                multiple
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    handleFilesAdded(e.target.files);
                    e.target.value = '';
                  }
                }}
              />
            </div>

            {/* Error message */}
            {errorMessage && (
              <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 flex items-center gap-3 text-red-700 dark:text-red-300 text-xs sm:text-sm">
                <AlertTriangle className="w-5 h-5 shrink-0 text-red-500" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* File List */}
            {items.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                    Selected PDFs ({items.length}) — Reorder to adjust merge sequence
                  </span>
                  <button
                    onClick={() => setItems([])}
                    className="text-xs text-red-600 dark:text-red-400 hover:underline font-semibold cursor-pointer"
                  >
                    Clear All
                  </button>
                </div>

                <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                  {items.map((item, index) => (
                    <div
                      key={item.id}
                      className="p-4 rounded-xl bg-zinc-50 dark:bg-[#25282c] border border-zinc-200 dark:border-zinc-700/80 flex items-center justify-between gap-4 transition-all"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div className="min-w-0 space-y-0.5">
                          <p className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-white truncate">
                            {item.file.name}
                          </p>
                          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
                            <span>{formatBytes(item.file.size)}</span>
                            <span>•</span>
                            {item.loadingInfo ? (
                              <span className="inline-flex items-center gap-1 text-indigo-500">
                                <Loader2 className="w-3 h-3 animate-spin" /> Counting pages...
                              </span>
                            ) : (
                              <span>{item.pageCount !== undefined ? `${item.pageCount} pages` : 'PDF Document'}</span>
                            )}
                          </p>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          disabled={index === 0}
                          onClick={() => moveItem(index, 'up')}
                          title="Move Up"
                          className="p-2 rounded-lg text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-700 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
                        >
                          <ArrowUp className="w-4 h-4" />
                        </button>
                        <button
                          disabled={index === items.length - 1}
                          onClick={() => moveItem(index, 'down')}
                          title="Move Down"
                          className="p-2 rounded-lg text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-700 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
                        >
                          <ArrowDown className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => removeItem(item.id)}
                          title="Remove File"
                          className="p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/50 transition-colors ml-2 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Merge Action Button */}
                <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    <span>Local Privacy — Processed entirely in browser memory</span>
                  </div>

                  <button
                    disabled={isProcessing || items.length < 2}
                    onClick={handleMerge}
                    className="w-full sm:w-auto px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-sm shadow-lg shadow-indigo-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Merging {items.length} PDFs...</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4" />
                        <span>Merge {items.length} PDF Documents</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Empty state guidance */}
            {items.length === 0 && (
              <div className="text-center py-6 text-zinc-400 text-xs">
                Add at least 2 PDF files above to begin merging.
              </div>
            )}
          </>
        )}

      </div>

      <SeoGuideContent seoData={seoData} onNavigate={onNavigate} />
    </div>
  );
}
