import React from 'react';
import { 
  ShieldCheck, 
  Lock, 
  BookOpen,
  Zap as ZapIcon,
  FileImage,
  Sliders,
  Cpu
} from 'lucide-react';

const logoImg = '/assets/logo.webp';

interface FooterLinkHubProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}
export function FooterLinkHub({ currentPath, onNavigate }: FooterLinkHubProps) {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, path: string) => {
    e.preventDefault();
    onNavigate(path);
  };

  return (
    <footer 
      id="main-footer" 
      role="contentinfo" 
      aria-label="Zapixal Footer"
      className="w-full bg-zinc-50/90 dark:bg-[#121315] border-t border-zinc-200/70 dark:border-[#222428] mt-20 pt-10 pb-8 transition-colors duration-200 text-zinc-600 dark:text-zinc-400 font-sans"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Brand Header Section */}
        <div className="pb-6 border-b border-zinc-200/70 dark:border-[#222428] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <img 
                src={logoImg} 
                alt="Zapixal" 
                width="28"
                height="28"
                decoding="async"
                loading="lazy"
                referrerPolicy="no-referrer"
                className="w-7 h-7 rounded-lg object-contain bg-white dark:bg-[#1a1b1e] p-0.5 border border-zinc-200/80 dark:border-[#32353a]"
              />
              <span className="text-lg font-bold text-zinc-900 dark:text-white tracking-tight font-sans">
                Zapixal
              </span>
            </div>

            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-lg font-sans">
              Browser-based tools for image optimization, PDF documents, developer formatting, and media processing. Runs locally in browser memory via WebAssembly.
            </p>
          </div>
        </div>

        {/* Curated Contextual Link Columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 py-4 border-b border-zinc-200/70 dark:border-[#222428]">
          {/* Column 1: Categories & Directory */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-white">
              <ZapIcon className="w-3.5 h-3.5 text-indigo-500" />
              <span>Categories</span>
            </div>
            <ul className="space-y-0.5 text-xs font-medium">
              <li>
                <a href="/tools" onClick={(e) => handleClick(e, '/tools')} className="inline-block py-1 font-semibold text-indigo-600 dark:text-indigo-400 hover:underline transition-colors">
                  All Tools Directory
                </a>
              </li>
              <li>
                <a href="/tools/images" onClick={(e) => handleClick(e, '/tools/images')} className="inline-block py-1 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  Image Tools
                </a>
              </li>
              <li>
                <a href="/tools/documents" onClick={(e) => handleClick(e, '/tools/documents')} className="inline-block py-1 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  PDF & Documents
                </a>
              </li>
              <li>
                <a href="/tools/developer" onClick={(e) => handleClick(e, '/tools/developer')} className="inline-block py-1 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  Developer Tools
                </a>
              </li>
              <li>
                <a href="/tools/text" onClick={(e) => handleClick(e, '/tools/text')} className="inline-block py-1 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  Text Tools
                </a>
              </li>
              <li>
                <a href="/tools/utilities" onClick={(e) => handleClick(e, '/tools/utilities')} className="inline-block py-1 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  Utilities & Design
                </a>
              </li>
            </ul>
          </div>

          {/* Column 2: Featured Technical Guides */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-white">
              <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
              <span>Guides</span>
            </div>
            <ul className="space-y-0.5 text-xs font-medium">
              <li>
                <a href="/articles/benchmarks" onClick={(e) => handleClick(e, '/articles/benchmarks')} className="inline-block py-1 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors font-medium">
                  Compression Benchmark 2026
                </a>
              </li>
              <li>
                <a href="/articles/heic-vs-jpg" onClick={(e) => handleClick(e, '/articles/heic-vs-jpg')} className="inline-block py-1 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  HEIC vs JPG Guide
                </a>
              </li>
              <li>
                <a href="/articles/exif-metadata-privacy-guide" onClick={(e) => handleClick(e, '/articles/exif-metadata-privacy-guide')} className="inline-block py-1 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  EXIF Metadata Guide
                </a>
              </li>
              <li>
                <a href="/articles/compress-image-to-kb-limit-guide" onClick={(e) => handleClick(e, '/articles/compress-image-to-kb-limit-guide')} className="inline-block py-1 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  Target Size & KB Limits
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3: Featured Multi-Category Tools */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-white">
              <ZapIcon className="w-3.5 h-3.5 text-amber-500" />
              <span>Featured Tools</span>
            </div>
            <ul className="space-y-0.5 text-xs font-medium">
              <li>
                <a href="/convert-heic-to-jpg-locally" onClick={(e) => handleClick(e, '/convert-heic-to-jpg-locally')} className="inline-block py-1 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  HEIC to JPG
                </a>
              </li>
              <li>
                <a href="/merge-pdf" onClick={(e) => handleClick(e, '/merge-pdf')} className="inline-block py-1 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  Merge PDF
                </a>
              </li>
              <li>
                <a href="/json-formatter-validator" onClick={(e) => handleClick(e, '/json-formatter-validator')} className="inline-block py-1 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  JSON Formatter
                </a>
              </li>
              <li>
                <a href="/text-diff" onClick={(e) => handleClick(e, '/text-diff')} className="inline-block py-1 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  Text Diff
                </a>
              </li>
              <li>
                <a href="/markdown-live-preview" onClick={(e) => handleClick(e, '/markdown-live-preview')} className="inline-block py-1 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  Markdown Preview
                </a>
              </li>
              <li>
                <a href="/jwt-decoder" onClick={(e) => handleClick(e, '/jwt-decoder')} className="inline-block py-1 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  JWT Decoder
                </a>
              </li>
            </ul>
          </div>

          {/* Column 4: Platform & Legal */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-white">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Zapixal</span>
            </div>
            <ul className="space-y-0.5 text-xs font-medium">
              <li>
                <a href="/widget" onClick={(e) => handleClick(e, '/widget')} className="inline-block py-1 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  Embed Widget API
                </a>
              </li>
              <li>
                <a href="/about" onClick={(e) => handleClick(e, '/about')} className="inline-block py-1 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  About
                </a>
              </li>
              <li>
                <a href="/privacy" onClick={(e) => handleClick(e, '/privacy')} className="inline-block py-1 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="/terms" onClick={(e) => handleClick(e, '/terms')} className="inline-block py-1 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  Terms of Service
                </a>
              </li>
              <li>
                <button 
                  onClick={() => window.dispatchEvent(new CustomEvent('zapixal-open-feedback'))} 
                  className="inline-block py-1 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer text-left"
                >
                  Feedback
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar: Copyright */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500 dark:text-zinc-400 font-sans">
          <div className="flex items-center gap-3 text-center sm:text-left">
            <span>© 2026 Zapixal. Client-Side WebAssembly & Privacy-First.</span>
          </div>

        </div>
      </div>
    </footer>
  );
}
