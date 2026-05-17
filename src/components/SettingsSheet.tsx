import Sheet from './ui/Sheet';
import Switch from './ui/Switch';
import { useTheme } from './ui/useTheme';
import { useSettings } from './ui/useSettings';
import { useVibration } from '../hooks/useVibration';
import { MonitorIcon, MoonIcon, SunIcon } from './ui/icons';
import type { ThemeMode } from '../lib/persistedSchemas';

interface SettingsSheetProps {
  open: boolean;
  onClose: () => void;
}

const THEME_OPTIONS: { value: ThemeMode; label: string; Icon: typeof SunIcon }[] = [
  { value: 'light', label: 'Hell', Icon: SunIcon },
  { value: 'dark', label: 'Dunkel', Icon: MoonIcon },
  { value: 'system', label: 'System', Icon: MonitorIcon },
];

export default function SettingsSheet({ open, onClose }: SettingsSheetProps) {
  const { mode, setMode } = useTheme();
  const { settings, setSound, setHaptics } = useSettings();
  const { isSupported: hapticsSupported } = useVibration();

  return (
    <Sheet open={open} onClose={onClose} title="Einstellungen">
      <fieldset className="mb-6">
        <legend className="mb-3 text-sm font-bold text-surface-600 dark:text-surface-300">
          Erscheinungsbild
        </legend>
        <div className="grid grid-cols-3 gap-2">
          {THEME_OPTIONS.map(({ value, label, Icon }) => {
            const selected = mode === value;
            return (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => setMode(value)}
                className={`flex min-h-20 flex-col items-center justify-center gap-1.5 rounded-2xl border-2 px-3 py-2 text-sm font-bold transition-colors ${
                  selected
                    ? 'border-primary-500 bg-primary-50 text-primary-700 dark:border-primary-400 dark:bg-primary-900/40 dark:text-primary-100'
                    : 'border-surface-200 bg-white text-surface-700 hover:border-primary-300 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-200'
                }`}
              >
                <Icon size={22} />
                {label}
              </button>
            );
          })}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-3 text-sm font-bold text-surface-600 dark:text-surface-300">
          Audio & Haptik
        </legend>
        <div className="space-y-4">
          <Switch
            label="Töne"
            description="Beeps in Simon, Timer-Alarm und Würfel-Klicks."
            checked={settings.soundEnabled}
            onChange={setSound}
          />
          <Switch
            label="Vibration"
            description={
              hapticsSupported
                ? 'Kleine Rückmeldung beim Tippen und bei Spielereignissen.'
                : 'Nicht von diesem Gerät unterstützt.'
            }
            checked={settings.hapticsEnabled}
            onChange={setHaptics}
            disabled={!hapticsSupported}
          />
        </div>
      </fieldset>

      <p className="mt-6 text-xs text-surface-500 dark:text-surface-400">
        Alle Einstellungen werden nur lokal in deinem Browser gespeichert.
      </p>
    </Sheet>
  );
}
