import type {
  WorkerInboundMessage,
  WorkerOutboundMessage,
  ExecutionBackend,
} from '../features/background-remover/types';

// Model definition (RMBG-1.4 is state-of-the-art for fine hair and product boundaries)
const DEFAULT_MODEL_ID = 'briaai/RMBG-1.4';

let modelInstance: any = null;
let processorInstance: any = null;
let currentLoadedBackend: ExecutionBackend | null = null;
let currentActiveOperationId: string | null = null;
let isCancelled = false;

/**
 * Lazily loads transformers.js and instantiates the segmentation pipeline.
 */
async function loadSegmentationModel(
  backend: ExecutionBackend = 'webgpu',
  modelId: string = DEFAULT_MODEL_ID,
  operationId: string
): Promise<{ model: any; processor: any; backendUsed: ExecutionBackend }> {
  if (modelInstance && processorInstance && currentLoadedBackend === backend) {
    return { model: modelInstance, processor: processorInstance, backendUsed: backend };
  }

  // Dispose previous instance if backend switched
  if (modelInstance) {
    try {
      if (typeof modelInstance.dispose === 'function') {
        await modelInstance.dispose();
      }
    } catch {
      // Ignore disposal errors
    }
    modelInstance = null;
    processorInstance = null;
  }

  postResponse({
    type: 'PROGRESS',
    operationId,
    stage: 'downloading-model',
    progress: 5,
    message: 'Loading background removal AI model...',
  });

  const { AutoModel, AutoProcessor, env } = await import('@huggingface/transformers');

  // Configure browser environment flags
  env.allowLocalModels = false;
  env.useBrowserCache = true;

  const progressCallback = (p: any) => {
    if (isCancelled && currentActiveOperationId === operationId) return;

    if (p.status === 'progress' && typeof p.progress === 'number') {
      const pct = Math.round(p.progress * 0.7); // 0 to 70% during download
      postResponse({
        type: 'PROGRESS',
        operationId,
        stage: 'downloading-model',
        progress: Math.min(70, Math.max(5, pct)),
        message: `Downloading AI model (${Math.round(p.progress)}%)...`,
        bytesLoaded: p.loaded,
        bytesTotal: p.total,
      });
    } else if (p.status === 'ready' || p.status === 'done') {
      postResponse({
        type: 'PROGRESS',
        operationId,
        stage: 'initializing-backend',
        progress: 75,
        message: `Initializing ${backend.toUpperCase()} acceleration...`,
      });
    }
  };

  let actualBackend = backend;
  let model: any = null;
  let processor: any = null;

  try {
    processor = await AutoProcessor.from_pretrained(modelId, {
      progress_callback: progressCallback,
    });

    try {
      model = await AutoModel.from_pretrained(modelId, {
        device: backend === 'webgpu' ? 'webgpu' : 'wasm',
        progress_callback: progressCallback,
      });
      actualBackend = backend;
    } catch (err) {
      if (backend === 'webgpu') {
        console.warn('WebGPU model initialization failed in worker, falling back to WASM:', err);
        postResponse({
          type: 'PROGRESS',
          operationId,
          stage: 'initializing-backend',
          progress: 80,
          message: 'WebGPU unavailable, switching to high-performance WASM fallback...',
        });
        model = await AutoModel.from_pretrained(modelId, {
          device: 'wasm',
          progress_callback: progressCallback,
        });
        actualBackend = 'wasm';
      } else {
        throw err;
      }
    }
  } catch (error: any) {
    throw new Error(`Failed to load background removal model: ${error?.message || String(error)}`);
  }

  modelInstance = model;
  processorInstance = processor;
  currentLoadedBackend = actualBackend;

  return { model, processor, backendUsed: actualBackend };
}

/**
 * Runs segmentation inference on input image data.
 */
async function runInference(
  imageDataOrBitmap: ImageBitmap | ImageData,
  targetWidth: number,
  targetHeight: number,
  backend: ExecutionBackend = 'webgpu',
  operationId: string
) {
  currentActiveOperationId = operationId;
  isCancelled = false;

  const startTime = performance.now();

  const { model, processor, backendUsed } = await loadSegmentationModel(backend, DEFAULT_MODEL_ID, operationId);

  if (isCancelled || currentActiveOperationId !== operationId) {
    return;
  }

  postResponse({
    type: 'PROGRESS',
    operationId,
    stage: 'inferring',
    progress: 85,
    message: 'Computing subject cutout & alpha matte...',
  });

  const { RawImage } = await import('@huggingface/transformers');

  // Convert input to RawImage for Transformers.js processor
  let rawImage: any;
  if ('data' in imageDataOrBitmap) {
    // ImageData
    rawImage = new RawImage(
      imageDataOrBitmap.data,
      imageDataOrBitmap.width,
      imageDataOrBitmap.height,
      4
    );
  } else {
    // ImageBitmap - draw to an OffscreenCanvas to get Uint8ClampedArray
    const offscreen = new OffscreenCanvas(imageDataOrBitmap.width, imageDataOrBitmap.height);
    const ctx = offscreen.getContext('2d', { willReadFrequently: true });
    if (!ctx) {
      throw new Error('Could not create OffscreenCanvas 2D context in worker');
    }
    ctx.drawImage(imageDataOrBitmap, 0, 0);
    const imgData = ctx.getImageData(0, 0, imageDataOrBitmap.width, imageDataOrBitmap.height);
    rawImage = new RawImage(imgData.data, imgData.width, imgData.height, 4);

    // Close bitmap as soon as drawn
    try {
      imageDataOrBitmap.close();
    } catch {
      // Ignore
    }
  }

  if (isCancelled || currentActiveOperationId !== operationId) {
    return;
  }

  // Preprocess image
  const imageInputs = await processor(rawImage);

  if (isCancelled || currentActiveOperationId !== operationId) {
    return;
  }

  // Run model inference
  const { output } = await model(imageInputs);

  if (isCancelled || currentActiveOperationId !== operationId) {
    return;
  }

  postResponse({
    type: 'PROGRESS',
    operationId,
    stage: 'compositing',
    progress: 95,
    message: 'Extracting high-precision alpha mask...',
  });

  // Output mask processing
  // output is [1, 1, H, W] probability tensor
  const maskRaw = await RawImage.fromTensor(output[0].mul(255).to('uint8')).resize(targetWidth, targetHeight);

  const inferenceTimeMs = Math.round(performance.now() - startTime);

  // Extract raw mask byte buffer
  // maskRaw.data is Uint8ClampedArray / Uint8Array representing grayscale pixels
  const maskArray = maskRaw.data;
  const maskBuffer = maskArray.buffer.slice(
    maskArray.byteOffset,
    maskArray.byteOffset + maskArray.byteLength
  );

  postResponse(
    {
      type: 'SUCCESS',
      operationId,
      maskBuffer,
      maskWidth: targetWidth,
      maskHeight: targetHeight,
      backendUsed,
      inferenceTimeMs,
    },
    [maskBuffer] // Transferable ArrayBuffer
  );
}

function postResponse(message: WorkerOutboundMessage, transfer?: Transferable[]) {
  if (transfer && transfer.length > 0) {
    self.postMessage(message, { transfer });
  } else {
    self.postMessage(message);
  }
}

// Global worker listener
self.onmessage = async (event: MessageEvent<WorkerInboundMessage>) => {
  const msg = event.data;
  if (!msg) return;

  switch (msg.type) {
    case 'INIT': {
      try {
        currentActiveOperationId = msg.operationId;
        isCancelled = false;
        await loadSegmentationModel(msg.backend || 'webgpu', msg.modelId || DEFAULT_MODEL_ID, msg.operationId);
        postResponse({
          type: 'PROGRESS',
          operationId: msg.operationId,
          stage: 'completed',
          progress: 100,
          message: 'Model ready for inference.',
        });
      } catch (err: any) {
        postResponse({
          type: 'ERROR',
          operationId: msg.operationId,
          error: err?.message || 'Failed to initialize segmentation worker.',
        });
      }
      break;
    }

    case 'INFER': {
      const input = msg.imageBitmap || msg.imageData;
      if (!input) {
        postResponse({
          type: 'ERROR',
          operationId: msg.operationId,
          error: 'No image input provided for inference.',
        });
        return;
      }

      try {
        await runInference(
          input,
          msg.targetWidth,
          msg.targetHeight,
          msg.backend || 'webgpu',
          msg.operationId
        );
      } catch (err: any) {
        if (currentActiveOperationId === msg.operationId && !isCancelled) {
          postResponse({
            type: 'ERROR',
            operationId: msg.operationId,
            error: err?.message || 'Background removal inference failed.',
          });
        }
      }
      break;
    }

    case 'CANCEL': {
      if (currentActiveOperationId === msg.operationId) {
        isCancelled = true;
      }
      break;
    }

    case 'DISPOSE': {
      isCancelled = true;
      if (modelInstance) {
        try {
          if (typeof modelInstance.dispose === 'function') {
            modelInstance.dispose();
          }
        } catch {
          // Ignore
        }
        modelInstance = null;
        processorInstance = null;
      }
      currentLoadedBackend = null;
      break;
    }
  }
};
