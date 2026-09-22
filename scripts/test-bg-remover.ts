import assert from 'node:assert/strict';
import { clampSafeDimensions } from '../src/features/background-remover/deviceCapabilities';
import { getCutoutFileName, createImageFileItemFromBgResult } from '../src/features/background-remover/bgRemoverController';
import { TOOL_REGISTRY } from '../src/lib/toolRegistry';
import { PSEO_ROUTES_LIST } from '../src/lib/seo/routes';
import { BgRemovalResult } from '../src/features/background-remover/types';
import { parseSeoRoute, PAGE_IMPORTS } from '../src/lib/seo/meta';

console.log('====================================================');
console.log(' Zapixal: Background Remover Engine Test Suite      ');
console.log('====================================================\n');

let passedTests = 0;
let totalTests = 0;

async function runTest(description: string, fn: () => void | Promise<void>) {
  totalTests++;
  try {
    await fn();
    console.log(`  ✓ ${description}`);
    passedTests++;
  } catch (error) {
    console.error(`  ✗ FAIL: ${description}`);
    console.error(error);
    process.exitCode = 1;
  }
}

async function runSuite() {
// 1. Tool registry verification
await runTest('Background Remover is properly registered in TOOL_REGISTRY', () => {
  const tool = TOOL_REGISTRY.find(t => t.route === '/background-remover');
  assert.ok(tool, 'Tool should exist in registry');
  assert.equal(tool.id, 'background-remover');
  assert.equal(tool.category, 'images');
  assert.equal(tool.status, 'active');
  assert.ok(tool.capabilities.includes('webgpu'));
  assert.ok(tool.capabilities.includes('wasm'));
});

// 2. SEO routes list verification
await runTest('Background Remover route is registered in PSEO_ROUTES_LIST', () => {
  const seoRoute = PSEO_ROUTES_LIST.find(r => r.path === '/background-remover');
  assert.ok(seoRoute, 'Route should exist in SEO routes list');
});

// 3. PAGE_IMPORTS verification
await runTest('Background Remover is registered consistently in PAGE_IMPORTS', () => {
  assert.ok('background-remover' in PAGE_IMPORTS, 'background-remover key must exist in PAGE_IMPORTS');
  assert.equal(typeof PAGE_IMPORTS['background-remover'], 'function', 'PAGE_IMPORTS entry must be a factory function');
});

// 4. parseSeoRoute verification
await runTest('parseSeoRoute resolves /background-remover without 404', async () => {
  const seoData = await parseSeoRoute('/background-remover');
  assert.equal(seoData.path, '/background-remover', 'Path must match /background-remover');
  assert.ok(!seoData.isNotFound, 'isNotFound must not be true');
  assert.ok(seoData.h1Title && seoData.h1Title.length > 5, 'h1Title must be a valid descriptive string');
  assert.equal(seoData.canonicalUrl, 'https://zapixal.com/background-remover', 'Canonical URL must be accurate');
  assert.equal(seoData.isIndexable, true, 'Page must be indexable');
  assert.ok(seoData.guideContent && seoData.guideContent.faqs.length > 0, 'Must have guideContent with FAQs');
});

// 5. Dimension safety clamping for normal images
await runTest('Keeps normal resolution images untouched (e.g. 1920x1080)', () => {
  const res = clampSafeDimensions(1920, 1080, 5000, 24);
  assert.equal(res.width, 1920);
  assert.equal(res.height, 1080);
  assert.equal(res.scaled, false);
});

// 6. Dimension safety clamping for extreme megapixel images (e.g. 48MP phone photo)
await runTest('Clamps extreme megapixel images (8000x6000 = 48MP) to 24MP limit', () => {
  const res = clampSafeDimensions(8000, 6000, 5000, 24);
  assert.ok(res.scaled, 'Image must be scaled');
  assert.ok(res.width <= 5000, `Width ${res.width} must be <= 5000`);
  assert.ok(res.height <= 5000, `Height ${res.height} must be <= 5000`);
  const totalMp = (res.width * res.height) / 1_000_000;
  assert.ok(totalMp <= 24.5, `Total MP ${totalMp} must be <= 24MP`);
});

// 7. Dimension safety clamping for extreme single-dimension banners (e.g. 12000x1000)
await runTest('Clamps single extreme dimension (12000x1000) to max dimension ceiling', () => {
  const res = clampSafeDimensions(12000, 1000, 5000, 24);
  assert.ok(res.scaled, 'Image must be scaled');
  assert.equal(res.width, 5000);
  assert.equal(res.height, Math.round(1000 * (5000 / 12000)));
});

// 8. Filename generator for pipeline
await runTest('Generates proper cutout filename based on format', () => {
  assert.equal(getCutoutFileName('portrait.jpg', 'png'), 'portrait_cutout.png');
  assert.equal(getCutoutFileName('banner.png', 'webp'), 'banner_cutout.webp');
  assert.equal(getCutoutFileName('photo.jpeg', 'jpg'), 'photo_cutout.jpg');
});

// 9. ImageFileItem bridge conversion
await runTest('Converts BgRemovalResult into standard ImageFileItem representation', () => {
  const fakeBlob = new Blob(['test'], { type: 'image/png' });
  const fakeFile = new File([fakeBlob], 'test_cutout.png', { type: 'image/png' });
  const mockResult: BgRemovalResult = {
    operationId: 'op_123',
    blob: fakeBlob,
    file: fakeFile,
    previewUrl: 'blob:http://localhost/123',
    width: 800,
    height: 600,
    format: 'png',
    sizeBytes: 1024,
    backendUsed: 'webgpu',
    inferenceTimeMs: 150,
    totalTimeMs: 250,
    maskData: { width: 512, height: 512 },
    toImageFileItem: (customId) => createImageFileItemFromBgResult(mockResult, 'test.jpg', customId),
  };

  const fileItem = mockResult.toImageFileItem('custom-id-1');
  assert.equal(fileItem.id, 'custom-id-1');
  assert.equal(fileItem.file.name, 'test_cutout.png');
  assert.equal(fileItem.originalSize, 1024);
  assert.equal(fileItem.dimensions?.width, 800);
  assert.equal(fileItem.dimensions?.height, 600);
  assert.equal(fileItem.status, 'pending');
  assert.equal(fileItem.previewUrl, 'blob:http://localhost/123');
});

console.log(`\n====================================================`);
console.log(` Results: ${passedTests} / ${totalTests} bg-remover tests passed.`);
console.log(`====================================================\n`);
}

runSuite().catch(err => {
  console.error('Test suite failed:', err);
  process.exit(1);
});


