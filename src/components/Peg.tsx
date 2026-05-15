import type { Peg as PegState } from '../lib/ringSort';
import Ring from './Ring';

interface PegProps {
  peg: PegState;
  index: number;
  capacity: number;
  selected: boolean;
  onClick: (index: number) => void;
}

function ringWidthPercent(size: number, capacity: number): number {
  const minWidth = 45;
  const maxWidth = 90;
  if (capacity <= 1) return maxWidth;
  return minWidth + (size / (capacity - 1)) * (maxWidth - minWidth);
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
        {peg.map((ring, i) => {
          const isTop = i === peg.length - 1;
          return (
            <Ring
              key={ring.id}
              color={ring.color}
              widthPercent={ringWidthPercent(ring.size, capacity)}
              lifted={selected && isTop}
            />
          );
        })}
      </div>
      <div className="mt-1 h-2 w-full rounded-full bg-slate-400 dark:bg-slate-600" />
    </button>
  );
}
