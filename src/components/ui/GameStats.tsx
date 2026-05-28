import type { ReactNode } from 'react';

export interface GameStat {
  label: string;
  value: ReactNode;
  valueAriaLabel?: string;
}

interface GameStatsProps {
  items: GameStat[];
  className?: string;
}

const colsClass: Record<number, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-2',
  3: 'grid-cols-3',
  4: 'grid-cols-2 sm:grid-cols-4',
};

export default function GameStats({ items, className = '' }: GameStatsProps) {
  const cols = colsClass[items.length] ?? 'grid-cols-3';
  return (
    <dl
      className={`grid ${cols} gap-2 text-sm text-surface-600 dark:text-surface-300 ${className}`.trim()}
    >
      {items.map((stat, i) => {
        const align = i === 0 ? 'text-left' : i === items.length - 1 ? 'text-right' : 'text-center';
        const key = stat.label || `stat-${i}`;
        return (
          <div key={key} className={align}>
            {stat.label && <dt className="inline">{stat.label}: </dt>}
            <dd className="inline font-semibold tabular-nums">
              {stat.valueAriaLabel && <span className="sr-only">{stat.valueAriaLabel}: </span>}
              {stat.value}
            </dd>
          </div>
        );
      })}
    </dl>
  );
}
