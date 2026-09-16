import React, { useState, useEffect, useCallback, Suspense, lazy } from 'react';
import { ImageFileItem, ConversionSettings, TargetFormat } from './types';
import { Dropzone } from './components/Dropzone';
import { HeaderNavbar } from './components/HeaderNavbar';
import { HeroHeader } from './components/Converter/HeroHeader';
import { CompleteView } from './components/Converter/CompleteView';
import { ValuePropsSection } from './components/Converter/ValuePropsSection';
import { PopularToolsSection } from './components/Converter/PopularToolsSection';
import { HomeTaskDiscovery } from './components/HomeTaskDiscovery';
import { CategoryDiscoverySection } from './components/CategoryDiscoverySection';
import { SeoGuideContent } from './components/Converter/SeoGuideContent';
import { QueueSection } from './components/Converter/QueueSection';
import { ModalsOrchestrator } from './components/Modals/ModalsOrchestrator';
import { LowTierWarningModal } from './components/Modals/LowTierWarningModal';
import { RegionSelector } from './components/RegionSelector';
import { FileEditModal } from './components/Modals/FileEditModal';

import { useAppRouting } from './hooks/useAppRouting';
import { useShareActions } from './hooks/useShareActions';
import { useDarkMode } from './hooks/useDarkMode';
import { useBatchConversion } from './hooks/useBatchConversion';
import { Loader2, AlertTriangle, X } from 'lucide-react';

import { FooterLinkHub } from './components/FooterLinkHub';
import { FeedbackWidget } from './components/FeedbackWidget';
import { CategoryWorkspaceSwitcher } from './components/CategoryWorkspaceSwitcher';
import { CommandPalette } from './components/CommandPalette';
import { getCategoryInfo, getArticleBySlug } from './content/articles';

const PrivacyPolicy = lazy(() => import('./components/PrivacyPolicy').then(module => ({ default: module.PrivacyPolicy })));
const TermsOfService = lazy(() => import('./components/TermsOfService').then(module => ({ default: module.TermsOfService })));
const AboutPage = lazy(() => import('./components/AboutPage').then(module => ({ default: module.AboutPage })));
const ToolsDirectoryPage = lazy(() => import('./components/ToolsDirectoryPage').then(module => ({ default: module.ToolsDirectoryPage })));
const ArticlesHubPage = lazy(() => import('./components/Articles/ArticlesHubPage').then(module => ({ default: module.ArticlesHubPage })));
const ArticleCategoryPage = lazy(() => import('./components/Articles/ArticleCategoryPage').then(module => ({ default: module.ArticleCategoryPage })));
const ArticleViewPage = lazy(() => import('./components/Articles/ArticleViewPage').then(module => ({ default: module.ArticleViewPage })));
const PdfToJpgConverter = lazy(() => import('./components/PdfToJpgConverter').then(module => ({ default: module.PdfToJpgConverter })));
const SvgToPngPage = lazy(() => import('./components/SvgToPngPage').then(module => ({ default: module.SvgToPngPage })));
const PdfCompressorPage = lazy(() => import('./components/PdfCompressorPage').then(module => ({ default: module.PdfCompressorPage })));
const PdfMergerPage = lazy(() => import('./components/PdfMergerPage').then(module => ({ default: module.PdfMergerPage })));
const PdfSplitterPage = lazy(() => import('./components/PdfSplitterPage').then(module => ({ default: module.PdfSplitterPage })));
const ImageToPdfPage = lazy(() => import('./components/ImageToPdfPage').then(module => ({ default: module.ImageToPdfPage })));
const ImageToBase64Converter = lazy(() => import('./components/ImageToBase64Converter').then(module => ({ default: module.ImageToBase64Converter })));
const Base64ToImageDecoder = lazy(() => import('./components/Base64ToImageDecoder').then(module => ({ default: module.Base64ToImageDecoder })));
const WordCharacterCounter = lazy(() => import('./components/WordCharacterCounter').then(module => ({ default: module.WordCharacterCounter })));
const PasswordGenerator = lazy(() => import('./components/PasswordGenerator').then(module => ({ default: module.PasswordGenerator })));
const ColorPaletteExtractor = lazy(() => import('./components/ColorPaletteExtractor').then(module => ({ default: module.ColorPaletteExtractor })));
const JsonFormatterPage = lazy(() => import('./components/JsonFormatterPage').then(module => ({ default: module.JsonFormatterPage })));
const CsvToJsonPage = lazy(() => import('./components/CsvToJsonPage'));
const JwtDecoderPage = lazy(() => import('./components/JwtDecoderPage'));
const RegexTesterPage = lazy(() => import('./components/RegexTesterPage'));
const MarkdownLivePreviewPage = lazy(() => import('./components/MarkdownLivePreviewPage').then(module => ({ default: module.MarkdownLivePreviewPage })));
const TextDiffPage = lazy(() => import('./components/TextDiffPage').then(module => ({ default: module.TextDiffPage })));
const EmbedWidget = lazy(() => import('./components/Widget/EmbedWidget'));
const WidgetDocumentationPage = lazy(() => import('./components/Widget/WidgetDocumentationPage'));
const BenchmarkPage = lazy(() => import('./components/Articles/BenchmarkPage'));

const PageLoadingFallback = () => (
  <div className="flex flex-col items-center justify-center py-20 min-h-[400px] gap-3 text-zinc-500 dark:text-[#9aa0a6] animate-in fade-in duration-300">
    <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
    <span className="text-sm font-medium">Loading content...</span>
  </div>
);

const WidgetLoadingFallback = () => (
  <div className="min-h-screen bg-transparent p-2.5 sm:p-3 flex items-center justify-center font-sans" style={{ background: 'transparent' }}>
    <div className="w-full max-w-sm h-[380px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm flex flex-col items-center justify-center gap-2">
      <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
      <span className="text-xs font-medium text-zinc-400">Loading Zapixal Widget...</span>
    </div>
  </div>
);

import { SeoRouteData } from "./lib/seoEngine";

interface AppProps {
  initialPath?: string;
  initialSeoData?: SeoRouteData;
}

export default function App({ initialPath, initialSeoData }: AppProps) {
  const [settings, setSettingsState] = useState<ConversionSettings>({
    targetFormat: 'auto',
    targetFormatMode: 'per-original',
    quality: 0.8,
    resize: { enabled: false, keepAspectRatio: true },
    filenamePrefix: '',
    filenameSuffix: '',
  });

  const [touchedKeys, setTouchedKeys] = useState<Set<string>>(new Set());

  const handleUserSetSettings = useCallback((action: React.SetStateAction<ConversionSettings>) => {
    setSettingsState(prev => {
      const next = typeof action === 'function' ? action(prev) : action;

      const newlyTouched = new Set<string>();
      if (next.targetFormat !== prev.targetFormat) newlyTouched.add('targetFormat');
      if (next.targetMaxKB !== prev.targetMaxKB) newlyTouched.add('targetMaxKB');
      if (next.stripExif !== prev.stripExif) newlyTouched.add('stripExif');
      if (JSON.stringify(next.resize) !== JSON.stringify(prev.resize)) newlyTouched.add('resize');
      if (JSON.stringify(next.cropAspectRatio) !== JSON.stringify(prev.cropAspectRatio)) newlyTouched.add('cropAspectRatio');
      if (next.quality !== prev.quality) newlyTouched.add('quality');
      if (next.targetDPI !== prev.targetDPI) newlyTouched.add('targetDPI');

      if (newlyTouched.size > 0) {
        setTouchedKeys(old => {
          const updated = new Set(old);
          let changed = false;
          newlyTouched.forEach(k => {
            if (!updated.has(k)) {
              updated.add(k);
              changed = true;
            }
          });
          return changed ? updated : old;
        });
      }

      return next;
    });
  }, []);

  const resetTouchedKeys = useCallback(() => {
    setTouchedKeys(new Set());
  }, []);

  const [isDonateModalOpen, setIsDonateModalOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Global keyboard shortcut for Command Palette (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);


  const [editingFileId, setEditingFileId] = useState<string | null>(null);
  const [comparingFileId, setComparingFileId] = useState<string | null>(null);
  const [inspectingFileId, setInspectingFileId] = useState<string | null>(null);
  const [redactingFileId, setRedactingFileId] = useState<string | null>(null);
  const [showCompleteView, setShowCompleteView] = useState<boolean>(false);

  // Extracted Custom Hooks
  const { currentPath, handleNavigate, seoData } = useAppRouting({
    initialPath,
    initialSeoData,
    setSettings: setSettingsState,
    touchedKeys
  });
  const { isDarkMode, setIsDarkMode } = useDarkMode();

  const {
    files,
    isProcessing,
    isStopping,
    etaText,
    hasConvertedInSession,
    selectedFileIds,
    pendingCount,
    successCount,
    totalCount,
    processedCount,
    progressPercent,
    handleFilesAdded,
    handleRotateItem,
    handleUpdateFileFormat,
    handleUpdateBlurRegions,
    handleReformatItems,
    handleRetryFile,
    handleRemoveFile,
    handleClearAll: rawHandleClearAll,
    handleToggleSelect,
    handleDownloadSingle,
    handleDownloadAll,
    handleDownloadDirect,
    handleDownloadToDirectory,
    directoryHandle,
    onSelectDirectory,
    onDisconnectDirectory,
    hasDirectoryPicker,
    stopProcessing,
    processFiles,
    showLowTierWarning,
    setShowLowTierWarning,
    concurrencyProfile,
    stalledResetMessage,
    setStalledResetMessage,
    showLargeBatchBanner,
    dismissLargeBatchBanner,
    showAutoChunkedBanner,
    dismissAutoChunkedBanner,
    totalPendingBytes,
  } = useBatchConversion({ settings, setSettings: handleUserSetSettings });

  const handleClearAll = useCallback(() => {
    rawHandleClearAll();
    resetTouchedKeys();
  }, [rawHandleClearAll, resetTouchedKeys]);

  // Auto transition to CompleteView when conversion of a batch finishes
  useEffect(() => {
    if (!isProcessing && hasConvertedInSession && totalCount > 0 && processedCount === totalCount && successCount > 0) {
      setShowCompleteView(true);
    }
  }, [isProcessing, hasConvertedInSession, totalCount, processedCount, successCount]);

  const { isCopiedShareLink, handleShareApp } = useShareActions({ files });

  // Derive current modal target items live from files array
  const editItem = files.find((f) => f.id === editingFileId) || null;
  const compareItem = files.find((f) => f.id === comparingFileId) || null;
  const inspectItem = files.find((f) => f.id === inspectingFileId) || null;
  const redactItem = files.find((f) => f.id === redactingFileId) || null;

  const handleOpenEdit = useCallback((item: ImageFileItem) => setEditingFileId(item.id), []);
  const handleCloseEdit = useCallback(() => setEditingFileId(null), []);

  const handleOpenCompare = useCallback((item: ImageFileItem) => setComparingFileId(item.id), []);
  const handleCloseCompare = useCallback(() => setComparingFileId(null), []);

  const handleOpenInspect = useCallback((item: ImageFileItem) => setInspectingFileId(item.id), []);
  const handleCloseInspect = useCallback(() => setInspectingFileId(null), []);

  const handleOpenRedact = useCallback((item: ImageFileItem) => setRedactingFileId(item.id), []);
  const handleCloseRedact = useCallback(() => setRedactingFileId(null), []);

  const handleReformatItem = useCallback((id: string, format: TargetFormat) => {
    handleReformatItems([id], format);
  }, [handleReformatItems]);

  const isArticleOrStaticRoute = 
    currentPath === '/privacy' ||
    currentPath === '/terms' ||
    currentPath === '/about' ||
    currentPath === '/tools' ||
    currentPath.startsWith('/tools/') ||
    currentPath === '/widget' ||
    currentPath === '/articles/benchmarks' ||
    currentPath === '/articles' ||
    currentPath.startsWith('/articles/') ||
    seoData.isNotFound;

  if (currentPath === '/embed' || currentPath.replace(/\.html$/, '') === '/embed') {
    return (
      <Suspense fallback={<WidgetLoadingFallback />}>
        <EmbedWidget />
      </Suspense>
    );
  }

  return (
    <div className="min-h-screen w-full max-w-full bg-zinc-50 dark:bg-black text-zinc-900 dark:text-zinc-200 font-sans transition-colors duration-200">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-[100] focus:rounded-full focus:bg-indigo-600 focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-white"
      >
        Skip to main content
      </a>

      {/* Top Navbar */}
      <HeaderNavbar
        currentPath={currentPath}
        onNavigate={handleNavigate}
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
        onOpenDonate={() => setIsDonateModalOpen(true)}
        onOpenSearch={() => setIsSearchOpen(true)}
        onShareApp={handleShareApp}
        isCopiedShareLink={isCopiedShareLink}
      />

      <main id="main-content" className="max-w-6xl px-3 sm:px-6 py-4 sm:py-6 mx-auto lg:py-8">
        {/* Hero Header Section */}
        {!isArticleOrStaticRoute && (
          <HeroHeader seoData={seoData} onNavigate={handleNavigate} />
        )}

        {/* Category Workspace Switcher (Unified Sister Tools Navigation) */}
        {!isArticleOrStaticRoute && (
          <CategoryWorkspaceSwitcher
            currentPath={currentPath}
            onNavigate={handleNavigate}
          />
        )}

        {/* Stalled Watchdog Alert Banner */}
        {stalledResetMessage && (
          <div className="mb-6 p-4 bg-amber-50 dark:bg-[#3d2b1f] border border-amber-200 dark:border-zinc-800 rounded-2xl flex items-center justify-between gap-3 text-amber-800 dark:text-[#fdd663] animate-in slide-in-from-top-4 duration-300" id="stalled-reset-banner">
            <div className="flex items-center gap-2.5 text-sm font-semibold text-left">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-[#fdd663] shrink-0 animate-pulse" />
              <span>{stalledResetMessage}</span>
            </div>
            <button 
              onClick={() => setStalledResetMessage(null)} 
              className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer" 
              aria-label="Dismiss message"
              id="btn-dismiss-stalled-banner"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Main Content Router */}
        <Suspense fallback={<PageLoadingFallback />}>
          {seoData.path !== currentPath ? (
          <PageLoadingFallback />
        ) : seoData.isNotFound ? (
          <div className="flex flex-col items-center justify-center gap-6 py-20 min-h-[400px]">
            <h2 className="text-4xl font-black text-zinc-900 dark:text-white">Page Not Found</h2>
            <p className="text-zinc-600 dark:text-[#9aa0a6] text-center max-w-md">
              We couldn't find the page you're looking for. It might have been moved or doesn't exist.
            </p>
            <div className="flex gap-4">
              <button onClick={() => handleNavigate('/')} className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors">
                Go to Home
              </button>
            </div>
          </div>
        ) : currentPath === '/privacy' ? (
          <PrivacyPolicy />
        ) : currentPath === '/terms' ? (
          <TermsOfService />
        ) : currentPath === '/about' ? (
          <AboutPage />
        ) : currentPath === '/tools' || currentPath.startsWith('/tools/') ? (
          <ToolsDirectoryPage 
            onNavigate={handleNavigate} 
            initialCategory={currentPath.startsWith('/tools/') ? (currentPath.replace('/tools/', '') as any) : 'all'}
          />
        ) : currentPath === '/widget' ? (
          <WidgetDocumentationPage onNavigate={handleNavigate} />
        ) : currentPath === '/articles/benchmarks' ? (
          <BenchmarkPage onNavigate={handleNavigate} />
        ) : currentPath === '/articles' ? (
          <ArticlesHubPage onNavigate={handleNavigate} />
        ) : getCategoryInfo(currentPath.replace(/^\/articles\//, '')) ? (
          <ArticleCategoryPage 
            category={getCategoryInfo(currentPath.replace(/^\/articles\//, ''))!} 
            onNavigate={handleNavigate} 
          />
        ) : getArticleBySlug(currentPath.replace(/^\/articles\//, '')) ? (
          <ArticleViewPage 
            article={getArticleBySlug(currentPath.replace(/^\/articles\//, ''))!} 
            onNavigate={handleNavigate} 
          />
        ) : currentPath === '/merge-pdf' ? (
          <PdfMergerPage seoData={seoData} onNavigate={handleNavigate} />
        ) : currentPath === '/split-pdf' ? (
          <PdfSplitterPage seoData={seoData} onNavigate={handleNavigate} />
        ) : currentPath === '/convert-image-to-pdf' ? (
          <ImageToPdfPage seoData={seoData} onNavigate={handleNavigate} />
        ) : currentPath === '/convert-svg-to-png-transparent' ? (
          <SvgToPngPage seoData={seoData} onNavigate={handleNavigate} />
        ) : currentPath === '/secure-document-compressor-pdf' ? (
          <PdfCompressorPage seoData={seoData} onNavigate={handleNavigate} />
        ) : currentPath === '/convert-pdf-pages-to-jpg-images' ? (
          <React.Fragment>
            <PdfToJpgConverter onNavigate={handleNavigate} />
            <SeoGuideContent seoData={seoData} onNavigate={handleNavigate} />
            <ValuePropsSection />
          </React.Fragment>
        ) : currentPath === '/client-side-image-to-base64' ? (
          <React.Fragment>
            <ImageToBase64Converter onNavigate={handleNavigate} />
            <SeoGuideContent seoData={seoData} onNavigate={handleNavigate} />
            <ValuePropsSection />
          </React.Fragment>
        ) : currentPath === '/base64-to-image-converter' ? (
          <React.Fragment>
            <Base64ToImageDecoder onNavigate={handleNavigate} />
            <SeoGuideContent seoData={seoData} onNavigate={handleNavigate} />
            <ValuePropsSection />
          </React.Fragment>
        ) : currentPath === '/palette-color-extractor-image-hex' ? (
          <React.Fragment>
            <ColorPaletteExtractor onNavigate={handleNavigate} />
            <SeoGuideContent seoData={seoData} onNavigate={handleNavigate} />
            <ValuePropsSection />
          </React.Fragment>
        ) : currentPath === '/json-formatter-validator' ? (
          <JsonFormatterPage seoData={seoData} onNavigate={handleNavigate} />
        ) : currentPath === '/csv-to-json-converter' ? (
          <CsvToJsonPage seoData={seoData} onNavigate={handleNavigate} />
        ) : currentPath === '/jwt-decoder' ? (
          <JwtDecoderPage seoData={seoData} onNavigate={handleNavigate} />
        ) : currentPath === '/regex-tester' ? (
          <RegexTesterPage seoData={seoData} onNavigate={handleNavigate} />
        ) : currentPath === '/markdown-live-preview' ? (
          <MarkdownLivePreviewPage seoData={seoData} onNavigate={handleNavigate} />
        ) : currentPath === '/text-diff' ? (
          <TextDiffPage seoData={seoData} onNavigate={handleNavigate} />
        ) : currentPath === '/word-character-counter-online' ? (
          <React.Fragment>
            <WordCharacterCounter />
            <SeoGuideContent seoData={seoData} onNavigate={handleNavigate} />
            <ValuePropsSection />
          </React.Fragment>
        ) : currentPath === '/secure-password-generator-online' ? (
          <React.Fragment>
            <PasswordGenerator />
            <SeoGuideContent seoData={seoData} onNavigate={handleNavigate} />
            <ValuePropsSection />
          </React.Fragment>
        ) : (
          <React.Fragment>
            {files.length === 0 ? (
              /* STATE 1: IDLE / WORKSPACE READY */
              <div className="flex flex-col gap-5 mb-12 animate-in fade-in zoom-in-95 duration-300 min-h-[400px]">
                {seoData.pageCategory === 'home' ? (
                  <React.Fragment>
                    <HomeTaskDiscovery onNavigate={handleNavigate} />
                    <Dropzone onFilesAdded={handleFilesAdded} fromFormat={seoData.fromFormat} variant="compact" />
                    <ValuePropsSection />
                  </React.Fragment>
                ) : (
                  <React.Fragment>
                    <Dropzone onFilesAdded={handleFilesAdded} fromFormat={seoData.fromFormat} />
                    <SeoGuideContent seoData={seoData} onNavigate={handleNavigate} />
                    <PopularToolsSection onNavigate={handleNavigate} />
                    <ValuePropsSection />
                  </React.Fragment>
                )}
              </div>
            ) : showCompleteView && files.length > 0 ? (
              /* COMPLETE / DOWNLOAD VIEW */
              <CompleteView
                files={files}
                settings={settings}
                isCopiedShareLink={isCopiedShareLink}
                onDownloadAll={handleDownloadAll}
                onDownloadDirect={handleDownloadDirect}
                onDownloadToDirectory={handleDownloadToDirectory}
                hasDirectoryPicker={hasDirectoryPicker}
                onShareApp={handleShareApp}
                onClearAll={() => {
                  handleClearAll();
                  setShowCompleteView(false);
                }}
                onBackToWorkspace={() => setShowCompleteView(false)}
                onDownloadSingle={handleDownloadSingle}
                onRetryFile={handleRetryFile}
              />
            ) : (
              /* PERSISTENT WORKSPACE */
              <QueueSection
                files={files}
                selectedFileIds={selectedFileIds}
                settings={settings}
                setSettings={handleUserSetSettings}
                seoData={seoData}
                isProcessing={isProcessing}
                isStopping={isStopping}
                etaText={etaText}
                pendingCount={pendingCount}
                processedCount={processedCount}
                totalCount={totalCount}
                progressPercent={progressPercent}
                successCount={successCount}
                onFilesAdded={handleFilesAdded}
                onDownloadAll={handleDownloadAll}
                onDownloadDirect={handleDownloadDirect}
                onDownloadToDirectory={handleDownloadToDirectory}
                hasDirectoryPicker={hasDirectoryPicker}
                directoryHandle={directoryHandle}
                onSelectDirectory={onSelectDirectory}
                onDisconnectDirectory={onDisconnectDirectory}
                onConvert={processFiles}
                onStop={stopProcessing}
                onClearAll={() => {
                  handleClearAll();
                  setShowCompleteView(false);
                }}
                onToggleSelect={handleToggleSelect}
                onRemoveFile={handleRemoveFile}
                onRetryFile={handleRetryFile}
                onDownloadSingle={handleDownloadSingle}
                onRotateItem={handleRotateItem}
                onUpdateFileFormat={handleUpdateFileFormat}
                onReformatItems={handleReformatItems}
                onReformatItem={handleReformatItem}
                onCompare={handleOpenCompare}
                onInspectDetails={handleOpenInspect}
                onSelectRegions={handleOpenRedact}
                onEditItem={handleOpenEdit}
                concurrencyProfile={concurrencyProfile}
                showLargeBatchBanner={showLargeBatchBanner}
                onDismissLargeBatchBanner={dismissLargeBatchBanner}
                showAutoChunkedBanner={showAutoChunkedBanner}
                onDismissAutoChunkedBanner={dismissAutoChunkedBanner}
                totalPendingBytes={totalPendingBytes}
                onContinueToDownload={() => setShowCompleteView(true)}
              />
            )}
          </React.Fragment>
        )}
        </Suspense>
      </main>

      {/* Dynamic pSEO Interlinking Footer Link Hub */}
      <FooterLinkHub 
        currentPath={currentPath} 
        onNavigate={handleNavigate} 
      />

      {/* Low-tier warning modal */}
      <LowTierWarningModal
        isOpen={showLowTierWarning}
        onClose={() => setShowLowTierWarning(false)}
        onSelectDirectoryAndConvert={async () => {
          setShowLowTierWarning(false);
          const handle = await onSelectDirectory();
          if (handle) {
            setTimeout(() => {
              processFiles({ forceAll: true });
            }, 50);
          }
        }}
        onConvertNormally={() => {
          setShowLowTierWarning(false);
          processFiles({ chunked: true });
        }}
        hasDirectoryPicker={hasDirectoryPicker}
      />

      {/* Redaction Region Selector Modal */}
      {redactItem && (
        <RegionSelector
          item={redactItem}
          onClose={handleCloseRedact}
          onSave={handleUpdateBlurRegions}
        />
      )}

      {/* Per-File Focused Edit Modal */}
      {editItem && (
        <FileEditModal
          item={editItem}
          onClose={handleCloseEdit}
          onRotate={handleRotateItem}
          onUpdateFormat={handleUpdateFileFormat}
          onReformatItem={handleReformatItem}
          onSelectRegions={handleOpenRedact}
          onInspectDetails={handleOpenInspect}
          onCompare={handleOpenCompare}
        />
      )}

      {/* Orchestrated Modals & Floating Banners */}
      <ModalsOrchestrator
        compareItem={compareItem}
        inspectItem={inspectItem}
        isDonateModalOpen={isDonateModalOpen}
        onCloseCompare={handleCloseCompare}
        onCloseInspect={handleCloseInspect}
        onCloseDonate={() => setIsDonateModalOpen(false)}
      />

      {/* Universal Command Palette (Cmd+K / Ctrl+K) */}
      <CommandPalette
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onNavigate={handleNavigate}
      />

      {/* Persistent Minimal Feedback System */}
      <FeedbackWidget
        currentPath={currentPath}
        currentToolName={seoData?.h1Title}
        fileCount={files.length}
        hasErrors={files.some(f => f.status === 'error')}
        stalledMessage={stalledResetMessage}
        settings={settings}
      />
    </div>
  );
}
