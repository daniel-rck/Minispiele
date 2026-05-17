import { useCallback } from 'react';
import { STORAGE_KEYS } from './constants';
import { useLocalStorage } from './useLocalStorage';
import { HomeFavoritesSchema, type HomeFavorites } from './persistedSchemas';

export function useFavorites() {
  const [favorites, setFavorites] = useLocalStorage<HomeFavorites>(
    STORAGE_KEYS.HOME_FAVORITES,
    HomeFavoritesSchema,
    [],
  );

  const isFavorite = useCallback((path: string) => favorites.includes(path), [favorites]);

  const toggle = useCallback(
    (path: string) => {
      setFavorites((prev) =>
        prev.includes(path) ? prev.filter((p) => p !== path) : [path, ...prev].slice(0, 40),
      );
    },
    [setFavorites],
  );

  return { favorites, isFavorite, toggle };
}
