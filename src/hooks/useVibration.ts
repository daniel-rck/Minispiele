import { useCallback } from 'react';
import { useSettings } from '../lib/useSettings';

export function useVibration(): {
  vibrate: (pattern: number | readonly number[]) => boolean;
  isSupported: boolean;
} {
  const isSupported = typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function';
  const { settings } = useSettings();

  const vibrate = useCallback(
    (pattern: number | readonly number[]): boolean => {
      if (!isSupported) return false;
      if (!settings.vibration) return false;
      try {
        return navigator.vibrate(pattern as number | number[]);
      } catch {
        return false;
      }
    },
    [isSupported, settings.vibration],
  );

  return { vibrate, isSupported };
}
