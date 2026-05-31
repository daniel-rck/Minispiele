import { type ReactNode, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useFavorites } from '../hooks/useFavorites';
import { useRecentGames } from '../hooks/useRecentGames';
import { findGameByPath } from '../lib/gamesCatalog';

interface GameLayoutProps {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  /**
   * Wie der Spielbereich mit dem verfügbaren Platz umgeht:
   * - `'fit'` (Standard): Inhalt soll in die Höhe passen, kein Scroll (overflow versteckt).
   * - `'scroll'`: textlastige Spiele dürfen INNERHALB des Bereichs scrollen
   *   (die Seite selbst scrollt trotzdem nicht).
   */
  fit?: 'fit' | 'scroll';
}

export default function GameLayout({
  title,
  description,
  actions,
  children,
  fit = 'fit',
}: GameLayoutProps) {
  const { pathname } = useLocation();
  const game = findGameByPath(pathname);
  const { markPlayed } = useRecentGames();
  const { isFavorite, toggleFavorite } = useFavorites();

  useEffect(() => {
    if (game) markPlayed(game.slug);
  }, [game, markPlayed]);

  const fav = game ? isFavorite(game.slug) : false;

  return (
    <div className="mx-auto flex h-full w-full max-w-3xl flex-col px-4 py-3 sm:py-4">
      <div className="mb-1 flex shrink-0 items-start justify-between gap-3">
        <h1 className="text-2xl font-bold">{title}</h1>
        <div className="flex shrink-0 items-center gap-2">
          {actions}
          {game ? (
            <button
              type="button"
              onClick={() => toggleFavorite(game.slug)}
              aria-pressed={fav}
              aria-label={fav ? `${title} aus Favoriten entfernen` : `${title} zu Favoriten`}
              className={`inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg text-xl transition ${
                fav
                  ? 'text-amber-500 dark:text-amber-400'
                  : 'text-slate-400 hover:text-amber-500 dark:text-slate-500 dark:hover:text-amber-400'
              }`}
            >
              <span aria-hidden>{fav ? '★' : '☆'}</span>
            </button>
          ) : null}
        </div>
      </div>
      {description ? (
        <div className="mb-2 hidden shrink-0 text-sm text-slate-600 sm:mb-3 [@media(min-height:600px)]:block dark:text-slate-300">
          {description}
        </div>
      ) : null}
      <div
        data-game-fit={fit}
        className={`flex min-h-0 flex-1 flex-col ${fit === 'scroll' ? 'overflow-y-auto' : 'overflow-hidden'}`}
      >
        {children}
      </div>
    </div>
  );
}
