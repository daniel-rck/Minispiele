import { useState } from 'react';
import { usePwaUpdate } from '../lib/usePwaUpdate';

export default function UpdateBanner() {
  const { needRefresh, applyUpdate } = usePwaUpdate();
  const [dismissed, setDismissed] = useState(false);

  if (!needRefresh || dismissed) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-center gap-3 bg-primary-500 px-4 py-2 text-sm font-medium text-white"
    >
      <span className="flex-1">Neue Version verfügbar.</span>
      <button
        type="button"
        onClick={() => {
          void applyUpdate();
        }}
        className="inline-flex min-h-9 items-center rounded-full bg-white/15 px-3 font-bold ring-1 ring-white/40 hover:bg-white/25"
      >
        Neu laden
      </button>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label="Hinweis schließen"
        className="inline-flex min-h-9 min-w-9 items-center justify-center rounded-full hover:bg-white/15"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          aria-hidden
        >
          <path d="M6 6l12 12M6 18L18 6" />
        </svg>
      </button>
    </div>
  );
}
