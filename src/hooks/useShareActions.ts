import { useState, useCallback } from 'react';
import { ImageFileItem } from '../types';

interface UseShareActionsOptions {
  files: ImageFileItem[];
}

export function useShareActions({ files }: UseShareActionsOptions) {
  const [isCopiedShareLink, setIsCopiedShareLink] = useState(false);
  const [copiedSuccessImage, setCopiedSuccessImage] = useState(false);

  const handleShareApp = useCallback(async () => {
    const shareUrl = "https://www.zapixal.com";
    const sharePayload = {
      title: "Zapixal - Fast & Private Image Converter",
      text: "Check out Zapixal! Free batch image converter that processes files locally.",
      url: shareUrl,
    };

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share(sharePayload);
        setIsCopiedShareLink(true);
        setTimeout(() => setIsCopiedShareLink(false), 2000);
      } catch (err: any) {
        if (err?.name !== 'AbortError' && err?.name !== 'NotAllowedError') {
          try {
            await navigator.clipboard.writeText(shareUrl);
            setIsCopiedShareLink(true);
            setTimeout(() => setIsCopiedShareLink(false), 2000);
          } catch (clipErr) {
            console.error('Clipboard fallback error:', clipErr);
          }
        }
      }
    } else {
      try {
        if (typeof navigator !== 'undefined' && navigator.clipboard) {
          await navigator.clipboard.writeText(shareUrl);
          setIsCopiedShareLink(true);
          setTimeout(() => setIsCopiedShareLink(false), 2000);
        }
      } catch (err) {
        console.error('Clipboard copy error:', err);
      }
    }
  }, []);

  const handleCopyConvertedToClipboard = useCallback(async () => {
    const successFiles = files.filter(f => f.status === 'success' && f.blob);
    if (successFiles.length === 0) return;
    const itemToCopy = successFiles[successFiles.length - 1]; // Latest converted item
    try {
      let pngBlob = itemToCopy.blob!;
      if (pngBlob.type !== 'image/png') {
        const img = new Image();
        const url = URL.createObjectURL(pngBlob);
        await new Promise((res) => { img.onload = res; img.src = url; });
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0);
        pngBlob = (await new Promise<Blob>((res) => canvas.toBlob((b) => res(b!), 'image/png')))!;
        URL.revokeObjectURL(url);
      }
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': pngBlob })
      ]);
      setCopiedSuccessImage(true);
      setTimeout(() => setCopiedSuccessImage(false), 2000);
    } catch (err) {
      console.error('Failed to copy image to clipboard:', err);
    }
  }, [files]);

  return {
    isCopiedShareLink,
    copiedSuccessImage,
    handleShareApp,
    handleCopyConvertedToClipboard,
  };
}
