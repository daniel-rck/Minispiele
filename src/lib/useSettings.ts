import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  type ReactNode,
} from 'react';
import { STORAGE_KEYS } from './constants';
import { DEFAULT_SETTINGS, SettingsSchema, type Settings, type Theme } from './crossGameSchemas';
import { useLocalStorage } from './useLocalStorage';

export interface SettingsContextValue {
  settings: Settings;
  setTheme: (theme: Theme) => void;
  setVibration: (enabled: boolean) => void;
  setSound: (enabled: boolean) => void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

function prefersDarkScheme(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  try {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  } catch {
    return false;
  }
}

function applyTheme(theme: Theme): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  const dark = theme === 'dark' || (theme === 'system' && prefersDarkScheme());
  root.classList.toggle('dark', dark);
}

function readStoredTheme(): Theme {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS.theme;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (raw === null) return DEFAULT_SETTINGS.theme;
    const parsed: unknown = JSON.parse(raw);
    const result = SettingsSchema.safeParse(parsed);
    return result.success ? result.data.theme : DEFAULT_SETTINGS.theme;
  } catch {
    return DEFAULT_SETTINGS.theme;
  }
}

// Apply theme synchronously at module load to avoid a flash of incorrect theme
// before the SettingsProvider's effect runs after first paint.
applyTheme(readStoredTheme());

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useLocalStorage<Settings>(
    STORAGE_KEYS.SETTINGS,
    SettingsSchema,
    DEFAULT_SETTINGS,
  );

  useEffect(() => {
    applyTheme(settings.theme);
    if (settings.theme !== 'system') return;
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => applyTheme('system');
    mq.addEventListener?.('change', handler);
    return () => mq.removeEventListener?.('change', handler);
  }, [settings.theme]);

  const setTheme = useCallback(
    (theme: Theme) => setSettings((prev) => ({ ...prev, theme })),
    [setSettings],
  );
  const setVibration = useCallback(
    (vibration: boolean) => setSettings((prev) => ({ ...prev, vibration })),
    [setSettings],
  );
  const setSound = useCallback(
    (sound: boolean) => setSettings((prev) => ({ ...prev, sound })),
    [setSettings],
  );

  return createElement(
    SettingsContext.Provider,
    { value: { settings, setTheme, setVibration, setSound } },
    children,
  );
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) {
    return {
      settings: DEFAULT_SETTINGS,
      setTheme: () => undefined,
      setVibration: () => undefined,
      setSound: () => undefined,
    };
  }
  return ctx;
}
