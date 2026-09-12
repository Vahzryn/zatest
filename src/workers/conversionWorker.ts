import { encodeJpeg, encodePng, encodeWebp, encodeWebpAdaptive, encodeAvif, encodeBmp, encodeIco, injectDpiMetadata } from '../lib/codecs';
import {
  getCropSourceRect,
  applyBlurAndPixelateRegions,
  applyGrayscaleFilter,
  applyWatermarkText,
  reduceToTargetMaxKB
} from '../lib/imageEffects';

function isSameFormat(mime?: string, name?: string, targetFormat?: string): boolean {
  if (!targetFormat) return false;
  const m = (mime || '').toLowerCase();
  const fn = (name || '').toLowerCase();

  if ((targetFormat === 'jpg' || targetFormat === 'jpeg') && (m === 'image/jpeg' || /\.jpe?g$/i.test(fn))) return true;
  if (targetFormat === 'png' && (m === 'image/png' || /\.png$/i.test(fn))) return true;
  if (targetFormat === 'webp' && (m === 'image/webp' || /\.webp$/i.test(fn))) return true;
  if (targetFormat === 'avif' && (m === 'image/avif' || /\.avif$/i.test(fn))) return true;
  if (targetFormat === 'bmp' && (m === 'image/bmp' || /\.bmp$/i.test(fn))) return true;
  if (targetFormat === 'ico' && (m === 'image/x-icon' || m === 'image/vnd.microsoft.icon' || /\.ico$/i.test(fn))) return true;

  return false;
}

self.onmessage = async (e: MessageEvent) => {
  const { id, imageBitmap, settings, targetDim, rotation = 0, originalSize = 0, originalFileName, originalFileType, blurRegions, blurMode } = e.data;

  try {
    const { targetFormat, quality } = settings;
    const effectiveRotation = ((rotation % 360) + 360) % 360;
    const isRotated90or270 = effectiveRotation === 90 || effectiveRotation === 270;

    const canvasWidth = targetDim.width;
    const canvasHeight = targetDim.height;

    const canvas = new OffscreenCanvas(canvasWidth, canvasHeight);
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('OffscreenCanvas 2D context not supported');
    }

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    if (targetFormat === 'jpg' || targetFormat === 'bmp') {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    }

    const cropSource = getCropSourceRect(imageBitmap.width, imageBitmap.height, effectiveRotation, settings.cropAspectRatio);

    if (effectiveRotation !== 0) {
      const drawW = isRotated90or270 ? canvasHeight : canvasWidth;
      const drawH = isRotated90or270 ? canvasWidth : canvasHeight;
      ctx.save();
      ctx.translate(canvasWidth / 2, canvasHeight / 2);
      ctx.rotate((effectiveRotation * Math.PI) / 180);
      ctx.drawImage(
        imageBitmap,
        cropSource.cropX,
        cropSource.cropY,
        cropSource.cropWidth,
        cropSource.cropHeight,
        -drawW / 2,
        -drawH / 2,
        drawW,
        drawH
      );
      ctx.restore();
    } else {
      ctx.drawImage(
        imageBitmap,
        cropSource.cropX,
        cropSource.cropY,
        cropSource.cropWidth,
        cropSource.cropHeight,
        0,
        0,
        canvasWidth,
        canvasHeight
      );
    }

    applyBlurAndPixelateRegions(ctx, canvasWidth, canvasHeight, blurRegions, blurMode);

    if (settings.grayscale) {
      applyGrayscaleFilter(ctx, canvasWidth, canvasHeight);
    }

    if (settings.watermarkText && settings.watermarkText.trim()) {
      applyWatermarkText(ctx, canvasWidth, canvasHeight, settings.watermarkText);
    }

    // Close early if possible to free GPU/CPU memory
    if (imageBitmap && typeof imageBitmap.close === 'function') {
      try { imageBitmap.close(); } catch (e) {}
    }

    let blob: Blob;

    if (targetFormat === 'ico') {
      blob = await encodeIco(canvas);
    } else if (targetFormat === 'png') {
      const imgData = ctx.getImageData(0, 0, canvasWidth, canvasHeight);
      let pngBytes = await encodePng(imgData, quality, originalSize, canvas);
      if (settings.targetDPI && settings.targetDPI > 0) {
        pngBytes = injectDpiMetadata(pngBytes, 'png', settings.targetDPI);
      }
      blob = new Blob([pngBytes], { type: 'image/png' });
    } else if (targetFormat === 'jpg') {
      const imgData = ctx.getImageData(0, 0, canvasWidth, canvasHeight);
      let jpegBytes = await encodeJpeg(imgData, quality, canvas);
      if (settings.targetDPI && settings.targetDPI > 0) {
        jpegBytes = injectDpiMetadata(jpegBytes, 'jpg', settings.targetDPI);
      }
      blob = new Blob([jpegBytes], { type: 'image/jpeg' });
    } else if (targetFormat === 'webp') {
      if (settings.targetMaxKB && settings.targetMaxKB > 0) {
        const adaptiveRes = await encodeWebpAdaptive(canvas, {
          initialQuality: quality,
          originalSize,
          isJpegSource: true,
        });
        blob = adaptiveRes.blob;
      } else {
        blob = await encodeWebp(canvas, quality);
      }
    } else if (targetFormat === 'avif') {
      blob = await encodeAvif(canvas, quality);
    } else if (targetFormat === 'bmp') {
      blob = await encodeBmp(canvas);
    } else {
      blob = await encodeWebp(canvas, quality);
    }

    // targetMaxKB reduction loop if required
    if (settings.targetMaxKB && settings.targetMaxKB > 0 && targetFormat !== 'ico') {
      blob = await reduceToTargetMaxKB({
        canvas,
        ctx,
        canvasWidth,
        canvasHeight,
        initialBlob: blob,
        targetFormat,
        quality,
        targetMaxKB: settings.targetMaxKB,
        originalSize,
        targetDPI: settings.targetDPI,
        throwIfUnreached: false,
      });
    }

    const hasTransformations =
      effectiveRotation !== 0 ||
      (settings.resize && settings.resize.enabled) ||
      (settings.watermarkText && settings.watermarkText.trim() !== '') ||
      !!settings.grayscale;

    let originalFallback = false;
    const isOriginalSameFormat = isSameFormat(originalFileType, originalFileName, targetFormat);
    if (isOriginalSameFormat && originalSize > 0 && blob.size > originalSize && !hasTransformations && targetFormat !== 'ico') {
      originalFallback = true;
    }

    const megapixels = (canvasWidth * canvasHeight) / 1000000;
    const shouldRecycle = megapixels >= 12 || ((targetFormat === 'avif' || targetFormat === 'png') && megapixels >= 6);

    const buffer = await blob.arrayBuffer();
    // Post back with transfer list for zero-copy
    (self as any).postMessage({ id, status: 'success', buffer, mimeType: blob.type, originalFallback, shouldRecycle }, [buffer]);

    // Explicitly release canvas memory
    canvas.width = 0;
    canvas.height = 0;
  } catch (error: any) {
    (self as any).postMessage({ id, status: 'error', error: error?.message || 'Conversion error' });
  } finally {
    if (imageBitmap && typeof imageBitmap.close === 'function') {
      try {
        imageBitmap.close();
      } catch (closeErr) {
        console.warn('Failed to close imageBitmap in worker finally:', closeErr);
      }
    }
  }
};
