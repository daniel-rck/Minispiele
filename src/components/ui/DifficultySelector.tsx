interface DifficultySelectorProps<T extends string> {
  value: T;
  options: Record<T, string>;
  onChange: (next: T) => void;
  label?: string;
  disabled?: boolean;
}

export default function DifficultySelector<T extends string>({
  value,
  options,
  onChange,
  label = 'Schwierigkeit:',
  disabled = false,
}: DifficultySelectorProps<T>) {
  const keys = Object.keys(options) as T[];
  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="text-slate-600 dark:text-slate-300">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        disabled={disabled}
        className="min-h-11 rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900"
      >
        {keys.map((d) => (
          <option key={d} value={d}>
            {options[d]}
          </option>
        ))}
      </select>
    </label>
  );
}
