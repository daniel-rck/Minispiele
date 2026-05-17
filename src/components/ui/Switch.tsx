import { useId } from 'react';

interface SwitchProps {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  labelHidden?: boolean;
  description?: string;
  disabled?: boolean;
  id?: string;
}

export default function Switch({
  checked,
  onChange,
  label,
  labelHidden = false,
  description,
  disabled = false,
  id,
}: SwitchProps) {
  const autoId = useId();
  const switchId = id ?? autoId;
  const descId = description ? `${switchId}-desc` : undefined;

  return (
    <div className="flex items-center justify-between gap-3">
      {!labelHidden && (
        <label htmlFor={switchId} className="flex-1 cursor-pointer">
          <span className="block text-sm font-bold text-surface-800 dark:text-surface-100">
            {label}
          </span>
          {description ? (
            <span id={descId} className="block text-xs text-surface-500 dark:text-surface-400">
              {description}
            </span>
          ) : null}
        </label>
      )}
      <button
        id={switchId}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={labelHidden ? label : undefined}
        aria-describedby={descId}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-[var(--ease-snappy)] disabled:cursor-not-allowed disabled:opacity-50 ${
          checked ? 'bg-primary-500' : 'bg-surface-300 dark:bg-surface-700'
        }`}
      >
        <span
          className={`pointer-events-none inline-block size-5 rounded-full bg-white shadow-md transition-transform duration-200 ease-[var(--ease-snappy)] ${
            checked ? 'translate-x-5' : 'translate-x-0.5'
          }`}
        />
      </button>
    </div>
  );
}
