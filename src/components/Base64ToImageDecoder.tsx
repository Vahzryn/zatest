import React, { useState, useEffect, useRef } from 'react';
import { 
  FileImage, 
  Download, 
  Copy, 
  Check, 
  RefreshCw, 
  AlertTriangle,
  Code,
  Image as ImageIcon
} from 'lucide-react';

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

interface Base64ToImageDecoderProps {
  onNavigate?: (path: string) => void;
}

export function Base64ToImageDecoder({ onNavigate }: Base64ToImageDecoderProps) {
  const [base64Input, setBase64Input] = useState<string>('');
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);
  const [fileSize, setFileSize] = useState<number>(0);
  const [mimeType, setMimeType] = useState<string>('image/png');
  const [isCopied, setIsCopied] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setBase64Input(val);
    processBase64(val);
  };

  const processBase64 = (val: string) => {
    setError(null);
    setImgSrc(null);
    setDimensions(null);
    setFileSize(0);

    if (!val.trim()) return;

    let src = val.trim();
    
    // Auto-fix if it's missing the data URI scheme but looks like base64
    if (!src.startsWith('data:image/')) {
      // Basic check if it's valid base64 chars
      if (/^[a-zA-Z0-9+/=]+$/.test(src.replace(/\s/g, ''))) {
        src = 'data:image/png;base64,' + src;
      } else {
        setError('Input does not appear to be a valid Base64 encoded image string.');
        return;
      }
    }

    // Try to extract mime type
    const mimeMatch = src.match(/^data:(image\/[^;]+);base64,/);
    if (mimeMatch && mimeMatch[1]) {
      setMimeType(mimeMatch[1]);
    } else {
      setMimeType('image/png'); // fallback
    }

    // Calculate approximate size
    const base64Data = src.split(',')[1] || src;
    const padding = (base64Data.match(/=+$/) || [''])[0].length;
    const size = Math.floor((base64Data.length * 3) / 4) - padding;
    setFileSize(Math.max(0, size));

    const img = new Image();
    img.onload = () => {
      setDimensions({ width: img.width, height: img.height });
      setImgSrc(src);
    };
    img.onerror = () => {
      setError('Failed to decode image. The Base64 string may be corrupted or invalid.');
    };
    img.src = src;
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setBase64Input(text);
      processBase64(text);
    } catch (err) {
      console.error('Failed to read clipboard', err);
    }
  };

  const clearAll = () => {
    setBase64Input('');
    setImgSrc(null);
    setError(null);
    setDimensions(null);
    setFileSize(0);
  };

  return (
    <div className="max-w-5xl mx-auto px-2 sm:px-4 py-2 sm:py-4 space-y-8 animate-in fade-in duration-500">
      <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-xl overflow-hidden p-6 sm:p-8 space-y-6">
        
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <Code className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              Base64 String Input
            </label>
            {base64Input && (
              <button
                onClick={clearAll}
                className="text-xs font-semibold text-zinc-500 hover:text-zinc-900 dark:hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Clear
              </button>
            )}
          </div>
          <textarea
            value={base64Input}
            onChange={handleInputChange}
            placeholder="Paste your Base64 encoded image string here... (e.g., data:image/png;base64,iVBORw0KGgo...)"
            className="w-full h-40 sm:h-56 p-4 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 text-sm font-mono text-zinc-800 dark:text-zinc-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-y transition-smooth"
            spellCheck={false}
          />
          {!base64Input && (
            <div className="flex justify-end">
              <button
                onClick={handlePaste}
                className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg text-sm font-semibold transition-colors cursor-pointer"
              >
                Paste from Clipboard
              </button>
            </div>
          )}
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
            <p className="text-sm font-medium text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {imgSrc && dimensions && (
          <div className="space-y-6 pt-4 border-t border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                Decoded Image Preview
              </h3>
              <div className="flex items-center gap-4 text-sm">
                <span className="font-medium text-zinc-500 dark:text-zinc-400">
                  {dimensions.width} × {dimensions.height} px
                </span>
                <span className="text-zinc-300 dark:text-zinc-600">|</span>
                <span className="font-medium text-zinc-500 dark:text-zinc-400">
                  {formatBytes(fileSize)}
                </span>
                <span className="text-zinc-300 dark:text-zinc-600">|</span>
                <span className="font-mono text-xs text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded">
                  {mimeType}
                </span>
              </div>
            </div>

            <div className="relative rounded-2xl border border-zinc-200/60 dark:border-zinc-800 bg-zinc-50/50 dark:bg-[#121417] p-4 flex items-center justify-center min-h-[200px] overflow-hidden"
                 style={{ 
                   backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'20\' height=\'20\' viewBox=\'0 0 20 20\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'%239C92AC\' fill-opacity=\'0.1\' fill-rule=\'evenodd\'%3E%3Ccircle cx=\'3\' cy=\'3\' r=\'3\'/%3E%3Ccircle cx=\'13\' cy=\'13\' r=\'3\'/%3E%3C/g%3E%3C/svg%3E")',
                 }}>
              <img 
                src={imgSrc} 
                alt="Decoded Base64" 
                className="max-w-full max-h-[500px] object-contain rounded shadow-sm"
              />
            </div>

            <div className="flex justify-end pt-2">
              <a
                href={imgSrc}
                download={`decoded-image.${mimeType.split('/')[1] || 'png'}`}
                className="flex items-center justify-center gap-2.5 py-3 px-6 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] rounded-xl shadow-sm transition-smooth cursor-pointer"
              >
                <Download className="w-5 h-5" />
                <span>Download Image</span>
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
