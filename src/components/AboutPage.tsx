import React from 'react';
import { Cpu, Shield, Zap, Globe } from 'lucide-react';

export function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-black text-zinc-900 dark:text-white mb-6 tracking-tight">
          About Zapixal
        </h1>
        <p className="text-xl text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto font-medium leading-relaxed">
          The ultra-fast, privacy-first image conversion engine that runs entirely inside your browser.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 mb-16">
        <div className="bg-white dark:bg-zinc-950 p-8 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col gap-4">
          <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center mb-2">
            <Cpu className="w-6 h-6" />
          </div>
          <h3 className="text-2xl font-bold text-zinc-900 dark:text-white">WebAssembly Powered</h3>
          <p className="text-zinc-600 dark:text-[#bdc1c6] leading-relaxed">
            Traditionally, high-performance image compression required desktop software or expensive cloud servers. Zapixal uses <strong>WebAssembly (WASM)</strong> to compile desktop-class image processing algorithms (like MozJPEG and UPNG) to run natively at near-native speeds directly inside your web browser.
          </p>
        </div>

        <div className="bg-white dark:bg-zinc-950 p-8 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col gap-4">
          <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center mb-2">
            <Shield className="w-6 h-6" />
          </div>
          <h3 className="text-2xl font-bold text-zinc-900 dark:text-white">Zero-Upload Privacy</h3>
          <p className="text-zinc-600 dark:text-[#bdc1c6] leading-relaxed">
            We believe your data belongs to you. Because the engine runs entirely client-side, <strong>your files never leave your device</strong>. There are no server uploads, no temporary cloud storage, and no risk of data breaches. It's the ultimate privacy-first workflow.
          </p>
        </div>
      </div>

      <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6 text-zinc-600 dark:text-[#bdc1c6] leading-relaxed">
        <h2 className="text-3xl font-bold text-zinc-900 dark:text-white mt-8 mb-4">Why We Built This</h2>
        <p>
          Developers, designers, and everyday users frequently need to resize, convert, or compress images for web optimization, social media, or strict file-size limits. Existing tools were either filled with ads, required paid subscriptions, or worse—forced you to upload your sensitive personal documents or client assets to unknown servers.
        </p>
        <p>
          Zapixal was created to solve this. By leveraging modern HTML5 Canvas, Web Workers for concurrent processing, and WebAssembly, we deliver a lightning-fast, secure, and free utility that respects your privacy and your time.
        </p>

        <div className="flex flex-col sm:flex-row gap-6 mt-12 pt-12 border-t border-zinc-200 dark:border-zinc-800">
          <div className="flex-1">
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-2 flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-500" /> Free Web Tool
            </h3>
            <p className="text-sm">Zapixal is provided as a free utility. No paywalls, no watermarks, and no sign-ups required.</p>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-2 flex items-center gap-2">
              <Globe className="w-5 h-5 text-indigo-500" /> Client-Side Processing
            </h3>
            <p className="text-sm">Once loaded in your browser, image conversion and compression run locally inside client memory.</p>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-2 flex items-center gap-2">
              <Shield className="w-5 h-5 text-emerald-500" /> All Rights Reserved
            </h3>
            <p className="text-sm">Zapixal is a proprietary application. All rights, including branding and design, are reserved.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
