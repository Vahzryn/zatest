export interface SystemDiagnostics {
  userAgent: string;
  browserName: string;
  osName: string;
  screenWidth: number;
  screenHeight: number;
  viewportWidth: number;
  viewportHeight: number;
  devicePixelRatio: number;
  deviceMemoryGb?: number;
  cpuCores?: number;
  language: string;
  timezone: string;
  currentRoute: string;
  currentToolName?: string;
  fileCount: number;
  hasErrors: boolean;
  stalledMessage?: string | null;
  targetFormat: string;
  targetMaxKB?: number;
  quality: number;
  isClientSideOnly: boolean;
  timestamp: string;
  appVersion: string;
}

export function collectDiagnostics(context?: {
  currentRoute?: string;
  currentToolName?: string;
  fileCount?: number;
  hasErrors?: boolean;
  stalledMessage?: string | null;
  targetFormat?: string;
  targetMaxKB?: number;
  quality?: number;
}): SystemDiagnostics {
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  
  let browserName = 'Unknown Browser';
  if (ua.includes('Firefox/')) browserName = 'Firefox';
  else if (ua.includes('Edg/')) browserName = 'Edge';
  else if (ua.includes('Chrome/')) browserName = 'Chrome';
  else if (ua.includes('Safari/')) browserName = 'Safari';

  let osName = 'Unknown OS';
  if (ua.includes('Win')) osName = 'Windows';
  else if (ua.includes('Mac')) osName = 'macOS';
  else if (ua.includes('Linux')) osName = 'Linux';
  else if (ua.includes('Android')) osName = 'Android';
  else if (ua.includes('iPhone') || ua.includes('iPad')) osName = 'iOS';

  const screenWidth = typeof window !== 'undefined' ? window.screen?.width || 0 : 0;
  const screenHeight = typeof window !== 'undefined' ? window.screen?.height || 0 : 0;
  const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 0;
  const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 0;
  const devicePixelRatio = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;

  const deviceMemoryGb = typeof navigator !== 'undefined' && (navigator as any).deviceMemory 
    ? (navigator as any).deviceMemory 
    : undefined;
  
  const cpuCores = typeof navigator !== 'undefined' && navigator.hardwareConcurrency 
    ? navigator.hardwareConcurrency 
    : undefined;

  const language = typeof navigator !== 'undefined' ? navigator.language || 'en' : 'en';
  
  let timezone = 'UTC';
  try {
    timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    // fallback
  }

  return {
    userAgent: ua,
    browserName,
    osName,
    screenWidth,
    screenHeight,
    viewportWidth,
    viewportHeight,
    devicePixelRatio,
    deviceMemoryGb,
    cpuCores,
    language,
    timezone,
    currentRoute: context?.currentRoute || (typeof window !== 'undefined' ? window.location.pathname : '/'),
    currentToolName: context?.currentToolName || 'Zapixal Core Workspace',
    fileCount: context?.fileCount || 0,
    hasErrors: context?.hasErrors || false,
    stalledMessage: context?.stalledMessage || null,
    targetFormat: context?.targetFormat || 'auto',
    targetMaxKB: context?.targetMaxKB,
    quality: context?.quality || 0.8,
    isClientSideOnly: true,
    timestamp: new Date().toISOString(),
    appVersion: '1.0.0',
  };
}
