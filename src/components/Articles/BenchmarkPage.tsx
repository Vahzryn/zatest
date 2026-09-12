import React, { useState } from 'react';
import { Zap, BarChart2, ShieldCheck, ArrowRight, Lock, FileCode, CheckCircle2, ChevronRight, Download, Info, Clock, HardDrive, Check, Copy, Sparkles, TrendingUp } from 'lucide-react';
import rawBenchmarkData from '../../data/benchmarks/compression-2026.json';
import { validateBenchmarkData } from '../../data/benchmarks/validation';

export default function BenchmarkPage({ onNavigate }: { onNavigate: (path: string) => void }) {
  const benchmarkData = rawBenchmarkData as any;
  validateBenchmarkData(benchmarkData);

  const [activeMetric, setActiveMetric] = useState<'reduction' | 'speed' | 'size'>('reduction');
  const [copiedCli, setCopiedCli] = useState(false);

  const formatBytes = (bytes: number) => {
    if (bytes >= 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    return (bytes / 1024).toFixed(1) + ' KB';
  };

  const formatDate = (isoString: string) => {
    try {
      return new Date(isoString).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch {
      return isoString;
    }
  };

  const handleCopyCli = () => {
    navigator.clipboard.writeText('npx tsx scripts/run-benchmarks.ts');
    setCopiedCli(true);
    setTimeout(() => setCopiedCli(false), 2000);
  };

  return (
    <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 animate-subtle-in">
      
      {/* Header */}
      <header className="mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800/60 uppercase tracking-wider mb-4 shadow-xs">
          <BarChart2 className="w-3.5 h-3.5" />
          Zapixal Independent Research
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-zinc-900 dark:text-white mb-5 leading-tight tracking-tight">
          Image Compression Benchmark 2026: JPEG vs WebP vs AVIF
        </h1>
        <p className="text-base sm:text-lg text-zinc-600 dark:text-zinc-300 leading-relaxed max-w-3xl">
          An independent, reproducible compression benchmark comparing modern image formats across 20 real-world photographs and UI screenshots to measure byte reduction and encoding latency.
        </p>
      </header>

      {/* Key Metric Highlights Bento Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition-smooth">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Max Reduction</span>
            <span className="p-1 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-indigo-600 dark:text-indigo-400">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="text-3xl font-extrabold text-indigo-600 dark:text-indigo-400">78.48%</div>
          <div className="text-xs text-zinc-600 dark:text-zinc-400 font-medium mt-1">AVIF (libavif) Quality 80</div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition-smooth">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Fastest Encoder</span>
            <span className="p-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
              <Zap className="w-4 h-4" />
            </span>
          </div>
          <div className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">108 ms</div>
          <div className="text-xs text-zinc-600 dark:text-zinc-400 font-medium mt-1">WebP (11x faster than AVIF)</div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition-smooth">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Universal Baseline</span>
            <span className="p-1 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
              <HardDrive className="w-4 h-4" />
            </span>
          </div>
          <div className="text-3xl font-extrabold text-zinc-800 dark:text-zinc-100">62.79%</div>
          <div className="text-xs text-zinc-600 dark:text-zinc-400 font-medium mt-1">MozJPEG (Universal support)</div>
        </div>
      </div>

      {/* Article Content */}
      <div className="space-y-12 text-zinc-800 dark:text-zinc-200 leading-relaxed">
        
        {/* 1. Executive Summary */}
        <section>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-4 flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-3">
            1. Executive Summary
          </h2>
          <div className="bg-indigo-50/70 dark:bg-indigo-950/30 rounded-2xl p-6 sm:p-7 border border-indigo-100 dark:border-indigo-900/50 my-6 shadow-xs">
            <ul className="space-y-4 m-0 p-0 list-none">
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                <span className="text-sm sm:text-base leading-relaxed">
                  <strong className="text-zinc-900 dark:text-white">AVIF achieves the highest average size reduction (78.48%)</strong>. Across our real-world dataset, libavif produced the most aggressive byte-saving at Quality 80, confirming its status as the most efficient next-generation codec for pure file-size minimization.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                <span className="text-sm sm:text-base leading-relaxed">
                  <strong className="text-zinc-900 dark:text-white">WebP generated the smallest total volume (1.07 MB) at 11x faster encoding speeds than AVIF</strong>. While AVIF had higher individual average reductions, WebP (libwebp) excelled on dense screenshots and completed encoding in 108ms on average, compared to AVIF's 1247ms.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                <span className="text-sm sm:text-base leading-relaxed">
                  <strong className="text-zinc-900 dark:text-white">MozJPEG remains highly competitive (62.79% reduction)</strong>. Even against modern formats, a highly optimized JPEG encoder still drastically reduces raw uncompressed image sizes, proving its continued relevance for compatibility-first workflows.
                </span>
              </li>
            </ul>
          </div>
        </section>

        {/* 2. Interactive Visual Comparison Section */}
        <section className="p-6 sm:p-7 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-white">
                Interactive Codec Comparison
              </h3>
              <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
                Toggle dimensions to compare real-world performance metrics
              </p>
            </div>

            {/* Metric Toggle Tabs */}
            <div className="flex bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl shrink-0">
              <button
                type="button"
                onClick={() => setActiveMetric('reduction')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-smooth ${
                  activeMetric === 'reduction'
                    ? 'bg-white dark:bg-zinc-700 text-indigo-600 dark:text-indigo-300 shadow-xs'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                Byte Reduction
              </button>
              <button
                type="button"
                onClick={() => setActiveMetric('speed')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-smooth ${
                  activeMetric === 'speed'
                    ? 'bg-white dark:bg-zinc-700 text-indigo-600 dark:text-indigo-300 shadow-xs'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                Encoding Latency
              </button>
              <button
                type="button"
                onClick={() => setActiveMetric('size')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-smooth ${
                  activeMetric === 'size'
                    ? 'bg-white dark:bg-zinc-700 text-indigo-600 dark:text-indigo-300 shadow-xs'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                Total Output Size
              </button>
            </div>
          </div>

          {/* Visual Bars */}
          <div className="space-y-4 pt-2">
            {benchmarkData.formatSummaries.map((f: any) => {
              let barPercentage = 0;
              let displayValue = '';
              let badgeColor = 'bg-blue-600';

              if (activeMetric === 'reduction') {
                barPercentage = f.avgReductionPct;
                displayValue = `${f.avgReductionPct}% reduction`;
                badgeColor = f.format === 'AVIF' ? 'bg-indigo-600' : f.format === 'WebP' ? 'bg-blue-600' : 'bg-zinc-600';
              } else if (activeMetric === 'speed') {
                // Invert scale: lower ms = better
                const maxTime = Math.max(...benchmarkData.formatSummaries.map((x: any) => x.avgTimeMs));
                barPercentage = Math.max(10, 100 - (f.avgTimeMs / maxTime) * 85);
                displayValue = `${f.avgTimeMs} ms (${f.avgTimeMs < 200 ? 'Ultra Fast' : 'Heavy Compute'})`;
                badgeColor = f.avgTimeMs < 200 ? 'bg-emerald-600' : 'bg-amber-600';
              } else {
                const maxSize = Math.max(...benchmarkData.formatSummaries.map((x: any) => x.totalOutputSizeBytes));
                barPercentage = (f.totalOutputSizeBytes / maxSize) * 100;
                displayValue = formatBytes(f.totalOutputSizeBytes);
                badgeColor = 'bg-indigo-600';
              }

              return (
                <div key={f.format} className="space-y-1.5">
                  <div className="flex justify-between text-xs sm:text-sm font-semibold">
                    <span className="text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                      <strong className="font-bold">{f.format}</strong>
                      <span className="text-xs text-zinc-500 font-normal">({f.codec.split(' ')[0]})</span>
                    </span>
                    <span className="font-mono text-zinc-700 dark:text-zinc-300 font-bold">{displayValue}</span>
                  </div>
                  <div className="h-3 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden p-0.5">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ease-out ${badgeColor}`}
                      style={{ width: `${barPercentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 3. Dataset & Methodology */}
        <section>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-4 flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-3">
            2. Dataset & Methodology
          </h2>
          <p className="text-sm sm:text-base leading-relaxed mb-4">
            To ensure the findings apply to real-world usage rather than synthetic tests, the dataset consisted of <strong>{benchmarkData.dataset.totalImagesProcessed} images</strong> totaling <strong>{formatBytes(benchmarkData.dataset.uncompressedBytes)}</strong> of raw pixel data:
          </p>
          <ul className="space-y-2 text-sm sm:text-base list-disc pl-5 mb-6 text-zinc-700 dark:text-zinc-300">
            <li><strong>{benchmarkData.dataset.photosCount} Photographs:</strong> Complex gradients, noisy natural environments, and high-frequency details (foliage, portraits, landscapes).</li>
            <li><strong>{benchmarkData.dataset.graphicsCount} UI/Screenshots:</strong> Sharp vectors, flat color blocks, text elements, and application interfaces.</li>
          </ul>

          <div className="overflow-x-auto my-6 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs">
            <table className="min-w-full text-sm text-left">
              <thead>
                <tr className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800">
                  <th className="p-3.5 font-bold text-zinc-900 dark:text-zinc-100">Format</th>
                  <th className="p-3.5 font-bold text-zinc-900 dark:text-zinc-100">Codec & Version</th>
                  <th className="p-3.5 font-bold text-zinc-900 dark:text-zinc-100">Quality Target</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 font-medium">
                {benchmarkData.formatSummaries.map((f: any) => (
                  <tr key={f.format} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                    <td className="p-3.5 font-bold text-zinc-900 dark:text-zinc-100">{f.format}</td>
                    <td className="p-3.5 font-mono text-xs text-zinc-600 dark:text-zinc-400">{f.codec} {f.version}</td>
                    <td className="p-3.5 text-zinc-600 dark:text-zinc-400">{f.settings}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* 4. Complete Aggregated Results Table */}
        <section>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-4 flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-3">
            3. Full Benchmark Results
          </h2>
          <p className="text-sm sm:text-base leading-relaxed mb-4">
            Aggregated results across all {benchmarkData.dataset.totalImagesProcessed} files. Total starting volume was {formatBytes(benchmarkData.dataset.uncompressedBytes)}.
          </p>
          
          <div className="overflow-x-auto my-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
            <table className="w-full text-sm text-left">
              <thead className="bg-zinc-50 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-300">
                <tr>
                  <th className="p-4 font-bold border-b border-zinc-200 dark:border-zinc-800">Codec</th>
                  <th className="p-4 font-bold border-b border-zinc-200 dark:border-zinc-800 text-right">Avg Reduction</th>
                  <th className="p-4 font-bold border-b border-zinc-200 dark:border-zinc-800 text-right">Total Output</th>
                  <th className="p-4 font-bold border-b border-zinc-200 dark:border-zinc-800 text-right">Avg Latency</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {benchmarkData.formatSummaries.map((f: any) => (
                  <tr key={f.format} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 transition-smooth">
                    <td className="p-4 font-bold text-zinc-900 dark:text-white">
                      {f.format} <span className="text-zinc-500 font-normal block text-xs mt-0.5">{f.codec.split(' ')[0]}</span>
                    </td>
                    <td className="p-4 text-right font-mono">
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold text-base">{f.avgReductionPct}%</span>
                    </td>
                    <td className="p-4 text-right font-mono text-zinc-700 dark:text-zinc-300 font-semibold">
                      {formatBytes(f.totalOutputSizeBytes)}
                    </td>
                    <td className="p-4 text-right font-mono text-zinc-700 dark:text-zinc-300 font-semibold">
                      {f.avgTimeMs} ms
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* 5. Reproducibility & Limitations */}
        <section>
          <div className="grid md:grid-cols-2 gap-6 my-6">
            <div className="p-6 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
              <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white mb-2 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                Reproducibility
              </h3>
              <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 mb-4 leading-relaxed">
                These benchmarks are fully deterministic. Developers can verify these exact numbers by running the benchmark CLI locally in any Node.js runtime:
              </p>
              <div className="bg-zinc-950 text-zinc-200 p-3.5 rounded-xl text-xs font-mono flex items-center justify-between border border-zinc-800">
                <code>npx tsx scripts/run-benchmarks.ts</code>
                <button
                  type="button"
                  onClick={handleCopyCli}
                  className="p-1 hover:text-white text-zinc-400 transition-colors"
                  title="Copy command"
                >
                  {copiedCli ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
            
            <div className="p-6 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
              <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white mb-2 flex items-center gap-2">
                <Info className="w-5 h-5 text-amber-500" />
                Benchmark Limitations
              </h3>
              <ul className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 space-y-2 list-none p-0">
                <li className="flex items-start gap-2"><span className="text-amber-500 font-bold">•</span> <strong>Dataset Size:</strong> 20 images is a representative sample, not a definitive global model.</li>
                <li className="flex items-start gap-2"><span className="text-amber-500 font-bold">•</span> <strong>WASM Memory:</strong> Testing was bound to single-threaded WebAssembly memory limits.</li>
                <li className="flex items-start gap-2"><span className="text-amber-500 font-bold">•</span> <strong>Fixed Quality:</strong> We targeted Q=80 universally, but codec quality scales vary.</li>
              </ul>
            </div>
          </div>
        </section>

        {/* 6. Test It Yourself Interactive Links */}
        <section className="pt-4">
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-4 flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-3">
            4. Test It Yourself
          </h2>
          <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 mb-6">
            We expose these exact WASM-compiled codecs through our free, client-side tools so you can run your own files through them:
          </p>
          <div className="grid sm:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => onNavigate('/client-side-private-image-compressor')}
              className="p-5 text-left rounded-2xl border border-zinc-200 dark:border-zinc-800 hover:border-indigo-500 dark:hover:border-indigo-500 bg-white dark:bg-zinc-900 transition-smooth group shadow-sm hover:shadow-md cursor-pointer"
            >
              <div className="font-bold text-base text-zinc-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 flex items-center justify-between mb-1.5">
                Image Compressor
                <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:text-indigo-600 transition-transform group-hover:translate-x-1" />
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed font-medium">Test MozJPEG, WebP, and AVIF compressions instantly in your browser.</p>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('/compress-image-to-exact-size-kb')}
              className="p-5 text-left rounded-2xl border border-zinc-200 dark:border-zinc-800 hover:border-indigo-500 dark:hover:border-indigo-500 bg-white dark:bg-zinc-900 transition-smooth group shadow-sm hover:shadow-md cursor-pointer"
            >
              <div className="font-bold text-base text-zinc-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 flex items-center justify-between mb-1.5">
                Compress to Exact KB
                <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:text-indigo-600 transition-transform group-hover:translate-x-1" />
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed font-medium">Force the codec to compress an image down to a strict byte limit.</p>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('/convert-png-to-webp-lossless')}
              className="p-5 text-left rounded-2xl border border-zinc-200 dark:border-zinc-800 hover:border-indigo-500 dark:hover:border-indigo-500 bg-white dark:bg-zinc-900 transition-smooth group shadow-sm hover:shadow-md cursor-pointer"
            >
              <div className="font-bold text-base text-zinc-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 flex items-center justify-between mb-1.5">
                WebP Converter
                <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:text-indigo-600 transition-transform group-hover:translate-x-1" />
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed font-medium">See the speed and efficiency of libwebp applied to your own images.</p>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('/convert-to-avif-online-free')}
              className="p-5 text-left rounded-2xl border border-zinc-200 dark:border-zinc-800 hover:border-indigo-500 dark:hover:border-indigo-500 bg-white dark:bg-zinc-900 transition-smooth group shadow-sm hover:shadow-md cursor-pointer"
            >
              <div className="font-bold text-base text-zinc-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 flex items-center justify-between mb-1.5">
                AVIF Converter
                <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:text-indigo-600 transition-transform group-hover:translate-x-1" />
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed font-medium">Export ultra-compressed files using the next-generation libavif codec.</p>
            </button>
          </div>
        </section>

      </div>
    </article>
  );
}
