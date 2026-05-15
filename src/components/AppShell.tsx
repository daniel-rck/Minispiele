import { Link, Outlet, useLocation } from 'react-router';
import OfflineIndicator from './OfflineIndicator';

export default function AppShell() {
  const { pathname } = useLocation();
  const isHome = pathname === '/';

  return (
    <div className="flex min-h-full flex-col">
      <a href="#main" className="skip-link">
        Zum Inhalt springen
      </a>
      <header
        className="sticky top-0 z-20 border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-3">
          <Link
            to="/"
            className="flex items-center gap-2 text-lg font-semibold text-brand-700 dark:text-brand-300"
          >
            <span aria-hidden className="text-xl">
              ◉
            </span>
            Minispiele
          </Link>
          {!isHome && (
            <Link
              to="/"
              className="min-h-11 rounded-lg px-2 text-sm text-slate-600 hover:text-brand-600 dark:text-slate-300 dark:hover:text-brand-300"
            >
              ← Übersicht
            </Link>
          )}
        </div>
        <OfflineIndicator />
      </header>
      <main id="main" className="flex-1" tabIndex={-1}>
        <Outlet />
      </main>
    </div>
  );
}
