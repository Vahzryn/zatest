import {
  BgRemovalOptions,
  BgRemovalProgress,
  BgRemovalResult,
  DeviceInferenceProfile,
} from './types';
import { getDeviceInferenceProfile, clampSafeDimensions } from './deviceCapabilities';
import { getSegmentationEngine } from './segmentationEngine';
import { compositeAlphaMask } from './maskCompositor';
import { loadImageElement } from '../../lib/conversionOrchestrator';
import { ImageFileItem } from '../../types';

/**
 * Generates a clean output filename based on source filename and selected format.
 */
export function getCutoutFileName(originalName: string, format: string): string {
  const dotIndex = originalName.lastIndexOf('.');
  const baseName = dotIndex > 0 ? originalName.substring(0, dotIndex) : originalName;
  const ext = format === 'jpeg' ? 'jpg' : format;
  return `${baseName}_cutout.${ext}`;
}

/**
 * Creates a standard Zapixal ImageFileItem from a background removal result.
 */
export function createImageFileItemFromBgResult(
  result: BgRemovalResult,
  originalName: string = 'image.png',
  customId?: string
): ImageFileItem {
  const id = customId || `item-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  return {
    id,
    file: result.file,
    originalSize: result.sizeBytes,
    dimensions: {
      width: result.width,
      height: result.height,
    },
    status: 'pending',
    progress: 0,
    previewUrl: result.previewUrl,
  };
}

/**
 * High-level controller for removing the background from an image file.
 */
export async function removeBackground(
  file: File,
  options: BgRemovalOptions = {},
  onProgress?: (progress: BgRemovalProgress) => void,
  signal?: AbortSignal
): Promise<BgRemovalResult> {
  const totalStartTime = performance.now();
  const operationId = `bg_task_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  onProgress?.({
    operationId,
    stage: 'preprocessing',
    progress: 2,
    message: 'Analyzing and decoding image...',
  });

  // 1. Get adaptive device inference profile
  const profile: DeviceInferenceProfile = await getDeviceInferenceProfile(options.overrideBackend);

  // 2. Decode source image using Zapixal's native loader (handles HEIC, EXIF, orientation)
  const { img: sourceImg, objectUrl } = await loadImageElement(file);

  if (signal?.aborted) {
    URL.revokeObjectURL(objectUrl);
    if ('close' in sourceImg && typeof sourceImg.close === 'function') {
      sourceImg.close();
    }
    throw new DOMException('Operation was aborted by user', 'AbortError');
  }

  const rawWidth = 'width' in sourceImg ? sourceImg.width : (sourceImg as any).naturalWidth;
  const rawHeight = 'height' in sourceImg ? sourceImg.height : (sourceImg as any).naturalHeight;

  // 3. Clamp source dimensions to safe memory limits (max 24 Megapixels)
  const { width: safeWidth, height: safeHeight } = clampSafeDimensions(
    rawWidth,
    rawHeight,
    profile.maxSourceResolution
  );

  // 4. Create an inference-sized ImageBitmap for worker tensor input
  const inferenceResolution = options.overrideResolution || profile.inferenceResolution;
  const aspect = safeWidth / safeHeight;
  let inferWidth = inferenceResolution;
  let inferHeight = inferenceResolution;

  if (aspect >= 1) {
    inferHeight = Math.max(64, Math.round(inferenceResolution / aspect));
  } else {
    inferWidth = Math.max(64, Math.round(inferenceResolution * aspect));
  }

  // Create resized bitmap for inference
  let inferenceBitmap: ImageBitmap;
  if (typeof createImageBitmap !== 'undefined') {
    inferenceBitmap = await createImageBitmap(sourceImg, {
      resizeWidth: inferWidth,
      resizeHeight: inferHeight,
      resizeQuality: 'high',
    });
  } else {
    const canvas = document.createElement('canvas');
    canvas.width = inferWidth;
    canvas.height = inferHeight;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(sourceImg, 0, 0, inferWidth, inferHeight);
    inferenceBitmap = await createImageBitmap(canvas);
  }

  // 5. Dispatch segmentation inference to dedicated worker
  const engine = getSegmentationEngine();

  let maskData;
  try {
    maskData = await engine.segmentImage(
      inferenceBitmap,
      inferWidth,
      inferHeight,
      options.overrideBackend || profile.preferredBackend,
      onProgress,
      signal
    );
  } catch (err) {
    URL.revokeObjectURL(objectUrl);
    if ('close' in sourceImg && typeof sourceImg.close === 'function') {
      sourceImg.close();
    }
    throw err;
  }

  if (signal?.aborted) {
    URL.revokeObjectURL(objectUrl);
    if ('close' in sourceImg && typeof sourceImg.close === 'function') {
      sourceImg.close();
    }
    throw new DOMException('Operation was aborted by user', 'AbortError');
  }

  onProgress?.({
    operationId,
    stage: 'compositing',
    progress: 92,
    message: 'Compositing final high-resolution cutout...',
  });

  // 6. Composite the alpha mask with the full resolution source image & downstream transformations
  const { blob, width: outWidth, height: outHeight, format: finalFormat } = await compositeAlphaMask(
    sourceImg,
    maskData.maskBuffer,
    maskData.maskWidth,
    maskData.maskHeight,
    options,
    file.size
  );

  // 7. Cleanup source references
  URL.revokeObjectURL(objectUrl);
  if ('close' in sourceImg && typeof sourceImg.close === 'function') {
    sourceImg.close();
  }

  const totalTimeMs = Math.round(performance.now() - totalStartTime);
  const previewUrl = URL.createObjectURL(blob);
  const fileName = getCutoutFileName(file.name, finalFormat);
  const mimeType = blob.type || (finalFormat === 'png' ? 'image/png' : finalFormat === 'webp' ? 'image/webp' : 'image/jpeg');
  const resultFile = new File([blob], fileName, { type: mimeType, lastModified: Date.now() });

  onProgress?.({
    operationId,
    stage: 'completed',
    progress: 100,
    message: 'Background removed successfully!',
  });

  const result: BgRemovalResult = {
    operationId,
    blob,
    file: resultFile,
    previewUrl,
    width: outWidth,
    height: outHeight,
    format: finalFormat,
    sizeBytes: blob.size,
    backendUsed: maskData.backendUsed,
    inferenceTimeMs: maskData.inferenceTimeMs,
    totalTimeMs,
    maskData: {
      width: maskData.maskWidth,
      height: maskData.maskHeight,
      rawBuffer: maskData.maskBuffer,
    },
    toImageFileItem: (customId?: string) =>
      createImageFileItemFromBgResult(
        {
          operationId,
          blob,
          file: resultFile,
          previewUrl,
          width: outWidth,
          height: outHeight,
          format: finalFormat,
          sizeBytes: blob.size,
          backendUsed: maskData.backendUsed,
          inferenceTimeMs: maskData.inferenceTimeMs,
          totalTimeMs,
          maskData: {
            width: maskData.maskWidth,
            height: maskData.maskHeight,
          },
          toImageFileItem: () => (null as any),
        },
        file.name,
        customId
      ),
  };

  return result;
}

/**
 * Re-composites an already computed alpha mask with new background/transform settings without re-running AI inference.
 */
export async function recompositeCutout(
  file: File,
  maskBuffer: ArrayBuffer,
  maskWidth: number,
  maskHeight: number,
  options: BgRemovalOptions = {},
  existingResultMeta?: {
    operationId: string;
    backendUsed: any;
    inferenceTimeMs: number;
  }
): Promise<BgRemovalResult> {
  const startTime = performance.now();
  const { img: sourceImg, objectUrl } = await loadImageElement(file);

  try {
    const { blob, width: outWidth, height: outHeight, format: finalFormat } = await compositeAlphaMask(
      sourceImg,
      maskBuffer,
      maskWidth,
      maskHeight,
      options,
      file.size
    );

    URL.revokeObjectURL(objectUrl);
    if ('close' in sourceImg && typeof sourceImg.close === 'function') {
      sourceImg.close();
    }

    const totalTimeMs = Math.round(performance.now() - startTime);
    const previewUrl = URL.createObjectURL(blob);
    const fileName = getCutoutFileName(file.name, finalFormat);
    const mimeType = blob.type || (finalFormat === 'png' ? 'image/png' : finalFormat === 'webp' ? 'image/webp' : 'image/jpeg');
    const resultFile = new File([blob], fileName, { type: mimeType, lastModified: Date.now() });
    const opId = existingResultMeta?.operationId || `recomp_${Date.now()}`;

    const result: BgRemovalResult = {
      operationId: opId,
      blob,
      file: resultFile,
      previewUrl,
      width: outWidth,
      height: outHeight,
      format: finalFormat,
      sizeBytes: blob.size,
      backendUsed: existingResultMeta?.backendUsed || 'webgpu',
      inferenceTimeMs: existingResultMeta?.inferenceTimeMs || 0,
      totalTimeMs,
      maskData: {
        width: maskWidth,
        height: maskHeight,
        rawBuffer: maskBuffer,
      },
      toImageFileItem: (customId?: string) =>
        createImageFileItemFromBgResult(
          {
            operationId: opId,
            blob,
            file: resultFile,
            previewUrl,
            width: outWidth,
            height: outHeight,
            format: finalFormat,
            sizeBytes: blob.size,
            backendUsed: existingResultMeta?.backendUsed || 'webgpu',
            inferenceTimeMs: existingResultMeta?.inferenceTimeMs || 0,
            totalTimeMs,
            maskData: {
              width: maskWidth,
              height: maskHeight,
            },
            toImageFileItem: () => (null as any),
          },
          file.name,
          customId
        ),
    };

    return result;
  } catch (err) {
    URL.revokeObjectURL(objectUrl);
    if ('close' in sourceImg && typeof sourceImg.close === 'function') {
      sourceImg.close();
    }
    throw err;
  }
}

