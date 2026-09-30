import React, { useState, useCallback, useRef, useEffect } from 'react';
import { 
  FileText, 
  Upload, 
  Scissors, 
  Download, 
  ShieldCheck, 
  Zap, 
  AlertTriangle, 
  Loader2, 
  CheckCircle2, 
  RefreshCw,
  Layers,
  HelpCircle
} from 'lucide-react';
import { Breadcrumbs } from './Breadcrumbs';
import { SeoRouteData } from '../lib/seoEngine';
import { splitPdfFile, parsePageRanges } from '../lib/pdfSplitMerge';
import { loadPdfDocument, renderPdfPageThumbnail } from '../lib/pdfProcessor';
import { isPdfFile } from '../lib/utils';

import { SeoGuideContent } from './Converter/SeoGuideContent';

interface PdfSplitterPageProps {
  seoData: SeoRouteData;
  onNavigate: (path: string) => void;
}

export function PdfSplitterPage({ seoData, onNavigate }: PdfSplitterPageProps) {
  const [file, setFile] = useState<File | null>(null);
  const [pdfDoc, setPdfDoc] = useState<any | null>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [loadingPdf, setLoadingPdf] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [rangeInput, setRangeInput] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [successResult, setSuccessResult] = useState<{ url: string; filename: string; size: number; count: number } | null>(null);
  const [thumbnails, setThumbnails] = useState<Record<number, string>>({});

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragActive, setIsDragActive] = useState(false);

  const activeRequestIdRef = useRef<number>(0);
  const thumbnailsRef = useRef<Record<number, string>>({});
  const successResultRef = useRef<{ url: string; filename: string; size: number; count: number } | null>(null);

  const revokeThumbnails = useCallback(() => {
    Object.values(thumbnailsRef.current).forEach((url) => {
      if (url && url.startsWith('blob:')) {
        try {
          URL.revokeObjectURL(url);
        } catch (e) {}
      }
    });
    thumbnailsRef.current = {};
    setThumbnails({});
  }, []);

  const cleanupResults = useCallback(() => {
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
      activeRequestIdRef.current += 1;
      cleanupResults();
      revokeThumbnails();
    };
  }, [cleanupResults, revokeThumbnails]);

  const handleReset = useCallback(() => {
    activeRequestIdRef.current += 1;
    cleanupResults();
    revokeThumbnails();
    setFile(null);
    setPdfDoc(null);
    setNumPages(0);
    setRangeInput('');
    setErrorMessage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [cleanupResults, revokeThumbnails]);

  const processPdfFile = useCallback(async (selectedFile: File) => {
    if (!isPdfFile(selectedFile)) {
      setErrorMessage('Please select a valid PDF file (.pdf).');
      return;
    }

    const currentReqId = ++activeRequestIdRef.current;
    setLoadingPdf(true);
    setErrorMessage(null);
    cleanupResults();
    revokeThumbnails();
    setFile(selectedFile);

    try {
      const buffer = await selectedFile.arrayBuffer();
      if (activeRequestIdRef.current !== currentReqId) return;

      const doc = await loadPdfDocument(buffer);
      if (activeRequestIdRef.current !== currentReqId) return;

      setPdfDoc(doc);
      setNumPages(doc.numPages);
      setRangeInput(`1-${Math.min(doc.numPages, 3)}`);

      // Load thumbnail previews for up to 30 pages
      const limit = Math.min(doc.numPages, 30);
      for (let i = 1; i <= limit; i++) {
        renderPdfPageThumbnail(doc, i, 160).then((url) => {
          if (activeRequestIdRef.current !== currentReqId) {
            if (url && url.startsWith('blob:')) {
              try {
                URL.revokeObjectURL(url);
              } catch (e) {}
            }
            return;
          }
          thumbnailsRef.current[i] = url;
          setThumbnails((prev) => ({ ...prev, [i]: url }));
        }).catch(() => {});
      }
    } catch (err: any) {
      if (activeRequestIdRef.current !== currentReqId) return;
      setErrorMessage(err.message || 'Failed to parse PDF document.');
      setFile(null);
      setPdfDoc(null);
    } finally {
      if (activeRequestIdRef.current === currentReqId) {
        setLoadingPdf(false);
      }
    }
  }, [cleanupResults, revokeThumbnails]);

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
      processPdfFile(e.dataTransfer.files[0]);
    }
  };

  const handleSplit = async () => {
    if (!file || !pdfDoc || isProcessing) return;

    const currentReqId = ++activeRequestIdRef.current;
    setIsProcessing(true);
    setErrorMessage(null);
    cleanupResults();

    try {
      const pageNumbers = parsePageRanges(rangeInput, numPages);
      const splitBytes = await splitPdfFile(file, pageNumbers);
      if (activeRequestIdRef.current !== currentReqId) return;

      const blob = new Blob([splitBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      if (activeRequestIdRef.current !== currentReqId) {
        URL.revokeObjectURL(url);
        return;
      }
      const filename = `${file.name.replace(/\.[^/.]+$/, '')}-extracted-${pageNumbers.length}pages.pdf`;

      const result = {
        url,
        filename,
        size: blob.size,
        count: pageNumbers.length,
      };
      successResultRef.current = result;
      setSuccessResult(result);
    } catch (err: any) {
      if (activeRequestIdRef.current !== currentReqId) return;
      setErrorMessage(err.message || 'Failed to split PDF document.');
    } finally {
      if (activeRequestIdRef.current === currentReqId) {
        setIsProcessing(false);
      }
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
    <div className="max-w-5xl mx-auto px-2 sm:px-4 py-2 sm:py-3 space-y-4 sm:space-y-5">
      {/* Screen Reader Announcement */}
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {successResult ? `PDF split complete. Extracted ${successResult.count} pages. Download size is ${formatBytes(successResult.size)}.` : ''}
      </div>

      {/* Main Workspace Card */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-2xs overflow-hidden p-3.5 sm:p-5 space-y-4">
        
        {/* State A: Success Result View */}
        {successResult ? (
          <div className="flex flex-col items-center gap-4 py-2 max-w-lg mx-auto text-center animate-in fade-in zoom-in-98 duration-300">
            <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-2xs">
              <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
            </div>

            <div className="space-y-0.5">
              <h2 className="text-lg sm:text-xl font-black text-zinc-900 dark:text-white">
                PDF Pages Extracted
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Successfully extracted <span className="font-semibold text-zinc-800 dark:text-zinc-200">{successResult.count} {successResult.count === 1 ? 'page' : 'pages'}</span> from {file?.name || 'document'} ({formatBytes(successResult.size)}).
              </p>
            </div>

            <div className="w-full space-y-2.5 pt-1">
              <a
                href={successResult.url}
                download={successResult.filename}
                className="w-full flex items-center justify-center gap-2 py-3 px-5 text-sm sm:text-base font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] rounded-xl shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
                id="btn-download-split-pdf"
              >
                <Download className="w-4 h-4" />
                <span>Download PDF</span>
              </a>

              <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 pt-0.5">
                <button
                  onClick={cleanupResults}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Adjust range</span>
                </button>

                <span className="hidden sm:inline text-zinc-300 dark:text-zinc-700">•</span>

                <button
                  onClick={handleReset}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline transition-colors cursor-pointer"
                >
                  <span>New file</span>
                </button>
              </div>
            </div>
          </div>
        ) : !file ? (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-5 sm:p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${
              isDragActive
                ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20'
                : 'border-zinc-300 dark:border-zinc-700 hover:border-indigo-400 dark:hover:border-indigo-500 bg-zinc-50/50 dark:bg-zinc-900/30'
            }`}
          >
            <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Upload className="w-5 h-5" />
            </div>
            <div className="space-y-0.5">
              <p className="text-xs sm:text-sm font-bold text-zinc-800 dark:text-zinc-200">
                Drag & drop a PDF document here, or <span className="text-indigo-600 dark:text-indigo-400 underline">browse</span>
              </p>
              <p className="text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400">
                Processed entirely offline in browser memory. Zero cloud uploads.
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf,.pdf"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  processPdfFile(e.target.files[0]);
                  e.target.value = '';
                }
              }}
            />
          </div>
        ) : (
          <div className="space-y-4">
            {/* File info header */}
            <div className="p-2.5 sm:p-3 rounded-xl bg-zinc-50 dark:bg-[#25282c] border border-zinc-200 dark:border-zinc-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="min-w-0 space-y-0.5">
                  <p className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-white truncate">
                    {file.name}
                  </p>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    {formatBytes(file.size)} • {loadingPdf ? 'Loading...' : `${numPages} Pages`}
                  </p>
                </div>
              </div>

              <button
                onClick={handleReset}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-300 transition-colors shrink-0 self-start sm:self-center cursor-pointer"
              >
                Change PDF
              </button>
            </div>

            {/* Range Input Section */}
            <div className="space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                  <span>Enter Pages or Ranges to Extract</span>
                </label>
                <span className="text-xs text-zinc-400 font-mono">
                  Example: 1-3, 5, 7-10
                </span>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={rangeInput}
                  onChange={(e) => setRangeInput(e.target.value)}
                  placeholder="e.g. 1-4, 6, 8-10"
                  className="w-full flex-1 min-w-0 px-3 py-2 text-xs sm:text-sm bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-smooth"
                />
                <button
                  disabled={isProcessing || !rangeInput.trim()}
                  onClick={handleSplit}
                  className="w-full sm:w-auto justify-center px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs sm:text-sm shadow-sm transition-smooth flex items-center gap-2 shrink-0 cursor-pointer active:scale-[0.98]"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Extracting...</span>
                    </>
                  ) : (
                    <>
                      <Scissors className="w-4 h-4" />
                      <span>Extract</span>
                    </>
                  )}
                </button>
              </div>

              {/* Presets */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-xs text-zinc-400 font-semibold">Quick Presets:</span>
                <button
                  onClick={() => setRangeInput(`1-${numPages}`)}
                  className="px-2.5 py-1 rounded-lg text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-indigo-100 dark:hover:bg-indigo-950 transition-colors"
                >
                  All ({numPages} pages)
                </button>
                <button
                  onClick={() => setRangeInput('1')}
                  className="px-2.5 py-1 rounded-lg text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-indigo-100 dark:hover:bg-indigo-950 transition-colors"
                >
                  First Page (1)
                </button>
                <button
                  onClick={() => setRangeInput(`${numPages}`)}
                  className="px-2.5 py-1 rounded-lg text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-indigo-100 dark:hover:bg-indigo-950 transition-colors"
                >
                  Last Page ({numPages})
                </button>
              </div>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 flex items-center gap-3 text-red-700 dark:text-red-300 text-xs sm:text-sm">
                <AlertTriangle className="w-5 h-5 shrink-0 text-red-500" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Page Previews Grid */}
            {numPages > 0 && (
              <div className="space-y-3 pt-2">
                <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Page Previews ({numPages} total pages)
                </span>
                <div className="grid grid-cols-3 sm:grid-cols-6 md:grid-cols-8 gap-3 max-h-64 overflow-y-auto p-2 bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border border-zinc-200 dark:border-zinc-800">
                  {Array.from({ length: Math.min(numPages, 100) }, (_, i) => i + 1).map((pageNum) => (
                    <div
                      key={pageNum}
                      className="group relative bg-white dark:bg-[#25282c] rounded-xl border border-zinc-200 dark:border-zinc-700 p-2 flex flex-col items-center gap-1.5 shadow-2xs"
                    >
                      <div className="w-full aspect-[3/4] bg-zinc-100 dark:bg-zinc-800 rounded-lg overflow-hidden flex items-center justify-center">
                        {thumbnails[pageNum] ? (
                          <img
                            src={thumbnails[pageNum]}
                            alt={`Page ${pageNum}`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-[10px] font-mono text-zinc-400">P.{pageNum}</span>
                        )}
                      </div>
                      <span className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300">
                        {pageNum}
                      </span>
                    </div>
                  ))}
                  {numPages > 100 && (
                    <div className="col-span-full py-4 text-center text-xs text-zinc-400">
                      Preview limited to first 100 pages. You can still extract any page up to {numPages}.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

      </div>

      <SeoGuideContent seoData={seoData} onNavigate={onNavigate} />
    </div>
  );
}
