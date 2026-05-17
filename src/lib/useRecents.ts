import { useCallback, useEffect } from 'react';
import { useLocation } from 'react-router';
import { STORAGE_KEYS } from './constants';
import { useLocalStorage } from './useLocalStorage';
import { HomeRecentsSchema, type HomeRecents } from './persistedSchemas';

const MAX_RECENTS = 10;

export function useRecents() {
  const [recents, setRecents] = useLocalStorage<HomeRecents>(
    STORAGE_KEYS.HOME_RECENTS,
    HomeRecentsSchema,
    [],
  );

  const recordVisit = useCallback(
    (path: string) => {
      const now = Date.now();
      setRecents((prev) => {
        const filtered = prev.filter((r) => r.path !== path);
        return [{ path, at: now }, ...filtered].slice(0, MAX_RECENTS);
      });
    },
    [setRecents],
  );

  return { recents, recordVisit };
}

/**
 * Mounted once under the Router. Tracks every navigation to a non-root path
 * and persists into the recents list. No UI.
 */
export function RouteTracker() {
  const { pathname } = useLocation();
  const { recordVisit } = useRecents();

  useEffect(() => {
    if (pathname === '/' || pathname === '') return;
    recordVisit(pathname);
  }, [pathname, recordVisit]);

  return null;
}
