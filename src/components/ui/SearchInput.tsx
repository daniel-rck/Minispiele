import { forwardRef } from 'react';
import type { InputHTMLAttributes } from 'react';

interface SearchInputProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'type' | 'onChange'
> {
  value: string;
  onValueChange: (v: string) => void;
  clearLabel?: string;
  label?: string;
}

const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(function SearchInput(
  {
    value,
    onValueChange,
    clearLabel = 'Suche zurücksetzen',
    label = 'Spiele durchsuchen',
    placeholder = 'Spiele suchen …',
    className = '',
    ...rest
  },
  ref,
) {
  return (
    <div role="search" className={`relative ${className}`.trim()}>
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-3.5 inline-flex items-center text-surface-500 dark:text-surface-400"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
      </span>
      <input
        ref={ref}
        type="search"
        aria-label={label}
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        placeholder={placeholder}
        className="w-full min-h-12 rounded-2xl border-2 border-surface-200 bg-white pl-11 pr-12 text-sm font-medium text-surface-900 placeholder:text-surface-400 focus:border-primary-400 focus:outline-none dark:border-surface-700 dark:bg-surface-900 dark:text-surface-50 dark:placeholder:text-surface-500"
        {...rest}
      />
      {value ? (
        <button
          type="button"
          onClick={() => onValueChange('')}
          aria-label={clearLabel}
          className="absolute inset-y-0 right-2 my-auto inline-flex size-9 items-center justify-center rounded-full text-surface-500 hover:bg-surface-100 dark:text-surface-300 dark:hover:bg-surface-800"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
          >
            <path d="M6 6l12 12M6 18L18 6" />
          </svg>
        </button>
      ) : null}
    </div>
  );
});

export default SearchInput;
