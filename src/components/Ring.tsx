import type { RingColor } from '../lib/ringSort';

const colorClasses: Record<RingColor, string> = {
  red: 'bg-red-500 ring-red-700',
  blue: 'bg-blue-500 ring-blue-700',
  green: 'bg-emerald-500 ring-emerald-700',
};

interface RingProps {
  color: RingColor;
  width: number;
  lifted?: boolean;
}

export default function Ring({ color, width, lifted = false }: RingProps) {
  return (
    <div
      className={`h-6 sm:h-7 rounded-full shadow ring-2 transition-transform ${
        colorClasses[color]
      } ${lifted ? '-translate-y-3' : ''}`}
      style={{ width: `${width}%` }}
    />
  );
}
