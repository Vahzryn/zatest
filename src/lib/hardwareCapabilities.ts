export interface HardwareConfig {
  mode: 'STANDARD' | 'ECO';
  tier: 'LOW' | 'MID' | 'HIGH';
  maxConcurrentWorkers: number;
  maxCanvasDimension: number;
  thumbnailBatchSize: number;
}

// Threshold constants for hardware tier classification
const MEMORY_LOW_THRESHOLD = 2; // GB of RAM
const CONCURRENCY_LOW_THRESHOLD = 2; // CPU logical cores
const MEMORY_HIGH_THRESHOLD = 8; // GB of RAM
const CONCURRENCY_HIGH_THRESHOLD = 8; // CPU logical cores

export function detectHardwareCapabilities(): HardwareConfig {
  const isBrowser = typeof navigator !== 'undefined';
  const hardwareConcurrency = isBrowser ? (navigator.hardwareConcurrency || 2) : 2;
  // @ts-ignore - deviceMemory is non-standard but supported in Chromium
  const rawMemory = isBrowser ? (navigator as any).deviceMemory : undefined;
  const deviceMemory: number | undefined = typeof rawMemory === 'number' ? rawMemory : undefined;
  
  // Guard Chromium-only navigator.connection API
  const isSaveDataActive = isBrowser && !!(navigator as any).connection?.saveData;

  // Determine Tier
  let tier: 'LOW' | 'MID' | 'HIGH' = 'MID';

  if (isSaveDataActive) {
    tier = 'LOW';
  } else if (deviceMemory !== undefined) {
    if (deviceMemory <= MEMORY_LOW_THRESHOLD || hardwareConcurrency <= CONCURRENCY_LOW_THRESHOLD) {
      tier = 'LOW';
    } else if (deviceMemory >= MEMORY_HIGH_THRESHOLD && hardwareConcurrency >= CONCURRENCY_HIGH_THRESHOLD) {
      tier = 'HIGH';
    } else {
      tier = 'MID';
    }
  } else {
    // When deviceMemory is unavailable (e.g. Safari / iOS WebKit):
    // Rely conservatively on hardwareConcurrency alone.
    // Classify devices where deviceMemory is unavailable and hardwareConcurrency <= 4 as LOW tier.
    if (hardwareConcurrency <= 4) {
      tier = 'LOW';
    } else if (hardwareConcurrency >= CONCURRENCY_HIGH_THRESHOLD) {
      tier = 'HIGH';
    } else {
      tier = 'MID';
    }
  }

  // Derive config based on tier
  if (tier === 'LOW') {
    return {
      mode: 'ECO',
      tier: 'LOW',
      maxConcurrentWorkers: 1,
      maxCanvasDimension: 2048,
      thumbnailBatchSize: 1,
    };
  } else if (tier === 'MID') {
    return {
      mode: 'STANDARD',
      tier: 'MID',
      maxConcurrentWorkers: Math.max(1, Math.min(3, hardwareConcurrency - 1)),
      maxCanvasDimension: 4096, // High resolution support for MID tier
      thumbnailBatchSize: 2,
    };
  } else {
    return {
      mode: 'STANDARD',
      tier: 'HIGH',
      maxConcurrentWorkers: Math.max(1, Math.min(6, hardwareConcurrency - 1)),
      maxCanvasDimension: 8192,
      thumbnailBatchSize: 3,
    };
  }
}

// Battery Status API requires async setup if used, but we can do a quick check
export async function checkBatteryThrottling(config: HardwareConfig): Promise<HardwareConfig> {
  if (typeof navigator !== 'undefined' && typeof (navigator as any).getBattery === 'function') {
    try {
      const battery = await (navigator as any).getBattery();
      if (!battery.charging && battery.level < 0.2) {
        console.warn('Low battery detected, switching to ECO/LOW mode.');
        return {
          mode: 'ECO',
          tier: 'LOW',
          maxConcurrentWorkers: 1,
          maxCanvasDimension: 2048,
          thumbnailBatchSize: 1,
        };
      }
    } catch (e) {
      console.warn('Battery API blocked or failed', e);
    }
  }
  return config;
}

export interface BatchThresholds {
  optimalBatchBytes: number;
  maxBatchBytes: number;
}

export function getBatchThresholds(tier: 'LOW' | 'MID' | 'HIGH'): BatchThresholds {
  switch (tier) {
    case 'LOW':
      return {
        optimalBatchBytes: 150 * 1024 * 1024,      // 150 MB
        maxBatchBytes: 450 * 1024 * 1024,          // 450 MB
      };
    case 'MID':
      return {
        optimalBatchBytes: 500 * 1024 * 1024,      // 500 MB
        maxBatchBytes: 1500 * 1024 * 1024,         // 1.5 GB
      };
    case 'HIGH':
      return {
        optimalBatchBytes: 1500 * 1024 * 1024,     // 1.5 GB
        maxBatchBytes: 4500 * 1024 * 1024,         // 4.5 GB
      };
  }
}

export function getMaxMegapixels(tier: 'LOW' | 'MID' | 'HIGH'): number {
  switch (tier) {
    case 'LOW':
      return 40;
    case 'MID':
      return 100;
    case 'HIGH':
      return 300;
  }
}

export function getMaxPixels(tier: 'LOW' | 'MID' | 'HIGH'): number {
  return getMaxMegapixels(tier) * 1_000_000;
}


export interface MemoryBudget {
  deviceTotalBytes: number;
  safeWorkingBytes: number;
}

export function estimateDeviceMemoryBudget(hw: HardwareConfig): MemoryBudget {
  const isBrowser = typeof navigator !== 'undefined';
  const rawMemory = isBrowser ? (navigator as any).deviceMemory : undefined;
  
  let totalGB = 4;
  if (typeof rawMemory === 'number') {
    totalGB = rawMemory;
  } else {
    if (hw.tier === 'LOW') totalGB = 2;
    else if (hw.tier === 'MID') totalGB = 4;
    else if (hw.tier === 'HIGH') totalGB = 8;
  }

  let safeGB = totalGB * 0.25;
  if (safeGB > 2.5) safeGB = 2.5;
  if (safeGB < 0.5) safeGB = 0.5;

  return {
    deviceTotalBytes: totalGB * 1024 * 1024 * 1024,
    safeWorkingBytes: Math.floor(safeGB * 1024 * 1024 * 1024)
  };
}

export function estimateConversionMemoryCost(
  width: number, 
  height: number, 
  targetFormat: string
): number {
  const pixels = width * height;
  const rawBytes = pixels * 4; 
  const canvasBytes = pixels * 4;

  let encoderMultiplier = 1.5; 
  if (targetFormat === 'avif') {
    encoderMultiplier = 3.5; 
  } else if (targetFormat === 'png') {
    encoderMultiplier = 2.0;
  } else if (targetFormat === 'pdf') {
    encoderMultiplier = 2.0;
  }

  const encoderBytes = rawBytes * encoderMultiplier;
  const peakCost = rawBytes + canvasBytes + encoderBytes;
  return peakCost + (20 * 1024 * 1024);
}

export function estimateProcessingWorkload(
  width: number, 
  height: number, 
  sourceFormat: string,
  targetFormat: string,
  
): number {
  const pixels = width * height;
  const megapixels = pixels / 1_000_000;
  
  // Base cost depends on megapixels, minimum 0.5 to avoid zero division
  let baseWork = Math.max(0.5, megapixels);
  
  // Apply multipliers based on format complexity
  // Decoding complexity
  if (sourceFormat.includes('avif')) baseWork *= 1.2;
  if (sourceFormat.includes('heic')) baseWork *= 1.5;
  
  // Encoding complexity
  if (targetFormat === 'avif') {
    baseWork *= 4.0;
  } else if (targetFormat === 'webp') {
    baseWork *= 1.2;
  } else if (targetFormat === 'pdf') {
    baseWork *= 1.5;
  } else if (targetFormat === 'png') {
    baseWork *= 1.3;
  }
  
  // Compression complexity
  

  return baseWork;
}
