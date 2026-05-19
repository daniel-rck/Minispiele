import { type ReactNode, useEffect } from 'react';
import { useLocation } from 'react-router';
import { useFavorites } from '../hooks/useFavorites';
import { useRecentGames } from '../hooks/useRecentGames';
import { findGameByPath } from '../lib/gamesCatalog';

interface GameLayoutProps {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
}

export default function GameLayout({ title, description, actions, children }: GameLayoutProps) {
  const { pathname } = useLocation();
  const game = findGameByPath(pathname);
  const { markPlayed } = useRecentGames();
  const { isFavorite, toggleFavorite } = useFavorites();

  useEffect(() => {
    if (game) markPlayed(game.slug);
  }, [game, markPlayed]);

  const fav = game ? isFavorite(game.slug) : false;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="flex items-start justify-between gap-3 mb-1">
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
        <div className="text-slate-600 dark:text-slate-300 mb-4 text-sm">{description}</div>
      ) : null}
      {children}
    </div>
  );
}
