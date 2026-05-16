import type { Peg as PegState } from '../lib/ringSort';
import Ring from './Ring';

interface PegProps {
  peg: PegState;
  index: number;
  capacity: number;
  selected: boolean;
  onClick: (index: number) => void;
}

const RING_WIDTH_PERCENT = 88;

export default function Peg({ peg, index, capacity, selected, onClick }: PegProps) {
  return (
    <button
      type="button"
      onClick={() => onClick(index)}
      aria-label={`Stab ${index + 1}${peg.length === 0 ? ' (leer)' : `, ${peg.length} Ringe`}`}
      aria-pressed={selected}
      className="group relative flex w-full touch-manipulation flex-col items-center justify-end rounded-2xl px-1 pt-3 pb-1 select-none sm:px-2 md:px-3 md:pt-4"
      style={{ minHeight: `calc(var(--slot-h, 2rem) * ${capacity} + 2.5rem)` }}
    >
      {selected && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-1 inset-y-1 rounded-2xl bg-brand-100/60 dark:bg-brand-900/30"
        />
      )}
      <div
        aria-hidden
        className={`absolute top-3 bottom-7 left-1/2 w-2 -translate-x-1/2 rounded-full shadow-[inset_0_0_2px_rgba(0,0,0,0.35)] md:w-2.5 ${
          selected ? 'bg-brand-500' : 'bg-slate-400 dark:bg-slate-500'
        }`}
      />
      <div
        className="relative flex w-full flex-col-reverse items-center"
        style={{ minHeight: `calc(var(--slot-h, 2rem) * ${capacity})` }}
      >
        {peg.map((ring, i) => {
          const isTop = i === peg.length - 1;
          return (
            <Ring
              key={ring.id}
              color={ring.color}
              widthPercent={RING_WIDTH_PERCENT}
              lifted={selected && isTop}
            />
          );
        })}
      </div>
      <div
        aria-hidden
        className={`relative mt-1 h-3 w-full rounded-full shadow-md md:h-3.5 ${
          selected ? 'bg-brand-500' : 'bg-slate-500 dark:bg-slate-600'
        }`}
      />
    </button>
  );
}
