export type LetterStatus = 'correct' | 'wrong' | undefined;

interface LetterKeyboardProps {
  alphabet?: readonly string[];
  status: Record<string, LetterStatus>;
  onLetter: (letter: string) => void;
  disabled?: boolean;
  label?: string;
  className?: string;
}

const DEFAULT_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

export default function LetterKeyboard({
  alphabet = DEFAULT_ALPHABET,
  status,
  onLetter,
  disabled = false,
  label = 'Buchstaben',
  className = 'grid w-full max-w-lg grid-cols-7 gap-1.5 sm:grid-cols-9',
}: LetterKeyboardProps) {
  return (
    <div className={className} role="group" aria-label={label}>
      {alphabet.map((ch) => {
        const s = status[ch];
        const used = s !== undefined;
        const correct = s === 'correct';
        const wrong = s === 'wrong';
        return (
          <button
            key={ch}
            type="button"
            onClick={() => onLetter(ch)}
            disabled={used || disabled}
            aria-label={ch}
            className={`min-h-11 rounded-lg border text-sm font-semibold uppercase disabled:opacity-70 ${
              correct
                ? 'border-emerald-600 bg-emerald-500 text-white'
                : wrong
                  ? 'border-slate-500 bg-slate-400 text-white dark:bg-slate-700'
                  : 'border-slate-300 bg-white text-slate-700 hover:bg-brand-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            {ch}
          </button>
        );
      })}
    </div>
  );
}
