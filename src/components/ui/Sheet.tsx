import { type ReactNode, useEffect, useRef, useState } from 'react';

interface SheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  labelledById?: string;
  side?: 'bottom' | 'right';
  size?: 'auto' | 'sm' | 'md' | 'lg';
}

const SWIPE_DISMISS_PX = 80;

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [role="switch"]:not([disabled]), [tabindex]:not([tabindex="-1"])';

function getFocusable(root: HTMLElement | null): HTMLElement[] {
  if (!root) return [];
  return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (el) => !el.hasAttribute('aria-hidden') && el.offsetParent !== null,
  );
}

export default function Sheet({
  open,
  onClose,
  title,
  children,
  labelledById,
  side = 'bottom',
  size = 'auto',
}: SheetProps) {
  const sheetRef = useRef<HTMLDivElement | null>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);
  const [dragY, setDragY] = useState(0);
  const dragStartRef = useRef<number | null>(null);
  const titleId = labelledById ?? 'sheet-title';

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
    const focusables = getFocusable(sheetRef.current);
    (focusables[0] ?? sheetRef.current)?.focus();
    return () => {
      previouslyFocusedRef.current?.focus?.();
    };
  }, [open]);

  if (!open) return null;

  const onTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (side !== 'bottom') return;
    dragStartRef.current = e.touches[0]?.clientY ?? null;
  };
  const onTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (side !== 'bottom') return;
    const start = dragStartRef.current;
    const current = e.touches[0]?.clientY;
    if (start === null || current === undefined) return;
    const delta = current - start;
    if (delta > 0) setDragY(delta);
  };
  const onTouchEnd = () => {
    if (side !== 'bottom') return;
    if (dragY > SWIPE_DISMISS_PX) onClose();
    setDragY(0);
    dragStartRef.current = null;
  };

  const sizeWidth = {
    auto: 'max-w-lg',
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
  }[size];

  const containerClass =
    side === 'bottom' ? 'items-end justify-center' : 'items-stretch justify-end';

  const panelBase =
    side === 'bottom'
      ? `w-full ${sizeWidth} rounded-t-3xl`
      : `h-full w-full ${sizeWidth} rounded-l-3xl`;

  return (
    <div className={`fixed inset-0 z-50 flex ${containerClass}`}>
      <button
        type="button"
        aria-label="Schließen"
        onClick={onClose}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
      />
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={`relative ${panelBase} bg-white shadow-2xl outline-none dark:bg-surface-900`}
        style={{
          transform: side === 'bottom' ? `translateY(${dragY}px)` : undefined,
          transition: dragY === 0 ? 'transform 220ms var(--ease-snappy)' : 'none',
          paddingBottom: side === 'bottom' ? 'env(safe-area-inset-bottom)' : undefined,
        }}
      >
        {side === 'bottom' && (
          <div
            className="flex flex-col items-center pt-2 pb-1"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            <span
              aria-hidden
              className="h-1.5 w-10 rounded-full bg-surface-300 dark:bg-surface-700"
            />
          </div>
        )}
        <div className="flex items-center justify-between px-5 pt-3 pb-3">
          <h2 id={titleId} className="text-lg font-extrabold">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Schließen"
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full text-surface-500 hover:bg-surface-100 dark:hover:bg-surface-800"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
            >
              <path d="M6 6l12 12M6 18L18 6" />
            </svg>
          </button>
        </div>
        <div className="px-5 pb-6">{children}</div>
      </div>
    </div>
  );
}
