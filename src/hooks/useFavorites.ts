import { useCallback, useMemo } from 'react';
import { STORAGE_KEYS } from '../lib/constants';
import { type Favorites, FavoritesSchema } from '../lib/crossGameSchemas';
import { useLocalStorage } from '../lib/useLocalStorage';

const MAX_FAVORITES = 64;

export interface UseFavoritesResult {
  favorites: Favorites;
  favoriteSet: ReadonlySet<string>;
  isFavorite: (slug: string) => boolean;
  toggleFavorite: (slug: string) => void;
}

export function useFavorites(): UseFavoritesResult {
  const [favorites, setFavorites] = useLocalStorage<Favorites>(
    STORAGE_KEYS.FAVORITES,
    FavoritesSchema,
    [],
  );

  const favoriteSet = useMemo(() => new Set(favorites), [favorites]);

  const isFavorite = useCallback((slug: string) => favoriteSet.has(slug), [favoriteSet]);

  const toggleFavorite = useCallback(
    (slug: string) => {
      if (!slug) return;
      setFavorites((prev) => {
        if (prev.includes(slug)) return prev.filter((s) => s !== slug);
        if (prev.length >= MAX_FAVORITES) return prev;
        return [...prev, slug];
      });
    },
    [setFavorites],
  );

  return { favorites, favoriteSet, isFavorite, toggleFavorite };
}
