import React, { useState } from 'react';
import { 
  ArrowRight,
  Grid,
  ChevronDown
} from 'lucide-react';
import { TOOL_REGISTRY } from '../../lib/toolRegistry';

interface PopularToolsSectionProps {
  onNavigate: (path: string) => void;
}

interface ToolLinkItem {
  name: string;
  path: string;
  desc: string;
  badge: string;
  category: 'images' | 'documents' | 'developer' | 'text' | 'utilities';
}

/**
 * Featured tools displayed on the homepage across all core categories.
 */
export const FEATURED_HOMEPAGE_TOOLS: ToolLinkItem[] = [
  {
    name: 'Private Image Compressor',
    path: '/client-side-private-image-compressor',
    desc: 'Compress JPG, PNG, and WebP images locally with customizable quality controls.',
    badge: 'Image Compression',
    category: 'images'
  },
  {
    name: 'HEIC to JPG Converter',
    path: '/convert-heic-to-jpg-locally',
    desc: 'Convert iPhone HEIC photos to universal JPG format locally in your browser.',
    badge: 'HEIC -> JPG',
    category: 'images'
  },
  {
    name: 'PDF Merge',
    path: '/merge-pdf',
    desc: 'Combine multiple PDF documents into a single organized PDF file locally.',
    badge: 'PDF Document',
    category: 'documents'
  },
  {
    name: 'PDF Splitter',
    path: '/split-pdf',
    desc: 'Extract specific page ranges or split PDF documents into separate files.',
    badge: 'PDF Split',
    category: 'documents'
  },
  {
    name: 'JSON Formatter & Validator',
    path: '/json-formatter-validator',
    desc: 'Format, prettify, repair, and validate JSON data structure and syntax.',
    badge: 'JSON Formatter',
    category: 'developer'
  },
  {
    name: 'CSV ↔ JSON Converter',
    path: '/csv-to-json-converter',
    desc: 'Convert CSV data to JSON objects and array datasets bidirectionally.',
    badge: 'CSV / JSON',
    category: 'developer'
  },
  {
    name: 'JWT Decoder',
    path: '/jwt-decoder',
    desc: 'Decode JSON Web Token headers, payload claims, and signature info locally.',
    badge: 'JWT Token',
    category: 'developer'
  },
  {
    name: 'Regex Tester',
    path: '/regex-tester',
    desc: 'Test JavaScript regular expressions with real-time syntax highlighting & match explanation.',
    badge: 'Regex Tester',
    category: 'developer'
  },
  {
    name: 'Markdown Live Previewer',
    path: '/markdown-live-preview',
    desc: 'Write Markdown with real-time rendered preview, document outline, and HTML export.',
    badge: 'Markdown Editor',
    category: 'text'
  },
  {
    name: 'Text Diff & Comparator',
    path: '/text-diff',
    desc: 'Compare two text snippets side-by-side or unified with line & character highlighting.',
    badge: 'Text Comparator',
    category: 'text'
  },
  {
    name: 'Color Palette Extractor',
    path: '/palette-color-extractor-image-hex',
    desc: 'Extract dominant HEX color palettes and RGB codes directly from uploaded photos.',
    badge: 'Color Palette',
    category: 'utilities'
  },
  {
    name: 'Image to Base64 Converter',
    path: '/client-side-image-to-base64',
    desc: 'Convert image files directly into Data URI Base64 strings for CSS and HTML embeds.',
    badge: 'Image -> Base64',
    category: 'utilities'
  }
];

export const PopularToolsSection: React.FC<PopularToolsSectionProps> = ({ onNavigate }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, path: string) => {
    e.preventDefault();
    onNavigate(path);
  };

  const displayedTools = isExpanded ? FEATURED_HOMEPAGE_TOOLS : FEATURED_HOMEPAGE_TOOLS.slice(0, 4);

  return (
    <section 
      aria-label="Popular Image Tools and Specialized Workflows"
      className="w-full max-w-5xl mx-auto my-6 sm:my-7 space-y-3.5 font-sans"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-2.5 pb-2.5 border-b border-zinc-200 dark:border-zinc-800">
        <div className="space-y-0.5">
          <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white tracking-tight">
            Popular Utilities
          </h2>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 max-w-2xl leading-relaxed">
            Fast, client-side utilities for format conversions, document editing, and developer workflows.
          </p>
        </div>

        <a
          href="/tools"
          onClick={(e) => handleClick(e, '/tools')}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-xs font-semibold hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-all shadow-2xs self-start md:self-auto group"
        >
          <span>All {TOOL_REGISTRY.length} tools</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </a>
      </div>

      {/* Featured Tools Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-2 sm:gap-2.5">
        {displayedTools.map((tool) => (
          <a
            key={tool.path}
            href={tool.path}
            onClick={(e) => handleClick(e, tool.path)}
            className="group flex flex-col justify-between p-2.5 sm:p-3 rounded-xl border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs hover:border-indigo-300 dark:hover:border-indigo-600/60 hover:shadow-xs hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-150 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {tool.name}
                </span>
                <span className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/60 dark:border-zinc-700/50 px-1.5 py-0.2 rounded shrink-0">
                  {tool.badge}
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed line-clamp-2">
                {tool.desc}
              </p>
            </div>
          </a>
        ))}
      </div>

      {/* Expand / Collapse Button */}
      <div className="flex justify-center pt-1">
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 text-xs font-bold hover:bg-zinc-50 dark:hover:bg-zinc-800/80 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-zinc-300 dark:hover:border-zinc-700 active:scale-[0.98] transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] shadow-2xs group cursor-pointer"
        >
          <span>{isExpanded ? 'Show Fewer Featured Tools' : `Show More Featured Tools (${FEATURED_HOMEPAGE_TOOLS.length} Total)`}</span>
          <ChevronDown className={`w-3.5 h-3.5 text-zinc-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
        </button>
      </div>
    </section>
  );
};
