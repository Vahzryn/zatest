import React, { useCallback, useState } from 'react';
import { Upload } from 'lucide-react';
import { cn, isSupportedImageFile, CONVERTER_FILE_ACCEPT } from '../lib/utils';

interface DropzoneProps {
  onFilesAdded: (files: File[]) => void;
  fromFormat?: string;
  variant?: 'standard' | 'compact';
}

export function Dropzone({ onFilesAdded, fromFormat, variant = 'standard' }: DropzoneProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [emptyFileMessage, setEmptyFileMessage] = useState<string | null>(null);

  const processFileList = useCallback(
    (rawFiles: File[]) => {
      setEmptyFileMessage(null);
      const validFiles: File[] = [];
      let emptyCount = 0;

      for (const f of rawFiles) {
        if (f.size === 0) {
          emptyCount++;
        } else {
          validFiles.push(f);
        }
      }

      if (emptyCount > 0) {
        setEmptyFileMessage(
          emptyCount === 1
            ? "This file is empty (0 bytes) and can't be processed."
            : `${emptyCount} files are empty (0 bytes) and can't be processed.`
        );
      }

      if (validFiles.length > 0) {
        onFilesAdded(validFiles);
      }
    },
    [onFilesAdded]
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragActive(false);
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragActive(false);
      
      const getAllFilesFromEntries = async (dataTransferItemList: DataTransferItemList): Promise<File[]> => {
        const files: File[] = [];
        
        const readEntriesPromise = (dirReader: any) => {
          return new Promise<any[]>((resolve, reject) => {
            dirReader.readEntries(resolve, reject);
          });
        };

        const traverseFileTree = async (item: any, path?: string) => {
          path = path || "";
          if (item.isFile) {
            await new Promise<void>((resolve, reject) => {
              item.file((file: File) => {
                if (isSupportedImageFile(file)) {
                  files.push(file);
                }
                resolve();
              }, reject);
            });
          } else if (item.isDirectory) {
            const dirReader = item.createReader();
            let entries: any[] = [];
            let readResult = await readEntriesPromise(dirReader);
            while(readResult.length > 0) {
              entries = entries.concat(readResult);
              readResult = await readEntriesPromise(dirReader);
            }
            for (const entry of entries) {
              await traverseFileTree(entry, path + item.name + "/");
            }
          }
        };

        const items = Array.from(dataTransferItemList);
        for (const item of items) {
          const entry = item.webkitGetAsEntry ? item.webkitGetAsEntry() : null;
          if (entry) {
            await traverseFileTree(entry);
          } else if (item.kind === 'file') {
            const file = item.getAsFile();
            if (file && isSupportedImageFile(file)) {
              files.push(file);
            }
          }
        }
        return files;
      };

      let files: File[] = [];
      if (e.dataTransfer.items) {
        files = await getAllFilesFromEntries(e.dataTransfer.items);
      } else {
        files = Array.from(e.dataTransfer.files).filter(isSupportedImageFile);
      }
      
      if (files.length > 0) {
        processFileList(files);
      }
    },
    [processFileList]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        const files = Array.from(e.target.files).filter(isSupportedImageFile);
        if (files.length > 0) {
          processFileList(files);
        }
      }
    },
    [processFileList]
  );

  if (variant === 'compact') {
    return (
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "dropzone-cls-guard min-h-[66px] sm:min-h-[76px] relative flex items-center justify-between w-full py-2 px-3 sm:px-4 transition-smooth border-2 border-dashed rounded-xl cursor-pointer group bg-white/70 dark:bg-zinc-900/70 hover:bg-white dark:hover:bg-[#1e2024] active-press",
          isDragActive 
            ? "border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/40 ring-2 ring-indigo-500/20 animate-dropzone-glow" 
            : "border-zinc-300 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-600"
        )}
      >
        <input
          type="file"
          id="file-upload-input"
          aria-label="Upload files or drop them here"
          multiple
          accept={CONVERTER_FILE_ACCEPT}
          onChange={handleChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
        />

        <div className="flex items-center gap-2.5 sm:gap-3 pointer-events-none w-full">
          {/* Upload Icon */}
          <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-700 shadow-2xs flex items-center justify-center text-zinc-700 dark:text-zinc-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-950/40 transition-smooth shrink-0">
            <Upload className="w-4 h-4" />
          </div>

          {/* Prompt text */}
          <div className="flex-1 min-w-0 text-left">
            <p className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-white tracking-tight truncate">
              Drop files here, or <span className="text-indigo-600 dark:text-indigo-400 underline underline-offset-2 font-bold">browse</span>
            </p>
            <p className="text-[10px] sm:text-[11px] text-zinc-600 dark:text-zinc-400 truncate mt-0.5">
              Batch processing · Offline in browser · Paste (Ctrl+V)
            </p>
          </div>

          {/* Format Chips on Desktop */}
          <div className="hidden md:flex items-center gap-1 shrink-0">
            {['HEIC', 'PNG', 'JPG', 'WEBP', 'AVIF', 'SVG'].map((fmt) => (
              <span key={fmt} className="px-1.5 py-0.5 text-[10px] font-semibold text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-700 rounded transition-smooth">
                {fmt}
              </span>
            ))}
          </div>
        </div>

        {/* Empty file warning */}
        {emptyFileMessage && (
          <div className="absolute top-2 right-2 pointer-events-auto px-2.5 py-1 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 rounded-lg text-xs font-medium text-amber-800 dark:text-amber-200 z-20 flex items-center gap-1.5 shadow-xs">
            <span>⚠️ {emptyFileMessage}</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setEmptyFileMessage(null);
              }}
              className="ml-1 px-1 rounded hover:bg-amber-200/50 dark:hover:bg-amber-800/50 cursor-pointer"
              aria-label="Dismiss warning"
            >
              ✕
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        "dropzone-cls-guard min-h-[150px] sm:min-h-[185px] relative flex flex-col items-center justify-center w-full py-6 sm:py-8 px-4 sm:px-6 transition-smooth border-2 border-dashed rounded-2xl cursor-pointer group active-press shadow-2xs hover:shadow-xs",
        isDragActive 
          ? "border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 ring-2 ring-indigo-500/20 animate-dropzone-glow" 
          : "border-zinc-300 dark:border-zinc-700 bg-white/50 dark:bg-zinc-900/20 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-white dark:hover:bg-zinc-900/60"
      )}
    >
      <input
        type="file"
        id="file-upload-input"
        aria-label="Upload image files or drop them here"
        multiple
        accept={CONVERTER_FILE_ACCEPT}
        onChange={handleChange}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
      />
      
      <div className="flex flex-col items-center gap-2 sm:gap-2.5 pointer-events-none w-full max-w-lg text-center">
        {/* Upload Icon */}
        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-indigo-600 dark:bg-indigo-600 shadow-2xs flex items-center justify-center text-white transition-smooth group-hover:bg-indigo-700 dark:group-hover:bg-indigo-500">
          <Upload className="w-5 h-5" />
        </div>
        
        {/* Empty file warning */}
        {emptyFileMessage && (
          <div className="pointer-events-auto px-3 py-1 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 rounded-lg text-xs font-medium text-amber-800 dark:text-amber-200 z-20 flex items-center gap-1.5 shadow-sm">
            <span>⚠️ {emptyFileMessage}</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setEmptyFileMessage(null);
              }}
              className="ml-1 px-1 rounded hover:bg-amber-200/50 dark:hover:bg-amber-800/50 cursor-pointer"
              aria-label="Dismiss warning"
            >
              ✕
            </button>
          </div>
        )}

        {/* Primary Prompt */}
        <div className="space-y-1">
          <p className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-white tracking-tight">
            Drop {fromFormat ? <span className="uppercase text-indigo-600 dark:text-indigo-400">{fromFormat}</span> : "files"} here, or <span className="text-indigo-600 dark:text-indigo-400 font-bold group-hover:underline underline-offset-4">choose files</span>
          </p>
          
          {/* Format Badges */}
          <div className="flex flex-wrap justify-center gap-1 pt-0.5">
            {(fromFormat ? [fromFormat.toUpperCase()] : ['HEIC', 'PNG', 'JPG', 'WEBP', 'AVIF', 'SVG']).map((fmt) => (
              <span key={fmt} className="px-1.5 py-0.2 text-[9px] sm:text-[10px] font-bold text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded tracking-wide shadow-2xs">
                {fmt}
              </span>
            ))}
          </div>
          <div className="flex items-center justify-center gap-1.5 pt-1 text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">
            <span>Batch processing supported</span>
            <span>•</span>
            <span className="inline-flex items-center gap-1">
              <kbd className="px-1 py-0.2 rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 font-mono text-[9px] text-zinc-600 dark:text-zinc-400">Ctrl+V</kbd>
              <span>to paste</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

