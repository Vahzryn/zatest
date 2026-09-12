/**
 * Zero-Copy File I/O & Direct Download System
 */

/**
 * Strategy A: Standard direct download via Object URL.
 * Immediately revokes to prevent memory leaks.
 */
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  
  // Cleanup immediately
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
}

/**
 * Strategy B: Native File System Access API
 * Streams output directly to user's hard drive without holding in RAM.
 */
export async function saveFileDirectly(blob: Blob, defaultName: string) {
  if ('showSaveFilePicker' in window) {
    try {
      const handle = await (window as any).showSaveFilePicker({
        suggestedName: defaultName,
        types: [{
          description: 'Images',
          accept: { [blob.type]: [`.${defaultName.split('.').pop()}`] },
        }],
      });
      
      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();
      return true;
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        console.error('File System API Error:', err);
      }
      // Fallback
      return false;
    }
  }
  return false;
}

/**
 * Strategy C: Native Directory Picker Streaming
 * Streams multiple files directly to a selected output directory using File System Access API.
 */
export async function saveFilesToDirectory(
  items: Array<{ blob?: Blob; name?: string; file?: { name: string } }>,
  getFileName?: (item: any, index: number) => string
): Promise<{ success: boolean; writtenCount: number; canceled?: boolean }> {
  if (typeof window === 'undefined' || !('showDirectoryPicker' in window)) {
    return { success: false, writtenCount: 0 };
  }

  try {
    const dirHandle = await (window as any).showDirectoryPicker({ mode: 'readwrite' });
    let writtenCount = 0;
    const usedNames = new Set<string>();

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item.blob) continue;

      let fileName = getFileName
        ? getFileName(item, i)
        : (item.name || item.file?.name || `converted_${i + 1}`);

      if (usedNames.has(fileName)) {
        const dotIdx = fileName.lastIndexOf('.');
        const namePart = dotIdx >= 0 ? fileName.substring(0, dotIdx) : fileName;
        const extPart = dotIdx >= 0 ? fileName.substring(dotIdx) : '';
        let counter = 1;
        while (usedNames.has(`${namePart}_${counter}${extPart}`)) {
          counter++;
        }
        fileName = `${namePart}_${counter}${extPart}`;
      }
      usedNames.add(fileName);

      try {
        const fileHandle = await dirHandle.getFileHandle(fileName, { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(item.blob);
        await writable.close();
        writtenCount++;
      } catch (fileErr) {
        console.error(`Failed writing file ${fileName} to directory:`, fileErr);
      }
    }

    return { success: true, writtenCount };
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      return { success: false, writtenCount: 0, canceled: true };
    }
    console.error('Directory Picker Error:', err);
    return { success: false, writtenCount: 0 };
  }
}

/**
 * Setup Global Clipboard Paste Listener
 */
export function setupClipboardPasteListener(onFilesPasted: (files: File[]) => void) {
  const handler = (e: ClipboardEvent) => {
    if (e.clipboardData && e.clipboardData.files.length > 0) {
      e.preventDefault();
      const files = Array.from(e.clipboardData.files);
      // Filter for images only
      const imageFiles = files.filter(f => f.type.startsWith('image/'));
      if (imageFiles.length > 0) {
        onFilesPasted(imageFiles);
      }
    }
  };
  
  window.addEventListener('paste', handler);
  return () => window.removeEventListener('paste', handler);
}
