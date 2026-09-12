import { TargetFormat } from '../types';
import { encodeJpeg, encodePng, encodeWebp, encodeAvif, encodeBmp, injectDpiMetadata } from './codecs';
import { formatBytes } from './utils';

export function createCanvas(width: number, height: number): HTMLCanvasElement | OffscreenCanvas {
  if (typeof OffscreenCanvas !== 'undefined') {
    return new OffscreenCanvas(width, height);
  }
  if (typeof document !== 'undefined') {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    return canvas;
  }
  throw new Error('Canvas rendering is not supported in this environment');
}

export function calculateCropRect(
  sourceWidth: number,
  sourceHeight: number,
  targetRatio: { width: number; height: number }
): { cropX: number; cropY: number; cropWidth: number; cropHeight: number } {
  if (sourceWidth <= 0 || sourceHeight <= 0 || !targetRatio || targetRatio.width <= 0 || targetRatio.height <= 0) {
    return { cropX: 0, cropY: 0, cropWidth: Math.max(1, sourceWidth), cropHeight: Math.max(1, sourceHeight) };
  }

  const targetAspect = targetRatio.width / targetRatio.height;
  const sourceAspect = sourceWidth / sourceHeight;

  let cropWidth: number;
  let cropHeight: number;

  if (sourceAspect > targetAspect) {
    cropHeight = sourceHeight;
    cropWidth = sourceHeight * targetAspect;
  } else {
    cropWidth = sourceWidth;
    cropHeight = sourceWidth / targetAspect;
  }

  const cropX = Math.max(0, Math.min((sourceWidth - cropWidth) / 2, sourceWidth - cropWidth));
  const cropY = Math.max(0, Math.min((sourceHeight - cropHeight) / 2, sourceHeight - cropHeight));

  return {
    cropX: Math.round(cropX),
    cropY: Math.round(cropY),
    cropWidth: Math.round(cropWidth),
    cropHeight: Math.round(cropHeight),
  };
}

export function getCropSourceRect(
  sourceWidth: number,
  sourceHeight: number,
  rotation: number,
  cropRatio?: { width: number; height: number } | null
): { cropX: number; cropY: number; cropWidth: number; cropHeight: number } {
  const effectiveRotation = ((rotation % 360) + 360) % 360;
  const isRotated90or270 = effectiveRotation === 90 || effectiveRotation === 270;
  const postRotWidth = isRotated90or270 ? sourceHeight : sourceWidth;
  const postRotHeight = isRotated90or270 ? sourceWidth : sourceHeight;

  if (!cropRatio || cropRatio.width <= 0 || cropRatio.height <= 0) {
    return { cropX: 0, cropY: 0, cropWidth: sourceWidth, cropHeight: sourceHeight };
  }

  const cropRectPost = calculateCropRect(postRotWidth, postRotHeight, cropRatio);
  const { cropX: X, cropY: Y, cropWidth: W, cropHeight: H } = cropRectPost;

  let cropX = 0;
  let cropY = 0;
  let cropWidth = sourceWidth;
  let cropHeight = sourceHeight;

  if (effectiveRotation === 0) {
    cropX = X;
    cropY = Y;
    cropWidth = W;
    cropHeight = H;
  } else if (effectiveRotation === 90) {
    cropX = sourceWidth - (Y + H);
    cropY = X;
    cropWidth = H;
    cropHeight = W;
  } else if (effectiveRotation === 180) {
    cropX = sourceWidth - (X + W);
    cropY = sourceHeight - (Y + H);
    cropWidth = W;
    cropHeight = H;
  } else if (effectiveRotation === 270) {
    cropX = Y;
    cropY = sourceHeight - (X + W);
    cropWidth = H;
    cropHeight = W;
  }

  cropX = Math.max(0, Math.min(cropX, sourceWidth - cropWidth));
  cropY = Math.max(0, Math.min(cropY, sourceHeight - cropHeight));

  return { cropX, cropY, cropWidth, cropHeight };
}

export function applyBlurAndPixelateRegions(
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
  regions: Array<{ x: number; y: number; width: number; height: number }> | undefined,
  mode: 'blur' | 'pixelate' | undefined
): void {
  if (!regions || regions.length === 0) return;
  const activeMode = mode || 'blur';

  for (const region of regions) {
    const rx = Math.round(region.x * canvasWidth);
    const ry = Math.round(region.y * canvasHeight);
    const rw = Math.round(region.width * canvasWidth);
    const rh = Math.round(region.height * canvasHeight);

    if (rw <= 0 || rh <= 0) continue;

    if (activeMode === 'blur') {
      ctx.save();
      ctx.beginPath();
      ctx.rect(rx, ry, rw, rh);
      ctx.clip();

      try {
        const tempCanvas = createCanvas(rw, rh);
        const tempCtx = tempCanvas.getContext('2d') as CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null;
        if (tempCtx) {
          tempCtx.drawImage(ctx.canvas, rx, ry, rw, rh, 0, 0, rw, rh);
          
          // Draw with blur filter
          ctx.filter = 'blur(16px)';
          ctx.drawImage(tempCanvas as any, rx, ry);
        }
      } catch (err) {
        // Fallback: draw directly
        ctx.filter = 'blur(16px)';
        ctx.drawImage(ctx.canvas, rx, ry, rw, rh, rx, ry, rw, rh);
      }
      ctx.restore();
    } else {
      // Pixelate
      ctx.save();
      try {
        const scale = 0.08; // 8% of original size
        const sw = Math.max(1, Math.round(rw * scale));
        const sh = Math.max(1, Math.round(rh * scale));

        const tempCanvas = createCanvas(sw, sh);
        const tempCtx = tempCanvas.getContext('2d') as CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null;
        if (tempCtx) {
          tempCtx.imageSmoothingEnabled = false;
          tempCtx.drawImage(ctx.canvas, rx, ry, rw, rh, 0, 0, sw, sh);

          ctx.imageSmoothingEnabled = false;
          (ctx as any).mozImageSmoothingEnabled = false;
          (ctx as any).webkitImageSmoothingEnabled = false;
          (ctx as any).msImageSmoothingEnabled = false;

          ctx.drawImage(tempCanvas as any, 0, 0, sw, sh, rx, ry, rw, rh);
        }
      } catch (err) {
        console.error('Failed to pixelate region:', err);
      }
      ctx.restore();
    }
  }
}

export function applyGrayscaleFilter(
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  width: number,
  height: number
): void {
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const gray = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
    data[i] = gray;
    data[i + 1] = gray;
    data[i + 2] = gray;
  }
  ctx.putImageData(imgData, 0, 0);
}

export function applyWatermarkText(
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  width: number,
  height: number,
  watermarkText?: string
): void {
  if (!watermarkText || !watermarkText.trim()) return;
  const text = watermarkText.trim();
  const fontSize = Math.max(14, Math.round(height * 0.04));
  ctx.font = `bold ${fontSize}px sans-serif`;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'bottom';

  const padding = Math.max(12, Math.round(fontSize * 0.8));
  const x = width - padding;
  const y = height - padding;

  ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
  ctx.fillText(text, x + 1, y + 1);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.fillText(text, x, y);
}

export interface ReduceTargetMaxKBOptions {
  canvas: HTMLCanvasElement | OffscreenCanvas;
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;
  canvasWidth: number;
  canvasHeight: number;
  initialBlob: Blob;
  targetFormat: TargetFormat;
  quality: number;
  targetMaxKB: number;
  originalSize: number;
  targetDPI?: number | null;
  throwIfUnreached?: boolean;
}

export async function reduceToTargetMaxKB(
  options: ReduceTargetMaxKBOptions
): Promise<Blob> {
  const {
    canvas,
    ctx,
    canvasWidth,
    canvasHeight,
    initialBlob,
    targetFormat,
    quality,
    targetMaxKB,
    originalSize,
    targetDPI,
    throwIfUnreached = false,
  } = options;

  if (!targetMaxKB || targetMaxKB <= 0 || targetFormat === 'ico') {
    return initialBlob;
  }

  const maxBytes = targetMaxKB * 1024;
  let blob = initialBlob;
  let currentQuality = quality;
  let step = 0;

  // 1. First degrade quality
  while (blob.size > maxBytes && currentQuality > 0.12 && step < 10) {
    step++;
    currentQuality = Math.max(0.1, currentQuality * 0.75);
    if (targetFormat === 'jpg') {
      const imgData = ctx.getImageData(0, 0, canvasWidth, canvasHeight);
      let bytes = await encodeJpeg(imgData, currentQuality, canvas);
      if (targetDPI && targetDPI > 0) {
        bytes = injectDpiMetadata(bytes, 'jpg', targetDPI);
      }
      blob = new Blob([bytes], { type: 'image/jpeg' });
    } else if (targetFormat === 'png') {
      const imgData = ctx.getImageData(0, 0, canvasWidth, canvasHeight);
      let bytes = await encodePng(imgData, currentQuality, originalSize, canvas);
      if (targetDPI && targetDPI > 0) {
        bytes = injectDpiMetadata(bytes, 'png', targetDPI);
      }
      blob = new Blob([bytes], { type: 'image/png' });
    } else if (targetFormat === 'webp') {
      blob = await encodeWebp(canvas, currentQuality);
    } else if (targetFormat === 'avif') {
      blob = await encodeAvif(canvas, currentQuality);
    } else {
      break;
    }
  }

  // 2. Then scale down dimensions if still too big
  let currentCanvas: HTMLCanvasElement | OffscreenCanvas = canvas;
  let scale = 0.85;
  while (blob.size > maxBytes && scale > 0.15 && step < 15) {
    step++;
    const w = Math.max(16, Math.round(canvasWidth * scale));
    const h = Math.max(16, Math.round(canvasHeight * scale));

    const scaledCanvas = createCanvas(w, h);
    const sCtx = scaledCanvas.getContext('2d') as CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null;
    if (sCtx) {
      sCtx.drawImage(currentCanvas, 0, 0, w, h);
      if (targetFormat === 'jpg') {
        const imgData = sCtx.getImageData(0, 0, w, h);
        let bytes = await encodeJpeg(imgData, currentQuality, scaledCanvas);
        if (targetDPI && targetDPI > 0) {
          bytes = injectDpiMetadata(bytes, 'jpg', targetDPI);
        }
        blob = new Blob([bytes], { type: 'image/jpeg' });
      } else if (targetFormat === 'png') {
        const imgData = sCtx.getImageData(0, 0, w, h);
        let bytes = await encodePng(imgData, currentQuality, originalSize, scaledCanvas);
        if (targetDPI && targetDPI > 0) {
          bytes = injectDpiMetadata(bytes, 'png', targetDPI);
        }
        blob = new Blob([bytes], { type: 'image/png' });
      } else if (targetFormat === 'webp') {
        blob = await encodeWebp(scaledCanvas, currentQuality);
      } else if (targetFormat === 'avif') {
        blob = await encodeAvif(scaledCanvas, currentQuality);
      } else if (targetFormat === 'bmp') {
        blob = await encodeBmp(scaledCanvas);
      }
      currentCanvas = scaledCanvas;
    }
    scale *= 0.8;
  }

  if (throwIfUnreached && blob.size > maxBytes) {
    throw new Error(`target not reached (final size: ${formatBytes(blob.size)})`);
  }

  return blob;
}
