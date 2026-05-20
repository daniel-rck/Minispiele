import type { ReactNode } from 'react';
import Button from './Button';
import Sheet from './Sheet';

export type GameOverStat = {
  label: string;
  value: ReactNode;
};

export type GameOverAction = {
  label: string;
  onClick: () => void;
};

interface GameOverSheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  emoji?: string;
  isNewRecord?: boolean;
  recordLabel?: string;
  message?: ReactNode;
  stats?: GameOverStat[];
  primaryAction: GameOverAction;
  secondaryAction?: GameOverAction;
}

export default function GameOverSheet({
  open,
  onClose,
  title,
  emoji,
  isNewRecord = false,
  recordLabel = 'Neue Bestmarke!',
  message,
  stats,
  primaryAction,
  secondaryAction,
}: GameOverSheetProps) {
  return (
    <Sheet open={open} onClose={onClose} title={title}>
      <div className="text-center">
        {emoji && (
          <div className="mb-2 text-4xl" aria-hidden>
            {emoji}
          </div>
        )}
        {isNewRecord && (
          <div className="mb-2 inline-block rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-900 dark:bg-amber-900/40 dark:text-amber-100">
            {recordLabel}
          </div>
        )}
        {message && (
          <div className="mb-4 text-sm text-slate-600 dark:text-slate-300">{message}</div>
        )}
        {stats && stats.length > 0 && (
          <dl
            className={`mb-4 grid gap-2 text-center text-xs ${stats.length <= 2 ? 'grid-cols-2' : stats.length === 3 ? 'grid-cols-3' : 'grid-cols-4'}`}
          >
            {stats.map((stat) => (
              <div key={stat.label}>
                <dd className="text-lg font-semibold tabular-nums">{stat.value}</dd>
                <dt className="text-slate-500">{stat.label}</dt>
              </div>
            ))}
          </dl>
        )}
        <div className="flex flex-col gap-2">
          <Button variant="primary" block onClick={primaryAction.onClick}>
            {primaryAction.label}
          </Button>
          {secondaryAction && (
            <Button variant="ghost" block onClick={secondaryAction.onClick}>
              {secondaryAction.label}
            </Button>
          )}
        </div>
      </div>
    </Sheet>
  );
}
