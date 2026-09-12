import React from 'react';
import { 
  FileText, 
  Code, 
  FileImage, 
  GitCompare, 
  Palette, 
  Braces, 
  FileSpreadsheet, 
  KeyRound, 
  Sparkles, 
  Eye, 
  Scissors, 
  Combine, 
  Minimize2, 
  FileDown, 
  Layers 
} from 'lucide-react';
import { cn } from '../lib/utils';
import { TOOL_REGISTRY } from '../lib/toolRegistry';

interface CategoryWorkspaceSwitcherProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

interface WorkspaceTool {
  name: string;
  shortName: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface WorkspaceGroup {
  id: string;
  label: string;
  badge: string;
  icon: React.ComponentType<{ className?: string }>;
  tools: WorkspaceTool[];
}

const WORKSPACE_GROUPS: Record<string, WorkspaceGroup> = {
  documents: {
    id: 'documents',
    label: 'Document & PDF Suite',
    badge: '6 Tools',
    icon: FileText,
    tools: [
      { name: 'Images to PDF', shortName: 'Images to PDF', path: '/convert-image-to-pdf', icon: FileImage },
      { name: 'Merge PDF', shortName: 'Merge PDF', path: '/merge-pdf', icon: Combine },
      { name: 'Split PDF', shortName: 'Split PDF', path: '/split-pdf', icon: Scissors },
      { name: 'Compress PDF', shortName: 'Compress PDF', path: '/secure-document-compressor-pdf', icon: Minimize2 },
      { name: 'PDF to JPG', shortName: 'PDF to JPG', path: '/convert-pdf-pages-to-jpg-images', icon: FileDown },
      { name: 'SVG to PNG', shortName: 'SVG to PNG', path: '/convert-svg-to-png-transparent', icon: Sparkles },
    ],
  },
  developer: {
    id: 'developer',
    label: 'Developer Suite',
    badge: '5 Tools',
    icon: Code,
    tools: [
      { name: 'JSON Formatter', shortName: 'JSON Formatter', path: '/json-formatter-validator', icon: Braces },
      { name: 'CSV ↔ JSON', shortName: 'CSV ↔ JSON', path: '/csv-to-json-converter', icon: FileSpreadsheet },
      { name: 'JWT Decoder', shortName: 'JWT Decoder', path: '/jwt-decoder', icon: KeyRound },
      { name: 'Regex Tester', shortName: 'Regex Tester', path: '/regex-tester', icon: Sparkles },
      { name: 'Image to Base64', shortName: 'Image to Base64', path: '/client-side-image-to-base64', icon: Code },
    ],
  },
  text: {
    id: 'text',
    label: 'Text Suite',
    badge: '2 Tools',
    icon: Layers,
    tools: [
      { name: 'Markdown Previewer', shortName: 'Markdown Live', path: '/markdown-live-preview', icon: Eye },
      { name: 'Text & Code Diff', shortName: 'Diff Viewer', path: '/text-diff', icon: GitCompare },
    ],
  },
  utilities: {
    id: 'utilities',
    label: 'Design & Visual Suite',
    badge: '2 Tools',
    icon: Palette,
    tools: [
      { name: 'Color Palette Extractor', shortName: 'Color Extractor', path: '/palette-color-extractor-image-hex', icon: Palette },
      { name: 'Image to Base64', shortName: 'Image to Base64', path: '/client-side-image-to-base64', icon: Code },
    ],
  },
};

export const CategoryWorkspaceSwitcher: React.FC<CategoryWorkspaceSwitcherProps> = ({
  currentPath,
  onNavigate,
}) => {
  // Identify the matching workspace category for the current path
  let activeGroup: WorkspaceGroup | null = null;

  for (const group of Object.values(WORKSPACE_GROUPS)) {
    if (group.tools.some((t) => t.path === currentPath)) {
      activeGroup = group;
      break;
    }
  }

  // If on a tools category index route (e.g. /tools/documents or /tools/developer)
  if (!activeGroup) {
    if (currentPath === '/tools/documents') activeGroup = WORKSPACE_GROUPS.documents;
    else if (currentPath === '/tools/developer') activeGroup = WORKSPACE_GROUPS.developer;
    else if (currentPath === '/tools/text') activeGroup = WORKSPACE_GROUPS.text;
    else if (currentPath === '/tools/utilities') activeGroup = WORKSPACE_GROUPS.utilities;
  }

  if (!activeGroup) {
    return null;
  }

  const GroupIcon = activeGroup.icon;

  return (
    <div className="w-full mb-6 animate-in fade-in duration-200" id="category-workspace-switcher">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 rounded-2xl p-2 sm:p-2.5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-2.5">
        {/* Left: Suite Badge & Label */}
        <div className="flex items-center gap-2 px-2 shrink-0">
          <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
            <GroupIcon className="w-4 h-4" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-zinc-900 dark:text-white">
              {activeGroup.label}
            </span>
            <span className="hidden sm:inline-flex px-1.5 py-0.5 text-[10px] font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-md">
              {activeGroup.badge}
            </span>
          </div>
        </div>

        {/* Right: Horizontal Tool Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5 px-1 scroll-smooth">
          {activeGroup.tools.map((tool) => {
            const isActive = currentPath === tool.path;
            const ToolIcon = tool.icon;

            return (
              <button
                key={tool.path}
                type="button"
                onClick={() => onNavigate(tool.path)}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-xl whitespace-nowrap transition-all cursor-pointer select-none active:scale-95 shrink-0",
                  isActive
                    ? "bg-indigo-600 text-white shadow-xs font-bold"
                    : "text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 hover:text-zinc-900 dark:hover:text-white"
                )}
                title={tool.name}
              >
                <ToolIcon className={cn("w-3.5 h-3.5", isActive ? "text-white" : "text-zinc-400")} />
                <span>{tool.shortName}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
