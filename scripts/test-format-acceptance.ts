import assert from 'node:assert/strict';
import {
  isHeicOrHeifFile,
  isSupportedImageFile,
  getExtensionFromMime,
  HEIC_HEIF_EXTENSIONS,
  HEIC_HEIF_MIME_TYPES,
} from '../src/lib/utils';
import { validateMagicBytes } from '../src/lib/codecs';
import rawBenchmarkData from '../src/data/benchmarks/compression-2026.json';
import { validateBenchmarkData } from '../src/data/benchmarks/validation';

console.log('====================================================');
console.log(' Zapixal: Format Acceptance & Benchmark Test Suite  ');
console.log('====================================================\n');

let passedTests = 0;
let totalTests = 0;

function runTest(description: string, fn: () => void) {
  totalTests++;
  try {
    fn();
    console.log(`  ✓ ${description}`);
    passedTests++;
  } catch (error) {
    console.error(`  ✗ FAIL: ${description}`);
    console.error(error);
    process.exitCode = 1;
  }
}

// 1. .heic extension detection
runTest('Identifies .heic files by extension (lowercase and uppercase)', () => {
  assert.equal(isHeicOrHeifFile({ name: 'photo.heic', type: 'image/heic' }), true);
  assert.equal(isHeicOrHeifFile({ name: 'IMG_2024.HEIC', type: 'image/heic' }), true);
  assert.equal(isSupportedImageFile({ name: 'vacation.heic', type: 'image/heic' }), true);
  assert.equal(isSupportedImageFile({ name: 'PORTRAIT.HEIC', type: 'image/heic' }), true);
});

// 2. .heif extension detection
runTest('Identifies .heif files by extension (lowercase and uppercase)', () => {
  assert.equal(isHeicOrHeifFile({ name: 'photo.heif', type: 'image/heif' }), true);
  assert.equal(isHeicOrHeifFile({ name: 'PICTURE.HEIF', type: 'image/heif' }), true);
  assert.equal(isSupportedImageFile({ name: 'capture.heif', type: 'image/heif' }), true);
  assert.equal(isSupportedImageFile({ name: 'IMAGE.HEIF', type: 'image/heif' }), true);
});

// 3. image/heic MIME type detection
runTest('Detects image/heic MIME type even without extension or with generic name', () => {
  assert.equal(isHeicOrHeifFile({ name: 'blob', type: 'image/heic' }), true);
  assert.equal(isHeicOrHeifFile({ name: 'upload_temp_123', type: 'image/heic' }), true);
  assert.equal(isSupportedImageFile({ name: 'unknown', type: 'image/heic' }), true);
  assert.equal(getExtensionFromMime('image/heic'), 'heic');
});

// 4. image/heif MIME type detection
runTest('Detects image/heif MIME type even without extension or with generic name', () => {
  assert.equal(isHeicOrHeifFile({ name: 'blob', type: 'image/heif' }), true);
  assert.equal(isHeicOrHeifFile({ name: 'temp_file', type: 'image/heif' }), true);
  assert.equal(isSupportedImageFile({ name: 'camera_raw', type: 'image/heif' }), true);
  assert.equal(getExtensionFromMime('image/heif'), 'heif');
});

// 5. image/heic-sequence MIME type detection
runTest('Detects image/heic-sequence MIME type (Live Photos / Bursts)', () => {
  assert.equal(isHeicOrHeifFile({ name: 'burst_01', type: 'image/heic-sequence' }), true);
  assert.equal(isSupportedImageFile({ name: 'livephoto', type: 'image/heic-sequence' }), true);
  assert.equal(getExtensionFromMime('image/heic-sequence'), 'heic');
});

// 6. image/heif-sequence MIME type detection
runTest('Detects image/heif-sequence MIME type (HEIF sequences)', () => {
  assert.equal(isHeicOrHeifFile({ name: 'sequence_raw', type: 'image/heif-sequence' }), true);
  assert.equal(isSupportedImageFile({ name: 'burst_raw', type: 'image/heif-sequence' }), true);
  assert.equal(getExtensionFromMime('image/heif-sequence'), 'heif');
});

// 7. empty MIME with valid HEIC/HEIF extension
runTest('Identifies HEIC/HEIF with empty or missing MIME string', () => {
  assert.equal(isHeicOrHeifFile({ name: 'camera_capture.heic', type: '' }), true);
  assert.equal(isHeicOrHeifFile({ name: 'camera_capture.heif', type: '' }), true);
  assert.equal(isHeicOrHeifFile({ name: 'PHOTO_PORTRAIT.HEIC' }), true);
  assert.equal(isHeicOrHeifFile({ name: 'PHOTO_BURST.HEIF', type: '   ' }), true);
  assert.equal(isSupportedImageFile({ name: 'capture.heic', type: '' }), true);
  assert.equal(isSupportedImageFile({ name: 'capture.heif', type: '' }), true);
});

// 8. application/octet-stream with valid HEIC/HEIF extension
runTest('Identifies HEIC/HEIF when OS or browser reports application/octet-stream', () => {
  assert.equal(isHeicOrHeifFile({ name: 'attachment.heic', type: 'application/octet-stream' }), true);
  assert.equal(isHeicOrHeifFile({ name: 'attachment.heif', type: 'application/octet-stream' }), true);
  assert.equal(isHeicOrHeifFile({ name: 'EXPORT.HEIC', type: 'application/octet-stream' }), true);
  assert.equal(isSupportedImageFile({ name: 'attachment.heic', type: 'application/octet-stream' }), true);
  assert.equal(isSupportedImageFile({ name: 'attachment.heif', type: 'application/octet-stream' }), true);
});

// 9. Rejection of unrelated formats
runTest('Strictly rejects non-image formats (.pdf, .docx, .zip, .exe, .txt, .js, etc.)', () => {
  const unrelatedFiles = [
    { name: 'document.pdf', type: 'application/pdf' },
    { name: 'report.docx', type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' },
    { name: 'archive.zip', type: 'application/zip' },
    { name: 'installer.exe', type: 'application/x-msdownload' },
    { name: 'readme.txt', type: 'text/plain' },
    { name: 'script.js', type: 'application/javascript' },
    { name: 'data.json', type: 'application/json' },
    { name: 'data.csv', type: 'text/csv' },
    { name: 'generic_binary.bin', type: 'application/octet-stream' },
    { name: 'noextension', type: 'application/octet-stream' },
    { name: '', type: '' },
    null,
    undefined,
  ];

  for (const file of unrelatedFiles) {
    assert.equal(isHeicOrHeifFile(file), false, `isHeicOrHeifFile should reject: ${JSON.stringify(file)}`);
    assert.equal(isSupportedImageFile(file), false, `isSupportedImageFile should reject: ${JSON.stringify(file)}`);
  }
});

// 10. Verification of supported image companion formats
runTest('Validates supported image companion formats in isSupportedImageFile', () => {
  assert.equal(isSupportedImageFile({ name: 'photo.jpg', type: 'image/jpeg' }), true);
  assert.equal(isSupportedImageFile({ name: 'photo.png', type: 'image/png' }), true);
  assert.equal(isSupportedImageFile({ name: 'photo.webp', type: 'image/webp' }), true);
  assert.equal(isSupportedImageFile({ name: 'photo.avif', type: 'image/avif' }), true);
  assert.equal(isSupportedImageFile({ name: 'icon.svg', type: 'image/svg+xml' }), true);
});

// 11. Constants verification
runTest('Exports correct constant definitions for HEIC/HEIF extensions & MIME types', () => {
  assert.ok(HEIC_HEIF_EXTENSIONS.includes('.heic'));
  assert.ok(HEIC_HEIF_EXTENSIONS.includes('.heif'));
  assert.ok(HEIC_HEIF_MIME_TYPES.includes('image/heic'));
  assert.ok(HEIC_HEIF_MIME_TYPES.includes('image/heif'));
  assert.ok(HEIC_HEIF_MIME_TYPES.includes('image/heic-sequence'));
  assert.ok(HEIC_HEIF_MIME_TYPES.includes('image/heif-sequence'));
});

// 12. Binary Magic Bytes & Brand Validation via validateMagicBytes
runTest('Correctly recognizes binary ISO Base Media File Format brands for HEIC/HEIF', () => {
  // Helper to create ftyp header with brand
  function createFtypHeader(brand: string): ArrayBuffer {
    const bytes = new Uint8Array(16);
    bytes[0] = 0x00; bytes[1] = 0x00; bytes[2] = 0x00; bytes[3] = 0x10; // Box size 16
    bytes[4] = 0x66; bytes[5] = 0x74; bytes[6] = 0x79; bytes[7] = 0x70; // 'ftyp'
    for (let i = 0; i < 4; i++) {
      bytes[8 + i] = brand.charCodeAt(i);
    }
    return bytes.buffer;
  }

  const heicResult = validateMagicBytes(createFtypHeader('heic'));
  assert.equal(heicResult.valid, true);
  assert.equal(heicResult.format, 'heic');

  const mif1Result = validateMagicBytes(createFtypHeader('mif1'));
  assert.equal(mif1Result.valid, true);
  assert.equal(mif1Result.format, 'heic');

  const msf1Result = validateMagicBytes(createFtypHeader('msf1'));
  assert.equal(msf1Result.valid, true);
  assert.equal(msf1Result.format, 'heic');

  const hevcResult = validateMagicBytes(createFtypHeader('hevc'));
  assert.equal(hevcResult.valid, true);
  assert.equal(hevcResult.format, 'heic');
});

// 13. Compression benchmark dataset schema and metrics validation
runTest('Validates compression benchmark dataset schema and deterministic metrics', () => {
  assert.equal(validateBenchmarkData(rawBenchmarkData as any), true);
  assert.equal(rawBenchmarkData.results.length > 0, true);
  assert.equal(rawBenchmarkData.dataset.width, 956);
  assert.equal(rawBenchmarkData.dataset.height, 845);
});

console.log(`\n====================================================`);
console.log(` Results: ${passedTests} / ${totalTests} acceptance tests passed.`);
console.log(`====================================================\n`);

if (process.exitCode) {
  process.exit(process.exitCode);
}
