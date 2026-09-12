const wasmModuleCache = new Map<string, any>();


/**
 * Validates file magic bytes before passing to WASM decoders/encoders.
 */
export function validateMagicBytes(buffer: ArrayBuffer): { valid: boolean; format?: string; error?: string } {
  if (!buffer || buffer.byteLength < 4) {
    return { valid: false, error: 'File buffer is empty or corrupted' };
  }

  const bytes = new Uint8Array(buffer.slice(0, 16));
  
  // PNG: 89 50 4E 47
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) {
    return { valid: true, format: 'png' };
  }

  // JPEG: FF D8 FF
  if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) {
    return { valid: true, format: 'jpg' };
  }

  // GIF: 47 49 46 38
  if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38) {
    return { valid: true, format: 'gif' };
  }

  // BMP: 42 4D
  if (bytes[0] === 0x42 && bytes[1] === 0x4D) {
    return { valid: true, format: 'bmp' };
  }

  // WebP: RIFF ... WEBP (bytes 0-3: 52 49 46 46, bytes 8-11: 57 45 42 50)
  if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
      bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) {
    return { valid: true, format: 'webp' };
  }

  // PDF: 25 50 44 46 (%PDF)
  if (bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) {
    return { valid: true, format: 'pdf' };
  }

  // HEIC / HEIF / AVIF: ftyp brand check at offset 4
  // 66 74 79 70 (ftyp)
  if (bytes[4] === 0x66 && bytes[5] === 0x74 && bytes[6] === 0x79 && bytes[7] === 0x70) {
    const brand = String.fromCharCode(...bytes.slice(8, 12));
    if (brand.includes('heic') || brand.includes('heix') || brand.includes('mif1') || brand.includes('msf1')) {
      return { valid: true, format: 'heic' };
    }
    if (brand.includes('avif') || brand.includes('avis')) {
      return { valid: true, format: 'avif' };
    }
  }

  // Generic image fallback if magic byte isn't strictly recognized but valid header exists
  return { valid: true, format: 'unknown' };
}

/**
 * Encodes ImageData into MozJPEG (JPEG) Uint8Array via WASM with canvas fallback.
 */
export async function encodeJpeg(
  imageData: ImageData,
  quality: number,
  fallbackCanvas?: HTMLCanvasElement | OffscreenCanvas
): Promise<Uint8Array> {
  const targetQ = Math.max(1, Math.min(100, Math.round(quality * 100)));
  
  try {
    let jsquashJpeg = wasmModuleCache.get('jsquash-jpeg');
    if (!jsquashJpeg) {
      jsquashJpeg = await import('@jsquash/jpeg/encode');
      let wasmUrl = '';
      if (typeof process === 'undefined' || process.env.NODE_ENV !== 'test') {
        try { wasmUrl = (await import('@jsquash/jpeg/codec/enc/mozjpeg_enc.wasm?url')).default; } catch (e) {}
      }
      await (jsquashJpeg.init || jsquashJpeg.default?.init)?.(undefined, {
        locateFile: (path: string) => wasmUrl || path
      });
      wasmModuleCache.set('jsquash-jpeg', jsquashJpeg);
    }
    const encode = jsquashJpeg.default || jsquashJpeg;
    const buf = await encode(imageData, { quality: targetQ });
    return new Uint8Array(buf);
  } catch (err) {
    console.warn('MozJPEG WASM encoding failed, using canvas fallback:', err);
    if (!fallbackCanvas) {
      throw err;
    }
    let blob: Blob | null = null;
    if (typeof OffscreenCanvas !== 'undefined' && fallbackCanvas instanceof OffscreenCanvas) {
      blob = await fallbackCanvas.convertToBlob({ type: 'image/jpeg', quality });
    } else if ('toBlob' in fallbackCanvas) {
      blob = await new Promise<Blob | null>((resolve) => (fallbackCanvas as HTMLCanvasElement).toBlob(resolve, 'image/jpeg', quality));
    }
    if (!blob) throw new Error('JPEG canvas fallback export failed');
    return new Uint8Array(await blob.arrayBuffer());
  }
}

/**
 * Encodes ImageData into PNG Uint8Array via Imagequant WASM with UPNG/Canvas fallback.
 */
export async function encodePng(
  imageData: ImageData,
  quality: number,
  originalSize: number = 0,
  fallbackCanvas?: HTMLCanvasElement | OffscreenCanvas
): Promise<Uint8Array> {
  try {
    let imagequantModule = wasmModuleCache.get('imagequant');
    if (!imagequantModule) {
      imagequantModule = await import('imagequant');
      wasmModuleCache.set('imagequant', imagequantModule);
    }
    const { Imagequant, ImagequantImage } = imagequantModule;
    const iq = new Imagequant();
    const targetQ = Math.max(10, Math.min(100, Math.round(quality * 100)));
    const minQ = Math.max(0, targetQ - 30);

    iq.set_quality(minQ, targetQ);
    iq.set_speed(4);

    const img = new ImagequantImage(new Uint8Array(imageData.data.buffer), imageData.width, imageData.height, 0.0);
    const buf = iq.process(img);
    
    img.free();
    iq.free();

    if (originalSize > 0 && buf.byteLength > originalSize) {
      throw new Error('Imagequant output larger than original, falling back');
    }

    return new Uint8Array(buf);
  } catch (err) {
    let cnum = 256;
    if (quality >= 0.98) cnum = 0;
    else if (quality >= 0.85) cnum = 256;
    else if (quality >= 0.60) cnum = 128;
    else cnum = 64;

    try {
      let upngModule = wasmModuleCache.get('upng-js');
      if (!upngModule) {
        upngModule = await import('upng-js');
        wasmModuleCache.set('upng-js', upngModule);
      }
      const UPNG = upngModule.default || upngModule;
      const upngBuf = UPNG.encode([imageData.data.buffer], imageData.width, imageData.height, cnum);
      return new Uint8Array(upngBuf);
    } catch (upngErr) {
      if (!fallbackCanvas) {
        throw upngErr;
      }
      let blob: Blob | null = null;
      if (typeof OffscreenCanvas !== 'undefined' && fallbackCanvas instanceof OffscreenCanvas) {
        blob = await fallbackCanvas.convertToBlob({ type: 'image/png' });
      } else if ('toBlob' in fallbackCanvas) {
        blob = await new Promise<Blob | null>((resolve) => (fallbackCanvas as HTMLCanvasElement).toBlob(resolve, 'image/png'));
      }
      if (!blob) throw new Error('PNG canvas fallback export failed');
      return new Uint8Array(await blob.arrayBuffer());
    }
  }
}

export interface AdaptiveWebpOptions {
  initialQuality?: number;
  originalSize?: number;
  isJpegSource?: boolean;
  minQuality?: number;
  maxAttempts?: number;
}

export interface AdaptiveWebpResult {
  blob: Blob;
  finalQuality: number;
  attempts: number;
  isSmallerThanOriginal: boolean;
  originalSize: number;
  finalSize: number;
}

/**
 * Encodes canvas to WebP Blob.
 */
export async function encodeWebp(
  canvas: OffscreenCanvas | HTMLCanvasElement,
  quality: number
): Promise<Blob> {
  const targetQ = quality <= 1.0
    ? Math.max(1, Math.min(100, Math.round(quality * 100)))
    : Math.max(1, Math.min(100, Math.round(quality)));
  const qualityFloat = quality <= 1.0 ? quality : quality / 100;

  try {
    let jsquashWebp = wasmModuleCache.get('jsquash-webp');
    if (!jsquashWebp) {
      jsquashWebp = await import('@jsquash/webp/encode');
      let webpWasm = '', webpSimd = '';
      if (typeof process === 'undefined' || process.env.NODE_ENV !== 'test') {
        try { webpWasm = (await import('@jsquash/webp/codec/enc/webp_enc.wasm?url')).default; } catch (e) {}
        try { webpSimd = (await import('@jsquash/webp/codec/enc/webp_enc_simd.wasm?url')).default; } catch (e) {}
      }
      await (jsquashWebp.init || jsquashWebp.default?.init)?.(undefined, {
        locateFile: (path: string) => {
          if (path.endsWith('webp_enc_simd.wasm')) return webpSimd || path;
          return webpWasm || path;
        }
      });
      wasmModuleCache.set('jsquash-webp', jsquashWebp);
    }
    const encode = jsquashWebp.default || jsquashWebp;

    const ctx = canvas.getContext('2d') as CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;
    if (!ctx) throw new Error('Could not get 2d context for WebP WASM encoding');
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    const buf = await encode(imageData, {
      quality: targetQ,
      lossless: 0,
      method: 4,
      exact: 0,
      sns_strength: 50,
      filter_strength: 60,
    });
    return new Blob([buf], { type: 'image/webp' });
  } catch (err) {
    console.warn('WebP WASM encoding failed, using canvas fallback:', err);
    if (typeof OffscreenCanvas !== 'undefined' && canvas instanceof OffscreenCanvas) {
      return await canvas.convertToBlob({ type: 'image/webp', quality: qualityFloat });
    }
    return new Promise<Blob>((resolve, reject) => {
      (canvas as HTMLCanvasElement).toBlob(
        (b) => (b ? resolve(b) : reject(new Error('WebP export failed'))),
        'image/webp',
        qualityFloat
      );
    });
  }
}

/**
 * Adaptively encodes WebP to ensure size reduction over original JPEG/source image.
 */
export async function encodeWebpAdaptive(
  canvas: OffscreenCanvas | HTMLCanvasElement,
  options: AdaptiveWebpOptions = {}
): Promise<AdaptiveWebpResult> {
  const originalSize = options.originalSize || 0;
  const isJpeg = options.isJpegSource !== false;
  const minQ = options.minQuality !== undefined
    ? (options.minQuality <= 1 ? Math.round(options.minQuality * 100) : Math.round(options.minQuality))
    : 48;
  const maxAttempts = options.maxAttempts || 4;

  let startQVal = options.initialQuality !== undefined
    ? (options.initialQuality <= 1 ? Math.round(options.initialQuality * 100) : Math.round(options.initialQuality))
    : 75;

  if (isJpeg && startQVal > 75) {
    startQVal = 75;
  }

  let currentQ = Math.max(minQ, Math.min(100, startQVal));

  let bestBlob = await encodeWebp(canvas, currentQ / 100);
  let bestSize = bestBlob.size;
  let bestQ = currentQ;
  let attempts = 1;

  if (originalSize > 0 && bestSize >= originalSize) {
    while (currentQ > minQ && attempts < maxAttempts && bestSize >= originalSize) {
      const ratio = bestSize / originalSize;
      let step = 8;
      if (ratio > 1.25) step = 14;
      else if (ratio > 1.1) step = 10;

      const nextQ = Math.max(minQ, currentQ - step);
      if (nextQ === currentQ) break;

      currentQ = nextQ;
      attempts++;

      try {
        const candidateBlob = await encodeWebp(canvas, currentQ / 100);
        if (candidateBlob.size < bestSize) {
          bestBlob = candidateBlob;
          bestSize = candidateBlob.size;
          bestQ = currentQ;
        }

        if (bestSize < originalSize) {
          break;
        }
      } catch (err) {
        console.warn(`Adaptive WebP encoding failed at quality ${currentQ}:`, err);
        break;
      }
    }
  }

  const isSmallerThanOriginal = originalSize > 0 ? bestSize < originalSize : true;

  return {
    blob: bestBlob,
    finalQuality: bestQ / 100,
    attempts,
    isSmallerThanOriginal,
    originalSize,
    finalSize: bestSize,
  };
}

/**
 * Encodes canvas to AVIF Blob.
 */
export async function encodeAvif(
  canvas: OffscreenCanvas | HTMLCanvasElement,
  quality: number
): Promise<Blob> {
  const targetQ = Math.max(1, Math.min(100, Math.round(quality * 100)));

  try {
    let jsquashAvif = wasmModuleCache.get('jsquash-avif');
    if (!jsquashAvif) {
      jsquashAvif = await import('@jsquash/avif/encode');
      let avifWasm = '', avifMt = '';
      if (typeof process === 'undefined' || process.env.NODE_ENV !== 'test') {
        try { avifWasm = (await import('@jsquash/avif/codec/enc/avif_enc.wasm?url')).default; } catch (e) {}
        try { avifMt = (await import('@jsquash/avif/codec/enc/avif_enc_mt.wasm?url')).default; } catch (e) {}
      }
      await (jsquashAvif.init || jsquashAvif.default?.init)?.(undefined, {
        locateFile: (path: string) => {
          if (path.endsWith('avif_enc_mt.wasm')) return avifMt || path;
          return avifWasm || path;
        }
      });
      wasmModuleCache.set('jsquash-avif', jsquashAvif);
    }
    const encode = jsquashAvif.default || jsquashAvif;

    const ctx = canvas.getContext('2d') as CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;
    if (!ctx) throw new Error('Could not get 2d context for AVIF WASM encoding');
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    const buf = await encode(imageData, { quality: targetQ });
    return new Blob([buf], { type: 'image/avif' });
  } catch (err) {
    console.warn('AVIF WASM encoding failed, using canvas fallback:', err);
    let blob: Blob;
    if (typeof OffscreenCanvas !== 'undefined' && canvas instanceof OffscreenCanvas) {
      blob = await canvas.convertToBlob({ type: 'image/avif', quality });
    } else {
      blob = await new Promise<Blob>((resolve, reject) => {
        (canvas as HTMLCanvasElement).toBlob(
          (b) => (b ? resolve(b) : reject(new Error('AVIF export failed'))),
          'image/avif',
          quality
        );
      });
    }
    if (blob.type !== 'image/avif') {
      throw new Error('AVIF encoding is not supported by this browser and WASM fallback failed');
    }
    return blob;
  }
}

/**
 * Encodes canvas to genuine 24-bit uncompressed BMP Blob.
 */
export async function encodeBmp(canvas: OffscreenCanvas | HTMLCanvasElement): Promise<Blob> {
  const width = canvas.width;
  const height = canvas.height;
  if (width === 0 || height === 0) {
    throw new Error('Invalid canvas dimensions for BMP export');
  }

  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null;
  if (!ctx) {
    throw new Error('Could not get 2D rendering context for BMP encoding');
  }

  const imageData = ctx.getImageData(0, 0, width, height);
  const rgbaData = imageData.data;

  // Row size must be padded to a multiple of 4 bytes (24-bit = 3 bytes/pixel)
  const rowSize = Math.floor((width * 3 + 3) / 4) * 4;
  const pixelArraySize = rowSize * height;
  const fileSize = 54 + pixelArraySize;

  const buffer = new Uint8Array(fileSize);
  const view = new DataView(buffer.buffer);

  // 1. BMP File Header (14 bytes)
  buffer[0] = 0x42; // 'B'
  buffer[1] = 0x4D; // 'M'
  view.setUint32(2, fileSize, true);  // File size
  view.setUint16(6, 0, true);         // Reserved 1
  view.setUint16(8, 0, true);         // Reserved 2
  view.setUint32(10, 54, true);       // Pixel array offset

  // 2. DIB Header (BITMAPINFOHEADER - 40 bytes)
  view.setUint32(14, 40, true);       // Header size
  view.setInt32(18, width, true);     // Image width
  view.setInt32(22, height, true);    // Image height (positive = bottom-up)
  view.setUint16(26, 1, true);        // Color planes
  view.setUint16(28, 24, true);       // Bits per pixel (24-bit RGB)
  view.setUint32(30, 0, true);        // BI_RGB (uncompressed)
  view.setUint32(34, pixelArraySize, true); // Raw image size
  view.setInt32(38, 2835, true);     // X pixels/meter (~72 DPI)
  view.setInt32(42, 2835, true);     // Y pixels/meter (~72 DPI)
  view.setUint32(46, 0, true);        // Colors in color table
  view.setUint32(50, 0, true);        // Important colors

  // 3. Pixel Array (Bottom-to-top, BGR byte order)
  let offset = 54;
  for (let y = height - 1; y >= 0; y--) {
    const rowStart = y * width * 4;
    let colOffset = offset;
    for (let x = 0; x < width; x++) {
      const p = rowStart + x * 4;
      buffer[colOffset]     = rgbaData[p + 2]; // B
      buffer[colOffset + 1] = rgbaData[p + 1]; // G
      buffer[colOffset + 2] = rgbaData[p];     // R
      colOffset += 3;
    }
    offset += rowSize;
  }

  return new Blob([buffer], { type: 'image/bmp' });
}

/**
 * Creates 256x256 ICO Blob from source canvas.
 */
export async function encodeIco(canvas: OffscreenCanvas | HTMLCanvasElement): Promise<Blob> {
  const icoSize = 256;
  let pngBlob: Blob | null = null;

  if (typeof OffscreenCanvas !== 'undefined' && canvas instanceof OffscreenCanvas) {
    const icoCanvas = new OffscreenCanvas(icoSize, icoSize);
    const ctx = icoCanvas.getContext('2d');
    if (ctx) {
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(canvas, 0, 0, icoSize, icoSize);
      pngBlob = await icoCanvas.convertToBlob({ type: 'image/png' });
    }
  } else {
    const icoCanvas = document.createElement('canvas');
    icoCanvas.width = icoSize;
    icoCanvas.height = icoSize;
    const ctx = icoCanvas.getContext('2d');
    if (ctx) {
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(canvas as HTMLCanvasElement, 0, 0, icoSize, icoSize);
      pngBlob = await new Promise<Blob | null>((resolve) => icoCanvas.toBlob(resolve, 'image/png'));
    }
  }

  if (!pngBlob) {
    throw new Error('Failed to create PNG for ICO');
  }

  const pngBuffer = await pngBlob.arrayBuffer();
  const pngBytes = new Uint8Array(pngBuffer);

  const headerSize = 6;
  const dirSize = 16;
  const totalSize = headerSize + dirSize + pngBytes.length;
  const icoData = new Uint8Array(totalSize);
  const view = new DataView(icoData.buffer);

  // ICO Header
  view.setUint16(0, 0, true);  // Reserved
  view.setUint16(2, 1, true);  // Type 1 = ICO
  view.setUint16(4, 1, true);  // 1 image

  // Directory Entry
  view.setUint8(6, 0);          // Width (0 = 256px)
  view.setUint8(7, 0);          // Height (0 = 256px)
  view.setUint8(8, 0);          // Color count
  view.setUint8(9, 0);          // Reserved
  view.setUint16(10, 1, true);  // Color planes
  view.setUint16(12, 32, true); // Bits per pixel
  view.setUint32(14, pngBytes.length, true); // Image data size
  view.setUint32(18, headerSize + dirSize, true); // Image data offset

  icoData.set(pngBytes, headerSize + dirSize);
  return new Blob([icoData], { type: 'image/x-icon' });
}

function crc32(data: Uint8Array): number {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < data.length; i++) {
    let byte = data[i];
    crc ^= byte;
    for (let j = 0; j < 8; j++) {
      if ((crc & 1) !== 0) {
        crc = (crc >>> 1) ^ 0xEDB88320;
      } else {
        crc = crc >>> 1;
      }
    }
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

/**
 * Injects DPI metadata into JPEG (JFIF header) or PNG (pHYs chunk) byte arrays.
 */
export function injectDpiMetadata(
  bytes: Uint8Array,
  format: 'jpg' | 'png' | 'jpeg',
  dpi: number
): Uint8Array {
  if (!dpi || dpi <= 0 || !bytes || bytes.length === 0) {
    return bytes;
  }

  const fmt = format === 'jpeg' ? 'jpg' : format;

  if (fmt === 'jpg') {
    if (bytes.length < 4 || bytes[0] !== 0xFF || bytes[1] !== 0xD8) {
      return bytes;
    }

    const result = new Uint8Array(bytes);

    if (
      result[2] === 0xFF &&
      result[3] === 0xE0 &&
      result[6] === 0x4A &&
      result[7] === 0x46 &&
      result[8] === 0x49 &&
      result[9] === 0x46 &&
      result[10] === 0x00
    ) {
      result[13] = 1; // units: 1 = dots per inch
      result[14] = (dpi >> 8) & 0xFF;
      result[15] = dpi & 0xFF;
      result[16] = (dpi >> 8) & 0xFF;
      result[17] = dpi & 0xFF;
      return result;
    } else {
      const app0 = new Uint8Array(18);
      app0[0] = 0xFF;
      app0[1] = 0xE0;
      app0[2] = 0x00;
      app0[3] = 0x10;
      app0[4] = 0x4A;
      app0[5] = 0x46;
      app0[6] = 0x49;
      app0[7] = 0x46;
      app0[8] = 0x00;
      app0[9] = 0x01;
      app0[10] = 0x01;
      app0[11] = 0x01;
      app0[12] = (dpi >> 8) & 0xFF;
      app0[13] = dpi & 0xFF;
      app0[14] = (dpi >> 8) & 0xFF;
      app0[15] = dpi & 0xFF;
      app0[16] = 0x00;
      app0[17] = 0x00;

      const newBytes = new Uint8Array(bytes.length + 18);
      newBytes.set(bytes.subarray(0, 2), 0);
      newBytes.set(app0, 2);
      newBytes.set(bytes.subarray(2), 20);
      return newBytes;
    }
  }

  if (fmt === 'png') {
    if (
      bytes.length < 8 ||
      bytes[0] !== 0x89 ||
      bytes[1] !== 0x50 ||
      bytes[2] !== 0x4E ||
      bytes[3] !== 0x47
    ) {
      return bytes;
    }

    const ppm = Math.round(dpi * 39.3701);

    const physChunk = new Uint8Array(21);
    const view = new DataView(physChunk.buffer);

    view.setUint32(0, 9, false);
    physChunk[4] = 0x70;
    physChunk[5] = 0x48;
    physChunk[6] = 0x59;
    physChunk[7] = 0x73;
    view.setUint32(8, ppm, false);
    view.setUint32(12, ppm, false);
    physChunk[16] = 1;

    const crcVal = crc32(physChunk.subarray(4, 17));
    view.setUint32(17, crcVal, false);

    let physOffset = -1;
    let physLength = -1;
    let offset = 8;

    while (offset + 12 <= bytes.length) {
      const chunkLen =
        ((bytes[offset] << 24) >>> 0) +
        (bytes[offset + 1] << 16) +
        (bytes[offset + 2] << 8) +
        bytes[offset + 3];

      const type = String.fromCharCode(
        bytes[offset + 4],
        bytes[offset + 5],
        bytes[offset + 6],
        bytes[offset + 7]
      );

      if (type === 'pHYs') {
        physOffset = offset;
        physLength = 12 + chunkLen;
        break;
      }

      if (type === 'IEND') break;
      offset += 12 + chunkLen;
    }

    if (physOffset !== -1) {
      const newBytes = new Uint8Array(bytes.length - physLength + physChunk.length);
      newBytes.set(bytes.subarray(0, physOffset), 0);
      newBytes.set(physChunk, physOffset);
      newBytes.set(bytes.subarray(physOffset + physLength), physOffset + physChunk.length);
      return newBytes;
    } else {
      let ihdrEnd = 33;
      if (bytes.length >= 33) {
        const ihdrLen =
          ((bytes[8] << 24) >>> 0) +
          (bytes[9] << 16) +
          (bytes[10] << 8) +
          bytes[11];
        ihdrEnd = 8 + 12 + ihdrLen;
      }

      const newBytes = new Uint8Array(bytes.length + physChunk.length);
      newBytes.set(bytes.subarray(0, ihdrEnd), 0);
      newBytes.set(physChunk, ihdrEnd);
      newBytes.set(bytes.subarray(ihdrEnd), ihdrEnd + physChunk.length);
      return newBytes;
    }
  }

  return bytes;
}

