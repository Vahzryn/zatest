import React, { Suspense, lazy } from 'react';
import { ImageFileItem } from '../../types';

const CompareModal = lazy(() => import('../CompareModal').then(m => ({ default: m.CompareModal })));
const ImageDetailsModal = lazy(() => import('../ImageDetailsModal').then(m => ({ default: m.ImageDetailsModal })));
const DonateModal = lazy(() => import('../DonateModal').then(m => ({ default: m.DonateModal })));

function ModalLoadingFallback() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs">
      <div className="rounded-2xl bg-white p-4 shadow-xl dark:bg-zinc-900">
        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200">Loading modal...</span>
      </div>
    </div>
  );
}

interface ModalsOrchestratorProps {
  compareItem: ImageFileItem | null;
  inspectItem: ImageFileItem | null;
  isDonateModalOpen: boolean;
  onCloseCompare: () => void;
  onCloseInspect: () => void;
  onCloseDonate: () => void;
}

export const ModalsOrchestrator = React.memo<ModalsOrchestratorProps>(function ModalsOrchestrator({
  compareItem,
  inspectItem,
  isDonateModalOpen,
  onCloseCompare,
  onCloseInspect,
  onCloseDonate,
}) {
  return (
    <>
      {compareItem && (
        <Suspense fallback={<ModalLoadingFallback />}>
          <CompareModal item={compareItem} onClose={onCloseCompare} />
        </Suspense>
      )}

      {inspectItem && (
        <Suspense fallback={<ModalLoadingFallback />}>
          <ImageDetailsModal item={inspectItem} onClose={onCloseInspect} />
        </Suspense>
      )}

      {isDonateModalOpen && (
        <Suspense fallback={<ModalLoadingFallback />}>
          <DonateModal isOpen={isDonateModalOpen} onClose={onCloseDonate} />
        </Suspense>
      )}
    </>
  );
});
