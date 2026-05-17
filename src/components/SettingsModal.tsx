import { useSettings } from '../lib/useSettings';
import type { Theme } from '../lib/crossGameSchemas';
import BottomSheet from './BottomSheet';

interface Props {
  open: boolean;
  onClose: () => void;
}

const THEMES: { value: Theme; label: string; hint: string }[] = [
  { value: 'system', label: 'System', hint: 'Folgt der Systemeinstellung' },
  { value: 'light', label: 'Hell', hint: 'Immer hell' },
  { value: 'dark', label: 'Dunkel', hint: 'Immer dunkel' },
];

export default function SettingsModal({ open, onClose }: Props) {
  const { settings, setTheme, setVibration, setSound } = useSettings();

  return (
    <BottomSheet open={open} onClose={onClose} title="Einstellungen">
      <div className="flex flex-col gap-6">
        <fieldset>
          <legend className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
            Erscheinungsbild
          </legend>
          <div className="grid grid-cols-3 gap-2">
            {THEMES.map((t) => {
              const active = settings.theme === t.value;
              return (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setTheme(t.value)}
                  aria-pressed={active}
                  className={`min-h-11 rounded-xl border px-2 py-2 text-sm font-medium transition ${
                    active
                      ? 'border-brand-600 bg-brand-600 text-white dark:border-brand-500 dark:bg-brand-500'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-brand-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-brand-500'
                  }`}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            {THEMES.find((t) => t.value === settings.theme)?.hint}
          </p>
        </fieldset>

        <ToggleRow
          label="Vibration"
          hint="Haptisches Feedback auf unterstützten Geräten"
          checked={settings.vibration}
          onChange={setVibration}
        />

        <ToggleRow
          label="Sound"
          hint="Töne in Spielen wie Simon Says und beim Alarm"
          checked={settings.sound}
          onChange={setSound}
        />
      </div>
    </BottomSheet>
  );
}

interface ToggleRowProps {
  label: string;
  hint: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}

function ToggleRow({ label, hint, checked, onChange }: ToggleRowProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="flex flex-col">
        <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{label}</span>
        <span className="text-xs text-slate-500 dark:text-slate-400">{hint}</span>
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border transition ${
          checked
            ? 'border-brand-600 bg-brand-600 dark:border-brand-500 dark:bg-brand-500'
            : 'border-slate-300 bg-slate-200 dark:border-slate-600 dark:bg-slate-700'
        }`}
      >
        <span
          aria-hidden
          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
}
