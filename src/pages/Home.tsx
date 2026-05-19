import { useDeferredValue, useMemo, useState } from 'react';
import { Link } from 'react-router';
import Badge from '../components/ui/Badge';
import Card from '../components/ui/Card';
import Chip from '../components/ui/Chip';
import { ClockIcon, SparkleIcon } from '../components/ui/icons';
import MascotIcon from '../components/ui/MascotIcon';
import SearchInput from '../components/ui/SearchInput';
import StarToggle from '../components/ui/StarToggle';
import { useFavorites } from '../hooks/useFavorites';
import { useRecentGames } from '../hooks/useRecentGames';
import { BRAND_TAGLINE } from '../lib/brand';
import { STORAGE_KEYS } from '../lib/constants';
import { type HomeCategoryFilter, HomeCategoryFilterSchema } from '../lib/crossGameSchemas';
import { CATEGORIES, findGameBySlug, GAMES, type GameCard } from '../lib/gamesCatalog';
import { formatRelativeShort, isToday } from '../lib/relativeTime';
import { useLocalStorage } from '../lib/useLocalStorage';

const NEW_GAME_ISSUE_URL =
  'https://github.com/daniel-rck/minispiele/issues/new?template=new-game.yml';

function greeting(now: Date = new Date()): string {
  const h = now.getHours();
  if (h < 5) return 'Späte Runde gefällig?';
  if (h < 11) return 'Guten Morgen!';
  if (h < 14) return 'Mahlzeit!';
  if (h < 18) return 'Schön, dass du da bist!';
  if (h < 22) return 'Guten Abend!';
  return 'Lust auf ein Spiel?';
}

function normalize(input: string): string {
  return input.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '');
}

function matchesQuery(game: GameCard, q: string): boolean {
  const needle = normalize(q.trim());
  if (!needle) return true;
  return normalize(game.title).includes(needle) || normalize(game.description).includes(needle);
}

interface GameTileProps {
  game: GameCard;
  isFavorite: boolean;
  onToggleFavorite: (slug: string) => void;
  todayAt?: number;
  index?: number;
}

function GameTile({ game, isFavorite, onToggleFavorite, todayAt, index = 0 }: GameTileProps) {
  return (
    <li className="card-pop-in" style={{ animationDelay: `${Math.min(index * 30, 240)}ms` }}>
      <div className="relative">
        <Link to={game.to} aria-label={game.title} className="block rounded-2xl focus:outline-none">
          <Card interactive accent={game.category} className="h-full">
            <div className="relative">
              <img
                src={game.preview}
                alt={game.previewAlt}
                loading="lazy"
                className="w-full aspect-[16/9] object-cover"
              />
              {todayAt !== undefined && (
                <div className="absolute bottom-2 left-2">
                  <Badge variant="accent" size="sm">
                    Heute gespielt
                  </Badge>
                </div>
              )}
            </div>
            <div className="p-3 sm:p-4">
              <div className="font-display text-base font-extrabold sm:text-lg">{game.title}</div>
              <div className="mt-1 text-xs text-surface-700 dark:text-surface-300 sm:text-sm">
                {game.description}
              </div>
            </div>
          </Card>
        </Link>
        <StarToggle
          active={isFavorite}
          onToggle={() => onToggleFavorite(game.slug)}
          label={
            isFavorite
              ? `${game.title} aus Favoriten entfernen`
              : `${game.title} zu Favoriten hinzufügen`
          }
        />
      </div>
    </li>
  );
}

function RecentTile({ game, at }: { game: GameCard; at: number }) {
  return (
    <li className="snap-start">
      <Link
        to={game.to}
        aria-label={`${game.title} fortsetzen`}
        className="block focus:outline-none"
      >
        <Card interactive accent={game.category} className="w-44 sm:w-52">
          <img
            src={game.preview}
            alt=""
            loading="lazy"
            className="w-full aspect-[16/9] object-cover"
          />
          <div className="p-3">
            <div className="font-display text-sm font-extrabold">{game.title}</div>
            <div className="mt-1 inline-flex items-center gap-1 text-xs text-surface-600 dark:text-surface-400">
              <ClockIcon size={14} />
              {formatRelativeShort(at)}
            </div>
          </div>
        </Card>
      </Link>
    </li>
  );
}

export default function Home() {
  const [filter, setFilter] = useLocalStorage<HomeCategoryFilter>(
    STORAGE_KEYS.HOME_CATEGORY_FILTER,
    HomeCategoryFilterSchema,
    'all',
  );
  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search);
  const { favoriteSet, isFavorite, toggleFavorite } = useFavorites();
  const { recent, topSlugs } = useRecentGames();

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const g of GAMES) map.set(g.category, (map.get(g.category) ?? 0) + 1);
    return map;
  }, []);

  const filtered = useMemo(() => {
    const byCat = filter === 'all' ? GAMES : GAMES.filter((g) => g.category === filter);
    return byCat.filter((g) => matchesQuery(g, deferredSearch));
  }, [filter, deferredSearch]);

  const recentTiles = useMemo(() => {
    return topSlugs
      .map((slug) => {
        const game = findGameBySlug(slug);
        const entry = recent.find((e) => e.slug === slug);
        if (!game || !entry) return null;
        return { game, at: entry.at };
      })
      .filter((r): r is { game: GameCard; at: number } => r !== null);
  }, [topSlugs, recent]);

  const favoriteTiles = useMemo(() => GAMES.filter((g) => favoriteSet.has(g.slug)), [favoriteSet]);

  const recentMap = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of recent) m.set(r.slug, r.at);
    return m;
  }, [recent]);

  const hasRecents = recentTiles.length > 0;
  const hasFavorites = favoriteTiles.length > 0;
  const noResults = filtered.length === 0;
  const isSearching = deferredSearch.trim().length > 0;

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:py-8">
      {/* Hero */}
      <section className="mb-6 flex items-center gap-4 rounded-3xl bg-gradient-to-br from-primary-50 to-white p-4 sm:gap-5 sm:p-6 dark:from-primary-900/30 dark:to-surface-900">
        <MascotIcon size={84} className="shrink-0 drop-shadow-md sm:size-24" />
        <div className="min-w-0">
          <h1 className="font-display text-2xl font-black leading-tight text-surface-900 dark:text-surface-50 sm:text-3xl">
            {greeting()}
          </h1>
          <p className="mt-1 text-sm text-surface-700 dark:text-surface-300 sm:text-base">
            {BRAND_TAGLINE}
          </p>
        </div>
      </section>

      {/* Recent / Continue */}
      {hasRecents && (
        <section className="mb-6">
          <div className="mb-3 flex items-center gap-2">
            <ClockIcon size={20} className="text-primary-600 dark:text-primary-300" />
            <h2 className="font-display text-lg font-extrabold">Weiter spielen</h2>
          </div>
          <ul className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2">
            {recentTiles.map(({ game, at }) => (
              <RecentTile key={game.slug} game={game} at={at} />
            ))}
          </ul>
        </section>
      )}

      {/* Favorites */}
      {hasFavorites && (
        <section className="mb-6">
          <div className="mb-3 flex items-center gap-2">
            <SparkleIcon size={20} className="text-accent-500" />
            <h2 className="font-display text-lg font-extrabold">Deine Favoriten</h2>
            <Badge variant="neutral" size="sm">
              {favoriteTiles.length}
            </Badge>
          </div>
          <ul className="grid grid-cols-2 gap-3 sm:gap-4">
            {favoriteTiles.map((game, i) => (
              <GameTile
                key={`fav-${game.slug}`}
                game={game}
                isFavorite
                onToggleFavorite={toggleFavorite}
                todayAt={recentMap.get(game.slug)}
                index={i}
              />
            ))}
          </ul>
        </section>
      )}

      {/* Search */}
      <section className="mb-4">
        <SearchInput value={search} onValueChange={setSearch} />
      </section>

      {/* Category chips */}
      <div role="group" aria-label="Nach Kategorie filtern" className="mb-5 flex flex-wrap gap-2">
        <Chip active={filter === 'all'} onClick={() => setFilter('all')}>
          Alle{' '}
          <Badge variant={filter === 'all' ? 'accent' : 'neutral'} size="sm">
            {GAMES.length}
          </Badge>
        </Chip>
        {CATEGORIES.map((c) => {
          const count = counts.get(c.id) ?? 0;
          if (count === 0) return null;
          const active = filter === c.id;
          return (
            <Chip key={c.id} active={active} accent={c.id} onClick={() => setFilter(c.id)}>
              {c.label}{' '}
              <Badge variant={active ? 'accent' : 'neutral'} size="sm">
                {count}
              </Badge>
            </Chip>
          );
        })}
      </div>

      {/* Main grid */}
      {noResults ? (
        <div className="rounded-2xl border-2 border-dashed border-surface-300 p-8 text-center dark:border-surface-700">
          <p className="text-sm text-surface-600 dark:text-surface-300">
            {isSearching ? `Keine Treffer für „${search}".` : 'Keine Spiele in dieser Kategorie.'}
          </p>
          {isSearching && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="mt-3 inline-flex min-h-10 items-center rounded-full bg-primary-500 px-4 text-sm font-bold text-white hover:bg-primary-400"
            >
              Suche zurücksetzen
            </button>
          )}
        </div>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:gap-4">
          {filtered.map((game, i) => {
            const at = recentMap.get(game.slug);
            return (
              <GameTile
                key={game.slug}
                game={game}
                isFavorite={isFavorite(game.slug)}
                onToggleFavorite={toggleFavorite}
                todayAt={at !== undefined && isToday(at) ? at : undefined}
                index={i}
              />
            );
          })}
        </ul>
      )}

      {/* CTA — propose a new game */}
      <a
        href={NEW_GAME_ISSUE_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-6 flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-surface-300 p-4 text-sm font-bold text-surface-700 transition hover:border-primary-400 hover:text-primary-700 dark:border-surface-700 dark:text-surface-200 dark:hover:border-primary-400 dark:hover:text-primary-200"
      >
        <SparkleIcon size={18} />
        Neues Spiel vorschlagen
      </a>
    </div>
  );
}
