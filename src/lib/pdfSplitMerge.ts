import { PDFDocument } from 'pdf-lib';

/**
 * Parse page range input string (e.g., "1,3,5", "1-4", "1-3,7,9-11") into 1-based page numbers.
 * Validates out-of-range, invalid formatting, and duplicates.
 */
export function parsePageRanges(input: string, maxPages: number): number[] {
  const trimmed = input.trim();
  if (!trimmed) {
    throw new Error('Please enter page numbers or ranges to extract (e.g. 1-3, 5).');
  }

  const parts = trimmed.split(',');
  const pageSet = new Set<number>();

  for (const part of parts) {
    const subPart = part.trim();
    if (!subPart) continue;

    if (subPart.includes('-')) {
      const rangeBounds = subPart.split('-');
      if (rangeBounds.length !== 2) {
        throw new Error(`Invalid page range format: "${subPart}". Use format like 1-5.`);
      }
      const startStr = rangeBounds[0].trim();
      const endStr = rangeBounds[1].trim();
      if (!/^\d+$/.test(startStr) || !/^\d+$/.test(endStr)) {
        throw new Error(`Invalid numbers in page range: "${subPart}". Only integers are allowed.`);
      }
      const start = parseInt(startStr, 10);
      const end = parseInt(endStr, 10);

      if (isNaN(start) || isNaN(end)) {
        throw new Error(`Invalid numbers in page range: "${subPart}".`);
      }
      if (start < 1 || end > maxPages) {
        throw new Error(`Page range ${start}-${end} is out of bounds (Document has ${maxPages} pages).`);
      }
      if (start > end) {
        throw new Error(`Invalid page range ${start}-${end}: Start cannot be greater than end.`);
      }

      for (let p = start; p <= end; p++) {
        pageSet.add(p);
      }
    } else {
      if (!/^\d+$/.test(subPart)) {
        throw new Error(`Invalid page number: "${subPart}". Only integers are allowed.`);
      }
      const pageNum = parseInt(subPart, 10);
      if (isNaN(pageNum)) {
        throw new Error(`Invalid page number: "${subPart}".`);
      }
      if (pageNum < 1 || pageNum > maxPages) {
        throw new Error(`Page ${pageNum} is out of bounds (Document has ${maxPages} pages).`);
      }
      pageSet.add(pageNum);
    }
  }

  const result = Array.from(pageSet).sort((a, b) => a - b);
  if (result.length === 0) {
    throw new Error('No valid pages selected.');
  }
  return result;
}

/**
 * Merge multiple PDF files into a single PDF ArrayBuffer/Uint8Array
 */
export async function mergePdfFiles(files: File[]): Promise<Uint8Array> {
  if (!files || files.length < 2) {
    throw new Error('Please select at least 2 PDF files to merge.');
  }

  const mergedPdf = await PDFDocument.create();

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    try {
      const buffer = await file.arrayBuffer();
      const pdf = await PDFDocument.load(buffer, { ignoreEncryption: true });
      const pageIndices = pdf.getPageIndices();
      if (pageIndices.length === 0) {
        throw new Error(`File "${file.name}" contains no pages.`);
      }
      const copiedPages = await mergedPdf.copyPages(pdf, pageIndices);
      copiedPages.forEach((page) => mergedPdf.addPage(page));
    } catch (err: any) {
      throw new Error(`Failed to process "${file.name}": ${err.message || 'Invalid or encrypted PDF'}`);
    }
  }

  return await mergedPdf.save();
}

/**
 * Split/Extract specific pages from a PDF file into a new PDF Uint8Array
 */
export async function splitPdfFile(file: File, pageNumbers: number[]): Promise<Uint8Array> {
  if (!file) {
    throw new Error('Please select a PDF file to split.');
  }
  if (!pageNumbers || pageNumbers.length === 0) {
    throw new Error('Please specify at least one page to extract.');
  }

  try {
    const buffer = await file.arrayBuffer();
    const pdf = await PDFDocument.load(buffer, { ignoreEncryption: true });
    const maxPages = pdf.getPageCount();

    // Convert 1-based page numbers to 0-based indices
    const pageIndices = pageNumbers.map((p) => {
      if (p < 1 || p > maxPages) {
        throw new Error(`Page ${p} is out of bounds for this document.`);
      }
      return p - 1;
    });

    const subPdf = await PDFDocument.create();
    const copiedPages = await subPdf.copyPages(pdf, pageIndices);
    copiedPages.forEach((page) => subPdf.addPage(page));

    return await subPdf.save();
  } catch (err: any) {
    throw new Error(`Failed to split PDF: ${err.message || 'Invalid or encrypted PDF'}`);
  }
}
