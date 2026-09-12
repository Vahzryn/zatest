/**
 * ZAPIXAL — VERIFIED TECHNICAL FACTS & SYSTEM SPECIFICATIONS
 * 
 * This file serves as the absolute source of truth for the capabilities, 
 * performance characteristics, metadata behavior, and architectural limits 
 * of the Zapixal web application.
 * 
 * Referencing this dictionary prevents AI-generated editorial copy from
 * inventing capabilities, file-size claims, or security behaviors.
 */

export interface FactCategory {
  id: string;
  name: string;
  assertions: string[];
  evidenceType: 'CODE_VERIFIED' | 'OFFICIAL_SOURCE' | 'ESTABLISHED_TECHNICAL_FACT' | 'VARIABLE_REQUIREMENT';
  sourceCodeRef?: string;
}

export const VERIFIED_FACTS: Record<string, FactCategory> = {
  privacyAndNetwork: {
    id: 'privacy_network',
    name: 'Privacy and Network Security',
    evidenceType: 'CODE_VERIFIED',
    sourceCodeRef: 'src/lib/conversionOrchestrator.ts',
    assertions: [
      'Images are processed locally in your browser and are not uploaded to Zapixal\'s image-processing servers.',
      'All pixel decoding, canvas compositing, and quantization calculations execute locally within the client-side browser memory sandboxed environment.',
      'Network requests are limited purely to downloading initial static website assets and WebAssembly (WASM) binary workers.',
      'No tracking beacons or telemetry scripts are loaded or active during image processing.'
    ]
  },
  metadataBehavior: {
    id: 'metadata_behavior',
    name: 'Metadata Preservation and Stripping',
    evidenceType: 'CODE_VERIFIED',
    sourceCodeRef: 'src/lib/codecs.ts',
    assertions: [
      'Rasterization onto an HTML5 Canvas or OffscreenCanvas automatically strips all metadata (EXIF, GPS coordinates, IPTC fields, XMP sidecars, camera model details, and timestamps) because the browser Canvas API operates exclusively on raw RGBA pixel grids.',
      'Standard Canvas export (e.g. canvas.toBlob) does not preserve input image headers. All output formats are natively stripped of original metadata.',
      'DPI resolution metadata (JFIF APP0 headers for JPEGs, and pHYs chunks for PNGs) is explicitly injected post-rasterization when a custom target DPI is set (e.g. 300 or 600 DPI for print preparation).',
      'The "lossless metadata optimizer" page refers to stripping EXIF chunks by custom binary slicing or re-writing progressive scan tables, which retains high visual quality while reducing binary footprint.'
    ]
  },
  formatCapabilities: {
    id: 'format_capabilities',
    name: 'Image Format and Codec Capabilities',
    evidenceType: 'CODE_VERIFIED',
    sourceCodeRef: 'src/lib/codecs.ts',
    assertions: [
      'HEIC and HEIF files are decoded locally using a custom libheif decoder compiled to WebAssembly (WASM) and executed off the main thread inside browser Web Workers.',
      'Wide color gamut 10-bit Display P3 profiles embedded in iPhone HEIC photos are parsed and down-sampled to standard 8-bit sRGB color spaces during conversion.',
      'Alpha transparency and translucent layers (8-bit alpha channels) are fully preserved when converting from PNG, WebP, or SVG to target formats that support transparency (PNG, WebP).',
      'Converting transparent PNGs to JPEGs applies custom background matte compositing (default solid #FFFFFF white) to prevent default black background compression artifacts.',
      'SVG files are parsed dynamically and rasterized via OffscreenCanvas, rendering vectors accurately at high-DPI targets without server-side font dependencies.',
      'Animated GIFs are NOT animated upon export. Standard canvas rasterization flattens animated sequences, rendering and exporting only the first static preview frame.'
    ]
  },
  performanceLimits: {
    id: 'performance_limits',
    name: 'System Performance and RAM Boundaries',
    evidenceType: 'ESTABLISHED_TECHNICAL_FACT',
    sourceCodeRef: 'src/lib/concurrency.ts',
    assertions: [
      'There are no hardcoded server limits on batch sizes or maximum image megapixels, as processing is entirely device-driven.',
      'Maximum throughput and concurrency are strictly bounded by your local hardware (device system RAM and available CPU threads).',
      'Extremely large image files (e.g. 50+ megapixels) or massive batch queues (e.g. 100+ high-res photos) processed on low-end mobile devices can trigger browser Out of Memory (OOM) errors, tab crashes, or system responsiveness warnings.',
      'Multithreaded processing is achieved using Web Workers to distribute image-processing tasks across available CPU logical processors, keeping the main UI thread fluid and responsive.'
    ]
  },
  losslessOptimization: {
    id: 'lossless_optimization',
    name: 'Lossless Terminology Accuracy',
    evidenceType: 'ESTABLISHED_TECHNICAL_FACT',
    sourceCodeRef: 'src/lib/codecs.ts',
    assertions: [
      'No JPEG compression is mathematically 100% lossless, as standard JPEG encoding uses lossy Discrete Cosine Transform (DCT) quantization. Claims on JPEGs refer to "visually lossless" quality parameters.',
      'Lossless PNG compression preserves the decoded image pixels while optimizing the PNG representation.',
      'PNG palette quantization (via WASM Imagequant) is lossy but "visually lossless", reducing colors to under 256 for extreme size savings while maintaining sharp vector outlines and transparent borders.'
    ]
  },
  variableRequirements: {
    id: 'variable_requirements',
    name: 'External Standards and Regulatory Specifications',
    evidenceType: 'VARIABLE_REQUIREMENT',
    assertions: [
      'Passport photo dimensions, head-to-canvas aspect ratios, and background color tones vary dynamically across international jurisdictions (e.g., US 2x2 inch, Schengen 35x45mm, Indian visa, etc.).',
      'Government online portal upload caps (e.g. under 50KB or 20KB) and competitive exam portals utilize custom validation algorithms that can change without public notice.',
      'Applicant Tracking Systems (ATS) and career sites impose arbitrary file-size and naming validation filters that differ between individual enterprise installations (e.g. Workday, Taleo, Greenhouse).',
      'Zapixal provides interactive alignment overlays and custom target-size sliders to help users match these rules, but users must always verify current official guidelines prior to submitting documents.'
    ]
  }
};
