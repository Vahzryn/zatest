import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { ImageFileItem, TargetFormat } from '../types';
import { FileItem } from './FileItem';

interface VirtualFileListProps {
  files: ImageFileItem[];
  selectedFileIds?: Set<string>;
  onToggleSelect?: (id: string, multi: boolean) => void;
  onRemove: (id: string) => void;
  onRetry?: (id: string) => void;
  onDownload: (item: ImageFileItem) => void;
  onRotate?: (id: string, deltaDegrees: number) => void;
  onCompare?: (item: ImageFileItem) => void;
  onInspectDetails?: (item: ImageFileItem) => void;
  onUpdateFormat?: (id: string, format: TargetFormat | undefined) => void;
  onReformatItem?: (id: string, format: TargetFormat) => void;
  onSelectRegions?: (item: ImageFileItem) => void;
  onEditItem?: (item: ImageFileItem) => void;
}

const DEFAULT_ROW_HEIGHT = 280;
const GAP = 16;
const OVERSCAN = 5;

const RowWrapper = React.memo(({ 
  rowIndex, 
  children, 
  onMeasure 
}: { 
  rowIndex: number, 
  children: React.ReactNode, 
  onMeasure: (rowIndex: number, height: number) => void 
}) => {
  const ref = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      let height = 0;
      if (entries[0].borderBoxSize?.[0]) {
        height = entries[0].borderBoxSize[0].blockSize;
      } else {
        height = el.getBoundingClientRect().height;
      }
      onMeasure(rowIndex, height);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [rowIndex, onMeasure]);

  return (
    <div ref={ref} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {children}
    </div>
  );
});
RowWrapper.displayName = 'RowWrapper';

const VirtualFileListImpl: React.FC<VirtualFileListProps> = ({
  files,
  selectedFileIds = new Set(),
  onToggleSelect,
  onRemove,
  onRetry,
  onDownload,
  onRotate,
  onCompare,
  onInspectDetails,
  onUpdateFormat,
  onReformatItem,
  onSelectRegions,
  onEditItem,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [columnCount, setColumnCount] = useState(1);
  const [containerHeight, setContainerHeight] = useState(600);

  useEffect(() => {
    const updateSize = () => {
      if (typeof window !== 'undefined') {
        const ideal = Math.max(400, Math.min(800, window.innerHeight - 280));
        setContainerHeight(ideal);
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize, { passive: true });
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const rowHeights = useRef<Record<number, number>>({});
  const [heightsUpdated, setHeightsUpdated] = useState(0);

  const handleMeasure = useCallback((rowIndex: number, height: number) => {
    const roundedHeight = Math.round(height);
    const currentHeight = rowHeights.current[rowIndex];
    
    if (currentHeight === undefined || Math.abs(currentHeight - roundedHeight) > 1) {
      rowHeights.current[rowIndex] = roundedHeight;
      window.requestAnimationFrame(() => {
        setHeightsUpdated((v) => v + 1);
      });
    }
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (containerRef.current) {
        setScrollTop(containerRef.current.scrollTop);
      }
    };
    const el = containerRef.current;
    if (el) {
      el.addEventListener('scroll', handleScroll, { passive: true });
      return () => el.removeEventListener('scroll', handleScroll);
    }
  }, []);

  useEffect(() => {
    const smQuery = window.matchMedia('(min-width: 640px)');
    const lgQuery = window.matchMedia('(min-width: 1024px)');

    const updateColumns = () => {
      if (lgQuery.matches) {
        setColumnCount(3);
      } else if (smQuery.matches) {
        setColumnCount(2);
      } else {
        setColumnCount(1);
      }
    };

    updateColumns();

    const onChange = () => {
      rowHeights.current = {}; // reset measurements on resize
      updateColumns();
    };

    if (smQuery.addEventListener) {
      smQuery.addEventListener('change', onChange);
      lgQuery.addEventListener('change', onChange);
      return () => {
        smQuery.removeEventListener('change', onChange);
        lgQuery.removeEventListener('change', onChange);
      };
    } else {
      smQuery.addListener(onChange);
      lgQuery.addListener(onChange);
      return () => {
        smQuery.removeListener(onChange);
        lgQuery.removeListener(onChange);
      };
    }
  }, []);

  if (files.length <= 20) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" role="list" aria-label="Batch image conversion list">
        {files.map((file, idx) => (
          <FileItem
            key={file.id}
            item={file}
            index={idx}
            isSelected={selectedFileIds.has(file.id)}
            onToggleSelect={onToggleSelect}
            onRemove={onRemove}
            onRetry={onRetry}
            onDownload={onDownload}
            onRotate={onRotate}
            onCompare={onCompare}
            onInspectDetails={onInspectDetails}
            onUpdateFormat={onUpdateFormat}
            onReformatItem={onReformatItem}
            onSelectRegions={onSelectRegions}
            onEditItem={onEditItem}
          />
        ))}
      </div>
    );
  }

  const rowCount = Math.ceil(files.length / columnCount);
  
  const { offsets, totalHeight } = useMemo(() => {
    const newOffsets = new Float64Array(rowCount);
    let currentOffset = 0;
    for (let i = 0; i < rowCount; i++) {
      newOffsets[i] = currentOffset;
      const h = rowHeights.current[i] || DEFAULT_ROW_HEIGHT;
      currentOffset += h;
      if (i < rowCount - 1) {
         currentOffset += GAP;
      }
    }
    return { offsets: newOffsets, totalHeight: currentOffset };
  }, [rowCount, heightsUpdated, columnCount]);

  let startRow = 0;
  for (let i = 0; i < rowCount; i++) {
    const h = rowHeights.current[i] || DEFAULT_ROW_HEIGHT;
    if (offsets[i] + h > scrollTop) {
      startRow = Math.max(0, i - OVERSCAN);
      break;
    }
  }

  let endRow = rowCount - 1;
  for (let i = startRow; i < rowCount; i++) {
    if (offsets[i] > scrollTop + containerHeight) {
      endRow = Math.min(rowCount - 1, i + OVERSCAN);
      break;
    }
  }

  const offsetY = offsets[startRow] || 0;

  const visibleRows = [];
  for (let i = startRow; i <= endRow; i++) {
    const startIndex = i * columnCount;
    const rowFiles = files.slice(startIndex, startIndex + columnCount);
    if (rowFiles.length > 0) {
      visibleRows.push({ rowIndex: i, files: rowFiles });
    }
  }

  return (
    <div
      ref={containerRef}
      style={{ height: `${containerHeight}px`, overflowY: 'auto' }}
      className="relative rounded-xl border border-zinc-200 dark:border-zinc-800 p-2"
      role="list"
      aria-label="Virtualized batch image conversion list"
    >
      <div style={{ height: `${totalHeight}px`, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)`, position: 'absolute', top: 0, left: 0, right: 0 }} className="flex flex-col gap-4">
          {visibleRows.map((row) => (
            <RowWrapper key={row.rowIndex} rowIndex={row.rowIndex} onMeasure={handleMeasure}>
              {row.files.map((file, idx) => (
                <FileItem
                  key={file.id}
                  item={file}
                  index={row.rowIndex * columnCount + idx}
                  isSelected={selectedFileIds.has(file.id)}
                  onToggleSelect={onToggleSelect}
                  onRemove={onRemove}
                  onRetry={onRetry}
                  onDownload={onDownload}
                  onRotate={onRotate}
                  onCompare={onCompare}
                  onInspectDetails={onInspectDetails}
                  onUpdateFormat={onUpdateFormat}
                  onReformatItem={onReformatItem}
                  onSelectRegions={onSelectRegions}
                  onEditItem={onEditItem}
                />
              ))}
            </RowWrapper>
          ))}
        </div>
      </div>
    </div>
  );
};

export const VirtualFileList = React.memo(VirtualFileListImpl);
