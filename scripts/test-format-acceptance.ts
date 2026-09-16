import { isHeicOrHeifFile, isSupportedImageFile, CONVERTER_FILE_ACCEPT, IMAGE_FILE_ACCEPT } from '../src/lib/utils';
import { validateMagicBytes } from '../src/lib/codecs';

let failures = 0;

function assert(condition: boolean, description: string) {
  if (condition) {
    console.log(`  ✓ PASS: ${description}`);
  } else {
    console.error(`  ✗ FAIL: ${description}`);
    failures++;
  }
}

console.log('\n--- Test Suite: HEIC/HEIF Acceptance & Validation ---\n');

console.log('1. HEIC and HEIF Extension Detection:');
assert(isHeicOrHeifFile({ name: 'photo.heic', type: '' }), '.heic extension is accepted with empty MIME type');
assert(isHeicOrHeifFile({ name: 'PHOTO.HEIC', type: '' }), '.HEIC (uppercase) is accepted');
assert(isHeicOrHeifFile({ name: 'camera_capture.heif', type: '' }), '.heif extension is accepted with empty MIME type');
assert(isHeicOrHeifFile({ name: 'IMAGE.HEIF', type: '' }), '.HEIF (uppercase) is accepted');
assert(isHeicOrHeifFile({ name: 'my.photo.final.heif', type: 'application/octet-stream' }), '.heif with generic application/octet-stream is accepted');
assert(isHeicOrHeifFile({ name: 'my.photo.final.heic', type: 'application/octet-stream' }), '.heic with generic application/octet-stream is accepted');

console.log('\n2. HEIC and HEIF MIME Type Detection:');
assert(isHeicOrHeifFile({ name: 'blob', type: 'image/heic' }), 'MIME image/heic is accepted');
assert(isHeicOrHeifFile({ name: 'blob', type: 'image/heif' }), 'MIME image/heif is accepted');
assert(isHeicOrHeifFile({ name: 'blob', type: 'image/heic-sequence' }), 'MIME image/heic-sequence is accepted');
assert(isHeicOrHeifFile({ name: 'blob', type: 'image/heif-sequence' }), 'MIME image/heif-sequence is accepted');

console.log('\n3. General Image Validator (isSupportedImageFile):');
assert(isSupportedImageFile({ name: 'photo.heif', type: '' }), 'isSupportedImageFile accepts photo.heif with empty MIME');
assert(isSupportedImageFile({ name: 'photo.heic', type: '' }), 'isSupportedImageFile accepts photo.heic with empty MIME');
assert(isSupportedImageFile({ name: 'upload', type: 'image/heif' }), 'isSupportedImageFile accepts image/heif');
assert(isSupportedImageFile({ name: 'upload', type: 'image/heic' }), 'isSupportedImageFile accepts image/heic');
assert(isSupportedImageFile({ name: 'upload', type: 'image/heif-sequence' }), 'isSupportedImageFile accepts image/heif-sequence');
assert(isSupportedImageFile({ name: 'picture.jpg', type: 'image/jpeg' }), 'isSupportedImageFile accepts picture.jpg');
assert(isSupportedImageFile({ name: 'graphic.png', type: 'image/png' }), 'isSupportedImageFile accepts graphic.png');
assert(isSupportedImageFile({ name: 'vector.svg', type: 'image/svg+xml' }), 'isSupportedImageFile accepts vector.svg');
assert(isSupportedImageFile({ name: 'modern.webp', type: 'image/webp' }), 'isSupportedImageFile accepts modern.webp');
assert(isSupportedImageFile({ name: 'modern.avif', type: 'image/avif' }), 'isSupportedImageFile accepts modern.avif');

console.log('\n4. Rejection of Unrelated / Unsupported Formats:');
assert(!isSupportedImageFile({ name: 'document.pdf', type: 'application/pdf' }), 'Rejects .pdf file');
assert(!isSupportedImageFile({ name: 'script.exe', type: 'application/x-msdownload' }), 'Rejects .exe file');
assert(!isSupportedImageFile({ name: 'archive.zip', type: 'application/zip' }), 'Rejects .zip file');
assert(!isSupportedImageFile({ name: 'notes.txt', type: 'text/plain' }), 'Rejects .txt file');
assert(!isSupportedImageFile({ name: 'video.mp4', type: 'video/mp4' }), 'Rejects .mp4 video');
assert(!isSupportedImageFile({ name: 'document.docx', type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }), 'Rejects .docx file');
assert(!isHeicOrHeifFile({ name: 'notes.txt', type: 'text/plain' }), 'isHeicOrHeifFile rejects notes.txt');
assert(!isHeicOrHeifFile({ name: 'document.pdf', type: 'application/pdf' }), 'isHeicOrHeifFile rejects document.pdf');

console.log('\n5. Input Accept Attribute Strings:');
assert(CONVERTER_FILE_ACCEPT.includes('.heic'), 'CONVERTER_FILE_ACCEPT includes .heic');
assert(CONVERTER_FILE_ACCEPT.includes('.heif'), 'CONVERTER_FILE_ACCEPT includes .heif');
assert(CONVERTER_FILE_ACCEPT.includes('image/heic'), 'CONVERTER_FILE_ACCEPT includes image/heic');
assert(CONVERTER_FILE_ACCEPT.includes('image/heif'), 'CONVERTER_FILE_ACCEPT includes image/heif');
assert(CONVERTER_FILE_ACCEPT.includes('image/heic-sequence'), 'CONVERTER_FILE_ACCEPT includes image/heic-sequence');
assert(CONVERTER_FILE_ACCEPT.includes('image/heif-sequence'), 'CONVERTER_FILE_ACCEPT includes image/heif-sequence');
assert(IMAGE_FILE_ACCEPT.includes('.heic'), 'IMAGE_FILE_ACCEPT includes .heic');
assert(IMAGE_FILE_ACCEPT.includes('.heif'), 'IMAGE_FILE_ACCEPT includes .heif');
assert(IMAGE_FILE_ACCEPT.includes('image/heif'), 'IMAGE_FILE_ACCEPT includes image/heif');

console.log('\n6. Magic Bytes Validation:');
// Build mock ftyp buffers: 4 bytes length, 'ftyp' (0x66, 0x74, 0x79, 0x70), 4 bytes brand
function createFtypHeader(brand: string): ArrayBuffer {
  const buf = new Uint8Array(16);
  buf[0] = 0; buf[1] = 0; buf[2] = 0; buf[3] = 16;
  buf[4] = 0x66; buf[5] = 0x74; buf[6] = 0x79; buf[7] = 0x70; // ftyp
  for (let i = 0; i < 4; i++) {
    buf[8 + i] = brand.charCodeAt(i) || 0;
  }
  return buf.buffer;
}

const heicMagic = validateMagicBytes(createFtypHeader('heic'));
assert(heicMagic.valid && heicMagic.format === 'heic', 'ftyp "heic" brand recognized as heic format');

const mif1Magic = validateMagicBytes(createFtypHeader('mif1'));
assert(mif1Magic.valid && mif1Magic.format === 'heic', 'ftyp "mif1" (HEIF standard) brand recognized as heic format');

const heifMagic = validateMagicBytes(createFtypHeader('heif'));
assert(heifMagic.valid && heifMagic.format === 'heic', 'ftyp "heif" brand recognized as heic format');

const hevcMagic = validateMagicBytes(createFtypHeader('hevc'));
assert(hevcMagic.valid && hevcMagic.format === 'heic', 'ftyp "hevc" brand recognized as heic format');

const avifMagic = validateMagicBytes(createFtypHeader('avif'));
assert(avifMagic.valid && avifMagic.format === 'avif', 'ftyp "avif" brand recognized as avif format');

console.log(`\nResults: ${failures === 0 ? 'ALL TESTS PASSED' : `${failures} TESTS FAILED`}\n`);

if (failures > 0) {
  process.exit(1);
}
