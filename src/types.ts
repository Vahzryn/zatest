export interface ImageDimensions {
  width: number;
  height: number;
}

export type TargetFormat = 'webp' | 'avif' | 'jpg' | 'png' | 'bmp' | 'ico' | 'pdf' | 'auto';

export interface ConversionSettings {
  targetFormat: TargetFormat;
  targetFormatMode?: 'per-original' | 'unified';
  quality: number; // 0 to 1
  targetMaxKB?: number; // Target size under X KB
  resize: {
    enabled: boolean;
    maxWidth?: number;
    maxHeight?: number;
    keepAspectRatio: boolean;
  };
  cropAspectRatio?: { width: number; height: number } | null;
  targetDPI?: number | null;
  filenamePrefix: string;
  filenameSuffix: string;
  renamePattern?: string;
  rotation?: number; // 0, 90, 180, 270
  stripExif?: boolean;
  watermarkText?: string;
  grayscale?: boolean;
}

export interface ImageFileItem {
  id: string;
  file: File;
  previewUrl?: string;
  originalSize: number;
  status: 'pending' | 'processing' | 'success' | 'error';
  progress: number;
  rotation?: number; // 0, 90, 180, 270
  customTargetFormat?: TargetFormat;
  blob?: Blob;
  convertedSize?: number;
  dimensions?: ImageDimensions;
  convertedUrl?: string;
  originalFallback?: boolean;
  pdfImageData?: Blob; // Cache the raw raster data used for PDF generation
  pdfImageWidth?: number;
  pdfImageHeight?: number;
  error?: string;
  blurRegions?: Array<{ x: number; y: number; width: number; height: number }>;
  blurMode?: 'blur' | 'pixelate';
  savedToFolder?: boolean;
  folderSavePath?: string;
}
