import { ImageFileItem, ConversionSettings, ImageDimensions, TargetFormat } from '../types';
import { formatBytes } from './utils';
import { getWorkerPool, PooledWorker } from './workerPool';
import { validateMagicBytes, encodeJpeg, encodePng, encodeWebp, encodeWebpAdaptive, encodeAvif, encodeBmp, encodeIco, injectDpiMetadata } from './codecs';
import { detectHardwareCapabilities, getMaxPixels, getMaxMegapixels } from './hardwareCapabilities';
import {
  calculateCropRect,
  getCropSourceRect,
  applyBlurAndPixelateRegions,
  applyGrayscaleFilter,
  applyWatermarkText,
  reduceToTargetMaxKB
} from './imageEffects';

export {
  calculateCropRect,
  getCropSourceRect,
  applyBlurAndPixelateRegions
};

function isSameFormat(file: File, targetFormat: TargetFormat): boolean {
  const mime = (file.type || '').toLowerCase();
  const name = (file.name || '').toLowerCase();
  if (targetFormat === 'jpg' && (mime === 'image/jpeg' || /\.jpe?g$/i.test(name))) return true;
  if (targetFormat === 'png' && (mime === 'image/png' || /\.png$/i.test(name))) return true;
  if (targetFormat === 'webp' && (mime === 'image/webp' || /\.webp$/i.test(name))) return true;
  if (targetFormat === 'avif' && (mime === 'image/avif' || /\.avif$/i.test(name))) return true;
  if (targetFormat === 'bmp' && (mime === 'image/bmp' || /\.bmp$/i.test(name))) return true;
  if (targetFormat === 'ico' && (mime === 'image/x-icon' || mime === 'image/vnd.microsoft.icon' || /\.ico$/i.test(name))) return true;
  return false;
}

export async function loadImageElement(file: File): Promise<{
  img: ImageBitmap | HTMLImageElement;
  dimensions: ImageDimensions;
  objectUrl: string;
}> {
  let objectUrl: string;
  let targetFile: File | Blob = file;
  const extension = file.name.split('.').pop()?.toLowerCase() || '';

  // Check TIFF support (only native in Safari)
  if (extension === 'tiff' || extension === 'tif' || file.type.includes('tiff')) {
    const isSafari = typeof navigator !== 'undefined' && /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    if (!isSafari) {
      throw new Error(`TIFF decoding is not natively supported by this browser. Please convert the TIFF file to PNG or JPEG first, or use Safari.`);
    }
  }

  // Validate magic bytes first
  try {
    const headerBuffer = await file.slice(0, 16).arrayBuffer();
    const validation = validateMagicBytes(headerBuffer);
    if (!validation.valid && validation.error) {
      console.warn(`Magic byte validation warning for ${file.name}: ${validation.error}`);
    }
  } catch (err) {
    console.warn(`Could not read magic bytes for ${file.name}:`, err);
  }

  // HEIC decoding via worker pool
  if (extension === 'heic' || extension === 'heif' || file.type.includes('heic')) {
    try {
      targetFile = await getWorkerPool().decodeHeic(file);
      objectUrl = URL.createObjectURL(targetFile);
    } catch (e: any) {
      console.error('HEIC worker decoding failed:', e);
      throw new Error(`Failed to decode HEIC/HEIF file. Ensure the file is not corrupted or try a different HEIC encoder.`);
    }
  } else {
    objectUrl = URL.createObjectURL(file);
  }

  // Helper to construct highly informative error messages
  const getHelpfulError = (): Error => {
    if (extension === 'avif') {
      return new Error(`Failed to decode AVIF. Your browser or operating system may not support AVIF image decoding.`);
    }
    if (extension === 'webp') {
      return new Error(`Failed to decode WebP. Ensure the WebP image is valid and not corrupted.`);
    }
    if (extension === 'svg') {
      return new Error(`Failed to decode SVG. Ensure the SVG file is valid and contains standard XML elements.`);
    }
    if (extension === 'gif') {
      return new Error(`Failed to decode GIF. Ensure the file is valid. Note that animated GIFs are flattened to their first frame.`);
    }
    return new Error(`Unsupported or corrupted image file format (${extension.toUpperCase()}).`);
  };

  // Downscale at decode time if hardware caps or settings specify max dimensions
  const hw = detectHardwareCapabilities();
  const maxPixels = getMaxPixels(hw.tier);
  const maxMP = getMaxMegapixels(hw.tier);

  const maxAttempts = 3;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      let imgBitmap = await createImageBitmap(targetFile);

      // Check decoded pixel dimensions safety ceiling before proceeding
      const decodedPixels = imgBitmap.width * imgBitmap.height;
      if (decodedPixels > maxPixels) {
        imgBitmap.close();
        URL.revokeObjectURL(objectUrl);
        throw new Error(`Image dimensions too large to process safely on this device (${Math.round(decodedPixels / 1_000_000)} MP exceeds ${maxMP} MP limit)`);
      }

      if (imgBitmap.width > hw.maxCanvasDimension || imgBitmap.height > hw.maxCanvasDimension) {
        const scale = Math.min(
          hw.maxCanvasDimension / imgBitmap.width,
          hw.maxCanvasDimension / imgBitmap.height
        );
        const resizeWidth = Math.max(1, Math.round(imgBitmap.width * scale));
        const resizeHeight = Math.max(1, Math.round(imgBitmap.height * scale));

        try {
          const resizedBitmap = await createImageBitmap(targetFile, {
            resizeWidth,
            resizeHeight,
            resizeQuality: 'high',
          });
          imgBitmap.close();
          imgBitmap = resizedBitmap;
        } catch (resizeErr) {
          console.warn('createImageBitmap with resize options failed, keeping unscaled bitmap:', resizeErr);
        }
      }

      return {
        img: imgBitmap,
        dimensions: { width: imgBitmap.width, height: imgBitmap.height },
        objectUrl,
      };
    } catch (err: any) {
      if (err.message && err.message.includes('Image dimensions too large to process safely on this device')) {
        throw err;
      }
      console.warn(`createImageBitmap attempt ${attempt} failed:`, err);
      if (attempt < maxAttempts) {
        // Yield to the event loop
        if (typeof (window as any).scheduler?.yield === 'function') {
          await (window as any).scheduler.yield();
        } else {
          await new Promise(resolve => setTimeout(resolve, 150));
        }
        continue;
      }

      // If we reach here, we've exhausted all attempts of createImageBitmap.
      // Now fall back to the Image() method EXACTLY once.
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          const decodedPixels = img.naturalWidth * img.naturalHeight;
          if (decodedPixels > maxPixels) {
            URL.revokeObjectURL(objectUrl);
            reject(new Error(`Image dimensions too large to process safely on this device (${Math.round(decodedPixels / 1_000_000)} MP exceeds ${maxMP} MP limit)`));
            return;
          }
          resolve({
            img,
            dimensions: { width: img.naturalWidth, height: img.naturalHeight },
            objectUrl,
          });
        };
        img.onerror = () => {
          URL.revokeObjectURL(objectUrl);
          reject(getHelpfulError());
        };
        img.src = objectUrl;
      });
    }
  }

  // Fallback return just in case
  throw getHelpfulError();
}

export function calculateTargetDimensions(
  original: ImageDimensions,
  maxWidth?: number,
  maxHeight?: number,
  keepAspectRatio: boolean = true
): ImageDimensions {
  let { width, height } = original;

  if (!maxWidth && !maxHeight) {
    return {
      width: Math.max(1, width),
      height: Math.max(1, height),
    };
  }

  if (keepAspectRatio) {
    const widthRatio = maxWidth ? maxWidth / width : 1;
    const heightRatio = maxHeight ? maxHeight / height : 1;
    const minRatio = Math.min(widthRatio, heightRatio);

    if (minRatio < 1) {
      width = Math.round(width * minRatio);
      height = Math.round(height * minRatio);
    }
  } else {
    if (maxWidth) width = maxWidth;
    if (maxHeight) height = maxHeight;
  }

  return {
    width: Math.max(1, width),
    height: Math.max(1, height),
  };
}



export async function generateThumbnail(file: File, maxDim: number = 200): Promise<string> {
  if (file.size < 100 * 1024) {
    return URL.createObjectURL(file);
  }
  try {
    // Fast path: try native createImageBitmap decode with downscaling
    if (typeof createImageBitmap !== 'undefined') {
      try {
        let bmp = await createImageBitmap(file);
        const width = bmp.width;
        const height = bmp.height;
        const scale = Math.min(maxDim / width, maxDim / height);

        if (scale >= 1) {
          bmp.close();
          return URL.createObjectURL(file);
        }

        const targetW = Math.max(1, Math.round(width * scale));
        const targetH = Math.max(1, Math.round(height * scale));

        // Attempt downscaled decode directly at target dimensions
        try {
          const downscaled = await createImageBitmap(file, {
            resizeWidth: targetW,
            resizeHeight: targetH,
            resizeQuality: 'medium'
          });
          bmp.close();
          bmp = downscaled;
        } catch (e) {
          // Keep original bmp if browser resize option fails
        }

        let blob: Blob | null = null;
        if (typeof OffscreenCanvas !== 'undefined') {
          const canvas = new OffscreenCanvas(targetW, targetH);
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'medium';
            ctx.drawImage(bmp, 0, 0, targetW, targetH);
            blob = await canvas.convertToBlob({ type: 'image/jpeg', quality: 0.6 });
          }
        } else {
          const canvas = document.createElement('canvas');
          canvas.width = targetW;
          canvas.height = targetH;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'medium';
            ctx.drawImage(bmp, 0, 0, targetW, targetH);
            blob = await new Promise<Blob | null>((resolve) => {
              canvas.toBlob(resolve, 'image/jpeg', 0.6);
            });
          }
        }
        bmp.close();

        if (blob) {
          return URL.createObjectURL(blob);
        }
      } catch (fastErr) {
        // Fall back to standard loadImageElement
      }
    }

    const loaded = await loadImageElement(file);
    const { width, height } = loaded.dimensions;
    const scale = Math.min(maxDim / width, maxDim / height);

    if (scale >= 1) {
      if (typeof (loaded.img as any).close === 'function') {
        (loaded.img as any).close();
      }
      return loaded.objectUrl;
    }

    const targetW = Math.max(1, Math.round(width * scale));
    const targetH = Math.max(1, Math.round(height * scale));

    let blob: Blob | null = null;
    try {

    if (typeof OffscreenCanvas !== 'undefined' && loaded.img instanceof ImageBitmap) {
      const canvas = new OffscreenCanvas(targetW, targetH);
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'medium';
        ctx.drawImage(loaded.img, 0, 0, targetW, targetH);
        blob = await canvas.convertToBlob({ type: 'image/jpeg', quality: 0.6 });
      }
    } else {
      const canvas = document.createElement('canvas');
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'medium';
        ctx.drawImage(loaded.img, 0, 0, targetW, targetH);
        blob = await new Promise<Blob | null>((resolve) => {
          canvas.toBlob(resolve, 'image/jpeg', 0.6);
        });
      }
    }

    } finally {
      if (typeof (loaded.img as any).close === 'function') {
        (loaded.img as any).close();
      }
      URL.revokeObjectURL(loaded.objectUrl);
    }

    if (blob) {
      return URL.createObjectURL(blob);
    }
    return '';
  } catch (e) {
    console.error('Thumbnail generation failed:', e);
    return '';
  }
}

export async function convertSingleImage(
  item: ImageFileItem,
  settings: ConversionSettings,
  signal?: AbortSignal
): Promise<{
  blob: Blob;
  convertedSize: number;
  dimensions: ImageDimensions;
  convertedUrl: string;
  originalFallback?: boolean;
  pdfImageData?: Blob;
  pdfImageWidth?: number;
  pdfImageHeight?: number;
}> {
  if (signal?.aborted) {
    throw new DOMException('The operation was aborted.', 'AbortError');
  }

  let derivedFormat: TargetFormat = 'jpg';
  const originalExt = item.file.name.split('.').pop()?.toLowerCase() || '';
  const originalMime = (item.file.type || '').toLowerCase();

  if (item.customTargetFormat) {
    derivedFormat = item.customTargetFormat;
  } else if (settings.targetFormat === 'auto') {
    let detected: string | null = null;
    try {
      const headerBuffer = await item.file.slice(0, 16).arrayBuffer();
      const validation = validateMagicBytes(headerBuffer);
      if (validation.valid && validation.format) {
        detected = validation.format;
      }
    } catch (e) {}

    if (!detected) {
      if (originalExt === 'jpg' || originalExt === 'jpeg' || originalMime === 'image/jpeg') detected = 'jpg';
      else if (originalExt === 'png' || originalMime === 'image/png') detected = 'png';
      else if (originalExt === 'webp' || originalMime === 'image/webp') detected = 'webp';
      else if (originalExt === 'avif' || originalMime === 'image/avif') detected = 'avif';
      else if (originalExt === 'bmp' || originalMime === 'image/bmp') detected = 'bmp';
      else if (originalExt === 'ico' || originalMime === 'image/x-icon' || originalMime === 'image/vnd.microsoft.icon') detected = 'ico';
    }

    if (detected) {
      if (detected === 'jpg' || detected === 'png' || detected === 'webp' || detected === 'avif' || detected === 'bmp' || detected === 'ico') {
        derivedFormat = detected as TargetFormat;
      } else {
        throw new Error(`Format preservation is not supported for ${detected.toUpperCase()}. Please select an explicit output format to convert this file.`);
      }
    } else {
      const formatLabel = originalExt ? originalExt.toUpperCase() : 'unsupported';
      throw new Error(`Format preservation is not supported for ${formatLabel}. Please select an explicit output format to convert this file.`);
    }
  } else if (settings.targetFormatMode === 'per-original') {
    try {
      const headerBuffer = await item.file.slice(0, 16).arrayBuffer();
      const validation = validateMagicBytes(headerBuffer);
      if (validation.valid && validation.format) {
        if (validation.format === 'jpg' || validation.format === 'png' || validation.format === 'webp' || validation.format === 'bmp' || validation.format === 'ico') {
          derivedFormat = validation.format as TargetFormat;
        } else {
          derivedFormat = 'jpg';
        }
      } else {
        if (originalExt === 'jpg' || originalExt === 'jpeg') derivedFormat = 'jpg';
        else if (originalExt === 'png') derivedFormat = 'png';
        else if (originalExt === 'webp') derivedFormat = 'webp';
        else if (originalExt === 'bmp') derivedFormat = 'bmp';
        else if (originalExt === 'ico') derivedFormat = 'ico';
        else derivedFormat = 'jpg';
      }
    } catch (e) {
      if (originalExt === 'jpg' || originalExt === 'jpeg') derivedFormat = 'jpg';
      else if (originalExt === 'png') derivedFormat = 'png';
      else if (originalExt === 'webp') derivedFormat = 'webp';
      else if (originalExt === 'bmp') derivedFormat = 'bmp';
      else if (originalExt === 'ico') derivedFormat = 'ico';
      else derivedFormat = 'jpg';
    }
  } else {
    derivedFormat = settings.targetFormat;
  }

  const effectiveSettings: ConversionSettings = {
    ...settings,
    targetFormat: derivedFormat,
  };

  const { targetFormat, quality, resize } = effectiveSettings;
  const effectiveRotation = (((effectiveSettings.rotation || 0) + (item.rotation || 0)) % 360 + 360) % 360;
  const isRotated90or270 = effectiveRotation === 90 || effectiveRotation === 270;

  // Load image
  let loaded = await loadImageElement(item.file);
  let fallbackLoaded = null;
  try {
  if (signal?.aborted) {
    throw new DOMException('The operation was aborted.', 'AbortError');
  }

  const sourceW = loaded.dimensions.width;
  const sourceH = loaded.dimensions.height;
  const postRotW = isRotated90or270 ? sourceH : sourceW;
  const postRotH = isRotated90or270 ? sourceW : sourceH;

  let croppedW = postRotW;
  let croppedH = postRotH;
  if (effectiveSettings.cropAspectRatio && effectiveSettings.cropAspectRatio.width > 0 && effectiveSettings.cropAspectRatio.height > 0) {
    const cropPost = calculateCropRect(postRotW, postRotH, effectiveSettings.cropAspectRatio);
    croppedW = cropPost.cropWidth;
    croppedH = cropPost.cropHeight;
  }

  const targetDim = calculateTargetDimensions(
    { width: croppedW, height: croppedH },
    resize.enabled ? resize.maxWidth : undefined,
    resize.enabled ? resize.maxHeight : undefined,
    resize.keepAspectRatio
  );

  const canvasWidth = targetDim.width;
  const canvasHeight = targetDim.height;

  let convertedBlob: Blob | null = null;
  let pdfImageData: Blob | undefined = undefined;
  let pdfImageWidth: number | undefined = undefined;
  let pdfImageHeight: number | undefined = undefined;
  let originalFallback = false;

  // Worker Path via workerPool
  if (typeof OffscreenCanvas !== 'undefined' && loaded.img instanceof ImageBitmap && targetFormat !== 'ico' && targetFormat !== 'pdf') {
    let pooledWorker: PooledWorker | undefined;
    let workerShouldRecycle = false;
    try {
      pooledWorker = await getWorkerPool().acquireWorker();
      if (signal?.aborted) {
        throw new DOMException('The operation was aborted.', 'AbortError');
      }

      const workerInstance = pooledWorker.worker;
      const jobId = `${item.id}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const result = await new Promise<{ buffer: ArrayBuffer; mimeType: string; originalFallback?: boolean; shouldRecycle?: boolean }>(
        (resolve, reject) => {
          const timeoutId = setTimeout(() => {
            reject(new Error('Worker conversion timeout (25s)'));
          }, 25000);

          const onAbort = () => {
            clearTimeout(timeoutId);
            workerInstance.removeEventListener('message', onMsg);
            workerInstance.removeEventListener('error', onErr);
            reject(new DOMException('The operation was aborted.', 'AbortError'));
          };

          if (signal) {
            if (signal.aborted) {
              onAbort();
              return;
            }
            signal.addEventListener('abort', onAbort);
          }

          const onMsg = (e: MessageEvent) => {
            if (e.data.id !== jobId) return;
            workerInstance.removeEventListener('message', onMsg);
            workerInstance.removeEventListener('error', onErr);
            if (signal) signal.removeEventListener('abort', onAbort);
            clearTimeout(timeoutId);

            if (e.data.status === 'success') {
              resolve({
                buffer: e.data.buffer,
                mimeType: e.data.mimeType || 'image/jpeg',
                originalFallback: e.data.originalFallback,
                shouldRecycle: e.data.shouldRecycle,
              });
            } else {
              reject(new Error(e.data.error || 'Worker conversion failed'));
            }
          };

          const onErr = (err: ErrorEvent) => {
            workerInstance.removeEventListener('message', onMsg);
            workerInstance.removeEventListener('error', onErr);
            if (signal) signal.removeEventListener('abort', onAbort);
            clearTimeout(timeoutId);
            reject(err instanceof Error ? err : new Error('Worker script error'));
          };

          workerInstance.addEventListener('message', onMsg);
          workerInstance.addEventListener('error', onErr);

          workerInstance.postMessage(
            {
              id: jobId,
              imageBitmap: loaded.img,
              settings: effectiveSettings,
              targetDim,
              rotation: effectiveRotation,
              originalSize: item.originalSize,
              originalFileName: item.file.name,
              originalFileType: item.file.type,
              blurRegions: item.blurRegions,
              blurMode: item.blurMode,
            },
            [loaded.img] // Transfer ImageBitmap ownership for zero copy
          );
        }
      );

      convertedBlob = new Blob([result.buffer], { type: result.mimeType });
      originalFallback = !!result.originalFallback;
      workerShouldRecycle = !!result.shouldRecycle;
    } catch (err: any) {
      if (err.name === 'AbortError') {
        if (pooledWorker) {
          getWorkerPool().terminateWorker(pooledWorker);
          pooledWorker = undefined;
        }
        throw err;
      }
      console.warn('Worker conversion failed or timed out, using main-thread fallback:', err);
      if (pooledWorker) {
        getWorkerPool().terminateWorker(pooledWorker);
        pooledWorker = undefined;
      }
    } finally {
      if (pooledWorker) {
        const mp = (targetDim.width * targetDim.height) / 1000000;
        getWorkerPool().releaseWorker(pooledWorker, {
          shouldRecycle: workerShouldRecycle || mp >= 12,
          megapixels: mp,
        });
      }
    }
  }

  if (signal?.aborted) {
    throw new DOMException('The operation was aborted.', 'AbortError');
  }

  // Main thread fallback (if worker path was skipped or failed)
  if (!convertedBlob) {
    fallbackLoaded = typeof OffscreenCanvas !== 'undefined' && targetFormat !== 'ico' 
      ? await loadImageElement(item.file)
      : loaded;

    const canvas = document.createElement('canvas');
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context failed');

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    if (targetFormat === 'jpg' || targetFormat === 'bmp') {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    }

    const fbSourceW = fallbackLoaded.dimensions.width;
    const fbSourceH = fallbackLoaded.dimensions.height;
    const cropSource = getCropSourceRect(fbSourceW, fbSourceH, effectiveRotation, effectiveSettings.cropAspectRatio);

    if (effectiveRotation !== 0) {
      const drawW = isRotated90or270 ? canvasHeight : canvasWidth;
      const drawH = isRotated90or270 ? canvasWidth : canvasHeight;
      ctx.save();
      ctx.translate(canvasWidth / 2, canvasHeight / 2);
      ctx.rotate((effectiveRotation * Math.PI) / 180);
      ctx.drawImage(fallbackLoaded.img as CanvasImageSource, cropSource.cropX, cropSource.cropY, cropSource.cropWidth, cropSource.cropHeight, -drawW / 2, -drawH / 2, drawW, drawH);
      ctx.restore();
    } else {
      ctx.drawImage(fallbackLoaded.img as CanvasImageSource, cropSource.cropX, cropSource.cropY, cropSource.cropWidth, cropSource.cropHeight, 0, 0, canvasWidth, canvasHeight);
    }

    applyBlurAndPixelateRegions(ctx, canvasWidth, canvasHeight, item.blurRegions, item.blurMode);

    if (effectiveSettings.grayscale) {
      applyGrayscaleFilter(ctx, canvasWidth, canvasHeight);
    }

    if (effectiveSettings.watermarkText && effectiveSettings.watermarkText.trim()) {
      applyWatermarkText(ctx, canvasWidth, canvasHeight, effectiveSettings.watermarkText);
    }

    if (typeof (globalThis as any).scheduler?.yield === 'function') {
      await (globalThis as any).scheduler.yield();
    } else {
      await new Promise(r => setTimeout(r, 0));
    }

    if (targetFormat === 'ico') {
      convertedBlob = await encodeIco(canvas);
    } else if (targetFormat === 'png') {
      const imgData = ctx.getImageData(0, 0, canvasWidth, canvasHeight);
      let pngBytes = await encodePng(imgData, quality, item.originalSize, canvas);
      if (effectiveSettings.targetDPI && effectiveSettings.targetDPI > 0) {
        pngBytes = injectDpiMetadata(pngBytes, 'png', effectiveSettings.targetDPI);
      }
      convertedBlob = new Blob([pngBytes], { type: 'image/png' });
    } else if (targetFormat === 'jpg') {
      const imgData = ctx.getImageData(0, 0, canvasWidth, canvasHeight);
      let jpegBytes = await encodeJpeg(imgData, quality, canvas);
      if (effectiveSettings.targetDPI && effectiveSettings.targetDPI > 0) {
        jpegBytes = injectDpiMetadata(jpegBytes, 'jpg', effectiveSettings.targetDPI);
      }
      convertedBlob = new Blob([jpegBytes], { type: 'image/jpeg' });
    } else if (targetFormat === 'webp') {
      if (effectiveSettings.targetMaxKB && effectiveSettings.targetMaxKB > 0) {
        const adaptiveRes = await encodeWebpAdaptive(canvas, {
          initialQuality: quality,
          originalSize: item.originalSize,
          isJpegSource: /jpe?g$/i.test(item.file.name) || item.file.type === 'image/jpeg',
        });
        convertedBlob = adaptiveRes.blob;
      } else {
        convertedBlob = await encodeWebp(canvas, quality);
      }
    } else if (targetFormat === 'pdf') {
      const imgData = ctx.getImageData(0, 0, canvasWidth, canvasHeight);
      const jpegBytes = await encodeJpeg(imgData, 0.9, canvas);
      const pdfImageBlob = new Blob([jpegBytes], { type: 'image/jpeg' });
      
      const { jsPDF } = await import('jspdf');
      const orientation = canvasWidth > canvasHeight ? 'l' : 'p';
      const pdf = new jsPDF({
        orientation,
        unit: 'px',
        format: [canvasWidth, canvasHeight]
      });
      
      pdf.addImage(jpegBytes, 'JPEG', 0, 0, canvasWidth, canvasHeight);
      convertedBlob = pdf.output('blob');
      
      // Store the high-quality JPEG blob so it can be combined in handleDownloadAll
      pdfImageData = pdfImageBlob;
      pdfImageWidth = canvasWidth;
      pdfImageHeight = canvasHeight;
    } else if (targetFormat === 'avif') {
      convertedBlob = await encodeAvif(canvas, quality);
    } else if (targetFormat === 'bmp') {
      convertedBlob = await encodeBmp(canvas);
    } else {
      convertedBlob = await encodeWebp(canvas, quality);
    }

    // targetMaxKB reduction loop if required on main thread
    if (effectiveSettings.targetMaxKB && effectiveSettings.targetMaxKB > 0 && targetFormat !== 'ico') {
      convertedBlob = await reduceToTargetMaxKB({
        canvas,
        ctx,
        canvasWidth,
        canvasHeight,
        initialBlob: convertedBlob,
        targetFormat,
        quality,
        targetMaxKB: effectiveSettings.targetMaxKB,
        originalSize: item.originalSize,
        targetDPI: effectiveSettings.targetDPI,
        throwIfUnreached: true,
      });
    }
  }

  const hasTransformations =
    effectiveRotation !== 0 ||
    (effectiveSettings.resize && effectiveSettings.resize.enabled) ||
    (effectiveSettings.watermarkText && effectiveSettings.watermarkText.trim() !== '') ||
    !!effectiveSettings.grayscale;

  const isOriginalSameFormat = isSameFormat(item.file, targetFormat);
  if (isOriginalSameFormat && (convertedBlob.size > item.originalSize || originalFallback) && !hasTransformations && targetFormat !== 'ico') {
    convertedBlob = item.file;
    originalFallback = true;
  } else {
    originalFallback = false;
  }

  const convertedUrl = URL.createObjectURL(convertedBlob);

  return {
    blob: convertedBlob,
    convertedSize: convertedBlob.size,
    dimensions: { width: canvasWidth, height: canvasHeight },
    convertedUrl,
    originalFallback,
    pdfImageData,
    pdfImageWidth,
    pdfImageHeight,
  };
  } finally {
    if (loaded && loaded.img instanceof ImageBitmap) {
      try { loaded.img.close(); } catch(e) {}
    }
    if (loaded && loaded.objectUrl) URL.revokeObjectURL(loaded.objectUrl);
    
    if (fallbackLoaded && fallbackLoaded !== loaded) {
      if (fallbackLoaded.img instanceof ImageBitmap) {
        try { fallbackLoaded.img.close(); } catch(e) {}
      }
      if (fallbackLoaded.objectUrl) URL.revokeObjectURL(fallbackLoaded.objectUrl);
    }
  }
}

export async function generateBatchZip(
  files: ImageFileItem[],
  settings: ConversionSettings,
  formatOutputFilename: (item: ImageFileItem, idx: number, settings: ConversionSettings) => string
): Promise<Blob> {
  const { default: JSZip } = await import('jszip');
  const zip = new JSZip();
  const folder = zip.folder(`converted_images_${settings.targetFormat}`);
  const successFiles = files.filter((f) => f.status === 'success' && f.blob);
  const usedNames = new Set<string>();

  for (let i = 0; i < successFiles.length; i++) {
    const f = successFiles[i];
    if (!f.blob) continue;

    let fileName = formatOutputFilename(f, i, settings);
      
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

    folder?.file(fileName, f.blob);
  }

  return await zip.generateAsync({ type: 'blob' });
}


