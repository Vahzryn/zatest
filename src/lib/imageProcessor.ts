import { getWorkerPool } from './workerPool';
export * from './conversionOrchestrator';
export * from './workerPool';
export * from './codecs';

export function terminateWorkers() {
  getWorkerPool().terminateAll();
}
