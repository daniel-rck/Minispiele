import type { RingColor } from '../lib/ringSort';

interface RingStyle {
  gradient: string;
  outline: string;
  gloss: string;
}

const colorClasses: Record<RingColor, RingStyle> = {
  red: {
    gradient: 'bg-gradient-to-b from-red-400 via-red-500 to-red-700',
    outline: 'ring-red-800/70',
    gloss: 'bg-red-200/70',
  },
  blue: {
    gradient: 'bg-gradient-to-b from-blue-400 via-blue-500 to-blue-700',
    outline: 'ring-blue-800/70',
    gloss: 'bg-blue-200/70',
  },
  green: {
    gradient: 'bg-gradient-to-b from-emerald-400 via-emerald-500 to-emerald-700',
    outline: 'ring-emerald-800/70',
    gloss: 'bg-emerald-200/70',
  },
};

interface RingProps {
  color: RingColor;
  widthPercent: number;
  lifted?: boolean;
}

export default function Ring({ color, widthPercent, lifted = false }: RingProps) {
  const c = colorClasses[color];
  return (
    <div
      className={`relative h-6 sm:h-7 md:h-8 lg:h-9 rounded-full shadow-md ring-2 transition-transform ${c.gradient} ${c.outline} ${
        lifted ? '-translate-y-3 md:-translate-y-4' : ''
      }`}
      style={{ width: `${widthPercent}%` }}
    >
      <div
        aria-hidden
        className={`pointer-events-none absolute left-[10%] right-[10%] top-[12%] h-[22%] rounded-full opacity-80 ${c.gloss}`}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-1/2 h-[60%] w-[14%] min-w-[8px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-slate-300 shadow-[inset_0_1px_2px_rgba(0,0,0,0.45)] dark:bg-slate-700"
      />
    </div>
  );
}
