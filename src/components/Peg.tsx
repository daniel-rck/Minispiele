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
  const slotHeightRem = 1.95;
  const reservedHeight = capacity * slotHeightRem;

  return (
    <button
      type="button"
      onClick={() => onClick(index)}
      aria-label={`Stab ${index + 1}${peg.length === 0 ? ' (leer)' : `, ${peg.length} Ringe`}`}
      aria-pressed={selected}
      className={`group relative flex flex-col items-center justify-end rounded-2xl border-2 px-1 pt-2 pb-1 sm:px-3 md:px-4 md:pt-3 select-none transition ${
        selected
          ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/30'
          : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-brand-300'
      }`}
      style={{ minHeight: `${reservedHeight + 2.5}rem` }}
    >
      <div className="absolute top-2 bottom-6 left-1/2 -translate-x-1/2 w-2 md:w-2.5 rounded-full bg-slate-300 shadow-[inset_0_0_2px_rgba(0,0,0,0.3)] dark:bg-slate-700" />
      <div
        className="relative flex flex-col-reverse items-center gap-px w-full"
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
      <div className="mt-1 h-2.5 md:h-3 w-full rounded-full bg-slate-400 shadow-md dark:bg-slate-600" />
    </button>
  );
}
