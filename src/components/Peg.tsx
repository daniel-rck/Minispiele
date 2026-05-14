import type { Peg as PegState } from '../lib/ringSort';
import Ring from './Ring';

interface PegProps {
  peg: PegState;
  index: number;
  capacity: number;
  selected: boolean;
  onClick: (index: number) => void;
}

export default function Peg({ peg, index, capacity, selected, onClick }: PegProps) {
  const slotHeightRem = 1.75;
  const reservedHeight = capacity * slotHeightRem;

  return (
    <button
      type="button"
      onClick={() => onClick(index)}
      aria-label={`Stab ${index + 1}${peg.length === 0 ? ' (leer)' : `, ${peg.length} Ringe`}`}
      aria-pressed={selected}
      className={`group relative flex flex-col items-center justify-end rounded-2xl border-2 px-2 pt-2 pb-1 select-none transition ${
        selected
          ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/30'
          : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-brand-300'
      }`}
      style={{ minHeight: `${reservedHeight + 3}rem` }}
    >
      <div className="absolute top-2 bottom-6 left-1/2 -translate-x-1/2 w-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
      <div
        className="relative flex flex-col-reverse items-center gap-0.5 w-full"
        style={{ minHeight: `${reservedHeight}rem` }}
      >
        {peg.map((color, i) => {
          const isTop = i === peg.length - 1;
          const width = 55 + i * 8;
          return (
            <Ring
              key={i}
              color={color}
              width={Math.min(width, 95)}
              lifted={selected && isTop}
            />
          );
        })}
      </div>
      <div className="mt-1 h-2 w-full rounded-full bg-slate-400 dark:bg-slate-600" />
    </button>
  );
}
