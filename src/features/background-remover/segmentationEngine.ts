import {
  ExecutionBackend,
  BgRemovalProgress,
  SegmentationMaskData,
  WorkerInboundMessage,
  WorkerOutboundMessage,
} from './types';
import { getDeviceInferenceProfile } from './deviceCapabilities';

export interface ISegmentationEngine {
  segmentImage(
    inputBitmap: ImageBitmap,
    targetWidth: number,
    targetHeight: number,
    backend?: ExecutionBackend,
    onProgress?: (progress: BgRemovalProgress) => void,
    signal?: AbortSignal
  ): Promise<SegmentationMaskData>;
  cancelCurrent(): void;
  dispose(): void;
}

class SegmentationEngineImpl implements ISegmentationEngine {
  private worker: Worker | null = null;
  private currentOperationId = 0;
  private pendingPromise: {
    resolve: (data: SegmentationMaskData) => void;
    reject: (err: Error) => void;
    operationId: string;
    onProgress?: (progress: BgRemovalProgress) => void;
  } | null = null;

  /**
   * Initializes or retrieves the dedicated Web Worker.
   */
  private getWorker(): Worker {
    if (!this.worker) {
      this.worker = new Worker(
        new URL('../../workers/bg-remover.worker.ts', import.meta.url),
        { type: 'module' }
      );

      this.worker.onmessage = (event: MessageEvent<WorkerOutboundMessage>) => {
        const msg = event.data;
        if (!msg) return;

        // Check if this response matches the current active operation
        if (!this.pendingPromise || this.pendingPromise.operationId !== msg.operationId) {
          return; // Discard stale/cancelled message
        }

        switch (msg.type) {
          case 'PROGRESS': {
            this.pendingPromise.onProgress?.({
              operationId: msg.operationId,
              stage: msg.stage,
              progress: msg.progress,
              message: msg.message,
              bytesLoaded: msg.bytesLoaded,
              bytesTotal: msg.bytesTotal,
            });
            break;
          }

          case 'SUCCESS': {
            const { resolve } = this.pendingPromise;
            this.pendingPromise = null;
            resolve({
              maskBuffer: msg.maskBuffer,
              maskWidth: msg.maskWidth,
              maskHeight: msg.maskHeight,
              inferenceResolution: Math.max(msg.maskWidth, msg.maskHeight),
              backendUsed: msg.backendUsed,
              inferenceTimeMs: msg.inferenceTimeMs,
            });
            break;
          }

          case 'ERROR': {
            const { reject } = this.pendingPromise;
            this.pendingPromise = null;
            reject(new Error(msg.error || 'Segmentation worker encountered an error'));
            break;
          }
        }
      };

      this.worker.onerror = (err) => {
        if (this.pendingPromise) {
          const { reject } = this.pendingPromise;
          this.pendingPromise = null;
          reject(new Error(`Worker fatal runtime error: ${err.message || String(err)}`));
        }
      };
    }

    return this.worker;
  }

  /**
   * Dispatches segmentation task to worker.
   */
  public async segmentImage(
    inputBitmap: ImageBitmap,
    targetWidth: number,
    targetHeight: number,
    backend?: ExecutionBackend,
    onProgress?: (progress: BgRemovalProgress) => void,
    signal?: AbortSignal
  ): Promise<SegmentationMaskData> {
    // Increment monotonic operation ID
    this.currentOperationId += 1;
    const operationId = `bg_op_${this.currentOperationId}_${Date.now()}`;

    // Cancel any in-flight task
    this.cancelCurrent();

    const worker = this.getWorker();

    let resolvedBackend = backend;
    if (!resolvedBackend) {
      const profile = await getDeviceInferenceProfile();
      resolvedBackend = profile.preferredBackend;
    }

    if (signal?.aborted) {
      try {
        inputBitmap.close();
      } catch {
        // Ignore
      }
      throw new DOMException('Operation was aborted', 'AbortError');
    }

    return new Promise<SegmentationMaskData>((resolve, reject) => {
      this.pendingPromise = {
        resolve,
        reject,
        operationId,
        onProgress,
      };

      // Set up abort signal listener
      if (signal) {
        signal.addEventListener(
          'abort',
          () => {
            if (this.pendingPromise?.operationId === operationId) {
              this.cancelCurrent();
              reject(new DOMException('Operation was aborted by user', 'AbortError'));
            }
          },
          { once: true }
        );
      }

      // Send INFER message with transferable ImageBitmap
      const inferMsg: WorkerInboundMessage = {
        type: 'INFER',
        operationId,
        imageBitmap: inputBitmap,
        targetWidth,
        targetHeight,
        backend: resolvedBackend,
      };

      worker.postMessage(inferMsg, [inputBitmap]);
    });
  }

  /**
   * Cancels the currently running operation.
   */
  public cancelCurrent(): void {
    if (this.pendingPromise) {
      const opId = this.pendingPromise.operationId;
      this.pendingPromise = null;
      if (this.worker) {
        this.worker.postMessage({ type: 'CANCEL', operationId: opId });
      }
    }
  }

  /**
   * Disposes of worker and releases memory resources.
   */
  public dispose(): void {
    this.cancelCurrent();
    if (this.worker) {
      try {
        this.worker.postMessage({ type: 'DISPOSE' });
        this.worker.terminate();
      } catch {
        // Ignore
      }
      this.worker = null;
    }
  }
}

// Singleton engine instance for session reuse
let engineInstance: ISegmentationEngine | null = null;

export function getSegmentationEngine(): ISegmentationEngine {
  if (!engineInstance) {
    engineInstance = new SegmentationEngineImpl();
  }
  return engineInstance;
}

export function disposeSegmentationEngine(): void {
  if (engineInstance) {
    engineInstance.dispose();
    engineInstance = null;
  }
}
