import React, { useState } from 'react';
import { Code, Shield, Zap, Layers, Copy, Check, Info, Cpu, Lock, HelpCircle, Sparkles, Sliders, Monitor, Globe } from 'lucide-react';

export default function WidgetDocumentationPage({ onNavigate }: { onNavigate: (path: string) => void }) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'html' | 'react'>('html');
  const [format, setFormat] = useState('webp');
  const [quality, setQuality] = useState('80');

  const htmlEmbedCode = `<iframe 
  src="https://zapixal.com/embed?format=${format}&quality=${quality}" 
  width="100%" 
  height="420" 
  style="border: none; border-radius: 16px; max-width: 400px; width: 100%;" 
  title="Zapixal In-Browser Image Compressor"
  loading="lazy"
  sandbox="allow-scripts allow-downloads allow-same-origin"
></iframe>`;

  const reactEmbedCode = `export function ImageCompressorWidget() {
  return (
    <iframe 
      src="https://zapixal.com/embed?format=${format}&quality=${quality}" 
      width="100%" 
      height="420" 
      className="w-full max-w-[400px] rounded-2xl border-0 shadow-md"
      title="Zapixal Client-Side Image Compressor"
      loading="lazy"
      sandbox="allow-scripts allow-downloads allow-same-origin"
    />
  );
}`;

  const currentSnippet = activeTab === 'html' ? htmlEmbedCode : reactEmbedCode;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(currentSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const applyPreset = (presetFormat: string, presetQuality: string) => {
    setFormat(presetFormat);
    setQuality(presetQuality);
  };

  return (
    <div className="max-w-5xl mx-auto px-3.5 sm:px-6 lg:px-8 py-8 sm:py-12 animate-subtle-in min-h-screen">
      {/* Page Header */}
      <div className="text-center mb-8 sm:mb-12">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/50 mb-4 shadow-xs">
          <Code className="w-3.5 h-3.5" />
          Third-Party Integration SDK & Iframe
        </span>
        <h1 className="text-2xl sm:text-4xl md:text-5xl font-extrabold text-zinc-900 dark:text-white mb-3 sm:mb-4 tracking-tight">
          Zapixal Embeddable Image Widget
        </h1>
        <p className="text-sm sm:text-lg text-zinc-600 dark:text-zinc-300 max-w-2xl mx-auto leading-relaxed">
          Provide zero-dependency, private client-side image compression directly inside your blog, app, or CMS without running backend encoders or incurring API bills.
        </p>
      </div>

      <div className="grid lg:grid-cols-12 gap-8 items-start mb-16">
        {/* Left Column: Embed Configurator & Instructions */}
        <div className="lg:col-span-7 space-y-6 min-w-0 w-full">
          <section className="bg-white dark:bg-zinc-900 p-3.5 sm:p-7 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm min-w-0">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base sm:text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <Sliders className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                Embed Configurator
              </h2>
              <span className="text-xs text-zinc-500 font-medium hidden sm:inline">Auto-generating code</span>
            </div>

            {/* Quick Presets */}
            <div className="mb-6">
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">
                Quick Configuration Presets
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => applyPreset('webp', '80')}
                  className={`px-2.5 py-2 rounded-xl text-xs font-bold border transition-smooth text-center cursor-pointer ${
                    format === 'webp' && quality === '80'
                      ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500 text-indigo-700 dark:text-indigo-300 shadow-xs'
                      : 'bg-zinc-50 dark:bg-zinc-800/60 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:border-zinc-400'
                  }`}
                >
                  WebP (80%)
                  <span className="block text-[10px] font-normal text-zinc-500 mt-0.5">Fast & Small</span>
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('avif', '80')}
                  className={`px-2.5 py-2 rounded-xl text-xs font-bold border transition-smooth text-center cursor-pointer ${
                    format === 'avif' && quality === '80'
                      ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500 text-indigo-700 dark:text-indigo-300 shadow-xs'
                      : 'bg-zinc-50 dark:bg-zinc-800/60 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:border-zinc-400'
                  }`}
                >
                  AVIF (80%)
                  <span className="block text-[10px] font-normal text-zinc-500 mt-0.5">Max Byte Saving</span>
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('jpeg', '85')}
                  className={`px-2.5 py-2 rounded-xl text-xs font-bold border transition-smooth text-center cursor-pointer ${
                    format === 'jpeg' && quality === '85'
                      ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500 text-indigo-700 dark:text-indigo-300 shadow-xs'
                      : 'bg-zinc-50 dark:bg-zinc-800/60 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:border-zinc-400'
                  }`}
                >
                  JPEG (85%)
                  <span className="block text-[10px] font-normal text-zinc-500 mt-0.5">Legacy Universal</span>
                </button>
              </div>
            </div>

            {/* Interactive Selectors */}
            <div className="grid sm:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">
                  Target Format
                </label>
                <select
                  value={format}
                  onChange={(e) => setFormat(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl p-2.5 text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-smooth"
                >
                  <option value="webp">WebP (Recommended - Smallest)</option>
                  <option value="jpeg">JPEG (Universal Compatibility)</option>
                  <option value="png">PNG (Lossless Alpha)</option>
                  <option value="avif">AVIF (Next-Gen High Compression)</option>
                </select>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500">
                    Quality Level
                  </label>
                  <span className="text-xs font-bold font-mono text-indigo-600 dark:text-indigo-400">{quality}%</span>
                </div>
                <input
                  type="range"
                  min="40"
                  max="100"
                  step="5"
                  value={quality}
                  onChange={(e) => setQuality(e.target.value)}
                  className="w-full mt-2.5 h-2 bg-zinc-200 dark:bg-zinc-700 rounded-lg accent-indigo-600 cursor-pointer"
                />
              </div>
            </div>

            {/* Code Snippet Tabs */}
            <div className="space-y-2 min-w-0">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                <div className="flex bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => setActiveTab('html')}
                    className={`flex-1 sm:flex-none text-center px-3 py-1.5 sm:py-1 rounded-lg text-xs font-bold transition-smooth ${
                      activeTab === 'html'
                        ? 'bg-white dark:bg-zinc-700 text-indigo-600 dark:text-indigo-300 shadow-xs'
                        : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                    }`}
                  >
                    HTML / Iframe
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('react')}
                    className={`flex-1 sm:flex-none text-center px-3 py-1.5 sm:py-1 rounded-lg text-xs font-bold transition-smooth ${
                      activeTab === 'react'
                        ? 'bg-white dark:bg-zinc-700 text-indigo-600 dark:text-indigo-300 shadow-xs'
                        : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                    }`}
                  >
                    React Component
                  </button>
                </div>

                <button 
                  type="button"
                  onClick={copyToClipboard}
                  className="w-full sm:w-auto justify-center px-3 py-2 sm:py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-smooth flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95 shrink-0"
                  aria-label="Copy snippet to clipboard"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied!' : 'Copy Code'}
                </button>
              </div>

              <div className="relative group min-w-0 w-full overflow-hidden">
                <pre className="bg-zinc-950 text-zinc-200 p-3.5 sm:p-4 rounded-xl overflow-x-auto text-xs font-mono leading-relaxed border border-zinc-800 w-full max-w-full">
                  <code>{currentSnippet}</code>
                </pre>
              </div>
            </div>
          </section>

          {/* Architectural Highlights */}
          <section className="space-y-3 min-w-0">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">Security & Architectural Guarantees</h2>
            
            <div className="flex gap-3.5 p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
              <Lock className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-sm text-zinc-900 dark:text-white mb-1">Local In-Browser Processing</h3>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  User image files are processed locally in browser RAM memory via WebAssembly array buffers. Image files are not uploaded to remote servers, supporting complete GDPR and privacy compliance.
                </p>
              </div>
            </div>

            <div className="flex gap-3.5 p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
              <Cpu className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-sm text-zinc-900 dark:text-white mb-1">Zero CSS/Script Conflicts</h3>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  The widget runs inside a strictly sandboxed iframe environment. Host-page frameworks (Next.js, Vite, WordPress) and global style sheets can never leak or break widget execution.
                </p>
              </div>
            </div>

            <div className="flex gap-3.5 p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
              <Layers className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-sm text-zinc-900 dark:text-white mb-1">Universal Image Format Support</h3>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  Accepts Apple HEIC/HEIF photos, transparent PNGs, JPEGs, WebP, AVIF, TIFF, and BMP files directly from desktop drop zones or mobile photo pickers.
                </p>
              </div>
            </div>
          </section>
        </div>

        {/* Right Column: Live Interactive Iframe Preview */}
        <div className="lg:col-span-5 lg:sticky lg:top-20 min-w-0 w-full">
          <div className="bg-white dark:bg-zinc-900 p-3.5 sm:p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 text-center shadow-sm min-w-0 w-full">
            <div className="flex items-center justify-between mb-3 text-left">
              <div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
                  <Monitor className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                  Live Widget Preview
                </h3>
                <p className="text-[11px] text-zinc-500">Reacts dynamically to settings on the left</p>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40 shrink-0">
                Live Iframe
              </span>
            </div>
            
            <div className="flex justify-center bg-zinc-50 dark:bg-zinc-950 p-1 sm:p-3 rounded-xl border border-zinc-200/60 dark:border-zinc-800 w-full overflow-hidden">
              <iframe 
                src={`/embed?format=${format}&quality=${quality}`} 
                width="100%" 
                height="420" 
                className="w-full max-w-full border-none rounded-xl"
                style={{ border: 'none' }}
                title="Zapixal Image Compressor Live Embed Preview"
              ></iframe>
            </div>
            
            <p className="text-[11px] text-zinc-500 mt-3">
              Drag an image file into the preview box above to test client-side WASM encoding right now.
            </p>
          </div>
        </div>
      </div>

      {/* Technical Specifications & Integration Guide */}
      <section className="mb-16 border-t border-zinc-200 dark:border-zinc-800 pt-10">
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-6">Technical Specifications & Browser Support</h2>
        
        <div className="grid md:grid-cols-2 gap-6">
          {/* Query Parameters Table */}
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <h3 className="font-bold text-base text-zinc-900 dark:text-white mb-3">Supported URL Query Parameters</h3>
            <div className="space-y-3 text-xs">
              <div className="border-b border-zinc-100 dark:border-zinc-800 pb-2.5">
                <code className="font-bold text-indigo-600 dark:text-indigo-400">format</code>
                <span className="text-zinc-500 ml-2">(default: "webp")</span>
                <p className="text-zinc-600 dark:text-zinc-400 mt-1">Accepts: <code className="bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded">webp</code>, <code className="bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded">jpeg</code>, <code className="bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded">png</code>, <code className="bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded">avif</code>.</p>
              </div>
              <div className="border-b border-zinc-100 dark:border-zinc-800 pb-2.5">
                <code className="font-bold text-indigo-600 dark:text-indigo-400">quality</code>
                <span className="text-zinc-500 ml-2">(default: 80)</span>
                <p className="text-zinc-600 dark:text-zinc-400 mt-1">Accepts integer between 10 and 100 representing encoder quality target.</p>
              </div>
              <div>
                <code className="font-bold text-indigo-600 dark:text-indigo-400">sandbox</code>
                <span className="text-zinc-500 ml-2">(recommended)</span>
                <p className="text-zinc-600 dark:text-zinc-400 mt-1">Requires <code className="bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded">allow-scripts allow-downloads allow-same-origin</code> attributes on host iframe.</p>
              </div>
            </div>
          </div>

          {/* Browser Compatibility & Limits */}
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <h3 className="font-bold text-base text-zinc-900 dark:text-white mb-3">Browser Requirements & Memory Limits</h3>
            <ul className="space-y-3 text-xs text-zinc-600 dark:text-zinc-400">
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span><strong>Supported Browsers:</strong> Chrome 88+, Firefox 85+, Safari 14.1+, Edge 88+, iOS Safari 14.5+, Android Chrome.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span><strong>File Size Guidance:</strong> Optimized for images up to 50MB per file. For heavy batch processing (100+ files or multi-gigabyte photos), refer users to the main Zapixal app.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <HelpCircle className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                <span><strong>Mobile Downloads:</strong> If downloads do not trigger on embedded mobile WebViews, ensure your native container allows standard HTML5 blob downloads.</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Cross-Link to Main Tools */}
      <div className="pt-10 border-t border-zinc-200 dark:border-zinc-800 text-center">
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-3">Need Advanced Batch Conversion or Custom KB Limits?</h2>
        <p className="text-zinc-600 dark:text-zinc-400 mb-6 max-w-xl mx-auto text-sm leading-relaxed">
          While the embed widget handles fast single-file conversion, the full Zapixal app provides multi-file queue processing, exact byte limit target controls, EXIF metadata stripping, and customizable aspect-ratio cropping.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <button 
            type="button"
            onClick={() => onNavigate('/')}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-smooth shadow-sm hover:shadow-md text-sm cursor-pointer"
          >
            Launch Full Zapixal App
          </button>
          <button 
            type="button"
            onClick={() => onNavigate('/articles/benchmarks')}
            className="px-6 py-3 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white font-bold rounded-xl transition-smooth text-sm cursor-pointer"
          >
            View Codec Benchmarks
          </button>
        </div>
      </div>
    </div>
  );
}
