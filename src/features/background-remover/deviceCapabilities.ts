import { DeviceInferenceProfile, DevicePerformanceTier, ExecutionBackend } from './types';
import { detectHardwareCapabilities } from '../../lib/hardwareCapabilities';

let cachedProfile: DeviceInferenceProfile | null = null;
let webGpuAvailablePromise: Promise<boolean> | null = null;

/**
 * Probes browser and hardware for WebGPU support.
 */
export async function checkWebGpuSupport(): Promise<boolean> {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return false;
  }

  if (!('gpu' in navigator) || !(navigator as any).gpu) {
    return false;
  }

  try {
    const gpu = (navigator as any).gpu;
    const adapter = await gpu.requestAdapter();
    if (!adapter) {
      return false;
    }
    // Probe basic device request to confirm driver stability
    const device = await adapter.requestDevice();
    const hasDevice = !!device;
    if (device && typeof device.destroy === 'function') {
      device.destroy();
    }
    return hasDevice;
  } catch {
    return false;
  }
}

/**
 * Returns a cached WebGPU support boolean.
 */
export function getWebGpuSupport(): Promise<boolean> {
  if (!webGpuAvailablePromise) {
    webGpuAvailablePromise = checkWebGpuSupport();
  }
  return webGpuAvailablePromise;
}

/**
 * Computes an adaptive device inference profile.
 */
export async function getDeviceInferenceProfile(forceBackend?: ExecutionBackend): Promise<DeviceInferenceProfile> {
  if (cachedProfile && !forceBackend) {
    return cachedProfile;
  }

  const baseHardware = detectHardwareCapabilities();
  const hasWebGpu = await getWebGpuSupport();

  const isMobile = typeof navigator !== 'undefined' && /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  const memoryGB = (typeof navigator !== 'undefined' && (navigator as any).deviceMemory) || (baseHardware.tier === 'HIGH' ? 8 : baseHardware.tier === 'LOW' ? 2 : 4);
  const cores = (typeof navigator !== 'undefined' && navigator.hardwareConcurrency) || (baseHardware.tier === 'HIGH' ? 8 : baseHardware.tier === 'LOW' ? 2 : 4);

  let tier: DevicePerformanceTier = 'balanced';
  let preferredBackend: ExecutionBackend = 'wasm';
  let inferenceResolution = 768;
  let maxSourceResolution = 4096; // max source dimension (width or height)
  let enableHighPrecisionMatte = true;

  if (hasWebGpu && !isMobile && memoryGB >= 8 && cores >= 6) {
    tier = 'high';
    preferredBackend = 'webgpu';
    inferenceResolution = 1024;
    maxSourceResolution = 6000;
    enableHighPrecisionMatte = true;
  } else if (hasWebGpu && memoryGB >= 4) {
    tier = 'balanced';
    preferredBackend = 'webgpu';
    inferenceResolution = 768;
    maxSourceResolution = 4096;
    enableHighPrecisionMatte = true;
  } else if (!hasWebGpu && memoryGB >= 6 && cores >= 6) {
    tier = 'balanced';
    preferredBackend = 'wasm';
    inferenceResolution = 768;
    maxSourceResolution = 4096;
    enableHighPrecisionMatte = true;
  } else {
    // Constrained devices (older phones, limited RAM, single/dual core)
    tier = 'constrained';
    preferredBackend = 'wasm';
    inferenceResolution = 512;
    maxSourceResolution = 3000;
    enableHighPrecisionMatte = false;
  }

  if (forceBackend) {
    preferredBackend = forceBackend;
  }

  const profile: DeviceInferenceProfile = {
    tier,
    preferredBackend,
    inferenceResolution,
    maxSourceResolution,
    enableHighPrecisionMatte,
    concurrencyLimit: 1, // Inference is memory-heavy; process 1 model inference at a time
  };

  if (!forceBackend) {
    cachedProfile = profile;
  }

  return profile;
}

/**
 * Clamps large source image dimensions to safe memory limits (max 24 Megapixels).
 */
export function clampSafeDimensions(
  width: number,
  height: number,
  maxDimension = 5000,
  maxMegapixels = 24
): { width: number; height: number; scaled: boolean } {
  let targetW = width;
  let targetH = height;
  let scaled = false;

  // 1. Dimension clamp
  if (targetW > maxDimension || targetH > maxDimension) {
    const scale = maxDimension / Math.max(targetW, targetH);
    targetW = Math.round(targetW * scale);
    targetH = Math.round(targetH * scale);
    scaled = true;
  }

  // 2. Total Megapixel clamp
  const currentMp = (targetW * targetH) / 1_000_000;
  if (currentMp > maxMegapixels) {
    const scale = Math.sqrt(maxMegapixels / currentMp);
    targetW = Math.round(targetW * scale);
    targetH = Math.round(targetH * scale);
    scaled = true;
  }

  return { width: targetW, height: targetH, scaled };
}
