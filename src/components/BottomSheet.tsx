import { useEffect, useRef, useState, type ReactNode } from 'react';

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  labelledById?: string;
}

const SWIPE_DISMISS_PX = 80;

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function getFocusable(root: HTMLElement | null): HTMLElement[] {
  if (!root) return [];
  return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (el) => !el.hasAttribute('aria-hidden') && el.offsetParent !== null,
  );
}

export default function BottomSheet({ open, onClose, title, children, labelledById }: Props) {
  const sheetRef = useRef<HTMLDivElement | null>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);
  const [dragY, setDragY] = useState(0);
  const dragStartRef = useRef<number | null>(null);
  const titleId = labelledById ?? 'bottom-sheet-title';

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key === 'Tab') {
        const focusables = getFocusable(sheetRef.current);
        if (focusables.length === 0) {
          e.preventDefault();
          sheetRef.current?.focus();
          return;
        }
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (!first || !last) return;
        const active = document.activeElement as HTMLElement | null;
        if (e.shiftKey) {
          if (active === first || !sheetRef.current?.contains(active)) {
            e.preventDefault();
            last.focus();
          }
        } else if (active === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    previouslyFocusedRef.current = document.activeElement as HTMLElement | null;
    // Focus the first interactive element so the user can act immediately;
    // fall back to the dialog wrapper so ESC and Tab still work.
    const focusables = getFocusable(sheetRef.current);
    (focusables[0] ?? sheetRef.current)?.focus();
    return () => {
      previouslyFocusedRef.current?.focus?.();
    };
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
