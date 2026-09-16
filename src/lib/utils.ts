import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { ConversionSettings, ImageFileItem, TargetFormat } from "../types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatBytes(bytes: number, decimals = 2) {
  if (!+bytes) return '0 Bytes'
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}

/**
 * Supported HEIC/HEIF file extensions and MIME types.
 * Browsers and operating systems often report inconsistent or empty MIME types
 * for HEIC and HEIF files, so extension-based detection is critical.
 */
export const HEIC_HEIF_EXTENSIONS = ['.heic', '.heif'] as const;

export const HEIC_HEIF_MIME_TYPES = [
  'image/heic',
  'image/heif',
  'image/heic-sequence',
  'image/heif-sequence',
] as const;

export const IMAGE_FILE_ACCEPT =
  'image/*,.heic,.heif,image/heic,image/heif,image/heic-sequence,image/heif-sequence';

export const CONVERTER_FILE_ACCEPT =
  'image/*,.heic,.heif,image/heic,image/heif,image/heic-sequence,image/heif-sequence,.webp,.avif,.bmp,.ico,.png,.jpg,.jpeg,.svg';

/**
 * Checks whether a file object or file-like descriptor represents a HEIC or HEIF image.
 * Uses both MIME type checking and extension-based fallback.
 */
export function isHeicOrHeifFile(file?: { name?: string; type?: string } | null): boolean {
  if (!file) return false;
  const mime = (file.type || '').toLowerCase().trim();
  if (
    mime === 'image/heic' ||
    mime === 'image/heif' ||
    mime === 'image/heic-sequence' ||
    mime === 'image/heif-sequence' ||
    mime.includes('/heic') ||
    mime.includes('/heif')
  ) {
    return true;
  }

  const name = (file.name || '').toLowerCase().trim();
  return /\.(heic|heif)$/i.test(name);
}

/**
 * Validates if a file is a supported image for Zapixal.
 * Accepts all standard image MIME types plus HEIC/HEIF, with robust extension-based fallback
 * for operating systems where MIME types are blank or generic.
 * Excludes unrelated non-image files (.txt, .pdf, .exe, .zip, etc.).
 */
export function isSupportedImageFile(file?: { name?: string; type?: string } | null): boolean {
  if (!file) return false;

  if (isHeicOrHeifFile(file)) {
    return true;
  }

  const mime = (file.type || '').toLowerCase().trim();
  if (mime.startsWith('image/')) {
    return true;
  }

  const name = (file.name || '').toLowerCase().trim();
  return /\.(jpe?g|png|webp|avif|gif|bmp|ico|svg|tiff?)$/i.test(name);
}

export function getExtensionFromMime(mimeType: string): string {
  switch (mimeType) {
    case 'image/jpeg':
    case 'image/jpg':
      return 'jpg';
    case 'image/png':
      return 'png';
    case 'image/webp':
      return 'webp';
    case 'image/avif':
      return 'avif';
    case 'image/bmp':
      return 'bmp';
    case 'image/x-icon':
    case 'image/vnd.microsoft.icon':
      return 'ico';
    case 'application/pdf':
      return 'pdf';
    case 'image/heic':
    case 'image/heic-sequence':
      return 'heic';
    case 'image/heif':
    case 'image/heif-sequence':
      return 'heif';
    default:
      return 'jpg';
  }
}

export function getEffectiveTargetFormat(item: ImageFileItem, settings: ConversionSettings): TargetFormat {
  if (item.customTargetFormat) {
    return item.customTargetFormat;
  }
  if (settings.targetFormat === 'auto') {
    const ext = item.file.name.split('.').pop()?.toLowerCase() || '';
    const mime = (item.file.type || '').toLowerCase();
    
    if (ext === 'jpg' || ext === 'jpeg' || mime === 'image/jpeg') return 'jpg';
    if (ext === 'png' || mime === 'image/png') return 'png';
    if (ext === 'webp' || mime === 'image/webp') return 'webp';
    if (ext === 'avif' || mime === 'image/avif') return 'avif';
    if (ext === 'bmp' || mime === 'image/bmp') return 'bmp';
    if (ext === 'ico' || mime === 'image/x-icon' || mime === 'image/vnd.microsoft.icon') return 'ico';
    
    return 'jpg'; // Fallback
  }
  return settings.targetFormat;
}

export function formatOutputFilename(
  item: ImageFileItem,
  index: number,
  settings: ConversionSettings
): string {
  const originalName = item.file.name.substring(0, item.file.name.lastIndexOf('.')) || item.file.name;
  const originalExt = item.file.name.split('.').pop()?.toLowerCase() || '';
  
  let ext: string = settings.targetFormat;
  if (item.blob) {
    ext = getExtensionFromMime(item.blob.type) as any;
  } else if (item.originalFallback && originalExt) {
    ext = originalExt as any;
  } else {
    ext = getEffectiveTargetFormat(item, settings);
  }
  
  if (ext === 'jpeg') ext = 'jpg';

  if (settings.renamePattern && settings.renamePattern.trim()) {
    const pattern = settings.renamePattern.trim();
    const dateStr = new Date().toISOString().split('T')[0];
    
    const idx = index + 1; // 1-based index
    const idx2 = String(idx).padStart(2, '0');
    const idx3 = String(idx).padStart(3, '0');

    let result = pattern
      .replace(/\{name\}/gi, originalName)
      .replace(/\{index3\}/gi, idx3)
      .replace(/\{00index\}/gi, idx3)
      .replace(/\{index2\}/gi, idx2)
      .replace(/\{0index\}/gi, idx2)
      .replace(/\{index\}/gi, String(idx))
      .replace(/\{date\}/gi, dateStr)
      .replace(/\{format\}/gi, ext)
      .replace(/\{ext\}/gi, ext);

    const prefix = settings.filenamePrefix || '';
    const suffix = settings.filenameSuffix || '';

    if (!result.toLowerCase().endsWith(`.${ext}`)) {
      result = `${prefix}${result}${suffix}.${ext}`;
    }
    return result;
  }

  const prefix = settings.filenamePrefix || '';
  const suffix = settings.filenameSuffix || '';
  return `${prefix}${originalName}${suffix}.${ext}`;
}

