/**
 * Architecture Note:
 * Batch Object URLs and ImageBitmaps created during file processing 
 * MUST be explicitly closed/revoked (e.g. `URL.revokeObjectURL()`, 
 * `imageBitmap.close()`) after each conversion completes or errors out, 
 * to prevent memory leaks and Out-of-Memory (OOM) crashes on large batches.
 */
import { detectHardwareCapabilities } from './hardwareCapabilities';
import { hasWebWorkers } from './capabilities';

export interface PooledWorker {
  id: number;
  worker: Worker;
  active: boolean;
  totalMegapixelsProcessed?: number;
  processedCount?: number;
}

class WorkerPoolManager {
  private conversionWorkers: PooledWorker[] = [];
  private maxWorkers: number = 4;
  private workerIdCounter = 0;
  private pendingQueue: Array<{
    resolve: (workerInfo: PooledWorker) => void;
    reject: (reason?: any) => void;
  }> = [];

  private heicWorker: Worker | null = null;
  private heicTaskId = 0;
  private heicResolvers = new Map<number, { resolve: (b: Blob) => void; reject: (e: any) => void }>();
  private workersSupported: boolean = true;

  constructor() {
    const hw = detectHardwareCapabilities();
    this.maxWorkers = Math.max(1, hw.maxConcurrentWorkers);
    this.workersSupported = hasWebWorkers();
  }

  public isSupported(): boolean {
    return this.workersSupported;
  }

  public setMaxWorkers(max: number) {
    this.maxWorkers = Math.max(1, max);
  }

  public getMaxWorkers(): number {
    return this.maxWorkers;
  }

  /**
   * Acquires an available conversion worker or queues until one becomes available.
   */
  public async acquireWorker(): Promise<PooledWorker> {
    if (!this.workersSupported) {
      throw new Error('Web Workers are not supported in this browser environment');
    }

    // Look for an idle worker
    const idle = this.conversionWorkers.find((w) => !w.active);
    if (idle) {
      idle.active = true;
      return idle;
    }

    // Spawn a new worker if under limit
    if (this.conversionWorkers.length < this.maxWorkers) {
      const id = ++this.workerIdCounter;
      try {
        const worker = new Worker(new URL('../workers/conversionWorker.ts', import.meta.url), { type: 'module' });
        const pooled: PooledWorker = { id, worker, active: true };
        this.conversionWorkers.push(pooled);
        return pooled;
      } catch (err) {
        console.warn('Failed to spawn a new Web Worker, disabling workers:', err);
        this.workersSupported = false;
        throw new Error('Web Worker spawning failed');
      }
    }

    // Wait in queue (backpressure control)
    return new Promise<PooledWorker>((resolve, reject) => {
      this.pendingQueue.push({ resolve, reject });
    });
  }

  /**
   * Releases an active worker back to the pool, evaluating adaptive WASM/memory recycling.
   */
  public releaseWorker(pooledWorker: PooledWorker, options?: { shouldRecycle?: boolean; megapixels?: number }) {
    if (!pooledWorker) return;

    const mp = options?.megapixels || 0;
    pooledWorker.totalMegapixelsProcessed = (pooledWorker.totalMegapixelsProcessed || 0) + mp;
    pooledWorker.processedCount = (pooledWorker.processedCount || 0) + 1;

    const hw = detectHardwareCapabilities();
    const isLowTier = hw.tier === 'LOW';
    const totalMp = pooledWorker.totalMegapixelsProcessed;
    const count = pooledWorker.processedCount;

    // Trigger adaptive recycling if explicitly flagged (large image/codec allocation) or workload thresholds reached
    const accumulatedLimitReached = totalMp > (isLowTier ? 40 : 80) || count >= (isLowTier ? 15 : 30);
    const mustRecycle = !!options?.shouldRecycle || accumulatedLimitReached;

    if (mustRecycle) {
      this.recycleWorker(pooledWorker);
      return;
    }

    pooledWorker.active = false;
    if (this.pendingQueue.length > 0) {
      const next = this.pendingQueue.shift();
      if (next) {
        pooledWorker.active = true;
        next.resolve(pooledWorker);
      }
    }
  }

  /**
   * Recycles an inflated worker by terminating it and removing it cleanly from the pool.
   * Spawns a replacement lazily when needed or immediately if tasks are waiting.
   */
  public recycleWorker(pooledWorker: PooledWorker) {
    try {
      pooledWorker.worker.terminate();
    } catch (err) {
      console.warn('Error terminating recycled worker:', err);
    }
    this.conversionWorkers = this.conversionWorkers.filter((w) => w.id !== pooledWorker.id);

    if (this.pendingQueue.length > 0 && this.conversionWorkers.length < this.maxWorkers) {
      const id = ++this.workerIdCounter;
      try {
        const worker = new Worker(new URL('../workers/conversionWorker.ts', import.meta.url), { type: 'module' });
        const pooled: PooledWorker = { id, worker, active: true };
        this.conversionWorkers.push(pooled);
        const next = this.pendingQueue.shift();
        if (next) {
          next.resolve(pooled);
        }
      } catch (err) {
        console.error('Failed to spawn replacement worker during recycling:', err);
      }
    }
  }

  /**
   * Explicitly terminates a specific worker and removes it from the pool.
   * This is useful if a worker has hung, timed out, or been aborted, ensuring we don't reuse it.
   */
  public terminateWorker(pooledWorker: PooledWorker) {
    try {
      pooledWorker.worker.terminate();
    } catch (err) {
      console.warn('Error terminating pooled worker:', err);
    }
    this.conversionWorkers = this.conversionWorkers.filter((w) => w.id !== pooledWorker.id);
    
    // If there's pending work in the queue, spawn a new worker to keep the pool size consistent
    if (this.pendingQueue.length > 0 && this.conversionWorkers.length < this.maxWorkers) {
      const id = ++this.workerIdCounter;
      try {
        const worker = new Worker(new URL('../workers/conversionWorker.ts', import.meta.url), { type: 'module' });
        const pooled: PooledWorker = { id, worker, active: true };
        this.conversionWorkers.push(pooled);
        const next = this.pendingQueue.shift();
        if (next) {
          next.resolve(pooled);
        }
      } catch (err) {
        console.error('Failed to spawn replacement worker in pool:', err);
      }
    }
  }

  /**
   * Decodes a HEIC file using dedicated HEIC worker thread.
   */
  public async decodeHeic(file: File): Promise<Blob> {
    if (!this.workersSupported) {
      throw new Error('Web Workers are not supported or are disabled in this environment.');
    }
    const worker = this.getHeicWorker();
    const id = ++this.heicTaskId;

    return new Promise<Blob>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        this.heicResolvers.delete(id);
        if (this.heicWorker) {
          try {
            this.heicWorker.terminate();
          } catch (e) {}
          this.heicWorker = null; // Forces recreating a fresh worker next time
        }
        reject(new Error('HEIC decoding worker timeout (15s)'));
      }, 15000);

      this.heicResolvers.set(id, {
        resolve: (blob) => {
          clearTimeout(timeoutId);
          resolve(blob);
        },
        reject: (err) => {
          clearTimeout(timeoutId);
          reject(err);
        },
      });

      worker.postMessage({ id, file });
    });
  }

  private getHeicWorker(): Worker {
    if (!this.workersSupported) {
      throw new Error('Web Workers are not supported or are disabled in this environment.');
    }
    if (!this.heicWorker) {
      try {
        this.heicWorker = new Worker(new URL('../workers/heicWorker.ts', import.meta.url), { type: 'module' });
        this.heicWorker.onmessage = (e) => {
          const { id, status, buffer, mimeType, error } = e.data;
          const resolver = this.heicResolvers.get(id);
          if (resolver) {
            if (status === 'success') {
              const decodedBlob = new Blob([buffer], { type: mimeType || 'image/jpeg' });
              resolver.resolve(decodedBlob);
            } else {
              resolver.reject(new Error(error || 'HEIC decoding error'));
            }
            this.heicResolvers.delete(id);
          }
        };
      } catch (err) {
        console.warn('Failed to spawn HEIC worker, disabling workers:', err);
        this.workersSupported = false;
        throw new Error('Web Worker spawning failed');
      }
    }
    return this.heicWorker;
  }

  /**
   * Terminates all active worker instances and resets state.
   */
  public terminateAll() {
    if (this.heicWorker) {
      this.heicWorker.terminate();
      this.heicWorker = null;
    }
    this.heicResolvers.clear();

    this.conversionWorkers.forEach((w) => w.worker.terminate());
    this.conversionWorkers = [];
    
    this.pendingQueue.forEach((q) => q.reject(new Error('Worker pool terminated')));
    this.pendingQueue = [];
  }
}

let instance: WorkerPoolManager | null = null;

export function getWorkerPool(): WorkerPoolManager {
  if (!instance) {
    instance = new WorkerPoolManager();
  }
  return instance;
}
