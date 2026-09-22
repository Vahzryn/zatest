import { TargetFormat, ImageFileItem, ImageDimensions } from '../../types';

export type DevicePerformanceTier = 'high' | 'balanced' | 'constrained';
export type ExecutionBackend = 'webgpu' | 'wasm';
export type BackgroundMode = 'transparent' | 'color' | 'blur';
export type BgTargetFormat = TargetFormat;

export interface DeviceInferenceProfile {
  tier: DevicePerformanceTier;
  preferredBackend: ExecutionBackend;
  inferenceResolution: number;
  maxSourceResolution: number;
  enableHighPrecisionMatte: boolean;
  concurrencyLimit: number;
}

export interface BgRemovalOptions {
  backgroundMode?: BackgroundMode;
  backgroundColor?: string;
  blurRadius?: number;
  featherRadius?: number;
  targetFormat?: TargetFormat;
  quality?: number;
  targetMaxKB?: number;
  resize?: {
    enabled: boolean;
    maxWidth?: number;
    maxHeight?: number;
    keepAspectRatio: boolean;
  };
  cropAspectRatio?: { width: number; height: number } | null;
  targetDPI?: number | null;
  rotation?: number;
  grayscale?: boolean;
  watermarkText?: string;
  overrideResolution?: number;
  overrideBackend?: ExecutionBackend;
}

export type BgRemovalStage = 
  | 'idle'
  | 'downloading-model'
  | 'initializing-backend'
  | 'preprocessing'
  | 'inferring'
  | 'compositing'
  | 'encoding'
  | 'completed'
  | 'error'
  | 'cancelled';

export interface BgRemovalProgress {
  operationId: string;
  stage: BgRemovalStage;
  progress: number; // 0 to 100
  message?: string;
  bytesLoaded?: number;
  bytesTotal?: number;
}

export interface SegmentationMaskData {
  maskBuffer: ArrayBuffer;
  maskWidth: number;
  maskHeight: number;
  inferenceResolution: number;
  backendUsed: ExecutionBackend;
  inferenceTimeMs: number;
}

export interface BgRemovalResult {
  operationId: string;
  blob: Blob;
  file: File;
  previewUrl: string;
  width: number;
  height: number;
  format: TargetFormat;
  sizeBytes: number;
  backendUsed: ExecutionBackend;
  inferenceTimeMs: number;
  totalTimeMs: number;
  maskData: {
    width: number;
    height: number;
    rawBuffer?: ArrayBuffer;
  };
  toImageFileItem: (customId?: string) => ImageFileItem;
}

export interface WorkerInitMessage {
  type: 'INIT';
  operationId: string;
  backend?: ExecutionBackend;
  modelId?: string;
}

export interface WorkerInferMessage {
  type: 'INFER';
  operationId: string;
  imageBitmap?: ImageBitmap;
  imageData?: ImageData;
  targetWidth: number;
  targetHeight: number;
  backend?: ExecutionBackend;
}

export interface WorkerCancelMessage {
  type: 'CANCEL';
  operationId: string;
}

export interface WorkerDisposeMessage {
  type: 'DISPOSE';
}

export type WorkerInboundMessage = 
  | WorkerInitMessage
  | WorkerInferMessage
  | WorkerCancelMessage
  | WorkerDisposeMessage;

export interface WorkerProgressResponse {
  type: 'PROGRESS';
  operationId: string;
  stage: BgRemovalStage;
  progress: number;
  message?: string;
  bytesLoaded?: number;
  bytesTotal?: number;
}

export interface WorkerSuccessResponse {
  type: 'SUCCESS';
  operationId: string;
  maskBuffer: ArrayBuffer;
  maskWidth: number;
  maskHeight: number;
  backendUsed: ExecutionBackend;
  inferenceTimeMs: number;
}

export interface WorkerErrorResponse {
  type: 'ERROR';
  operationId: string;
  error: string;
  fallbackAvailable?: boolean;
}

export type WorkerOutboundMessage =
  | WorkerProgressResponse
  | WorkerSuccessResponse
  | WorkerErrorResponse;
