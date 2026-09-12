import { useState, useRef, useEffect, useCallback } from 'react';
import { ImageFileItem, ConversionSettings, TargetFormat } from '../types';
import { detectHardwareCapabilities, checkBatteryThrottling, getBatchThresholds, estimateDeviceMemoryBudget, estimateConversionMemoryCost, estimateProcessingWorkload } from '../lib/hardwareCapabilities';
import { formatBytes, formatOutputFilename, getExtensionFromMime, getEffectiveTargetFormat } from '../lib/utils';
import { safeRandomUUID } from '../lib/capabilities';
import { saveFilesToDirectory, downloadBlob } from '../lib/fileSystemAccess';
import { terminateWorkers } from '../lib/imageProcessor';

interface UseBatchConversionProps {
  settings: ConversionSettings;
  setSettings: React.Dispatch<React.SetStateAction<ConversionSettings>>;
}

export function useBatchConversion({ settings, setSettings }: UseBatchConversionProps) {
  const [files, setFiles] = useState<ImageFileItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isStopping, setIsStopping] = useState(false);
  const [etaText, setEtaText] = useState<string>('');
  const [processingSpeed, setProcessingSpeed] = useState<string>('');
  const [concurrencyProfile, setConcurrencyProfile] = useState<string>('');
  const [hasConvertedInSession, setHasConvertedInSession] = useState(false);
  const [lastBatchDuration, setLastBatchDuration] = useState<string>('');
  const [selectedFileIds, setSelectedFileIds] = useState<Set<string>>(new Set());
  const [showLowTierWarning, setShowLowTierWarning] = useState(false);
  const [stalledResetMessage, setStalledResetMessage] = useState<string | null>(null);

  const [isLargeBatchBannerDismissed, setIsLargeBatchBannerDismissed] = useState(false);
  const [isAutoChunkedBannerDismissed, setIsAutoChunkedBannerDismissed] = useState(false);

  const [directoryHandle, setDirectoryHandle] = useState<any | null>(null);
  const [hasDirectoryPicker, setHasDirectoryPicker] = useState(false);

  const handleSelectDirectory = useCallback(async () => {
    if (typeof window === 'undefined' || !('showDirectoryPicker' in window)) {
      return;
    }
    try {
      const handle = await (window as any).showDirectoryPicker({ mode: 'readwrite' });
      setDirectoryHandle(handle);
      return handle;
    } catch (err: any) {
      if (err?.name !== 'AbortError') {
        console.error('Directory Picker Error:', err);
      }
    }
  }, []);

  const handleDisconnectDirectory = useCallback(() => {
    setDirectoryHandle(null);
  }, []);

  const writeResultToDirectory = useCallback(async (handle: any, fileName: string, blob: Blob): Promise<boolean> => {
    try {
      const fileHandle = await handle.getFileHandle(fileName, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(blob);
      await writable.close();
      return true;
    } catch (err) {
      console.error(`Failed to write ${fileName} to folder:`, err);
      return false;
    }
  }, []);

  // Global unhandled promise rejection listener integration
  useEffect(() => {
    const handleGlobalRejection = (e: Event) => {
      const customEvent = e as CustomEvent;
      const errorMsg = customEvent.detail?.message || '';
      
      setFiles(prev => {
        let matched = false;
        const nextFiles = prev.map(f => {
          if (f.status === 'processing') {
            const matchesName = errorMsg && f.file.name && errorMsg.includes(f.file.name);
            if (matchesName) {
              matched = true;
              return {
                ...f,
                status: 'error' as const,
                error: 'Unhandled operation failure'
              };
            }
          }
          return f;
        });
        
        return matched ? nextFiles as ImageFileItem[] : prev;
      });
    };

    setHasDirectoryPicker(typeof window !== 'undefined' && 'showDirectoryPicker' in window);
    window.addEventListener('zapixal-unhandled-rejection' as any, handleGlobalRejection);
    return () => {
      window.removeEventListener('zapixal-unhandled-rejection' as any, handleGlobalRejection);
    };
  }, []);

  // Watchdog timer to detect stalled processing
  useEffect(() => {
    if (!isProcessing) return;

    const processingStartedAt = Date.now();
    let lastProgressAt = Date.now();
    let lastCompletedCount = completedBatchCountRef.current;

    const intervalId = setInterval(() => {
      const now = Date.now();
      const currentCompleted = completedBatchCountRef.current;

      if (currentCompleted !== lastCompletedCount) {
        lastCompletedCount = currentCompleted;
        lastProgressAt = now;
      }

      const totalElapsed = now - processingStartedAt;
      const noProgressElapsed = now - lastProgressAt;

      // Watchdog conditions: total processing > 45s AND no progress for > 20s
      if (totalElapsed > 45000 && noProgressElapsed > 20000) {
        console.warn('Watchdog: Batch processing has stalled. Resetting in-progress files.');
        
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }

        setFiles(prev =>
          prev.map(f =>
            f.status === 'processing'
              ? {
                  ...f,
                  status: 'pending' as const,
                  progress: 0,
                  error: undefined,
                }
              : f
          )
        );

        setIsProcessing(false);
        setIsStopping(false);
        setStalledResetMessage('Conversion stalled and was reset — you can try converting again.');

        try {
          terminateWorkers();
        } catch (e) {
          console.error('Failed to terminate workers in watchdog:', e);
        }

        clearInterval(intervalId);
      }
    }, 1000);

    return () => {
      clearInterval(intervalId);
    };
  }, [isProcessing]);

  const isProcessingRef = useRef(false);
  useEffect(() => {
    isProcessingRef.current = isProcessing;
  }, [isProcessing]);

  const filesRef = useRef<ImageFileItem[]>(files);
  useEffect(() => {
    filesRef.current = files;
  }, [files]);

  const lastEtaUpdateTsRef = useRef<number>(0);

  const abortControllerRef = useRef<AbortController | null>(null);
  const batchStartTimeRef = useRef<number>(0);
  const completedBatchCountRef = useRef<number>(0);
  const totalBatchCountRef = useRef<number>(0);
  const completedWorkloadRef = useRef<number>(0);
  const totalWorkloadRef = useRef<number>(0);
  const throughputHistoryRef = useRef<number[]>([]);
  const recentWorkSamplesRef = useRef<{ timestamp: number; work: number }[]>([]);
  const lastEtaSecRef = useRef<number | null>(null);

  useEffect(() => {
    if (!hasConvertedInSession && files.some(f => f.status === 'success')) {
      setHasConvertedInSession(true);
    }
  }, [files, hasConvertedInSession]);

  const updateEtaMetrics = useCallback((force?: boolean) => {
    const now = Date.now();
    if (!force && now - lastEtaUpdateTsRef.current < 100) {
      return;
    }
    lastEtaUpdateTsRef.current = now;

    const completedItems = completedBatchCountRef.current;
    const totalItems = totalBatchCountRef.current;
    const elapsedMs = Math.max(1, now - batchStartTimeRef.current);
    const elapsedSeconds = elapsedMs / 1000;
    const remainingItems = totalItems - completedItems;
    
    if (completedItems === 0 || completedWorkloadRef.current === 0) {
      setEtaText('Estimating...');
      setProcessingSpeed('');
      return;
    }

    if (remainingItems <= 0) {
      setEtaText('Almost done...');
      setProcessingSpeed('');
      return;
    }

    // Workload-based estimation
    const completedWork = completedWorkloadRef.current;
    const totalWork = totalWorkloadRef.current;
    const remainingWork = Math.max(remainingItems * 0.1, totalWork - completedWork);
    
    // Long-term throughput across the entire batch runtime (work units per second)
    const longTermThroughput = completedWork / elapsedSeconds;

    // Keep at most 7 recent samples and prune older than 6000ms
    recentWorkSamplesRef.current = recentWorkSamplesRef.current.filter(s => now - s.timestamp <= 6000);
    if (recentWorkSamplesRef.current.length > 7) {
      recentWorkSamplesRef.current = recentWorkSamplesRef.current.slice(-7);
    }
    const samples = recentWorkSamplesRef.current;

    // Calculate short-term throughput from recent window
    let shortTermThroughput = longTermThroughput;
    if (samples.length >= 2) {
      const windowDurationSec = Math.max(0.1, (now - samples[0].timestamp) / 1000);
      const recentWorkSum = samples.slice(1).reduce((sum, s) => sum + s.work, 0);
      shortTermThroughput = recentWorkSum / windowDurationSec;
    } else if (samples.length === 1) {
      const windowDurationSec = Math.max(0.1, (now - batchStartTimeRef.current) / 1000);
      shortTermThroughput = samples[0].work / windowDurationSec;
    }

    // Measure performance divergence between recent and historical throughput
    const divergence = Math.abs(shortTermThroughput - longTermThroughput) / Math.max(0.001, longTermThroughput);

    // Dynamic weighting:
    // Stable performance (divergence ~ 0): alpha = 0.3 (70% longTerm, 30% shortTerm) for visual stability
    // Substantial change (divergence >= 1.0): alpha up to 0.85 (15% longTerm, 85% shortTerm) for fast response
    const alpha = Math.min(0.85, 0.3 + 0.55 * Math.min(1.0, divergence));
    const effectiveThroughput = alpha * shortTermThroughput + (1 - alpha) * longTermThroughput;

    // Estimate remaining seconds
    let estimatedRemainingSec = 0;
    if (effectiveThroughput > 0.001) {
      estimatedRemainingSec = remainingWork / effectiveThroughput;
    } else {
      // Fallback to simple item-based if workload metrics are broken
      const itemsPerSec = completedItems / elapsedSeconds;
      estimatedRemainingSec = remainingItems / (itemsPerSec || 1);
    }
    
    // Adaptive clamping:
    // Use moderate bounds (0.5x..1.5x) when stable, but allow larger corrections (0.1x..4.0x) on major speed changes
    if (lastEtaSecRef.current !== null) {
       const prev = lastEtaSecRef.current;
       const maxIncreaseFactor = 1.5 + 2.5 * Math.min(1.0, divergence);
       const minDecreaseFactor = Math.max(0.1, 0.5 - 0.4 * Math.min(1.0, divergence));

       if (estimatedRemainingSec > prev * maxIncreaseFactor) {
         estimatedRemainingSec = prev * maxIncreaseFactor;
       } else if (estimatedRemainingSec < prev * minDecreaseFactor) {
         estimatedRemainingSec = prev * minDecreaseFactor;
       }
    }
    
    lastEtaSecRef.current = estimatedRemainingSec;
    const displaySec = Math.ceil(estimatedRemainingSec);

    let formattedTime = '';
    if (displaySec <= 5) {
      formattedTime = 'A few seconds left';
    } else if (displaySec < 60) {
      // Round to nearest 5 for stability if > 15
      let s = displaySec;
      if (s > 15) {
        s = Math.round(s / 5) * 5;
      }
      formattedTime = `About ${s}s left`;
    } else {
      const mins = Math.floor(displaySec / 60);
      const secs = displaySec % 60;
      
      // Keep it clean
      if (secs < 10) {
         formattedTime = `About ${mins}m left`;
      } else {
         let roundedSecs = Math.round(secs / 10) * 10;
         if (roundedSecs === 60) {
           formattedTime = `About ${mins + 1}m left`;
         } else {
           formattedTime = `About ${mins}m ${roundedSecs}s left`;
         }
      }
    }

    setEtaText(formattedTime);
    
    // Display friendly speed
    const itemsPerSec = completedItems / elapsedSeconds;
    setProcessingSpeed(`${itemsPerSec.toFixed(1)} items/s`);
  }, []);

  useEffect(() => {
    if (!isProcessing) {
      setEtaText('');
      setProcessingSpeed('');
      return;
    }

    const interval = setInterval(() => {
      updateEtaMetrics();
    }, 500);

    return () => clearInterval(interval);
  }, [isProcessing, updateEtaMetrics]);

  useEffect(() => {
    const config = detectHardwareCapabilities();
    if (config.tier === 'LOW') {
      setConcurrencyProfile('Optimized for this device (entry-level — sequential processing)');
    } else if (config.tier === 'MID') {
      setConcurrencyProfile(`Optimized for this device (balanced — up to ${config.maxConcurrentWorkers} parallel processes)`);
    } else {
      setConcurrencyProfile(`Optimized for this device (performance-tier — up to ${config.maxConcurrentWorkers} parallel processes)`);
    }
  }, []);

  const thumbnailQueue = useRef<{ id: string; file: File }[]>([]);
  const isProcessingThumbnails = useRef(false);

  const processThumbnailQueue = useCallback(async () => {
    if (isProcessingThumbnails.current) return;
    isProcessingThumbnails.current = true;
    
    try {
      const { generateThumbnail } = await import('../lib/imageProcessor');
      
      while (thumbnailQueue.current.length > 0) {
        if (isProcessingRef.current) {
          // Pause and wait before pulling items from the queue
          await new Promise(resolve => setTimeout(resolve, 250));
          continue;
        }

        const hw = detectHardwareCapabilities();
        const batchSize = hw.thumbnailBatchSize;
        const batch = thumbnailQueue.current.splice(0, batchSize);
        
        const results = await Promise.all(batch.map(async (item) => {
          try {
            const url = await generateThumbnail(item.file, 120);
            return { id: item.id, url };
          } catch (e) {
            return { id: item.id, url: '' };
          }
        }));
        
        setFiles(prev => {
          const nextFiles = [...prev];
          let changed = false;
          results.forEach(match => {
            const idx = nextFiles.findIndex(f => f.id === match.id);
            if (idx !== -1 && match.url) {
              nextFiles[idx] = { ...nextFiles[idx], previewUrl: match.url };
              changed = true;
            }
          });
          
          results.forEach(r => {
            if (r.url && !nextFiles.find(f => f.id === r.id)) {
              URL.revokeObjectURL(r.url);
            }
          });
          
          return changed ? nextFiles : prev;
        });
        
        if (typeof (globalThis as any).scheduler?.yield === 'function') {
          await (globalThis as any).scheduler.yield();
        } else {
          await new Promise(resolve => setTimeout(resolve, 0));
        }
      }
    } catch (err) {
      console.error("Failed to process thumbnail queue", err);
    } finally {
      isProcessingThumbnails.current = false;
    }
  }, []);

  const handleFilesAdded = useCallback((newFiles: File[]) => {
    const validFiles = newFiles.filter(file => file && file.size > 0);
    if (validFiles.length === 0) return;

    const MAX_FILE_SIZE = 150 * 1024 * 1024; // 150MB

    // Reset banner dismissal flags when adding new files
    setIsLargeBatchBannerDismissed(false);
    setIsAutoChunkedBannerDismissed(false);

    setFiles(prev => {
      const newItems: ImageFileItem[] = [];

      validFiles.forEach((file) => {
        const isOverSize = file.size > MAX_FILE_SIZE;

        let status: 'pending' | 'error' = 'pending';
        let error: string | undefined = undefined;

        if (isOverSize) {
          status = 'error';
          error = `File size exceeds 150MB limit (${formatBytes(file.size)}).`;
        }

        newItems.push({
          id: safeRandomUUID(),
          file,
          previewUrl: '',
          originalSize: file.size,
          status,
          error,
          progress: 0,
          customTargetFormat: undefined,
        });
      });

      const merged = [...prev, ...newItems];

      // Push to thumbnail queue only if status is pending
      newItems.forEach(item => {
        if (item.status === 'pending') {
          thumbnailQueue.current.push({ id: item.id, file: item.file });
        }
      });

      return merged;
    });

    processThumbnailQueue();
  }, [processThumbnailQueue]);

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (!e.clipboardData) return;
      const items = Array.from(e.clipboardData.items);
      const pastedFiles: File[] = [];
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) {
            const ext = file.type.split('/')[1] || 'png';
            const name = `pasted-image-${Date.now()}.${ext}`;
            pastedFiles.push(new File([file], name, { type: file.type }));
          }
        }
      }
      if (pastedFiles.length > 0) {
        handleFilesAdded(pastedFiles);
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [handleFilesAdded]);

  const handleRotateItem = useCallback((id: string, deltaDegrees: number) => {
    setFiles(prev =>
      prev.map(file => {
        if (file.id === id) {
          const currentRotation = file.rotation || 0;
          const newRotation = ((currentRotation + deltaDegrees) % 360 + 360) % 360;
          if (file.convertedUrl) {
            URL.revokeObjectURL(file.convertedUrl);
          }
          return {
            ...file,
            rotation: newRotation,
            status: 'pending',
            blob: undefined,
            convertedSize: undefined,
            convertedUrl: undefined,
          };
        }
        return file;
      })
    );
  }, []);

  const handleUpdateFileFormat = useCallback((id: string, format: TargetFormat | undefined) => {
    setFiles(prev =>
      prev.map(file => {
        if (file.id === id) {
          if (file.convertedUrl) {
            URL.revokeObjectURL(file.convertedUrl);
          }
          return {
            ...file,
            customTargetFormat: format,
            status: 'pending',
            blob: undefined,
            convertedSize: undefined,
            convertedUrl: undefined,
          };
        }
        return file;
      })
    );
  }, []);

  const handleUpdateBlurRegions = useCallback((id: string, regions: Array<{ x: number; y: number; width: number; height: number }> | undefined, mode: 'blur' | 'pixelate' | undefined) => {
    setFiles(prev =>
      prev.map(file => {
        if (file.id === id) {
          if (file.convertedUrl) {
            URL.revokeObjectURL(file.convertedUrl);
          }
          return {
            ...file,
            blurRegions: regions,
            blurMode: mode,
            status: 'pending',
            blob: undefined,
            convertedSize: undefined,
            convertedUrl: undefined,
          };
        }
        return file;
      })
    );
  }, []);

  const handleRetryFile = useCallback(async (id: string) => {
    let itemToProcess: ImageFileItem | undefined;
    
    setFiles(prev => {
      const idx = prev.findIndex(f => f.id === id);
      if (idx === -1) return prev;
      const next = [...prev];
      itemToProcess = { ...next[idx], status: 'pending', error: undefined };
      next[idx] = { ...itemToProcess, status: 'processing' };
      return next;
    });

    if (!itemToProcess) return;

    try {
      const processor = await import('../lib/imageProcessor');
      const result = await processor.convertSingleImage(itemToProcess, settings);
      
      setFiles(prev => {
        const nextFiles = [...prev];
        const idx = nextFiles.findIndex(f => f.id === id);
        if (idx !== -1) {
          nextFiles[idx] = { 
            ...nextFiles[idx], 
            status: 'success', 
            blob: result.blob, 
            convertedSize: result.convertedSize, 
            convertedUrl: result.convertedUrl,
            dimensions: result.dimensions,
            originalFallback: result.originalFallback,
            pdfImageData: result.pdfImageData,
            pdfImageWidth: result.pdfImageWidth,
            pdfImageHeight: result.pdfImageHeight
          };
        }
        return nextFiles;
      });
    } catch (err: any) {
      setFiles(prev => {
        const nextFiles = [...prev];
        const idx = nextFiles.findIndex(f => f.id === id);
        if (idx !== -1) {
          nextFiles[idx] = { ...nextFiles[idx], status: 'error', error: err.message || 'Conversion failed' };
        }
        return nextFiles;
      });
    }
  }, [settings]);

  const handleRemoveFile = useCallback((id: string) => {
    setFiles(prev => {
      const target = prev.find(f => f.id === id);
      if (target) {
        if (target.previewUrl) URL.revokeObjectURL(target.previewUrl);
        if (target.convertedUrl) URL.revokeObjectURL(target.convertedUrl);
      }
      return prev.filter(f => f.id !== id);
    });
    setSelectedFileIds(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const cleanupWorkers = useCallback(() => {
    import('../lib/imageProcessor').then(m => m.terminateWorkers()).catch(e => {
      console.error('Failed to cleanup workers:', e);
    });
  }, []);

  useEffect(() => {
    const handleBeforeUnload = () => cleanupWorkers();
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      cleanupWorkers();
    };
  }, [cleanupWorkers]);

  const handleClearAll = useCallback(() => {
    setFiles(prev => {
      prev.forEach(f => {
        if (f.previewUrl) URL.revokeObjectURL(f.previewUrl);
        if (f.convertedUrl) URL.revokeObjectURL(f.convertedUrl);
      });
      return [];
    });
    setSelectedFileIds(new Set());
    cleanupWorkers();
  }, [cleanupWorkers]);

  const handleToggleSelect = useCallback((id: string) => {
    setSelectedFileIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleDownloadSingle = useCallback(async (file: ImageFileItem) => {
    if (!file.blob || !file.convertedUrl) return;
    const a = document.createElement('a');
    a.href = file.convertedUrl;
    
    const currentFiles = filesRef.current;
    const idx = currentFiles.findIndex(f => f.id === file.id);
    const finalName = formatOutputFilename(file, idx !== -1 ? idx : 0, settings);
    a.download = finalName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    // Release raw JPEG intermediate data after single download
    if (file.pdfImageData) {
      setFiles(prev => prev.map(f => f.id === file.id ? {
        ...f,
        pdfImageData: undefined,
        pdfImageWidth: undefined,
        pdfImageHeight: undefined
      } : f));
    }
  }, [settings]);

  const handleDownloadToDirectory = useCallback(async () => {
    const currentFiles = filesRef.current;
    const successfulFiles = currentFiles.filter(f => f.status === 'success' && f.blob);
    if (successfulFiles.length === 0) return false;

    const usedNames = new Set<string>();
    const res = await saveFilesToDirectory(successfulFiles, (file, i) => {
      const idx = currentFiles.findIndex(f => f.id === file.id);
      let fileName = formatOutputFilename(file, idx !== -1 ? idx : i, settings);
      if (usedNames.has(fileName)) {
        const dotIdx = fileName.lastIndexOf('.');
        const namePart = dotIdx >= 0 ? fileName.substring(0, dotIdx) : fileName;
        const extPart = dotIdx >= 0 ? fileName.substring(dotIdx) : '';
        let counter = 1;
        while (usedNames.has(`${namePart}_${counter}${extPart}`)) {
          counter++;
        }
        fileName = `${namePart}_${counter}${extPart}`;
      }
      usedNames.add(fileName);
      return fileName;
    });

    if (res.success) {
      // Clear intermediate pdfImageData once saved to disk
      setFiles(prev => prev.map(f => f.pdfImageData ? {
        ...f,
        pdfImageData: undefined,
        pdfImageWidth: undefined,
        pdfImageHeight: undefined
      } : f));
    }

    return res.success;
  }, [settings]);

  const handleDownloadAll = useCallback(async () => {
    const currentFiles = filesRef.current;
    const successfulFiles = currentFiles.filter(f => f.status === 'success' && f.blob);
    if (successfulFiles.length === 0) return;

    if (successfulFiles.length === 1) {
      handleDownloadSingle(successfulFiles[0]);
      return;
    }

    const hw = detectHardwareCapabilities();
    const thresholds = getBatchThresholds(hw.tier);

    // Helper function for formatting filenames uniquely
    const getFormattedName = (file: ImageFileItem, i: number, usedNames: Set<string>) => {
      if (file.id === 'multi-page-pdf') return file.file.name;
      const idx = currentFiles.findIndex(f => f.id === file.id);
      let fileName = formatOutputFilename(file, idx !== -1 ? idx : i, settings);
      if (usedNames.has(fileName)) {
        const dotIdx = fileName.lastIndexOf('.');
        const namePart = dotIdx >= 0 ? fileName.substring(0, dotIdx) : fileName;
        const extPart = dotIdx >= 0 ? fileName.substring(dotIdx) : '';
        let counter = 1;
        while (usedNames.has(`${namePart}_${counter}${extPart}`)) {
          counter++;
        }
        fileName = `${namePart}_${counter}${extPart}`;
      }
      usedNames.add(fileName);
      return fileName;
    };

    const pdfFiles = successfulFiles.filter(f => {
      const tf = getEffectiveTargetFormat(f, settings);
      return tf === 'pdf' && f.pdfImageData && f.pdfImageWidth && f.pdfImageHeight;
    });
    
    const nonPdfFiles = successfulFiles.filter(f => {
      const tf = getEffectiveTargetFormat(f, settings);
      return tf !== 'pdf' || !f.pdfImageData;
    });

    let multiPagePdfBlob: Blob | null = null;
    if (pdfFiles.length > 1) {
      const { jsPDF } = await import('jspdf');
      const pdf = new jsPDF({ unit: 'px' });
      pdf.deletePage(1);
      for (const f of pdfFiles) {
        const w = f.pdfImageWidth!;
        const h = f.pdfImageHeight!;
        const orientation = w > h ? 'l' : 'p';
        pdf.addPage([w, h], orientation);
        const buffer = await f.pdfImageData!.arrayBuffer();
        pdf.addImage(new Uint8Array(buffer), 'JPEG', 0, 0, w, h);
      }
      multiPagePdfBlob = pdf.output('blob');
    }

    // Immediately release intermediate pdfImageData references once multi-page or individual PDFs are processed
    if (pdfFiles.length > 0) {
      setFiles(prev => prev.map(f => f.pdfImageData ? {
        ...f,
        pdfImageData: undefined,
        pdfImageWidth: undefined,
        pdfImageHeight: undefined
      } : f));
    }

    if (multiPagePdfBlob && nonPdfFiles.length === 0) {
      downloadBlob(multiPagePdfBlob, `zapixal-document-${Date.now()}.pdf`);
      return;
    }

    let filesToZip = successfulFiles;
    if (multiPagePdfBlob) {
      filesToZip = [...nonPdfFiles, {
        id: 'multi-page-pdf',
        status: 'success',
        blob: multiPagePdfBlob,
        convertedSize: multiPagePdfBlob.size,
        originalSize: 0,
        customTargetFormat: 'pdf',
        file: new File([], `zapixal-document-${Date.now()}.pdf`)
      } as unknown as ImageFileItem];
    }

    // Chunked ZIP export strategy with hardware memory guard
    const zipSizeBudget = hw.tier === 'LOW'
      ? Math.min(thresholds.optimalBatchBytes, 25 * 1024 * 1024)
      : (hw.tier === 'MID' ? Math.min(thresholds.optimalBatchBytes, 75 * 1024 * 1024) : thresholds.optimalBatchBytes);

    const zipChunks: ImageFileItem[][] = [];
    let currentChunk: ImageFileItem[] = [];
    let currentChunkBytes = 0;

    for (const file of filesToZip) {
      const fSize = file.blob?.size || file.convertedSize || file.originalSize;
      if (currentChunk.length > 0 && (currentChunkBytes + fSize > zipSizeBudget)) {
        zipChunks.push(currentChunk);
        currentChunk = [file];
        currentChunkBytes = fSize;
      } else {
        currentChunk.push(file);
        currentChunkBytes += fSize;
      }
    }
    if (currentChunk.length > 0) {
      zipChunks.push(currentChunk);
    }

    try {
      const JSZip = (await import('jszip')).default;

      if (zipChunks.length <= 1) {
        const zip = new JSZip();
        const usedNames = new Set<string>();
        for (let i = 0; i < filesToZip.length; i++) {
          const file = filesToZip[i];
          const fileName = getFormattedName(file, i, usedNames);
          if (file.blob) {
            zip.file(fileName, file.blob);
          }
        }
        const content = await zip.generateAsync({ type: 'blob' });
        downloadBlob(content, `zapixal-converted-${Date.now()}.zip`);
      } else {
        const totalParts = zipChunks.length;
        const globalUsedNames = new Set<string>();

        for (let partIdx = 0; partIdx < totalParts; partIdx++) {
          const chunk = zipChunks[partIdx];
          const zip = new JSZip();

          for (let i = 0; i < chunk.length; i++) {
            const file = chunk[i];
            const fileName = getFormattedName(file, i, globalUsedNames);
            if (file.blob) {
              zip.file(fileName, file.blob);
            }
          }

          const content = await zip.generateAsync({ type: 'blob' });
          const partName = `zapixal-export-part-${partIdx + 1}-of-${totalParts}.zip`;
          downloadBlob(content, partName);

          if (partIdx < totalParts - 1) {
            await new Promise(res => setTimeout(res, 300));
          }
        }
      }
    } catch (err) {
      console.error('Failed to generate ZIP export:', err);
    }
  }, [settings, handleDownloadSingle]);

  const handleDownloadDirect = useCallback(async () => {
    const currentFiles = filesRef.current;
    const successfulFiles = currentFiles.filter(f => f.status === 'success' && f.blob);
    for (let i = 0; i < successfulFiles.length; i++) {
      handleDownloadSingle(successfulFiles[i]);
      if (i < successfulFiles.length - 1) {
        await new Promise(res => setTimeout(res, 200));
      }
    }
  }, [handleDownloadSingle]);

  const stopProcessing = useCallback(() => {
    if (!isProcessing || isStopping) return;
    setIsStopping(true);
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, [isProcessing, isStopping]);

  const processFiles = useCallback(async (options?: { forceAll?: boolean; chunked?: boolean }) => {
    if (isProcessing) return;
    
    setStalledResetMessage(null);
    const currentFiles = filesRef.current;
    const pendingFiles = currentFiles.filter(f => f.status === 'pending' || f.status === 'error');
    if (pendingFiles.length === 0) return;

    const baseHw = detectHardwareCapabilities();
    const hw = await checkBatteryThrottling(baseHw);
    const thresholds = getBatchThresholds(hw.tier);
    const totalSize = pendingFiles.reduce((sum, f) => sum + f.originalSize, 0);

    const hasAvif = settings.targetFormat === 'avif' || pendingFiles.some(f => {
      const tf = getEffectiveTargetFormat(f, settings);
      return tf === 'avif';
    });
    let dynamicChunkLimit = 15;
    if (hw.tier === 'LOW') {
      dynamicChunkLimit = hasAvif ? 3 : 5;
    } else if (hw.tier === 'MID') {
      dynamicChunkLimit = hasAvif ? 8 : 12;
    } else {
      dynamicChunkLimit = hasAvif ? 16 : 24;
    }

    // Trigger performance alert modal for potentially straining batches on regular click
    const hasDirectoryPicker = typeof window !== 'undefined' && 'showDirectoryPicker' in window;
    const isStraining = pendingFiles.length > dynamicChunkLimit || totalSize > thresholds.optimalBatchBytes;
    if (isStraining && !options?.forceAll && !options?.chunked && hasDirectoryPicker && !directoryHandle) {
      setShowLowTierWarning(true);
      return;
    }

    // Automatically engage safest export strategy (chunked) if total size reaches maxBatchBytes or count exceeds dynamic limit
    const runChunked = options?.chunked || totalSize >= thresholds.maxBatchBytes || pendingFiles.length > dynamicChunkLimit;

    setIsProcessing(true);
    setIsStopping(false);
    
    abortControllerRef.current = new AbortController();
    
    const processor = await import('../lib/imageProcessor');
    const maxConcurrent = hw.maxConcurrentWorkers;

    // Split pendingFiles into chunks of dynamic limit if chunked processing is selected or auto-engaged
    const chunkSize = dynamicChunkLimit;
    const chunks: ImageFileItem[][] = [];
    if (runChunked) {
      for (let i = 0; i < pendingFiles.length; i += chunkSize) {
        chunks.push(pendingFiles.slice(i, i + chunkSize));
      }
    } else {
      chunks.push(pendingFiles);
    }

    const usedNamesInBatch = new Set<string>();

    completedBatchCountRef.current = 0;
    totalBatchCountRef.current = pendingFiles.length;
    batchStartTimeRef.current = Date.now();
    lastEtaSecRef.current = null;
    throughputHistoryRef.current = [];
    recentWorkSamplesRef.current = [];
    completedWorkloadRef.current = 0;

    let totalBatchWorkload = 0;
    for (const item of pendingFiles) {
       const tf = getEffectiveTargetFormat(item, settings);
       const w = item.dimensions?.width || 2048;
       const h = item.dimensions?.height || 2048;
       totalBatchWorkload += estimateProcessingWorkload(w, h, item.file.type, tf);
    }
    totalWorkloadRef.current = totalBatchWorkload;
    setEtaText('Calculating...');

    try {
      for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
        if (abortControllerRef.current?.signal.aborted) break;
        
        const currentChunk = chunks[chunkIndex];
        if (chunkIndex > 0 && completedBatchCountRef.current > 0) {
          updateEtaMetrics();
        }

        // Update files in current chunk to 'processing'
        setFiles(prev => prev.map(f => {
          if (currentChunk.some(p => p.id === f.id)) {
            return { ...f, status: 'processing', progress: 0, error: undefined };
          }
          return f;
        }));

        let currentIndex = 0;
        let activeWorkers = 0;
        let activeMemory = 0;
        const memoryBudget = estimateDeviceMemoryBudget(hw);
        const maxMemory = memoryBudget.safeWorkingBytes;

        await new Promise<void>((resolveChunk) => {
          const next = () => {
            if (abortControllerRef.current?.signal.aborted) {
              if (activeWorkers === 0) {
                resolveChunk();
              }
              return;
            }

            while (currentIndex < currentChunk.length && activeWorkers < maxConcurrent) {
              const peekItem = currentChunk[currentIndex];
              const tf = getEffectiveTargetFormat(peekItem, settings);
              const w = peekItem.dimensions?.width || 2048;
              const h = peekItem.dimensions?.height || 2048;
              const cost = estimateConversionMemoryCost(w, h, tf);
              const workCost = estimateProcessingWorkload(w, h, peekItem.file.type, tf);

              if (activeWorkers > 0 && activeMemory + cost > maxMemory) {
                break;
              }

              if (cost > maxMemory * 1.5 && activeWorkers === 0) {
                setFiles(prev => prev.map(f => f.id === peekItem.id ? {
                  ...f,
                  status: 'error',
                  error: `Image too large for available memory. Cost: ${formatBytes(cost)}`
                } : f));
                currentIndex++;
                completedBatchCountRef.current++;
                updateEtaMetrics();
                continue;
              }

              const item = currentChunk[currentIndex++];
              activeWorkers++;
              activeMemory += cost;

              processor.convertSingleImage(item, settings, abortControllerRef.current?.signal)
                .then(async result => {
                  if (abortControllerRef.current?.signal.aborted) {
                    if (result.convertedUrl) {
                      try { URL.revokeObjectURL(result.convertedUrl); } catch (e) {}
                    }
                    return;
                  }

                  let savedToFolder = false;
                  let finalName = '';
                  if (directoryHandle) {
                    const idx = files.findIndex(f => f.id === item.id);
                    finalName = formatOutputFilename({ ...item, customTargetFormat: result.originalFallback ? undefined : item.customTargetFormat }, idx !== -1 ? idx : 0, settings);
                    
                    if (usedNamesInBatch.has(finalName)) {
                      const dotIdx = finalName.lastIndexOf('.');
                      const namePart = dotIdx >= 0 ? finalName.substring(0, dotIdx) : finalName;
                      const extPart = dotIdx >= 0 ? finalName.substring(dotIdx) : '';
                      let counter = 1;
                      while (usedNamesInBatch.has(`${namePart}_${counter}${extPart}`)) {
                        counter++;
                      }
                      finalName = `${namePart}_${counter}${extPart}`;
                    }
                    usedNamesInBatch.add(finalName);

                    const writeSuccess = await writeResultToDirectory(directoryHandle, finalName, result.blob);
                    if (writeSuccess) {
                      savedToFolder = true;
                      try { URL.revokeObjectURL(result.convertedUrl); } catch (e) {}
                    }
                  }

                  setFiles(prev => prev.map(f => f.id === item.id ? {
                    ...f,
                    status: 'success',
                    blob: savedToFolder ? undefined : result.blob,
                    convertedSize: result.convertedSize,
                    convertedUrl: savedToFolder ? undefined : result.convertedUrl,
                    dimensions: result.dimensions,
                    originalFallback: result.originalFallback,
                    pdfImageData: savedToFolder ? undefined : result.pdfImageData,
                    pdfImageWidth: savedToFolder ? undefined : result.pdfImageWidth,
                    pdfImageHeight: savedToFolder ? undefined : result.pdfImageHeight,
                    progress: 100,
                    savedToFolder,
                    folderSavePath: savedToFolder ? finalName : undefined,
                  } : f));
                })
                .catch(err => {
                  if (abortControllerRef.current?.signal.aborted) return;
                  setFiles(prev => prev.map(f => f.id === item.id ? {
                    ...f,
                    status: 'error',
                    error: err.message || 'Conversion failed'
                  } : f));
                })
                .finally(() => {
                  activeWorkers--;
                  activeMemory -= cost;
                  completedBatchCountRef.current++;
                  completedWorkloadRef.current += workCost;
                  recentWorkSamplesRef.current.push({ timestamp: Date.now(), work: workCost });
                  updateEtaMetrics();
                  
                  if (typeof (globalThis as any).scheduler?.yield === 'function') {
                    (globalThis as any).scheduler.yield().then(next);
                  } else {
                    setTimeout(next, 0);
                  }
                });
            }

            if (activeWorkers === 0 && (currentIndex >= currentChunk.length || abortControllerRef.current?.signal.aborted)) {
              if (abortControllerRef.current?.signal.aborted) {
                setFiles(prev => prev.map(f => f.status === 'processing' ? { ...f, status: 'pending' } : f));
              }
              if (runChunked) {
                processor.terminateWorkers();
              }
              resolveChunk();
            }
          };
          
          next();
        });

        if (runChunked && !abortControllerRef.current?.signal.aborted) {
          // Cooldown between chunks to force GC sweep of WebWorker & DOM thread memory
          await new Promise(r => setTimeout(r, 200));
        }
      }
    } finally {
      setIsProcessing(false);
      setIsStopping(false);
    }
  }, [isProcessing, settings, updateEtaMetrics, writeResultToDirectory]);

  const pendingCount = files.filter(f => f.status === 'pending' || f.status === 'error').length;
  const successCount = files.filter(f => f.status === 'success').length;
  const totalCount = files.length;
  const processedCount = files.filter(f => f.status === 'success' || f.status === 'error').length;
  const progressPercent = totalCount > 0 ? Math.round((processedCount / totalCount) * 100) : 0;

  const setFormat = useCallback((format: TargetFormat) => {
    setSettings(prev => ({ ...prev, targetFormat: format }));
  }, [setSettings]);

  const handleReformatItems = useCallback(async (ids: string[], newFormat: TargetFormat) => {
    if (isProcessing) return;
    const currentFiles = filesRef.current;
    const itemsToReformat = currentFiles.filter(f => ids.includes(f.id));
    if (itemsToReformat.length === 0) return;

    setIsProcessing(true);
    setIsStopping(false);

    abortControllerRef.current = new AbortController();
    setEtaText('Reformatting...');

    // Set files to processing, update customTargetFormat, and revoke old URLs
    setFiles(prev =>
      prev.map(f => {
        if (ids.includes(f.id)) {
          if (f.convertedUrl) {
            try { URL.revokeObjectURL(f.convertedUrl); } catch (e) {}
          }
          return {
            ...f,
            status: 'processing',
            customTargetFormat: newFormat,
            progress: 0,
            blob: undefined,
            convertedSize: undefined,
            convertedUrl: undefined,
            error: undefined,
          };
        }
        return f;
      })
    );

    const processor = await import('../lib/imageProcessor');
    const hardware = detectHardwareCapabilities();
    const maxConcurrent = hardware.maxConcurrentWorkers;

    let currentIndex = 0;
    let activeWorkers = 0;
    let activeMemory = 0;
    const memoryBudget = estimateDeviceMemoryBudget(hardware);
    const maxMemory = memoryBudget.safeWorkingBytes;
    const usedNamesInBatch = new Set<string>();
    
    completedBatchCountRef.current = 0;
    totalBatchCountRef.current = itemsToReformat.length;
    batchStartTimeRef.current = Date.now();
    lastEtaSecRef.current = null;
    throughputHistoryRef.current = [];
    recentWorkSamplesRef.current = [];
    completedWorkloadRef.current = 0;
    
    let reformatWorkload = 0;
    for (const item of itemsToReformat) {
       const w = item.dimensions?.width || 2048;
       const h = item.dimensions?.height || 2048;
       reformatWorkload += estimateProcessingWorkload(w, h, item.file.type, newFormat);
    }
    totalWorkloadRef.current = reformatWorkload;

    return new Promise<void>((resolve) => {
      const next = () => {
        if (abortControllerRef.current?.signal.aborted) {
          if (activeWorkers === 0) {
            setIsProcessing(false);
            setIsStopping(false);
            resolve();
          }
          return;
        }

        while (currentIndex < itemsToReformat.length && activeWorkers < maxConcurrent) {
          const peekItem = itemsToReformat[currentIndex];
          const w = peekItem.dimensions?.width || 2048;
          const h = peekItem.dimensions?.height || 2048;
          const cost = estimateConversionMemoryCost(w, h, newFormat);
          const workCost = estimateProcessingWorkload(w, h, peekItem.file.type, newFormat);

          if (activeWorkers > 0 && activeMemory + cost > maxMemory) {
            break;
          }

          if (cost > maxMemory * 1.5 && activeWorkers === 0) {
            setFiles(prev => prev.map(f => f.id === peekItem.id ? {
              ...f,
              status: 'error',
              error: `Image too large for available memory. Cost: ${formatBytes(cost)}`
            } : f));
            currentIndex++;
            continue;
          }

          const item = itemsToReformat[currentIndex++];
          activeWorkers++;
          activeMemory += cost;

          const itemSettings = {
            ...settings,
            targetFormat: newFormat,
          };

          processor.convertSingleImage({ ...item, customTargetFormat: newFormat }, itemSettings, abortControllerRef.current?.signal)
            .then(async result => {
              if (abortControllerRef.current?.signal.aborted) {
                if (result.convertedUrl) {
                  try { URL.revokeObjectURL(result.convertedUrl); } catch (e) {}
                }
                return;
              }

              let savedToFolder = false;
              let finalName = '';
              if (directoryHandle) {
                const idx = files.findIndex(f => f.id === item.id);
                finalName = formatOutputFilename({ ...item, customTargetFormat: result.originalFallback ? undefined : newFormat }, idx !== -1 ? idx : 0, itemSettings);
                
                if (usedNamesInBatch.has(finalName)) {
                  const dotIdx = finalName.lastIndexOf('.');
                  const namePart = dotIdx >= 0 ? finalName.substring(0, dotIdx) : finalName;
                  const extPart = dotIdx >= 0 ? finalName.substring(dotIdx) : '';
                  let counter = 1;
                  while (usedNamesInBatch.has(`${namePart}_${counter}${extPart}`)) {
                    counter++;
                  }
                  finalName = `${namePart}_${counter}${extPart}`;
                }
                usedNamesInBatch.add(finalName);

                const writeSuccess = await writeResultToDirectory(directoryHandle, finalName, result.blob);
                if (writeSuccess) {
                  savedToFolder = true;
                  try { URL.revokeObjectURL(result.convertedUrl); } catch (e) {}
                }
              }

              setFiles(prev => prev.map(f => f.id === item.id ? {
                ...f,
                status: 'success',
                blob: savedToFolder ? undefined : result.blob,
                convertedSize: result.convertedSize,
                convertedUrl: savedToFolder ? undefined : result.convertedUrl,
                dimensions: result.dimensions,
                originalFallback: result.originalFallback,
                pdfImageData: savedToFolder ? undefined : result.pdfImageData,
                pdfImageWidth: savedToFolder ? undefined : result.pdfImageWidth,
                pdfImageHeight: savedToFolder ? undefined : result.pdfImageHeight,
                progress: 100,
                savedToFolder,
                folderSavePath: savedToFolder ? finalName : undefined,
              } : f));
            })
            .catch(err => {
              if (abortControllerRef.current?.signal.aborted) return;
              setFiles(prev => prev.map(f => f.id === item.id ? {
                ...f,
                status: 'error',
                error: err.message || 'Reformat failed'
              } : f));
            })
            .finally(() => {
              activeWorkers--;
              activeMemory -= cost;
              completedBatchCountRef.current++;
              completedWorkloadRef.current += workCost;
              recentWorkSamplesRef.current.push({ timestamp: Date.now(), work: workCost });
              updateEtaMetrics();
              if (typeof (globalThis as any).scheduler?.yield === 'function') {
                (globalThis as any).scheduler.yield().then(next);
              } else {
                setTimeout(next, 0);
              }
            });
        }

        if (activeWorkers === 0 && (currentIndex >= itemsToReformat.length || abortControllerRef.current?.signal.aborted)) {
          setIsProcessing(false);
          setIsStopping(false);
          resolve();
        }
      };

      next();
    }).then(() => {
      setIsProcessing(false);
      setIsStopping(false);
    });
  }, [isProcessing, settings, writeResultToDirectory]);

  const totalPendingBytes = files
    .filter(f => f.status === 'pending' || f.status === 'error')
    .reduce((sum, f) => sum + f.originalSize, 0);

  const hwConfig = detectHardwareCapabilities();
  const currentThresholds = getBatchThresholds(hwConfig.tier);

  const hasAvifBanner = settings.targetFormat === 'avif' || files.some(f => {
    const tf = getEffectiveTargetFormat(f, settings);
    return tf === 'avif';
  });
  let dynamicChunkLimitBanner = 15;
  if (hwConfig.tier === 'LOW') {
    dynamicChunkLimitBanner = hasAvifBanner ? 3 : 5;
  } else if (hwConfig.tier === 'MID') {
    dynamicChunkLimitBanner = hasAvifBanner ? 8 : 12;
  } else {
    dynamicChunkLimitBanner = hasAvifBanner ? 16 : 24;
  }

  const isLargeBatch = (totalPendingBytes >= currentThresholds.optimalBatchBytes && totalPendingBytes < currentThresholds.maxBatchBytes) && pendingCount <= dynamicChunkLimitBanner;
  const isMaxBatch = totalPendingBytes >= currentThresholds.maxBatchBytes || pendingCount > dynamicChunkLimitBanner;

  const showLargeBatchBanner = isLargeBatch && !isLargeBatchBannerDismissed;
  const showAutoChunkedBanner = isMaxBatch && !isAutoChunkedBannerDismissed;

  const dismissLargeBatchBanner = useCallback(() => {
    setIsLargeBatchBannerDismissed(true);
  }, []);

  const dismissAutoChunkedBanner = useCallback(() => {
    setIsAutoChunkedBannerDismissed(true);
  }, []);

  return {
    files,
    isProcessing,
    isStopping,
    etaText,
    processingSpeed,
    concurrencyProfile,
    hasConvertedInSession,
    lastBatchDuration,
    selectedFileIds,
    pendingCount,
    successCount,
    totalCount,
    processedCount,
    progressPercent,
    setFormat,
    handleFilesAdded,
    handleRotateItem,
    handleUpdateFileFormat,
    handleUpdateBlurRegions,
    handleReformatItems,
    handleRetryFile,
    handleRemoveFile,
    handleClearAll,
    handleToggleSelect,
    handleDownloadSingle,
    handleDownloadAll,
    handleDownloadDirect,
    handleDownloadToDirectory,
    directoryHandle,
    onSelectDirectory: handleSelectDirectory,
    onDisconnectDirectory: handleDisconnectDirectory,
    hasDirectoryPicker,
    stopProcessing,
    processFiles,
    showLowTierWarning,
    setShowLowTierWarning,
    stalledResetMessage,
    setStalledResetMessage,
    showLargeBatchBanner,
    dismissLargeBatchBanner,
    showAutoChunkedBanner,
    dismissAutoChunkedBanner,
    totalPendingBytes,
    optimalBatchBytes: currentThresholds.optimalBatchBytes,
    maxBatchBytes: currentThresholds.maxBatchBytes,
    isAutoChunkedActive: isMaxBatch,
  };
}
