import React, { useState, useCallback, useRef } from 'react';
import {
  Upload,
  Copy,
  Check,
  FileCode,
  RefreshCw,
  Image as ImageIcon,
  AlertTriangle,
  FileImage,
  ArrowRight,
  ShieldAlert
} from 'lucide-react';

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

interface ImageToBase64ConverterProps {
  onNavigate?: (path: string) => void;
}

export function ImageToBase64Converter({ onNavigate }: ImageToBase64ConverterProps) {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [dataUrl, setDataUrl] = useState<string>('');
  const [rawBase64, setRawBase64] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Clipboard copy status
  const [copiedType, setCopiedType] = useState<'complete' | 'raw' | null>(null);
  
  const [isDragActive, setIsDragActive] = useState(false);

  const processImageFile = useCallback((selectedFile: File) => {
    if (!selectedFile.type.startsWith('image/')) {
      setErrorMessage('Please select a valid image file (PNG, JPG, WEBP, SVG, etc.).');
      return;
    }

    // Safety constraint: Warn but allow files up to 15MB to prevent memory crashes
    if (selectedFile.size > 15 * 1024 * 1024) {
      setErrorMessage('The image is extremely large (above 15MB). Encoding may cause browser instability.');
    } else {
      setErrorMessage(null);
    }

    setFile(selectedFile);
    setLoading(true);

    // Create a local object URL for rendering the standard image tag preview (efficient)
    const objectUrl = URL.createObjectURL(selectedFile);
    setPreviewUrl(objectUrl);

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setDataUrl(result);
        const commaIndex = result.indexOf(',');
        if (commaIndex !== -1) {
          setRawBase64(result.substring(commaIndex + 1));
        } else {
          setRawBase64(result);
        }
      }
      setLoading(false);
    };

    reader.onerror = () => {
      setErrorMessage('Failed to read the image file.');
      setLoading(false);
    };

    reader.readAsDataURL(selectedFile);
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

  const handleReset = useCallback(() => {
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    setFile(null);
    setPreviewUrl(null);
    setDataUrl('');
    setRawBase64('');
    setErrorMessage(null);
    setCopiedType(null);
  }, [previewUrl]);

  const copyToClipboard = (text: string, type: 'complete' | 'raw') => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedType(type);
      setTimeout(() => setCopiedType(null), 2000);
    }).catch(() => {
      alert('Failed to copy text. Please select and copy manually.');
    });
  };

  // Truncate output representation for DOM performance (rendering 10MB text blocks freezes the browser)
  const getTruncatedDisplay = (text: string) => {
    if (text.length <= 3000) return text;
    return `${text.substring(0, 1500)}\n\n[... ${text.length - 3000} characters truncated for layout performance. Click "Copy" above to copy the full string safely from memory ...]\n\n${text.substring(text.length - 1500)}`;
  };

  return (
    <div className="w-full bg-white dark:bg-[#292a2d] border border-zinc-200/80 dark:border-zinc-800 rounded-3xl p-4 sm:p-6 shadow-sm mb-6 animate-in fade-in duration-300">
      <div className="flex flex-col gap-4">
        {/* Header Block */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-100 dark:border-zinc-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl text-indigo-600 dark:text-indigo-400">
              <FileCode className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-white">Image to Base64 Encoder</h2>
              <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
                Convert image pixels directly into inline Data URLs and base64 strings.
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

        {/* Workspace Dropzone Area */}
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
            onClick={() => document.getElementById('base64-file-input')?.click()}
          >
            <input
              id="base64-file-input"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileInputChange}
            />
            <div className="p-4 bg-white dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 rounded-2xl shadow-sm mb-4">
              <Upload className="w-8 h-8 text-zinc-400 dark:text-zinc-500 animate-pulse" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-zinc-800 dark:text-white mb-1">
              Drag & Drop Your Image Here
            </h3>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 max-w-xs mb-4">
              Supports PNG, JPEG, WebP, SVG, and more. Encoded client-side in your browser.
            </p>
            <button className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-sm hover:shadow transition-all">
              Choose Local Image
            </button>
          </div>
        )}

        {/* Result & Processing Interface */}
        {file && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-2">
            {/* Left Side: Preview & Specs */}
            <div className="lg:col-span-4 flex flex-col gap-4">
              <div className="border border-zinc-100 dark:border-zinc-800 bg-zinc-50/40 dark:bg-zinc-800/20 p-4 rounded-3xl flex flex-col gap-4">
                <h3 className="text-xs font-bold text-zinc-400 dark:text-zinc-400 uppercase tracking-wider">
                  Source Image Specification
                </h3>
                
                {previewUrl && (
                  <div className="relative aspect-video sm:aspect-square w-full rounded-2xl overflow-hidden bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center">
                    <img
                      src={previewUrl}
                      alt="Source file preview"
                      referrerPolicy="no-referrer"
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                )}

                <div className="flex flex-col gap-2.5 text-xs">
                  <div className="flex justify-between border-b border-zinc-100 dark:border-zinc-800/80 pb-2">
                    <span className="text-zinc-500">File Name</span>
                    <span className="font-bold text-zinc-800 dark:text-white truncate max-w-[180px]">{file.name}</span>
                  </div>
                  <div className="flex justify-between border-b border-zinc-100 dark:border-zinc-800/80 pb-2">
                    <span className="text-zinc-500">MIME Type</span>
                    <span className="font-bold text-zinc-800 dark:text-white">{file.type || 'image/unknown'}</span>
                  </div>
                  <div className="flex justify-between border-b border-zinc-100 dark:border-zinc-800/80 pb-2">
                    <span className="text-zinc-500">Raw Size</span>
                    <span className="font-bold text-zinc-800 dark:text-white">{formatBytes(file.size)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Base64 Length</span>
                    <span className="font-bold text-zinc-800 dark:text-white">
                      {loading ? 'Encoding...' : formatBytes(dataUrl.length)}
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleReset}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-white text-xs font-bold rounded-xl transition-all"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Convert Another Image</span>
                </button>
              </div>
            </div>

            {/* Right Side: Copyable Base64 Output Fields */}
            <div className="lg:col-span-8 flex flex-col gap-6">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3 border border-zinc-100 dark:border-zinc-800 rounded-3xl">
                  <Loader2Icon className="w-8 h-8 text-indigo-600 animate-spin" />
                  <span className="text-xs sm:text-sm font-semibold text-zinc-500">Reading image buffers & encoding...</span>
                </div>
              ) : (
                <React.Fragment>
                  {/* Panel 1: Complete HTML/CSS Data URL */}
                  <div className="border border-zinc-200/80 dark:border-zinc-800 rounded-3xl p-4 flex flex-col gap-3 bg-zinc-50/10">
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg text-indigo-600 dark:text-indigo-400">
                          <FileImage className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-zinc-800 dark:text-white">Complete Data URL</h4>
                          <p className="text-[10px] text-zinc-400">Best for HTML <code>&lt;img src=&quot;...&quot;&gt;</code> or CSS backgrounds.</p>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => copyToClipboard(dataUrl, 'complete')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer ${
                          copiedType === 'complete'
                            ? 'bg-green-600 text-white hover:bg-green-700'
                            : 'bg-indigo-600 text-white hover:bg-indigo-700'
                        }`}
                      >
                        {copiedType === 'complete' ? (
                          <React.Fragment>
                            <Check className="w-3.5 h-3.5" />
                            <span>Copied Complete!</span>
                          </React.Fragment>
                        ) : (
                          <React.Fragment>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy Complete Data URL</span>
                          </React.Fragment>
                        )}
                      </button>
                    </div>

                    <div className="relative">
                      <textarea
                        readOnly
                        value={getTruncatedDisplay(dataUrl)}
                        className="w-full h-28 p-3 text-xs font-mono bg-zinc-900 text-zinc-300 dark:text-zinc-400 border border-zinc-800 rounded-xl focus:outline-none resize-none overflow-y-auto leading-relaxed"
                      />
                    </div>
                  </div>

                  {/* Panel 2: Raw Base64 Payload */}
                  <div className="border border-zinc-200/80 dark:border-zinc-800 rounded-3xl p-4 flex flex-col gap-3 bg-zinc-50/10">
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg text-indigo-600 dark:text-indigo-400">
                          <FileCode className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-zinc-800 dark:text-white">Raw Base64 Payload</h4>
                          <p className="text-[10px] text-zinc-400">Pure base64 string without MIME formatting headers.</p>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => copyToClipboard(rawBase64, 'raw')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer ${
                          copiedType === 'raw'
                            ? 'bg-green-600 text-white hover:bg-green-700'
                            : 'bg-indigo-600 text-white hover:bg-indigo-700'
                        }`}
                      >
                        {copiedType === 'raw' ? (
                          <React.Fragment>
                            <Check className="w-3.5 h-3.5" />
                            <span>Copied Raw!</span>
                          </React.Fragment>
                        ) : (
                          <React.Fragment>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy Raw Payload</span>
                          </React.Fragment>
                        )}
                      </button>
                    </div>

                    <div className="relative">
                      <textarea
                        readOnly
                        value={getTruncatedDisplay(rawBase64)}
                        className="w-full h-28 p-3 text-xs font-mono bg-zinc-900 text-zinc-300 dark:text-zinc-400 border border-zinc-800 rounded-xl focus:outline-none resize-none overflow-y-auto leading-relaxed"
                      />
                    </div>
                  </div>
                </React.Fragment>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Loader2Icon({ className }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  );
}
