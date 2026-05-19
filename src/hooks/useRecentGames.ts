import { useCallback, useMemo } from 'react';
import { STORAGE_KEYS } from '../lib/constants';
import { type RecentGameEntry, type RecentGames, RecentGamesSchema } from '../lib/crossGameSchemas';
import { useLocalStorage } from '../lib/useLocalStorage';

const MAX_RECENT = 6;
const RING_BUFFER = 20;

export interface UseRecentGamesResult {
  recent: RecentGames;
  topSlugs: string[];
  markPlayed: (slug: string, at?: number) => void;
  clear: () => void;
}

export function useRecentGames(): UseRecentGamesResult {
  const [recent, setRecent] = useLocalStorage<RecentGames>(
    STORAGE_KEYS.RECENT_GAMES,
    RecentGamesSchema,
    [],
  );

  const markPlayed = useCallback(
    (slug: string, at: number = Date.now()) => {
      if (!slug) return;
      setRecent((prev) => {
        const filtered = prev.filter((e) => e.slug !== slug);
        const next: RecentGameEntry = { slug, at };
        return [next, ...filtered].slice(0, RING_BUFFER);
      });
    },
    [setRecent],
  );

  const clear = useCallback(() => setRecent([]), [setRecent]);

  const topSlugs = useMemo(() => recent.slice(0, MAX_RECENT).map((e) => e.slug), [recent]);

  return { recent, topSlugs, markPlayed, clear };
}
