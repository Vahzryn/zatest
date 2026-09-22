import { BackgroundMode, BgTargetFormat, BgRemovalOptions } from './types';
import { TargetFormat } from '../../types';
import { 
  encodePng, 
  encodeWebp, 
  encodeJpeg, 
  encodeAvif, 
  encodeBmp, 
  encodeIco, 
  injectDpiMetadata 
} from '../../lib/codecs';
import { calculateTargetDimensions } from '../../lib/conversionOrchestrator';
import { 
  calculateCropRect, 
  getCropSourceRect, 
  applyGrayscaleFilter, 
  applyWatermarkText, 
  reduceToTargetMaxKB 
} from '../../lib/imageEffects';

/**
 * Creates an OffscreenCanvas or fallback HTMLCanvasElement of specified dimensions.
 */
export function createProcessingCanvas(width: number, height: number): {
  canvas: OffscreenCanvas | HTMLCanvasElement;
  ctx: OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D;
} {
  if (typeof OffscreenCanvas !== 'undefined') {
    const canvas = new OffscreenCanvas(width, height);
    const ctx = canvas.getContext('2d', { willReadFrequently: true }) as OffscreenCanvasRenderingContext2D;
    return { canvas, ctx };
  }
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true }) as CanvasRenderingContext2D;
  return { canvas, ctx };
}

/**
 * Renders the alpha-cutout image onto an in-memory Canvas with either transparent background or flattened background.
 * Preserves high-fidelity alpha edges without encoding to a lossy format.
 */
export function renderAlphaCutoutCanvas(
  sourceImage: ImageBitmap | HTMLImageElement | HTMLCanvasElement | OffscreenCanvas,
  maskBuffer: ArrayBuffer,
  maskWidth: number,
  maskHeight: number,
  options: BgRemovalOptions = {}
): {
  canvas: OffscreenCanvas | HTMLCanvasElement;
  ctx: OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D;
  width: number;
  height: number;
} {
  const {
    backgroundMode = 'transparent',
    backgroundColor = '#ffffff',
    blurRadius = 12,
    featherRadius = 0,
  } = options;

  const targetWidth = 'width' in sourceImage ? sourceImage.width : (sourceImage as any).naturalWidth || maskWidth;
  const targetHeight = 'height' in sourceImage ? sourceImage.height : (sourceImage as any).naturalHeight || maskHeight;

  // 1. Create mask canvas from raw 1-channel / grayscale mask buffer
  const maskUint8 = new Uint8ClampedArray(maskBuffer);
  const { canvas: maskCanvas, ctx: maskCtx } = createProcessingCanvas(maskWidth, maskHeight);

  const maskImageData = maskCtx.createImageData(maskWidth, maskHeight);
  const data = maskImageData.data;
  const totalPixels = maskWidth * maskHeight;

  const isOneChannel = maskUint8.length === totalPixels;
  const isThreeChannel = maskUint8.length === totalPixels * 3;

  for (let i = 0; i < totalPixels; i++) {
    const alphaVal = isOneChannel
      ? maskUint8[i]
      : isThreeChannel
      ? maskUint8[i * 3]
      : maskUint8[i * 4];

    const idx = i * 4;
    data[idx] = 255;
    data[idx + 1] = 255;
    data[idx + 2] = 255;
    data[idx + 3] = alphaVal;
  }
  maskCtx.putImageData(maskImageData, 0, 0);

  // 2. Build foreground cutout canvas at full target resolution
  const { canvas: fgCanvas, ctx: fgCtx } = createProcessingCanvas(targetWidth, targetHeight);
  fgCtx.imageSmoothingEnabled = true;
  fgCtx.imageSmoothingQuality = 'high';

  // Draw source image
  fgCtx.drawImage(sourceImage, 0, 0, targetWidth, targetHeight);

  // Apply alpha mask using destination-in
  fgCtx.globalCompositeOperation = 'destination-in';

  if (featherRadius > 0 && typeof fgCtx.filter !== 'undefined') {
    fgCtx.filter = `blur(${featherRadius}px)`;
  }
  fgCtx.drawImage(maskCanvas, 0, 0, targetWidth, targetHeight);
  fgCtx.filter = 'none';
  fgCtx.globalCompositeOperation = 'source-over';

  // Release intermediate mask canvas
  if ('width' in maskCanvas) maskCanvas.width = 0;

  // 3. Assemble final rendered canvas based on selected backgroundMode
  if (backgroundMode === 'transparent') {
    // Return fgCanvas directly to avoid redundant layer copy
    return { canvas: fgCanvas, ctx: fgCtx, width: targetWidth, height: targetHeight };
  }

  const { canvas: finalCanvas, ctx: finalCtx } = createProcessingCanvas(targetWidth, targetHeight);
  finalCtx.imageSmoothingEnabled = true;
  finalCtx.imageSmoothingQuality = 'high';

  if (backgroundMode === 'color') {
    // Fill solid background color
    finalCtx.fillStyle = backgroundColor;
    finalCtx.fillRect(0, 0, targetWidth, targetHeight);
    // Draw foreground cutout on top
    finalCtx.drawImage(fgCanvas, 0, 0);
  } else if (backgroundMode === 'blur') {
    // Draw blurred source image as background
    if (typeof finalCtx.filter !== 'undefined') {
      finalCtx.filter = `blur(${blurRadius}px)`;
    }
    finalCtx.drawImage(sourceImage, -blurRadius, -blurRadius, targetWidth + blurRadius * 2, targetHeight + blurRadius * 2);
    finalCtx.filter = 'none';
    // Draw crisp foreground cutout on top
    finalCtx.drawImage(fgCanvas, 0, 0);
  }

  // Release fgCanvas
  if ('width' in fgCanvas) fgCanvas.width = 0;

  return { canvas: finalCanvas, ctx: finalCtx, width: targetWidth, height: targetHeight };
}

/**
 * Applies Zapixal's standard downstream image transformations (Crop, Rotate, Resize, Grayscale, Watermark, TargetMaxKB, Encoding).
 * Directly consumes the active in-memory cutout canvas without redundant re-decoding.
 */
export async function applyZapixalPostProcessing(
  cutoutCanvas: OffscreenCanvas | HTMLCanvasElement,
  options: BgRemovalOptions = {},
  originalSize: number = 0
): Promise<{ blob: Blob; width: number; height: number; format: TargetFormat }> {
  const {
    backgroundMode = 'transparent',
    targetFormat = 'png',
    quality = 0.92,
    resize,
    cropAspectRatio,
    targetDPI,
    rotation = 0,
    grayscale = false,
    watermarkText,
    targetMaxKB,
  } = options;

  const sourceW = cutoutCanvas.width;
  const sourceH = cutoutCanvas.height;

  // Safe default format logic: if transparent background is selected and format is JPG, fallback to PNG to preserve alpha
  let effectiveFormat: TargetFormat = targetFormat;
  if (backgroundMode === 'transparent' && (effectiveFormat === 'jpg' || effectiveFormat === 'bmp')) {
    effectiveFormat = 'png';
  }

  const effectiveRotation = ((rotation % 360) + 360) % 360;
  const isRotated90or270 = effectiveRotation === 90 || effectiveRotation === 270;
  const postRotW = isRotated90or270 ? sourceH : sourceW;
  const postRotH = isRotated90or270 ? sourceW : sourceH;

  // 1. Calculate Crop Rect
  let croppedW = postRotW;
  let croppedH = postRotH;
  if (cropAspectRatio && cropAspectRatio.width > 0 && cropAspectRatio.height > 0) {
    const cropPost = calculateCropRect(postRotW, postRotH, cropAspectRatio);
    croppedW = cropPost.cropWidth;
    croppedH = cropPost.cropHeight;
  }

  // 2. Calculate Resize Dimensions
  const targetDim = calculateTargetDimensions(
    { width: croppedW, height: croppedH },
    resize?.enabled ? resize.maxWidth : undefined,
    resize?.enabled ? resize.maxHeight : undefined,
    resize ? resize.keepAspectRatio : true
  );

  const finalWidth = targetDim.width;
  const finalHeight = targetDim.height;

  // 3. Build Post-processed Canvas
  const { canvas: processedCanvas, ctx: pCtx } = createProcessingCanvas(finalWidth, finalHeight);
  pCtx.imageSmoothingEnabled = true;
  pCtx.imageSmoothingQuality = 'high';

  const cropSource = getCropSourceRect(sourceW, sourceH, effectiveRotation, cropAspectRatio);

  if (effectiveRotation !== 0) {
    const drawW = isRotated90or270 ? finalHeight : finalWidth;
    const drawH = isRotated90or270 ? finalWidth : finalHeight;
    pCtx.save();
    pCtx.translate(finalWidth / 2, finalHeight / 2);
    pCtx.rotate((effectiveRotation * Math.PI) / 180);
    pCtx.drawImage(
      cutoutCanvas,
      cropSource.cropX,
      cropSource.cropY,
      cropSource.cropWidth,
      cropSource.cropHeight,
      -drawW / 2,
      -drawH / 2,
      drawW,
      drawH
    );
    pCtx.restore();
  } else {
    pCtx.drawImage(
      cutoutCanvas,
      cropSource.cropX,
      cropSource.cropY,
      cropSource.cropWidth,
      cropSource.cropHeight,
      0,
      0,
      finalWidth,
      finalHeight
    );
  }

  // 4. Filters & Watermarks
  if (grayscale) {
    applyGrayscaleFilter(pCtx, finalWidth, finalHeight);
  }

  if (watermarkText && watermarkText.trim()) {
    applyWatermarkText(pCtx, finalWidth, finalHeight, watermarkText);
  }

  // 5. Initial Codec Encode
  let blob: Blob;
  if (effectiveFormat === 'webp') {
    blob = await encodeWebp(processedCanvas, quality);
  } else if (effectiveFormat === 'jpg') {
    const imgData = pCtx.getImageData(0, 0, finalWidth, finalHeight);
    let jpgBytes = await encodeJpeg(imgData, quality, processedCanvas);
    if (targetDPI && targetDPI > 0) {
      jpgBytes = injectDpiMetadata(jpgBytes, 'jpg', targetDPI);
    }
    blob = new Blob([jpgBytes], { type: 'image/jpeg' });
  } else if (effectiveFormat === 'avif') {
    blob = await encodeAvif(processedCanvas, quality);
  } else if (effectiveFormat === 'bmp') {
    blob = await encodeBmp(processedCanvas);
  } else if (effectiveFormat === 'ico') {
    blob = await encodeIco(processedCanvas);
  } else {
    // PNG default
    const imgData = pCtx.getImageData(0, 0, finalWidth, finalHeight);
    let pngBytes = await encodePng(imgData, quality, originalSize, processedCanvas);
    if (targetDPI && targetDPI > 0) {
      pngBytes = injectDpiMetadata(pngBytes, 'png', targetDPI);
    }
    blob = new Blob([pngBytes], { type: 'image/png' });
  }

  // 6. Target Max KB compression if requested
  if (targetMaxKB && targetMaxKB > 0 && effectiveFormat !== 'ico') {
    blob = await reduceToTargetMaxKB({
      canvas: processedCanvas,
      ctx: pCtx,
      canvasWidth: finalWidth,
      canvasHeight: finalHeight,
      initialBlob: blob,
      targetFormat: effectiveFormat,
      quality,
      targetMaxKB,
      originalSize,
      targetDPI,
      throwIfUnreached: false,
    });
  }

  // Clean up canvases
  if ('width' in processedCanvas && processedCanvas !== cutoutCanvas) {
    processedCanvas.width = 0;
  }

  return {
    blob,
    width: finalWidth,
    height: finalHeight,
    format: effectiveFormat,
  };
}

/**
 * Composites the predicted alpha mask with the source image, applies downstream transformations, and returns the result.
 */
export async function compositeAlphaMask(
  sourceImage: ImageBitmap | HTMLImageElement | HTMLCanvasElement | OffscreenCanvas,
  maskBuffer: ArrayBuffer,
  maskWidth: number,
  maskHeight: number,
  options: BgRemovalOptions = {},
  originalSize: number = 0
): Promise<{ blob: Blob; width: number; height: number; format: TargetFormat }> {
  // 1. Render alpha cutout
  const { canvas: cutoutCanvas } = renderAlphaCutoutCanvas(
    sourceImage,
    maskBuffer,
    maskWidth,
    maskHeight,
    options
  );

  // 2. Apply downstream Zapixal image processing in single pass
  const result = await applyZapixalPostProcessing(cutoutCanvas, options, originalSize);

  // Release cutout canvas
  if ('width' in cutoutCanvas) {
    cutoutCanvas.width = 0;
  }

  return result;
}

