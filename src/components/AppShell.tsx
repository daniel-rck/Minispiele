import { Link, Outlet, useLocation } from 'react-router';

export default function AppShell() {
  const { pathname } = useLocation();
  const isHome = pathname === '/';

  return (
    <div className="min-h-full flex flex-col">
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <Link
            to="/"
            className="flex items-center gap-2 font-semibold text-lg text-brand-700 dark:text-brand-300"
          >
            <span aria-hidden className="text-xl">◉</span>
            Minispiele
          </Link>
          {!isHome && (
            <Link
              to="/"
              className="text-sm text-slate-600 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-300"
            >
              ← Übersicht
            </Link>
          )}
        </div>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
