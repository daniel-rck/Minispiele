import type { RingColor } from '../lib/ringSort';

interface RingStyle {
  gradient: string;
  outline: string;
  gloss: string;
}

const colorClasses: Record<RingColor, RingStyle> = {
  red: {
    gradient: 'bg-gradient-to-b from-red-300 via-red-500 to-red-800',
    outline: 'ring-red-900/70',
    gloss: 'bg-red-100/70',
  },
  blue: {
    gradient: 'bg-gradient-to-b from-blue-300 via-blue-500 to-blue-800',
    outline: 'ring-blue-900/70',
    gloss: 'bg-blue-100/70',
  },
  green: {
    gradient: 'bg-gradient-to-b from-emerald-300 via-emerald-500 to-emerald-800',
    outline: 'ring-emerald-900/70',
    gloss: 'bg-emerald-100/70',
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
      className={`relative h-10 sm:h-12 md:h-14 lg:h-16 rounded-full shadow-lg ring-2 transition-transform ${c.gradient} ${c.outline} ${
        lifted ? '-translate-y-4 md:-translate-y-5' : ''
      }`}
      style={{ width: `${widthPercent}%` }}
    >
      <div
        aria-hidden
        className={`pointer-events-none absolute left-[14%] right-[14%] top-[10%] h-[22%] rounded-full opacity-80 ${c.gloss}`}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-1/2 h-[38%] w-3 md:w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-slate-300 shadow-[inset_0_1px_3px_rgba(0,0,0,0.55)] dark:bg-slate-700"
      />
    </div>
  );
}
