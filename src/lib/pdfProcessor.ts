export interface PdfDocumentInfo {
  numPages: number;
  fingerprint: string;
  title?: string;
}

export interface RenderedPdfPage {
  pageNumber: number;
  blob: Blob;
  dataUrl: string;
  width: number;
  height: number;
  sizeBytes: number;
  filename: string;
}

/**
 * Lazy-load pdfjs-dist only in client-side browser environment
 */
async function getPdfJsLib() {
  if (typeof window === 'undefined') {
    throw new Error('PDF processing is only supported in a browser environment.');
  }
  const pdfjsLib = await import('pdfjs-dist');
  const pdfWorker = (await import('pdfjs-dist/build/pdf.worker.mjs?url')).default;

  if (pdfjsLib.GlobalWorkerOptions && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;
  }
  return pdfjsLib;
}

/**
 * Clean original filename to create deterministic page filenames
 */
export function sanitizeFilenameForPage(originalFilename: string, pageNum: number, extension = 'jpg'): string {
  const baseName = originalFilename.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_');
  const paddedPage = String(pageNum).padStart(3, '0');
  return `${baseName}-page-${paddedPage}.${extension}`;
}

/**
 * Load PDF document from ArrayBuffer
 */
export async function loadPdfDocument(arrayBuffer: ArrayBuffer): Promise<any> {
  const pdfjsLib = await getPdfJsLib();
  try {
    const loadingTask = pdfjsLib.getDocument({
      data: arrayBuffer,
      useSystemFonts: true,
    });
    return await loadingTask.promise;
  } catch (error: any) {
    if (error?.name === 'PasswordException') {
      throw new Error('This PDF is password-protected. Please unlock the PDF before converting pages.');
    }
    if (error?.name === 'InvalidPDFException') {
      throw new Error('The selected file appears to be invalid or corrupt PDF data.');
    }
    throw new Error(`Failed to load PDF document: ${error?.message || 'Unknown error'}`);
  }
}

/**
 * Render a single PDF page to a JPEG Blob
 */
export async function renderPdfPageToJpg(
  pdfDoc: any,
  pageNumber: number,
  scale: number = 1.5,
  quality: number = 0.85
): Promise<{ blob: Blob; width: number; height: number }> {
  const page = await pdfDoc.getPage(pageNumber);
  const viewport = page.getViewport({ scale });

  const canvas = document.createElement('canvas');
  canvas.width = Math.floor(viewport.width);
  canvas.height = Math.floor(viewport.height);

  const context = canvas.getContext('2d', { alpha: false });
  if (!context) {
    throw new Error('Failed to create 2D canvas context for rendering PDF page.');
  }

  // Draw white background for PDF page
  context.fillStyle = '#FFFFFF';
  context.fillRect(0, 0, canvas.width, canvas.height);

  const renderContext = {
    canvasContext: context,
    viewport: viewport,
  };

  await page.render(renderContext).promise;

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        // Clean up canvas
        canvas.width = 0;
        canvas.height = 0;

        if (blob) {
          resolve({
            blob,
            width: Math.floor(viewport.width),
            height: Math.floor(viewport.height),
          });
        } else {
          reject(new Error(`Failed to encode canvas output for page ${pageNumber} to JPEG.`));
        }
      },
      'image/jpeg',
      quality
    );
  });
}

/**
 * Generate a low-res thumbnail blob for page selection previews
 */
export async function renderPdfPageThumbnail(
  pdfDoc: any,
  pageNumber: number,
  maxWidth: number = 200
): Promise<string> {
  const page = await pdfDoc.getPage(pageNumber);
  const unscaledViewport = page.getViewport({ scale: 1.0 });
  const scale = maxWidth / unscaledViewport.width;
  const viewport = page.getViewport({ scale: Math.min(scale, 1.0) });

  const canvas = document.createElement('canvas');
  canvas.width = Math.floor(viewport.width);
  canvas.height = Math.floor(viewport.height);

  const context = canvas.getContext('2d', { alpha: false });
  if (!context) return '';

  context.fillStyle = '#FFFFFF';
  context.fillRect(0, 0, canvas.width, canvas.height);

  await page.render({
    canvasContext: context,
    viewport,
  }).promise;

  const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
  canvas.width = 0;
  canvas.height = 0;
  return dataUrl;
}
