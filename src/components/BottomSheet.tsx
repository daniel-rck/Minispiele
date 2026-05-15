import { useEffect, useRef, useState, type ReactNode } from 'react';

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  labelledById?: string;
}

const SWIPE_DISMISS_PX = 80;

export default function BottomSheet({ open, onClose, title, children, labelledById }: Props) {
  const sheetRef = useRef<HTMLDivElement | null>(null);
  const [dragY, setDragY] = useState(0);
  const dragStartRef = useRef<number | null>(null);
  const titleId = labelledById ?? 'bottom-sheet-title';

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    sheetRef.current?.focus();
  }, [open]);

  if (!open) return null;

  const onTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    dragStartRef.current = e.touches[0]?.clientY ?? null;
  };

  const onTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    const start = dragStartRef.current;
    const current = e.touches[0]?.clientY;
    if (start === null || current === undefined) return;
    const delta = current - start;
    if (delta > 0) setDragY(delta);
  };

  const onTouchEnd = () => {
    if (dragY > SWIPE_DISMISS_PX) {
      onClose();
    }
    setDragY(0);
    dragStartRef.current = null;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <button
        type="button"
        aria-label="Sheet schließen"
        onClick={onClose}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
      />
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="relative w-full max-w-lg rounded-t-2xl bg-white shadow-2xl outline-none dark:bg-slate-900"
        style={{
          transform: `translateY(${dragY}px)`,
          transition: dragY === 0 ? 'transform 200ms ease' : 'none',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        <div
          className="flex flex-col items-center pt-2 pb-1"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <span aria-hidden className="h-1.5 w-10 rounded-full bg-slate-300 dark:bg-slate-700" />
        </div>
        <div className="flex items-center justify-between px-5 pt-2 pb-3">
          <h2 id={titleId} className="text-base font-semibold">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Schließen"
            className="min-h-11 min-w-11 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            ✕
          </button>
        </div>
        <div className="px-5 pb-5">{children}</div>
      </div>
    </div>
  );
}
