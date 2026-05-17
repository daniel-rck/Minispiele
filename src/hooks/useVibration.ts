import { useCallback } from 'react';
import { isHapticsEnabled } from '../lib/audioSettings';

export function useVibration(): {
  vibrate: (pattern: number | readonly number[]) => boolean;
  isSupported: boolean;
} {
  const isSupported = typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function';

  const vibrate = useCallback(
    (pattern: number | readonly number[]): boolean => {
      if (!isSupported) return false;
      if (!isHapticsEnabled()) return false;
      try {
        return navigator.vibrate(pattern as number | number[]);
      } catch {
        return false;
      }
    },
    [isSupported],
  );

  return { vibrate, isSupported };
}
