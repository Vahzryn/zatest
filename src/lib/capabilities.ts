/**
 * Device and Browser Capability Layer
 * 
 * Detects supported APIs and provides safe fallbacks for missing or non-standard
 * interfaces like createImageBitmap, OffscreenCanvas, Web Workers, WebAssembly,
 * File System Access API, deviceMemory, scheduler.yield, and crypto.randomUUID.
 */

// 1. Feature Detection Checks
export function hasCreateImageBitmap(): boolean {
  return typeof globalThis !== 'undefined' && typeof globalThis.createImageBitmap === 'function';
}

export function hasOffscreenCanvas(): boolean {
  return typeof globalThis !== 'undefined' && typeof globalThis.OffscreenCanvas !== 'undefined';
}

export function hasWebWorkers(): boolean {
  try {
    return typeof globalThis !== 'undefined' && typeof globalThis.Worker !== 'undefined';
  } catch {
    return false;
  }
}

export function hasWebAssembly(): boolean {
  try {
    return (
      typeof globalThis !== 'undefined' &&
      typeof globalThis.WebAssembly === 'object' &&
      typeof globalThis.WebAssembly.instantiate === 'function'
    );
  } catch {
    return false;
  }
}

export function hasFileSystemAccess(): boolean {
  return (
    typeof window !== 'undefined' &&
    ('showOpenFilePicker' in window || 'showSaveFilePicker' in window)
  );
}

export function getDeviceMemory(): number {
  if (typeof navigator !== 'undefined') {
    // navigator.deviceMemory is standard in Chromium but undefined elsewhere
    return (navigator as any).deviceMemory || 4; // Default to 4GB if undetected
  }
  return 4;
}

// 2. Safe Fallbacks & Polyfills
export async function safeYield(): Promise<void> {
  // @ts-ignore - scheduler is experimental in chromium
  if (typeof globalThis !== 'undefined' && typeof (globalThis as any).scheduler?.yield === 'function') {
    try {
      // @ts-ignore
      await (globalThis as any).scheduler.yield();
      return;
    } catch {
      // Ignore errors and fall back
    }
  }
  // Standard non-blocking fallback
  return new Promise((resolve) => setTimeout(resolve, 0));
}

export function safeRandomUUID(): string {
  if (
    typeof crypto !== 'undefined' &&
    // @ts-ignore
    typeof crypto.randomUUID === 'function'
  ) {
    try {
      return crypto.randomUUID();
    } catch {
      // Fallback if it throws in non-secure context
    }
  }

  // Pure JS fallback for UUID v4
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Cache for tested canvas export formats to avoid testing repeatedly
let cachedSupportedFormats: Record<string, boolean> | null = null;

/**
 * Checks which image mime types are natively supportable by the browser canvas.
 */
export async function checkSupportedCanvasFormats(): Promise<Record<string, boolean>> {
  if (cachedSupportedFormats) {
    return cachedSupportedFormats;
  }

  const formats = {
    'image/jpeg': false,
    'image/png': false,
    'image/webp': false,
    'image/avif': false,
    'image/bmp': false,
  };

  if (typeof document === 'undefined') {
    // If not in browser main thread, return minimal baseline
    return {
      'image/jpeg': true,
      'image/png': true,
      'image/webp': false,
      'image/avif': false,
      'image/bmp': false,
    };
  }

  try {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;

    const testFormat = (mimeType: string): Promise<boolean> => {
      return new Promise((resolve) => {
        try {
          canvas.toBlob((blob) => {
            resolve(!!blob && blob.type === mimeType);
          }, mimeType);
        } catch {
          resolve(false);
        }
      });
    };

    // Test formats in parallel
    const [jpg, png, webp, avif, bmp] = await Promise.all([
      testFormat('image/jpeg'),
      testFormat('image/png'),
      testFormat('image/webp'),
      testFormat('image/avif'),
      testFormat('image/bmp'),
    ]);

    formats['image/jpeg'] = jpg;
    formats['image/png'] = png;
    formats['image/webp'] = webp;
    formats['image/avif'] = avif;
    formats['image/bmp'] = bmp;
  } catch (err) {
    console.error('Failed to probe supported canvas formats:', err);
    // Baseline support in all standard browsers
    formats['image/jpeg'] = true;
    formats['image/png'] = true;
  }

  cachedSupportedFormats = formats;
  return formats;
}
