import { formatHundredths, formatRemaining } from '../lib/clickerTimer';
import type { TimerDisplayMode } from '../lib/persistedSchemas';
import FlipDigit from './FlipDigit';

interface Props {
  mode: TimerDisplayMode;
  ms: number;
  /** When false, suppresses flip animations (e.g. before the timer has started). */
  animate?: boolean;
}

export default function TimerDisplay({ mode, ms, animate = true }: Props) {
  if (mode === 'continuous') {
    const hundredths = formatHundredths(ms);
    return (
      <span className="tabular-nums" role="img" aria-label={`${hundredths} verbleibend`}>
        {hundredths}
      </span>
    );
  }

  const text = formatRemaining(ms);
  return (
    <span
      className="inline-flex items-baseline tabular-nums"
      style={{ perspective: '600px' }}
      role="img"
      aria-label={`${text} verbleibend`}
    >
      {text.split('').map((ch, idx) =>
        ch === ':' ? (
          <span key={idx} aria-hidden>
            {ch}
          </span>
        ) : (
          <FlipDigit key={idx} digit={ch} animate={animate} />
        ),
      )}
    </span>
  );
}
