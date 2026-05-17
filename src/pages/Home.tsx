import { useDeferredValue, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { useFavorites } from '../hooks/useFavorites';
import { useRecentGames } from '../hooks/useRecentGames';
import { STORAGE_KEYS } from '../lib/constants';
import {
  CATEGORIES,
  GAMES,
  findGameBySlug,
  type Category,
  type GameCard,
} from '../lib/gamesCatalog';
import { HomeCategoryFilterSchema, type HomeCategoryFilter } from '../lib/crossGameSchemas';
import { useLocalStorage } from '../lib/useLocalStorage';

const NEW_GAME_ISSUE_URL =
  'https://github.com/daniel-rck/minispiele/issues/new?template=new-game.yml';

const chipBase =
  'inline-flex min-h-9 items-center rounded-full border px-3 py-1.5 text-xs sm:text-sm font-medium transition';
const chipActive =
  'border-brand-600 bg-brand-600 text-white shadow-sm dark:border-brand-500 dark:bg-brand-500';
const chipInactive =
  'border-slate-200 bg-white text-slate-700 hover:border-brand-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-brand-500';

function normalize(input: string): string {
  return input.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '');
}

function matchesQuery(game: GameCard, q: string): boolean {
  if (!q) return true;
  const needle = normalize(q);
  return normalize(game.title).includes(needle) || normalize(game.description).includes(needle);
}

export default function Home() {
  const [filter, setFilter] = useLocalStorage<HomeCategoryFilter>(
    STORAGE_KEYS.HOME_CATEGORY_FILTER,
    HomeCategoryFilterSchema,
    'all',
  );
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);
  const { favoriteSet, isFavorite, toggleFavorite } = useFavorites();
  const { topSlugs } = useRecentGames();

  const counts = useMemo(() => {
    const map = new Map<Category, number>();
    for (const g of GAMES) map.set(g.category, (map.get(g.category) ?? 0) + 1);
    return map;
  }, []);

  const filtered = useMemo(() => {
    const byCat = filter === 'all' ? GAMES : GAMES.filter((g) => g.category === filter);
    return byCat.filter((g) => matchesQuery(g, deferredQuery));
  }, [filter, deferredQuery]);

  const favoriteGames = useMemo(() => GAMES.filter((g) => favoriteSet.has(g.slug)), [favoriteSet]);
  const recentGames = useMemo(
    () =>
      topSlugs.map((slug) => findGameBySlug(slug)).filter((g): g is GameCard => g !== undefined),
    [topSlugs],
  );

  const showQuickSections = query.trim() === '' && filter === 'all';

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-2">Minispiele</h1>
      <p className="text-slate-600 dark:text-slate-300 mb-4">
        Kleine Browser-Spiele. Lokal, ohne Account, ohne Tracking.
      </p>

      <label className="mb-4 block">
        <span className="sr-only">Spiele durchsuchen</span>
        <div className="relative">
          <span aria-hidden className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            🔎
          </span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Spiele durchsuchen…"
            className="w-full min-h-11 rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          />
        </div>
      </label>

      <div role="group" aria-label="Nach Kategorie filtern" className="mb-6 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setFilter('all')}
          aria-pressed={filter === 'all'}
          className={`${chipBase} ${filter === 'all' ? chipActive : chipInactive}`}
        >
          Alle <span className="ml-1 opacity-70">({GAMES.length})</span>
        </button>
        {CATEGORIES.map((c) => {
          const count = counts.get(c.id) ?? 0;
          if (count === 0) return null;
          const active = filter === c.id;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => setFilter(c.id)}
              aria-pressed={active}
              className={`${chipBase} ${active ? chipActive : chipInactive}`}
            >
              {c.label} <span className="ml-1 opacity-70">({count})</span>
            </button>
          );
        })}
      </div>

      {showQuickSections && favoriteGames.length > 0 ? (
        <section aria-labelledby="favorites-heading" className="mb-6">
          <h2
            id="favorites-heading"
            className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-200"
          >
            ★ Favoriten
          </h2>
          <ul className="grid grid-cols-2 gap-3 sm:gap-4">
            {favoriteGames.map((g) => (
              <li key={g.to}>
                <GameTile game={g} isFav onToggleFav={() => toggleFavorite(g.slug)} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {showQuickSections && recentGames.length > 0 ? (
        <section aria-labelledby="recent-heading" className="mb-6">
          <h2
            id="recent-heading"
            className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-200"
          >
            Zuletzt gespielt
          </h2>
          <ul className="flex gap-3 overflow-x-auto pb-2">
            {recentGames.map((g) => (
              <li key={g.to} className="w-40 shrink-0 sm:w-48">
                <GameTile
                  game={g}
                  isFav={isFavorite(g.slug)}
                  onToggleFav={() => toggleFavorite(g.slug)}
                />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {filtered.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500 dark:border-slate-700">
          {query.trim() !== ''
            ? `Keine Treffer für „${query}“.`
            : 'Keine Spiele in dieser Kategorie.'}
        </p>
      ) : (
        <>
          {showQuickSections && (favoriteGames.length > 0 || recentGames.length > 0) ? (
            <h2 className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
              Alle Spiele
            </h2>
          ) : null}
          <ul className="grid grid-cols-2 gap-3 sm:gap-4">
            {filtered.map((g) => (
              <li key={g.to}>
                <GameTile
                  game={g}
                  isFav={isFavorite(g.slug)}
                  onToggleFav={() => toggleFavorite(g.slug)}
                />
              </li>
            ))}
          </ul>
        </>
      )}

      <div className="mt-8 flex flex-col items-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-white/50 p-6 text-center dark:border-slate-700 dark:bg-slate-900/50">
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Du vermisst ein Spiel? Schlag es vor — wir bauen es vielleicht.
        </p>
        <a
          href={NEW_GAME_ISSUE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-12 items-center justify-center rounded-xl bg-brand-600 px-6 py-3 text-sm font-medium text-white shadow-sm hover:bg-brand-700"
        >
          <span aria-hidden className="mr-2">
            🎮
          </span>
          Neues Spiel vorschlagen
        </a>
        <span className="text-xs text-slate-500">Öffnet ein GitHub-Issue mit kurzem Formular.</span>
      </div>
    </div>
  );
}

interface GameTileProps {
  game: GameCard;
  isFav: boolean;
  onToggleFav: () => void;
}

function GameTile({ game, isFav, onToggleFav }: GameTileProps) {
  return (
    <div className="relative">
      <Link
        to={game.to}
        className="block rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden hover:border-brand-500 hover:shadow-md transition"
      >
        <img
          src={game.preview}
          alt={game.previewAlt}
          loading="lazy"
          className="w-full aspect-[16/9] object-cover bg-slate-100 dark:bg-slate-800"
        />
        <div className="p-3 sm:p-5">
          <div className="font-semibold text-base sm:text-lg">{game.title}</div>
          <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1">
            {game.description}
          </div>
        </div>
      </Link>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onToggleFav();
        }}
        aria-pressed={isFav}
        aria-label={isFav ? `${game.title} aus Favoriten entfernen` : `${game.title} zu Favoriten`}
        className={`absolute right-2 top-2 inline-flex min-h-11 min-w-11 items-center justify-center rounded-full bg-white/85 text-xl shadow-sm backdrop-blur transition hover:scale-110 dark:bg-slate-900/85 ${
          isFav
            ? 'text-amber-500 dark:text-amber-400'
            : 'text-slate-400 hover:text-amber-500 dark:text-slate-500 dark:hover:text-amber-400'
        }`}
      >
        <span aria-hidden>{isFav ? '★' : '☆'}</span>
      </button>
    </div>
  );
}
