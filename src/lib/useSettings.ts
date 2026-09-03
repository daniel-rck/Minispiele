import {
  createContext,
  createElement,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
} from "react";
import { STORAGE_KEYS } from "./constants";
import { DEFAULT_SETTINGS, type Settings, SettingsSchema, type Theme } from "./crossGameSchemas";
import { useLocalStorage } from "./useLocalStorage";

export interface SettingsContextValue {
  settings: Settings;
  setTheme: (theme: Theme) => void;
  setVibration: (enabled: boolean) => void;
  setSound: (enabled: boolean) => void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

/**
 * Express the theme as `data-theme` on <html>: absent means "follow the OS",
 * "dark"/"light" mean forced. A class cannot say "follow the OS" without
 * JavaScript, so with the old `.dark` toggle every forced choice flashed the
 * wrong colors until React mounted. Keep in sync with public/theme-init.js,
 * which applies the same rule before first paint.
 */
function applyTheme(theme: Theme): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (theme === "system") root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", theme);
}

function readStoredTheme(): Theme {
  if (typeof window === "undefined") return DEFAULT_SETTINGS.theme;
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
