import { useId } from 'react';
import type { RingColor } from '../lib/ringSort';

interface RingPalette {
  light: string;
  mid: string;
  dark: string;
  stroke: string;
}

const palettes: Record<RingColor, RingPalette> = {
  red: { light: '#fecaca', mid: '#ef4444', dark: '#991b1b', stroke: '#7f1d1d' },
  blue: { light: '#bfdbfe', mid: '#3b82f6', dark: '#1e3a8a', stroke: '#172554' },
  green: { light: '#a7f3d0', mid: '#10b981', dark: '#065f46', stroke: '#064e3b' },
};

interface RingProps {
  color: RingColor;
  widthPercent: number;
  lifted?: boolean;
}

export default function Ring({ color, widthPercent, lifted = false }: RingProps) {
  const p = palettes[color];
  const uid = useId().replace(/:/g, '');
  const bodyId = `ring-body-${uid}`;
  const glossId = `ring-gloss-${uid}`;
  const holeId = `ring-hole-${uid}`;

  return (
    <div
      className={`relative h-10 sm:h-12 md:h-14 lg:h-16 transition-transform ${
        lifted ? '-translate-y-4 md:-translate-y-5' : ''
      }`}
      style={{ width: `${widthPercent}%` }}
    >
      <svg
        viewBox="0 0 200 80"
        preserveAspectRatio="none"
        className="block h-full w-full overflow-visible drop-shadow-[0_3px_2px_rgba(0,0,0,0.25)]"
        aria-hidden
      >
        <defs>
          <radialGradient id={bodyId} cx="50%" cy="28%" r="70%" fx="50%" fy="18%">
            <stop offset="0%" stopColor={p.light} />
            <stop offset="55%" stopColor={p.mid} />
            <stop offset="100%" stopColor={p.dark} />
          </radialGradient>
          <linearGradient id={glossId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.75" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
          <radialGradient id={holeId} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#000000" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Donut body */}
        <ellipse
          cx="100"
          cy="40"
          rx="97"
          ry="36"
          fill={`url(#${bodyId})`}
          stroke={p.stroke}
          strokeWidth="1.5"
        />

        {/* Top gloss highlight */}
        <ellipse cx="100" cy="22" rx="80" ry="10" fill={`url(#${glossId})`} />

        {/* Subtle shadow ring inside near the hole */}
        <ellipse cx="100" cy="40" rx="22" ry="14" fill={`url(#${holeId})`} pointerEvents="none" />
      </svg>

      {/* Hole — fixed width that matches the peg so the rod visually passes through */}
      <div
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-1/2 h-[40%] w-3 md:w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-slate-300 shadow-[inset_0_1px_2px_rgba(0,0,0,0.55)] dark:bg-slate-700"
      />
    </div>
  );
}
