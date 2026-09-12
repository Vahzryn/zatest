import React from 'react';
import { FileImage, FileText, Code, ShieldCheck, ArrowRight, Layers } from 'lucide-react';
import { TOOL_REGISTRY } from '../lib/toolRegistry';

interface CategoryDiscoverySectionProps {
  onNavigate: (path: string) => void;
}

interface CategoryCardItem {
  key: string;
  path: string;
  title: string;
  badge: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  sampleTools: { name: string; path: string }[];
}

const CATEGORIES: CategoryCardItem[] = [
  {
    key: 'images',
    path: '/tools/images',
    title: 'Image Tools & Codecs',
    badge: 'Optimization & Batch',
    description: 'Compress, convert, resize, crop, and strip EXIF metadata from photos locally in browser memory.',
    icon: FileImage,
    sampleTools: [
      { name: 'Image Compressor', path: '/client-side-private-image-compressor' },
      { name: 'HEIC to JPG', path: '/convert-heic-to-jpg-locally' },
      { name: 'EXIF Stripper', path: '/strip-exif-metadata-online-private' },
      { name: 'AVIF Converter', path: '/convert-to-avif-online-free' },
    ],
  },
  {
    key: 'documents',
    path: '/tools/documents',
    title: 'PDF & Document Tools',
    badge: 'Local Documents',
    description: 'Merge PDF files, split page ranges, compress documents, and extract pages securely.',
    icon: FileText,
    sampleTools: [
      { name: 'Merge PDF', path: '/merge-pdf' },
      { name: 'Split PDF', path: '/split-pdf' },
      { name: 'PDF Compressor', path: '/secure-document-compressor-pdf' },
      { name: 'PDF to JPG', path: '/convert-pdf-pages-to-jpg-images' },
    ],
  },
  {
    key: 'developer',
    path: '/tools/developer',
    title: 'Developer Utilities',
    badge: 'Code, Formats & Tokens',
    description: 'Format & validate JSON, convert CSV datasets, decode JWT claims, and test Regex patterns.',
    icon: Code,
    sampleTools: [
      { name: 'JSON Formatter', path: '/json-formatter-validator' },
      { name: 'CSV ↔ JSON', path: '/csv-to-json-converter' },
      { name: 'JWT Decoder', path: '/jwt-decoder' },
      { name: 'Regex Tester', path: '/regex-tester' },
    ],
  },
  {
    key: 'text',
    path: '/tools/text',
    title: 'Text & Diff Tools',
    badge: 'Markdown & Comparison',
    description: 'Write Markdown with real-time preview and compare text snippets line-by-line with diff highlighting.',
    icon: FileText,
    sampleTools: [
      { name: 'Markdown Live Preview', path: '/markdown-live-preview' },
      { name: 'Text Diff & Comparator', path: '/text-diff' },
    ],
  },
  {
    key: 'utilities',
    path: '/tools/utilities',
    title: 'Utilities & Design',
    badge: 'Color & Analysis',
    description: 'Extract color palettes from images, inspect HEX codes, and generate Base64 data URIs.',
    icon: ShieldCheck,
    sampleTools: [
      { name: 'Color Palette Extractor', path: '/palette-color-extractor-image-hex' },
      { name: 'Image to Base64', path: '/client-side-image-to-base64' },
      { name: 'SVG to PNG', path: '/convert-svg-to-png-transparent' },
    ],
  },
];

export const CategoryDiscoverySection: React.FC<CategoryDiscoverySectionProps> = ({ onNavigate }) => {
  return (
    <section className="w-full max-w-6xl mx-auto my-6 px-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-4 gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">
            Tool Categories
          </h2>
          <p className="mt-0.5 text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">
            Browser-native utilities for media, documents, and developer workflows.
          </p>
        </div>

        <button
          onClick={() => onNavigate('/tools')}
          className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer group shrink-0"
        >
          <span>All {TOOL_REGISTRY.length} tools</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          return (
            <div
              key={cat.key}
              className="flex flex-col justify-between p-4.5 rounded-xl border border-zinc-200/80 dark:border-zinc-700/80 bg-white dark:bg-[#282a2e] hover:border-zinc-400 dark:hover:border-zinc-500 transition-all text-left"
            >
              <div>
                <button
                  type="button"
                  onClick={() => onNavigate(cat.path)}
                  className="flex items-center gap-2.5 mb-2.5 text-left w-full cursor-pointer group"
                >
                  <div className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    <Icon className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {cat.title}
                  </h3>
                </button>

                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  {cat.description}
                </p>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  {cat.sampleTools.map((tool) => (
                    <button
                      key={tool.path}
                      type="button"
                      onClick={() => onNavigate(tool.path)}
                      className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800/80 hover:bg-zinc-200 dark:hover:bg-zinc-700 hover:text-indigo-600 dark:hover:text-indigo-400 px-2 py-0.5 rounded transition-colors cursor-pointer"
                    >
                      {tool.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
