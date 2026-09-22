import { ConversionSettings, TargetFormat } from '../types';
import { SeoRouteData } from './seoEngine';

const VALID_TARGET_FORMATS = new Set<TargetFormat>([
  'webp',
  'avif',
  'jpg',
  'png',
  'bmp',
  'ico',
  'pdf',
  'auto'
]);

const VALID_ROTATIONS = new Set<number>([0, 90, 180, 270]);

/**
 * Parses query parameters from a URL search string into valid ConversionSettings updates.
 * Safely ignores malformed, out-of-bounds, or unexpected values.
 */
export function parseConfigFromQuery(search: string): Partial<ConversionSettings> {
  if (!search || typeof search !== 'string') return {};

  const query = search.startsWith('?') ? search.slice(1) : search;
  if (!query.trim()) return {};

  const params = new URLSearchParams(query);
  const result: Partial<ConversionSettings> = {};

  // 1. targetMaxKB (synonyms: maxKB, kb, targetKb)
  const rawMaxKB = params.get('targetMaxKB') ?? params.get('maxKB') ?? params.get('kb') ?? params.get('targetKb');
  if (rawMaxKB) {
    const cleaned = rawMaxKB.trim();
    const parsed = parseInt(cleaned, 10);
    if (!isNaN(parsed) && parsed > 0 && /^\d+$/.test(cleaned)) {
      result.targetMaxKB = Math.min(parsed, 500000);
    }
  }

  // 2. format / targetFormat / to (synonyms)
  const rawFormat = params.get('format') ?? params.get('targetFormat') ?? params.get('to');
  if (rawFormat) {
    let lower = rawFormat.toLowerCase().trim() as TargetFormat;
    if (lower === 'jpeg' as any) lower = 'jpg';
    if (VALID_TARGET_FORMATS.has(lower)) {
      result.targetFormat = lower;
    }
  }

  // 3. quality (supports 0.01 - 1.0 or 10 - 100, synonyms: quality, q)
  const rawQuality = params.get('quality') ?? params.get('q');
  if (rawQuality) {
    let parsed = parseFloat(rawQuality.trim());
    if (!isNaN(parsed)) {
      if (parsed >= 10 && parsed <= 100) {
        parsed = parsed / 100;
      } else if (parsed > 1) {
        parsed = 1.0;
      }
      if (parsed >= 0.01 && parsed <= 1) {
        result.quality = Math.round(parsed * 100) / 100;
      }
    }
  }

  // 4. stripExif
  const rawStripExif = params.get('stripExif');
  if (rawStripExif !== null) {
    const val = rawStripExif.trim().toLowerCase();
    if (val === '1' || val === 'true') {
      result.stripExif = true;
    } else if (val === '0' || val === 'false') {
      result.stripExif = false;
    }
  }

  // 5. resize: maxWidth, maxHeight, keepAspectRatio (synonyms: resizeW, resizeH, keepRatio)
  const rawMaxWidth = params.get('maxWidth') ?? params.get('width') ?? params.get('resizeW');
  const rawMaxHeight = params.get('maxHeight') ?? params.get('height') ?? params.get('resizeH');
  const rawKeepAspect = params.get('keepAspectRatio') ?? params.get('keepRatio');
  const rawResize = params.get('resize');

  let parsedWidth: number | undefined;
  let parsedHeight: number | undefined;

  if (rawMaxWidth) {
    const cleaned = rawMaxWidth.trim();
    const p = parseInt(cleaned, 10);
    if (!isNaN(p) && p > 0 && /^\d+$/.test(cleaned)) {
      parsedWidth = Math.min(p, 50000);
    }
  }

  if (rawMaxHeight) {
    const cleaned = rawMaxHeight.trim();
    const p = parseInt(cleaned, 10);
    if (!isNaN(p) && p > 0 && /^\d+$/.test(cleaned)) {
      parsedHeight = Math.min(p, 50000);
    }
  }

  const keepAspect = rawKeepAspect !== null
    ? (rawKeepAspect.trim().toLowerCase() !== '0' && rawKeepAspect.trim().toLowerCase() !== 'false')
    : true;

  if (parsedWidth || parsedHeight || rawResize === '1' || rawResize === 'true') {
    result.resize = {
      enabled: true,
      maxWidth: parsedWidth,
      maxHeight: parsedHeight,
      keepAspectRatio: keepAspect
    };
  }

  // 6. crop aspect ratio (e.g. crop=16:9 or cropWidth=16&cropHeight=9, cropW=16&cropH=9)
  const rawCrop = params.get('crop');
  const rawCropW = params.get('cropWidth') ?? params.get('cropW');
  const rawCropH = params.get('cropHeight') ?? params.get('cropH');

  if (rawCrop && rawCrop.includes(':')) {
    const parts = rawCrop.split(':');
    const w = parseFloat(parts[0]);
    const h = parseFloat(parts[1]);
    if (!isNaN(w) && !isNaN(h) && w > 0 && h > 0 && w <= 10000 && h <= 10000) {
      result.cropAspectRatio = { width: w, height: h };
    }
  } else if (rawCropW && rawCropH) {
    const w = parseFloat(rawCropW);
    const h = parseFloat(rawCropH);
    if (!isNaN(w) && !isNaN(h) && w > 0 && h > 0 && w <= 10000 && h <= 10000) {
      result.cropAspectRatio = { width: w, height: h };
    }
  }

  // 7. targetDPI
  const rawDpi = params.get('dpi') ?? params.get('targetDPI');
  if (rawDpi) {
    const p = parseInt(rawDpi.trim(), 10);
    if (!isNaN(p) && p >= 72 && p <= 1200) {
      result.targetDPI = p;
    }
  }

  // 8. rotation (synonyms: rotation, rotate)
  const rawRot = params.get('rotation') ?? params.get('rotate');
  if (rawRot) {
    const p = parseInt(rawRot.trim(), 10);
    if (VALID_ROTATIONS.has(p)) {
      result.rotation = p;
    }
  }

  return result;
}

/**
 * Builds a deterministic share URL containing only meaningful non-default settings.
 * Sorts query parameters alphabetically for consistent, reproducible links.
 */
export function generateShareUrl(
  currentPath: string,
  settings: ConversionSettings,
  seoData?: SeoRouteData
): string {
  const origin = typeof window !== 'undefined' && window.location.origin
    ? window.location.origin
    : 'https://www.zapixal.com';

  const cleanPath = (currentPath || '/').split('?')[0].split('#')[0] || '/';
  const queryParams: Record<string, string> = {};

  // 1. targetMaxKB (highest priority for size-constrained workflows)
  if (settings.targetMaxKB !== undefined && settings.targetMaxKB > 0) {
    queryParams['targetMaxKB'] = String(settings.targetMaxKB);
  }

  // 2. format (only if explicitly set or differs from default 'auto')
  if (settings.targetFormat && settings.targetFormat !== 'auto') {
    queryParams['format'] = settings.targetFormat;
  }

  // 3. quality (encode if not targetMaxKB mode and differs from 0.8, or if quality slider mode)
  if (
    settings.quality !== undefined &&
    Math.round(settings.quality * 100) !== 80 &&
    (settings.targetMaxKB === undefined || settings.quality > 0.95)
  ) {
    queryParams['quality'] = String(Math.round(settings.quality * 100) / 100);
  }

  // 4. stripExif
  if (settings.stripExif !== undefined) {
    // Only encode if it deviates from route default or is explicitly true
    if (settings.stripExif) {
      queryParams['stripExif'] = '1';
    } else if (seoData?.stripExif === true) {
      queryParams['stripExif'] = '0';
    }
  }

  // 5. resize
  if (settings.resize?.enabled) {
    if (settings.resize.maxWidth) {
      queryParams['maxWidth'] = String(settings.resize.maxWidth);
    }
    if (settings.resize.maxHeight) {
      queryParams['maxHeight'] = String(settings.resize.maxHeight);
    }
    if (settings.resize.keepAspectRatio === false) {
      queryParams['keepAspectRatio'] = '0';
    }
  }

  // 6. crop
  if (settings.cropAspectRatio) {
    queryParams['crop'] = `${settings.cropAspectRatio.width}:${settings.cropAspectRatio.height}`;
  }

  // 7. dpi
  if (settings.targetDPI && settings.targetDPI !== 300) {
    queryParams['dpi'] = String(settings.targetDPI);
  }

  // 8. rotation
  if (settings.rotation && settings.rotation !== 0) {
    queryParams['rotation'] = String(settings.rotation);
  }

  // Deterministic sorting of query keys
  const sortedKeys = Object.keys(queryParams).sort();
  const normalizedPath = cleanPath.startsWith('/') ? cleanPath : `/${cleanPath}`;

  if (sortedKeys.length === 0) {
    return `${origin}${normalizedPath}`;
  }

  const searchParams = new URLSearchParams();
  for (const key of sortedKeys) {
    searchParams.set(key, queryParams[key]);
  }

  return `${origin}${normalizedPath}?${searchParams.toString()}`;
}
