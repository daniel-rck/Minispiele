import type { SVGAttributes } from 'react';

type Mood = 'happy' | 'thinking' | 'cheer';

interface MascotIconProps extends Omit<SVGAttributes<SVGSVGElement>, 'children'> {
  mood?: Mood;
  size?: number;
}

export default function MascotIcon({
  mood = 'happy',
  size = 64,
  className = '',
  ...rest
}: MascotIconProps) {
  const mouth =
    mood === 'thinking'
      ? 'M22 46 Q32 46 42 46'
      : mood === 'cheer'
        ? 'M22 42 Q32 56 42 42'
        : 'M22 42 Q32 50 42 42';
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64"
      width={size}
      height={size}
      role="img"
      aria-hidden
      className={className}
      {...rest}
    >
      <defs>
        <linearGradient id="mascot-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--color-primary-400)" />
          <stop offset="1" stopColor="var(--color-primary-600)" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="16" fill="url(#mascot-bg)" />
      <circle cx="20" cy="44" r="6" fill="#ffffff" opacity="0.18" />
      <circle cx="48" cy="20" r="3" fill="#ffffff" opacity="0.25" />
      <ellipse cx="24" cy="28" rx="5" ry="6" fill="#ffffff" className="mascot-eye" />
      <ellipse cx="40" cy="28" rx="5" ry="6" fill="#ffffff" className="mascot-eye" />
      <circle cx="25" cy="29" r="2.4" fill="#0b2424" />
      <circle cx="41" cy="29" r="2.4" fill="#0b2424" />
      <circle cx="25.8" cy="28.2" r="0.9" fill="#ffffff" />
      <circle cx="41.8" cy="28.2" r="0.9" fill="#ffffff" />
      <path d={mouth} stroke="#ffffff" strokeWidth="3.2" fill="none" strokeLinecap="round" />
      <circle cx="18" cy="40" r="2.2" fill="var(--color-accent-400)" opacity="0.85" />
      <circle cx="46" cy="40" r="2.2" fill="var(--color-accent-400)" opacity="0.85" />
    </svg>
  );
}
