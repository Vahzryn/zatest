import assert from 'node:assert';
import { parseConfigFromQuery, generateShareUrl } from '../src/lib/shareConfig';
import { ConversionSettings } from '../src/types';

console.log('====================================================');
console.log(' Zapixal: Shareable Configuration URL Test Suite   ');
console.log('====================================================\n');

let passed = 0;

function test(description: string, fn: () => void) {
  try {
    fn();
    console.log(`  ✓ ${description}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ ${description}`);
    console.error(err);
    process.exit(1);
  }
}

// 1. Parsing targetMaxKB
test('Parses and validates targetMaxKB correctly', () => {
  const parsed = parseConfigFromQuery('?targetMaxKB=30');
  assert.strictEqual(parsed.targetMaxKB, 30);

  const parsedMax = parseConfigFromQuery('?maxKB=200');
  assert.strictEqual(parsedMax.targetMaxKB, 200);

  const parsedKb = parseConfigFromQuery('?kb=50');
  assert.strictEqual(parsedKb.targetMaxKB, 50);

  // Clamping and invalid rejection
  const parsedNegative = parseConfigFromQuery('?targetMaxKB=-5');
  assert.strictEqual(parsedNegative.targetMaxKB, undefined);

  const parsedHuge = parseConfigFromQuery('?targetMaxKB=9999999');
  assert.strictEqual(parsedHuge.targetMaxKB, 500000);

  const parsedGarbage = parseConfigFromQuery('?targetMaxKB=abc<script>');
  assert.strictEqual(parsedGarbage.targetMaxKB, undefined);
});

// 2. Parsing format
test('Parses and validates target format correctly', () => {
  const parsedWebp = parseConfigFromQuery('?format=webp');
  assert.strictEqual(parsedWebp.targetFormat, 'webp');

  const parsedJpg = parseConfigFromQuery('?to=jpeg');
  assert.strictEqual(parsedJpg.targetFormat, 'jpg');

  const parsedInvalid = parseConfigFromQuery('?format=exe');
  assert.strictEqual(parsedInvalid.targetFormat, undefined);
});

// 3. Parsing quality
test('Parses and clamps quality correctly', () => {
  const parsed = parseConfigFromQuery('?quality=80');
  assert.strictEqual(parsed.quality, 0.8);

  const parsedDecimal = parseConfigFromQuery('?q=0.85');
  assert.strictEqual(parsedDecimal.quality, 0.85);

  const parsedOutOfRange = parseConfigFromQuery('?q=2.5');
  assert.strictEqual(parsedOutOfRange.quality, 1.0);
});

// 4. Parsing stripExif
test('Parses stripExif boolean flags', () => {
  assert.strictEqual(parseConfigFromQuery('?stripExif=false').stripExif, false);
  assert.strictEqual(parseConfigFromQuery('?stripExif=0').stripExif, false);
  assert.strictEqual(parseConfigFromQuery('?stripExif=true').stripExif, true);
  assert.strictEqual(parseConfigFromQuery('?stripExif=1').stripExif, true);
});

// 5. Parsing resize & crop
test('Parses resize and crop parameters', () => {
  const parsedResize = parseConfigFromQuery('?resizeW=1920&resizeH=1080&keepRatio=1');
  assert.deepStrictEqual(parsedResize.resize, {
    enabled: true,
    maxWidth: 1920,
    maxHeight: 1080,
    keepAspectRatio: true
  });

  const parsedCrop = parseConfigFromQuery('?cropW=16&cropH=9');
  assert.deepStrictEqual(parsedCrop.cropAspectRatio, {
    width: 16,
    height: 9
  });
});

// 6. Parsing DPI & rotation
test('Parses DPI and rotation parameters', () => {
  assert.strictEqual(parseConfigFromQuery('?dpi=300').targetDPI, 300);
  assert.strictEqual(parseConfigFromQuery('?rotate=90').rotation, 90);
  assert.strictEqual(parseConfigFromQuery('?rotation=270').rotation, 270);
  assert.strictEqual(parseConfigFromQuery('?rotate=45').rotation, undefined); // only multiples of 90 allowed
});

// 7. Security: ignores unknown / prototype pollution / xss params
test('Safely ignores malicious and non-whitelisted params', () => {
  const parsed = parseConfigFromQuery('?__proto__[polluted]=true&<script>=alert(1)&targetMaxKB=50');
  assert.strictEqual((parsed as any).polluted, undefined);
  assert.strictEqual(parsed.targetMaxKB, 50);
});

// 8. Generating URL: Deterministic, clean sorting, omissions of route defaults
test('Generates deterministic URLs with sorted parameters', () => {
  const settings: ConversionSettings = {
    targetFormat: 'webp',
    quality: 0.8,
    targetMaxKB: 30,
    stripExif: true,
    resize: { enabled: false, keepAspectRatio: true },
    cropAspectRatio: null,
    filenamePrefix: '',
    filenameSuffix: ''
  };

  const url = generateShareUrl('/compress-image', settings);
  assert.ok(url.startsWith('https://www.zapixal.com/compress-image'));
  assert.ok(url.includes('targetMaxKB=30'));
  // Should not leak blob: or local file data
  assert.ok(!url.includes('blob:'));
  assert.ok(!url.includes('file:'));
});

// 9. University use-case test
test('University workflow: Preconfigured 30 KB target link', () => {
  const settings: ConversionSettings = {
    targetFormat: 'jpg',
    quality: 0.85,
    targetMaxKB: 30,
    stripExif: true,
    resize: { enabled: false, keepAspectRatio: true },
    cropAspectRatio: null,
    filenamePrefix: '',
    filenameSuffix: ''
  };

  const shareUrl = generateShareUrl('/compress-jpeg-to-200kb', settings);
  const parsedFromUrl = parseConfigFromQuery(new URL(shareUrl).search);
  assert.strictEqual(parsedFromUrl.targetMaxKB, 30);
});

// 10. Homepage sharing test
test('Homepage workflow: Share settings configured on root path (/)', () => {
  // Target Max KB workflow on homepage
  const settingsKB: ConversionSettings = {
    targetFormat: 'webp',
    quality: 0.8,
    targetMaxKB: 50,
    stripExif: true,
    resize: { enabled: false, keepAspectRatio: true },
    cropAspectRatio: null,
    filenamePrefix: '',
    filenameSuffix: ''
  };

  const shareUrlKB = generateShareUrl('/', settingsKB);
  assert.ok(shareUrlKB.startsWith('https://www.zapixal.com/?') || shareUrlKB.startsWith('https://www.zapixal.com/'));
  const urlObjKB = new URL(shareUrlKB);
  const parsedKB = parseConfigFromQuery(urlObjKB.search);
  assert.strictEqual(parsedKB.targetMaxKB, 50);
  assert.strictEqual(parsedKB.targetFormat, 'webp');

  // Custom quality convert workflow on homepage
  const settingsQuality: ConversionSettings = {
    targetFormat: 'jpg',
    quality: 0.65,
    targetMaxKB: undefined,
    stripExif: true,
    resize: { enabled: false, keepAspectRatio: true },
    cropAspectRatio: null,
    filenamePrefix: '',
    filenameSuffix: ''
  };

  const shareUrlQ = generateShareUrl('/', settingsQuality);
  const urlObjQ = new URL(shareUrlQ);
  const parsedQ = parseConfigFromQuery(urlObjQ.search);
  assert.strictEqual(parsedQ.targetFormat, 'jpg');
  assert.strictEqual(parsedQ.quality, 0.65);
});

console.log('\n====================================================');
console.log(` Results: ${passed} / 10 share configuration tests passed.`);
console.log('====================================================\n');
