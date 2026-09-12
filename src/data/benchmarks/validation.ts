export interface BenchmarkDataset {
  type: string;
  width: number;
  height: number;
  uncompressedBytes: number;
  baselinePngBytes: number;
  pngTimeMs: number;
}

export interface BenchmarkResultItem {
  format: string;
  quality: number | string;
  sizeBytes: number;
  timeMs: number;
  reductionPct: string;
}

export interface CompressionBenchmarkData {
  testDate: string;
  environment: string;
  dataset: BenchmarkDataset;
  results: BenchmarkResultItem[];
}

export function validateBenchmarkData(data: CompressionBenchmarkData): boolean {
  if (!data || !data.testDate || !data.dataset || !Array.isArray(data.results)) {
    throw new Error('Invalid benchmark data structure');
  }

  if (data.dataset.width <= 0 || data.dataset.height <= 0) {
    throw new Error('Benchmark dataset dimensions must be positive');
  }

  if (data.dataset.uncompressedBytes <= 0 || data.dataset.baselinePngBytes <= 0) {
    throw new Error('Benchmark file sizes must be positive');
  }

  if (data.results.length === 0) {
    throw new Error('Benchmark results cannot be empty');
  }

  for (const item of data.results) {
    if (!item.format || typeof item.sizeBytes !== 'number' || item.sizeBytes <= 0) {
      throw new Error(`Invalid benchmark item format or sizeBytes for ${item.format}`);
    }
    if (typeof item.timeMs !== 'number' || item.timeMs < 0) {
      throw new Error(`Invalid timeMs for benchmark item ${item.format}`);
    }
    const pct = parseFloat(item.reductionPct);
    if (isNaN(pct) || pct < -100 || pct > 100) {
      throw new Error(`Invalid reductionPct (${item.reductionPct}) for ${item.format}`);
    }
  }

  return true;
}
