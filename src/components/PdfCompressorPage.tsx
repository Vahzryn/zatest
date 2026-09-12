import React, { useState, useCallback, useRef } from 'react';
import { 
  FileText, 
  Upload, 
  Download, 
  ShieldCheck, 
  Zap, 
  AlertTriangle, 
  Loader2, 
  CheckCircle2, 
  RefreshCw,
  Settings2,
  FileDown
} from 'lucide-react';
import { Breadcrumbs } from './Breadcrumbs';
import { SeoRouteData } from '../lib/seoEngine';
import { loadPdfDocument, renderPdfPageToJpg } from '../lib/pdfProcessor';
import { SeoGuideContent } from './Converter/SeoGuideContent';

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

interface PdfCompressorPageProps {
  seoData: SeoRouteData;
  onNavigate: (path: string) => void;
}

type CompressionLevel = 'low' | 'medium' | 'high' | 'extreme';

export function PdfCompressorPage({ seoData, onNavigate }: PdfCompressorPageProps) {
  const [file, setFile] = useState<File | null>(null);
  const [pdfDoc, setPdfDoc] = useState<any | null>(null);
  const [numPages, setNumPages] = useState<number>(0);
  
  const [compressionLevel, setCompressionLevel] = useState<CompressionLevel>('medium');
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successResult, setSuccessResult] = useState<{ url: string; filename: string; originalSize: number; newSize: number } | null>(null);
  
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (selectedFile: File) => {
    if (selectedFile.type !== 'application/pdf') {
      setErrorMessage('Please upload a valid PDF file.');
      return;
    }

    setErrorMessage(null);
    setSuccessResult(null);
    setFile(selectedFile);
    setLoadingPdf(true);

    try {
      const arrayBuffer = await selectedFile.arrayBuffer();
      const doc = await loadPdfDocument(arrayBuffer);
      setPdfDoc(doc);
      setNumPages(doc.numPages);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load PDF.');
      setFile(null);
      setPdfDoc(null);
    } finally {
      setLoadingPdf(false);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) handleFile(droppedFile);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
  }, []);

  const handleCompress = async () => {
    if (!file || !pdfDoc || numPages === 0) return;
    
    setIsProcessing(true);
    setErrorMessage(null);
    setProgressPercent(0);
    
    try {
      // Determine rasterization settings based on compression level
      // Lower scale = smaller resolution. Lower quality = higher JPEG compression.
      let scale = 1.0;
      let quality = 0.75;
      
      switch (compressionLevel) {
        case 'low':
          scale = 1.5;
          quality = 0.85;
          break;
        case 'medium':
          scale = 1.0;
          quality = 0.65;
          break;
        case 'high':
          scale = 0.75;
          quality = 0.50;
          break;
        case 'extreme':
          scale = 0.5;
          quality = 0.30;
          break;
      }

      const { jsPDF } = await import('jspdf');
      const pdf = new jsPDF({ unit: 'px' });
      pdf.deletePage(1); // Remove default empty page

      for (let i = 1; i <= numPages; i++) {
        const rendered = await renderPdfPageToJpg(pdfDoc, i, scale, quality);
        const { blob, width, height } = rendered;
        
        const orientation = width > height ? 'l' : 'p';
        pdf.addPage([width, height], orientation);
        
        const arrayBuffer = await blob.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        
        pdf.addImage(uint8Array, 'JPEG', 0, 0, width, height);
        
        setProgressPercent(Math.round((i / numPages) * 100));
      }

      const compressedBlob = pdf.output('blob');
      const url = URL.createObjectURL(compressedBlob);
      
      const dotIdx = file.name.lastIndexOf('.');
      const baseName = dotIdx >= 0 ? file.name.substring(0, dotIdx) : file.name;
      const newFilename = `${baseName}_compressed.pdf`;

      setSuccessResult({
        url,
        filename: newFilename,
        originalSize: file.size,
        newSize: compressedBlob.size
      });
      
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred during compression.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setPdfDoc(null);
    setNumPages(0);
    setErrorMessage(null);
    if (successResult?.url) URL.revokeObjectURL(successResult.url);
    setSuccessResult(null);
    setProgressPercent(0);
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-2 sm:px-4 py-2 sm:py-4 space-y-8">
      {errorMessage && (
        <div className="mb-6 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 p-4 rounded-xl flex items-start gap-3 border border-red-200 dark:border-red-800/30">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <p className="text-sm">{errorMessage}</p>
        </div>
      )}

      {/* Screen Reader Announcement */}
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {successResult 
          ? `PDF compression complete. Reduced from ${formatBytes(successResult.originalSize)} to ${formatBytes(successResult.newSize)}, saving ${Math.max(0, Math.round(100 - (successResult.newSize / successResult.originalSize) * 100))} percent.` 
          : ''}
      </div>

      {/* Main Workspace Card */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-xl overflow-hidden p-6 sm:p-8 space-y-6">
          
          {!file && !loadingPdf && (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`
                relative group flex flex-col items-center justify-center py-20 px-6
                border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-200
                ${isDragActive 
                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10' 
                  : 'border-zinc-300 dark:border-zinc-700 hover:border-indigo-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                }
              `}
            >
              <div className="w-16 h-16 rounded-2xl bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <FileText className="w-8 h-8" />
              </div>
              <p className="text-xl font-medium text-zinc-800 dark:text-zinc-200 mb-2">
                Click or drag PDF file here
              </p>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center max-w-sm">
                Files are processed entirely in your browser. No uploads.
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f);
                }}
              />
            </div>
          )}

          {loadingPdf && (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-4" />
              <p className="text-zinc-600 dark:text-zinc-400 font-medium">Loading document...</p>
            </div>
          )}

          {file && !successResult && !loadingPdf && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-700">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 rounded-lg">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-medium text-zinc-900 dark:text-zinc-100 truncate max-w-[200px] sm:max-w-xs">{file.name}</h3>
                    <p className="text-sm text-zinc-500">{formatBytes(file.size)} • {numPages} pages</p>
                  </div>
                </div>
                <button
                  onClick={handleReset}
                  className="mt-3 sm:mt-0 px-3 py-1.5 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-red-600 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-sm hover:shadow transition-all"
                  disabled={isProcessing}
                >
                  Change File
                </button>
              </div>

              {/* Compression Controls */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <Settings2 className="w-5 h-5 text-zinc-500" />
                  <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">Select Compression Level</h3>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {[
                    { id: 'low', label: 'Low Compression', desc: 'High Quality', scale: '1.5x' },
                    { id: 'medium', label: 'Medium', desc: 'Good Balance', scale: '1.0x' },
                    { id: 'high', label: 'High Compression', desc: 'Lower Quality', scale: '0.75x' },
                    { id: 'extreme', label: 'Extreme', desc: 'Smallest File', scale: '0.5x' }
                  ].map((level) => (
                    <button
                      key={level.id}
                      disabled={isProcessing}
                      onClick={() => setCompressionLevel(level.id as CompressionLevel)}
                      className={`
                        p-4 rounded-xl border-2 text-left transition-all
                        ${compressionLevel === level.id 
                          ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20' 
                          : 'border-zinc-200 dark:border-zinc-700 hover:border-indigo-400 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                        }
                        ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                      `}
                    >
                      <div className="font-medium text-zinc-900 dark:text-zinc-100 mb-1">{level.label}</div>
                      <div className="text-sm text-zinc-500 dark:text-zinc-400">{level.desc}</div>
                    </button>
                  ))}
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">
                  * Compression works by rasterizing document pages securely in your browser to remove hidden bloat and optimize imagery. Text may become slightly blurry at higher compression levels.
                </p>
              </div>

              {/* Action Button */}
              <div className="flex justify-end pt-4 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  onClick={handleCompress}
                  disabled={isProcessing}
                  className={`
                    flex items-center gap-2 px-6 py-3 rounded-xl font-medium text-white shadow-lg transition-all
                    ${isProcessing 
                      ? 'bg-indigo-400 cursor-not-allowed' 
                      : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-indigo-500/25'
                    }
                  `}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Compressing ({progressPercent}%)...
                    </>
                  ) : (
                    <>
                      <Zap className="w-5 h-5" />
                      Compress PDF
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {successResult && (
            <div className="flex flex-col items-center gap-6 py-4 max-w-lg mx-auto text-center animate-in fade-in zoom-in-98 duration-300">
              <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-xs">
                <CheckCircle2 className="w-8 h-8 stroke-[2.5]" />
              </div>

              <div className="space-y-1">
                <h2 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white">
                  PDF Compressed Successfully
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Document size reduced by <span className="font-bold text-emerald-600 dark:text-emerald-400">{Math.max(0, Math.round(100 - (successResult.newSize / successResult.originalSize) * 100))}%</span> with high fidelity.
                </p>
              </div>

              {/* Stat Pill */}
              <div className="w-full bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/70 dark:border-zinc-800/80 rounded-2xl p-4">
                <div className="grid grid-cols-3 divide-x divide-zinc-200 dark:divide-zinc-800 text-center">
                  <div className="px-2">
                    <div className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">Original</div>
                    <div className="text-sm font-bold text-zinc-800 dark:text-zinc-200 line-through opacity-60 mt-0.5">{formatBytes(successResult.originalSize)}</div>
                  </div>
                  <div className="px-2">
                    <div className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">New Size</div>
                    <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{formatBytes(successResult.newSize)}</div>
                  </div>
                  <div className="px-2">
                    <div className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">Reduction</div>
                    <div className="text-sm font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                      {Math.max(0, Math.round(100 - (successResult.newSize / successResult.originalSize) * 100))}%
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="w-full space-y-3 pt-1">
                <a
                  href={successResult.url}
                  download={successResult.filename}
                  className="w-full flex items-center justify-center gap-2.5 py-3.5 px-6 text-sm sm:text-base font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] rounded-2xl shadow-lg shadow-indigo-600/25 transition-all cursor-pointer"
                  id="btn-download-compressed-pdf"
                >
                  <Download className="w-5 h-5" />
                  <span>Download Compressed PDF</span>
                </a>

                <div className="flex items-center justify-center gap-4 pt-1">
                  <button
                    onClick={handleReset}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Compress Another Document</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Dynamic SEO Guide Content */}
        {!isProcessing && !successResult && (
          <SeoGuideContent seoData={seoData} onNavigate={onNavigate} />
        )}
    </div>
  );
}
