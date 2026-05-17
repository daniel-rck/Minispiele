import { useCallback, useEffect, useMemo } from 'react';
import type { ReactNode } from 'react';
import { STORAGE_KEYS } from '../../lib/constants';
import { useLocalStorage } from '../../lib/useLocalStorage';
import { DEFAULT_UI_SETTINGS, UISettingsSchema, type UISettings } from '../../lib/persistedSchemas';
import { setAudioSetting, setHapticsSetting } from '../../lib/audioSettings';
import { SettingsContext, type SettingsContextValue } from './SettingsContext';

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useLocalStorage<UISettings>(
    STORAGE_KEYS.UI_SETTINGS,
    UISettingsSchema,
    DEFAULT_UI_SETTINGS,
  );

  useEffect(() => {
    setAudioSetting(settings.soundEnabled);
    setHapticsSetting(settings.hapticsEnabled);
  }, [settings.soundEnabled, settings.hapticsEnabled]);

  const setSound = useCallback(
    (enabled: boolean) => setSettings((prev) => ({ ...prev, soundEnabled: enabled })),
    [setSettings],
  );
  const setHaptics = useCallback(
    (enabled: boolean) => setSettings((prev) => ({ ...prev, hapticsEnabled: enabled })),
    [setSettings],
  );

  const value = useMemo<SettingsContextValue>(
    () => ({ settings, setSound, setHaptics }),
    [settings, setSound, setHaptics],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}
