import type { LetterState } from '../lib/wordle';

interface Props {
  status: Record<string, LetterState>;
  onLetter: (ch: string) => void;
  onEnter: () => void;
  onBackspace: () => void;
  disabled?: boolean;
}

const ROW1 = ['Q', 'W', 'E', 'R', 'T', 'Z', 'U', 'I', 'O', 'P'];
const ROW2 = ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'];
const ROW3 = ['Y', 'X', 'C', 'V', 'B', 'N', 'M'];

function keyClass(state: LetterState | undefined): string {
  switch (state) {
    case 'correct':
      return 'bg-emerald-500 text-white border-emerald-600';
    case 'present':
      return 'bg-amber-400 text-white border-amber-500';
    case 'absent':
      return 'bg-slate-400 text-white border-slate-500 dark:bg-slate-700 dark:border-slate-800';
    default:
      return 'bg-slate-200 text-slate-900 border-slate-300 dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700';
  }
}

export default function WordleKeyboard({
  status,
  onLetter,
  onEnter,
  onBackspace,
  disabled,
}: Props) {
  const renderKey = (ch: string) => (
    <button
      key={ch}
      type="button"
      onClick={() => onLetter(ch)}
      disabled={disabled}
      aria-label={`Buchstabe ${ch}`}
      className={`min-h-10 flex-1 rounded border text-sm font-semibold uppercase transition disabled:opacity-60 sm:min-h-12 sm:text-base ${keyClass(status[ch])}`}
    >
      {ch}
    </button>
  );

  return (
    <div
      className="flex w-full max-w-md flex-col gap-1 sm:max-w-lg"
      role="group"
      aria-label="Tastatur"
    >
      <div className="flex gap-1">{ROW1.map(renderKey)}</div>
      <div className="flex gap-1 px-3">{ROW2.map(renderKey)}</div>
      <div className="flex gap-1">
        <button
          type="button"
          onClick={onEnter}
          disabled={disabled}
          aria-label="Eingabe absenden"
          className="min-h-10 flex-[1.5] rounded border border-slate-300 bg-slate-200 text-xs font-semibold text-slate-900 disabled:opacity-60 sm:min-h-12 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        >
          ↵
        </button>
        {ROW3.map(renderKey)}
        <button
          type="button"
          onClick={onBackspace}
          disabled={disabled}
          aria-label="Zeichen löschen"
          className="min-h-10 flex-[1.5] rounded border border-slate-300 bg-slate-200 text-xs font-semibold text-slate-900 disabled:opacity-60 sm:min-h-12 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        >
          ⌫
        </button>
      </div>
    </div>
  );
}
