import { useRegisterSW } from 'virtual:pwa-register/react';
import { useEffect, useState } from 'react';

export default function PWAUpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisterError(err: unknown) {
      console.warn('SW register failed', err);
    },
  });
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!needRefresh) setDismissed(false);
  }, [needRefresh]);

  if (!needRefresh || dismissed) return null;

  return (
    <div
      role="status"
      className="fixed inset-x-0 top-0 z-40 flex justify-center"
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      <div className="m-3 flex items-center gap-3 rounded-xl border border-brand-300 bg-brand-50 px-4 py-3 text-sm shadow-lg dark:border-brand-700 dark:bg-brand-950/80">
        <span className="text-brand-900 dark:text-brand-100">Neue Version verfügbar.</span>
        <button
          type="button"
          onClick={() => void updateServiceWorker(true)}
          className="min-h-11 rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700"
        >
          Aktualisieren
        </button>
        <button
          type="button"
          onClick={() => {
            setDismissed(true);
            setNeedRefresh(false);
          }}
          aria-label="Hinweis schließen"
          className="min-h-11 min-w-11 rounded-lg text-slate-500 hover:bg-white/50 dark:hover:bg-slate-800/50"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
