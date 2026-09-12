import React, { useState, useRef, useCallback } from 'react';
import { 
  MessageSquareHeart, 
  ThumbsUp, 
  ThumbsDown, 
  X, 
  Upload, 
  Check, 
  AlertCircle, 
  Loader2, 
  ShieldCheck, 
  Image as ImageIcon 
} from 'lucide-react';
import { collectDiagnostics, SystemDiagnostics } from '../lib/diagnostics';
import { ConversionSettings } from '../types';

interface FeedbackWidgetProps {
  currentPath: string;
  currentToolName?: string;
  fileCount?: number;
  hasErrors?: boolean;
  stalledMessage?: string | null;
  settings?: ConversionSettings;
}

export function FeedbackWidget({
  currentPath,
  currentToolName,
  fileCount = 0,
  hasErrors = false,
  stalledMessage,
  settings,
}: FeedbackWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<'rate' | 'positive' | 'negative' | 'success'>('rate');
  const [isHelpful, setIsHelpful] = useState<boolean | null>(null);
  
  // Feedback form state
  const [category, setCategory] = useState<string>("Didn't work / Error");
  const [message, setMessage] = useState('');
  const [screenshotBase64, setScreenshotBase64] = useState<string | null>(null);
  const [screenshotName, setScreenshotName] = useState<string | null>(null);
  const [includeDiagnostics, setIncludeDiagnostics] = useState(true);
  
  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleOpen = useCallback(() => {
    setIsOpen(true);
    setStep('rate');
    setIsHelpful(null);
    setMessage('');
    setScreenshotBase64(null);
    setScreenshotName(null);
    setErrorMessage(null);
  }, []);

  React.useEffect(() => {
    const handleEvent = () => handleOpen();
    window.addEventListener('zapixal-open-feedback', handleEvent);
    return () => window.removeEventListener('zapixal-open-feedback', handleEvent);
  }, [handleOpen]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  const handleSelectRating = (helpful: boolean) => {
    setIsHelpful(helpful);
    if (helpful) {
      setStep('positive');
    } else {
      setStep('negative');
    }
  };

  const handleScreenshotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please select a valid image file (PNG, JPG, WebP).');
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      setErrorMessage('Screenshot size must be under 3MB.');
      return;
    }

    setErrorMessage(null);
    setScreenshotName(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      setScreenshotBase64(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveScreenshot = () => {
    setScreenshotBase64(null);
    setScreenshotName(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    let diagnosticsData: SystemDiagnostics | undefined = undefined;
    if (includeDiagnostics) {
      diagnosticsData = collectDiagnostics({
        currentRoute: currentPath,
        currentToolName,
        fileCount,
        hasErrors,
        stalledMessage,
        targetFormat: settings?.targetFormat || 'auto',
        targetMaxKB: settings?.targetMaxKB,
        quality: settings?.quality,
      });
    }

    const payload = {
      isHelpful: isHelpful ?? false,
      category: isHelpful ? 'Positive Feedback' : category,
      message: message.trim(),
      screenshotBase64,
      diagnostics: diagnosticsData,
    };

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to submit feedback.');
      }

      setStep('success');
    } catch (err: any) {
      setErrorMessage(err.message || 'Network error. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <React.Fragment>
      {/* Modal Popup Window */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-2 sm:p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200"
          id="feedback-overlay"
        >
          <div 
            className="relative bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl max-w-md w-full p-5 sm:p-6 overflow-hidden animate-in zoom-in-95 duration-200"
            id="feedback-card"
          >
            {/* Close Button */}
            <button
              onClick={handleClose}
              type="button"
              className="absolute top-3.5 right-3.5 p-1.5 rounded-xl text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              aria-label="Close feedback"
              id="btn-close-feedback"
            >
              <X className="w-4.5 h-4.5" />
            </button>

            {/* STEP 1: RATING CHOICE */}
            {step === 'rate' && (
              <div className="flex flex-col items-center text-center space-y-4 py-2">
                <div className="p-3 bg-indigo-50 dark:bg-[#1a2c42] text-indigo-600 dark:text-indigo-400 rounded-full">
                  <MessageSquareHeart className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-zinc-900 dark:text-white">
                    Was Zapixal helpful?
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                    Your feedback helps us make client-side image editing better.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 w-full pt-2">
                  <button
                    onClick={() => handleSelectRating(true)}
                    type="button"
                    className="flex items-center justify-center gap-2 py-3 px-4 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer group"
                    id="btn-feedback-yes"
                  >
                    <ThumbsUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform" />
                    <span>Yes, helpful!</span>
                  </button>

                  <button
                    onClick={() => handleSelectRating(false)}
                    type="button"
                    className="flex items-center justify-center gap-2 py-3 px-4 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer group"
                    id="btn-feedback-no"
                  >
                    <ThumbsDown className="w-4 h-4 text-rose-600 dark:text-rose-400 group-hover:scale-110 transition-transform" />
                    <span>No, faced an issue</span>
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: POSITIVE FEEDBACK */}
            {step === 'positive' && (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 rounded-full">
                    <ThumbsUp className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-zinc-900 dark:text-white leading-tight">
                      Thanks! Glad Zapixal helped.
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      Have any additional thoughts or suggestions?
                    </p>
                  </div>
                </div>

                <div>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Any comments or feature ideas? (optional)"
                    rows={3}
                    className="w-full p-3 text-xs bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none"
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setStep('rate')}
                    className="text-xs font-semibold text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 cursor-pointer"
                  >
                    Back
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    <span>Submit</span>
                  </button>
                </div>
              </form>
            )}

            {/* STEP 3: NEGATIVE / ISSUE FEEDBACK */}
            {step === 'negative' && (
              <form onSubmit={handleSubmit} className="space-y-3.5">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 rounded-full">
                    <AlertCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-zinc-900 dark:text-white leading-tight">
                      Help us fix this issue
                    </h3>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                      Tell us what went wrong so we can resolve it.
                    </p>
                  </div>
                </div>

                {errorMessage && (
                  <div className="p-2.5 text-xs bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-rose-700 dark:text-rose-300 rounded-xl">
                    {errorMessage}
                  </div>
                )}

                {/* Category Dropdown */}
                <div>
                  <label className="block text-[11px] font-bold text-zinc-700 dark:text-zinc-200 mb-1">
                    Problem Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full p-2.5 text-xs bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 cursor-pointer"
                  >
                    <option value="Didn't work / Error">Didn't work / Error</option>
                    <option value="Wrong output quality">Wrong output quality</option>
                    <option value="Too slow">Too slow</option>
                    <option value="File size / limit issue">File size / limit issue</option>
                    <option value="UI / navigation issue">UI / navigation issue</option>
                    <option value="Conversion issue">Conversion issue</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* Written Message */}
                <div>
                  <label className="block text-[11px] font-bold text-zinc-700 dark:text-zinc-200 mb-1">
                    Message <span className="font-normal text-zinc-400">(optional)</span>
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="What went wrong?"
                    rows={3}
                    className="w-full p-2.5 text-xs bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none"
                  />
                </div>

                {/* Optional Screenshot */}
                <div>
                  <label className="block text-[11px] font-bold text-zinc-700 dark:text-zinc-200 mb-1">
                    Add screenshot <span className="font-normal text-zinc-400">(optional)</span>
                  </label>
                  
                  {screenshotBase64 ? (
                    <div className="flex items-center justify-between p-2 text-xs bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl">
                      <div className="flex items-center gap-2 truncate">
                        <ImageIcon className="w-4 h-4 text-indigo-500 shrink-0" />
                        <span className="truncate text-zinc-700 dark:text-zinc-300 font-medium">
                          {screenshotName || 'Screenshot attached'}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveScreenshot}
                        className="p-1 text-zinc-400 hover:text-rose-500 cursor-pointer"
                        title="Remove screenshot"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="relative">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        onChange={handleScreenshotChange}
                        className="hidden"
                        id="feedback-screenshot-input"
                      />
                      <label
                        htmlFor="feedback-screenshot-input"
                        className="flex items-center justify-center gap-2 p-2.5 text-xs border border-dashed border-zinc-300 dark:border-zinc-800 hover:border-indigo-500 rounded-xl bg-zinc-50/50 dark:bg-zinc-950 text-zinc-600 dark:text-zinc-400 hover:text-indigo-600 transition-colors cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload Screenshot (PNG, JPG max 3MB)</span>
                      </label>
                    </div>
                  )}
                </div>

                {/* Diagnostics Checkbox */}
                <div className="pt-1">
                  <label className="flex items-start gap-2 cursor-pointer text-xs select-none">
                    <input
                      type="checkbox"
                      checked={includeDiagnostics}
                      onChange={(e) => setIncludeDiagnostics(e.target.checked)}
                      className="mt-0.5 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                    <div>
                      <span className="font-bold text-zinc-800 dark:text-zinc-200">
                        Include diagnostics
                      </span>
                      <p className="text-[10px] text-zinc-500 dark:text-zinc-400 leading-tight mt-0.5">
                        Shares basic technical specs (browser, screen size, format settings) to help debug issues. Zero personal data or files shared.
                      </p>
                    </div>
                  </label>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setStep('rate')}
                    className="text-xs font-semibold text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 cursor-pointer"
                  >
                    Back
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 cursor-pointer transition-colors shadow-xs"
                  >
                    {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    <span>Send Feedback</span>
                  </button>
                </div>
              </form>
            )}

            {/* SUCCESS STATE */}
            {step === 'success' && (
              <div className="flex flex-col items-center text-center space-y-3 py-4">
                <div className="p-3 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-full">
                  <ShieldCheck className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-black text-zinc-900 dark:text-white">
                  Thank You!
                </h3>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 max-w-xs">
                  Your feedback helps us continuously improve Zapixal's privacy-first browser converters.
                </p>
                <button
                  type="button"
                  onClick={handleClose}
                  className="mt-2 py-2.5 px-6 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Close Window
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </React.Fragment>
  );
}
