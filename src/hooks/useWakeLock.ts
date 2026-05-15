import { useCallback, useEffect, useRef } from 'react';

function getWakeLock(): WakeLock | null {
  if (typeof navigator === 'undefined') return null;
  return ('wakeLock' in navigator ? navigator.wakeLock : null) ?? null;
}

export function useWakeLock(active: boolean): { isSupported: boolean } {
  const sentinelRef = useRef<WakeLockSentinel | null>(null);
  const desiredRef = useRef(false);
  desiredRef.current = active;

  const acquire = useCallback(async () => {
    const api = getWakeLock();
    if (!api) return;
    if (sentinelRef.current && !sentinelRef.current.released) return;
    try {
      const sentinel = await api.request('screen');
      sentinelRef.current = sentinel;
      sentinel.addEventListener('release', () => {
        sentinelRef.current = null;
      });
    } catch (err) {
      console.warn('useWakeLock: request failed', err);
    }
  }, []);

  const release = useCallback(async () => {
    const sentinel = sentinelRef.current;
    if (!sentinel || sentinel.released) return;
    try {
      await sentinel.release();
    } catch (err) {
      console.warn('useWakeLock: release failed', err);
    } finally {
      sentinelRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (active) {
      void acquire();
    } else {
      void release();
    }
  }, [active, acquire, release]);

  // Re-acquire when the tab becomes visible again (Page Visibility API releases the lock automatically).
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const onVisible = () => {
      if (document.visibilityState === 'visible' && desiredRef.current) {
        void acquire();
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [acquire]);

  useEffect(
    () => () => {
      void release();
    },
    [release],
  );

  return { isSupported: getWakeLock() !== null };
}
