import { useCallback, useState } from 'react';
import { useVibration } from '../hooks/useVibration';
import { STORAGE_KEYS } from '../lib/constants';
import { RouletteBalanceSchema } from '../lib/persistedSchemas';
import { useGameSfx } from '../lib/useGameSfx';
import { useLocalStorage } from '../lib/useLocalStorage';
import AriaLive from './AriaLive';
import Button from './ui/Button';

const WHEEL_ORDER = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14,
  31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26,
];
const RED_NUMS = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);
const CHIPS = [5, 10, 25, 50, 100] as const;
type ChipValue = (typeof CHIPS)[number];

type OutsideKey = 'red' | 'black' | 'even' | 'odd' | 'low' | 'high';

const OUTSIDE: { key: OutsideKey; label: string; color: string }[] = [
  { key: 'red', label: 'Rot', color: 'bg-rose-700' },
  { key: 'black', label: 'Schwarz', color: 'bg-slate-900' },
  { key: 'even', label: 'Gerade', color: 'bg-slate-700' },
  { key: 'odd', label: 'Ungerade', color: 'bg-slate-700' },
  { key: 'low', label: '1-18', color: 'bg-slate-700' },
  { key: 'high', label: '19-36', color: 'bg-slate-700' },
];

function isRed(n: number): boolean {
  return RED_NUMS.has(n);
}

export default function RouletteGame() {
  const [balance, setBalance] = useLocalStorage<number>(
    STORAGE_KEYS.ROULETTE_BALANCE,
    RouletteBalanceSchema,
    1000,
  );
  const [chip, setChip] = useState<ChipValue>(5);
  const [bets, setBets] = useState<Record<string, number>>({});
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<number | null>(null);
  const [announcement, setAnnouncement] = useState('Platziere Einsätze und drehe das Rad.');

  const sfx = useGameSfx();
  const { vibrate } = useVibration();

  const totalBet = Object.values(bets).reduce((a, b) => a + b, 0);

  const placeBet = useCallback(
    (key: string) => {
      if (spinning) return;
      if (totalBet + chip > balance) return;
      vibrate(10);
      setBets((b) => ({ ...b, [key]: (b[key] ?? 0) + chip }));
    },
    [spinning, totalBet, chip, balance, vibrate],
  );

  const clearBets = useCallback(() => {
    if (spinning) return;
    setBets({});
  }, [spinning]);

  const spin = useCallback(() => {
    if (spinning) return;
    if (totalBet === 0) {
      setAnnouncement('Platziere zuerst einen Einsatz.');
      sfx.error();
      return;
    }
    setSpinning(true);
    setBalance(balance - totalBet);
    setResult(null);
    sfx.reelTick();
    window.setTimeout(() => {
      const idx = Math.floor(Math.random() * WHEEL_ORDER.length);
      const num = WHEEL_ORDER[idx] ?? 0;
      let winnings = 0;
      for (const [key, amount] of Object.entries(bets)) {
        if (key === String(num)) winnings += amount * 36;
        else if (key === 'red' && isRed(num)) winnings += amount * 2;
        else if (key === 'black' && num > 0 && !isRed(num)) winnings += amount * 2;
        else if (key === 'even' && num > 0 && num % 2 === 0) winnings += amount * 2;
        else if (key === 'odd' && num % 2 === 1) winnings += amount * 2;
        else if (key === 'low' && num >= 1 && num <= 18) winnings += amount * 2;
        else if (key === 'high' && num >= 19 && num <= 36) winnings += amount * 2;
      }
      setBalance((b) => b + winnings);
      setResult(num);
      setBets({});
      setSpinning(false);
      const color = num === 0 ? 'Grün' : isRed(num) ? 'Rot' : 'Schwarz';
      if (winnings > 0) {
        setAnnouncement(`${num} ${color}. Gewinn: ${winnings}.`);
        sfx.win();
        vibrate([60, 40, 120]);
      } else {
        setAnnouncement(`${num} ${color}. Verloren.`);
        sfx.lose();
        vibrate([120, 60, 80]);
      }
    }, 2000);
  }, [spinning, totalBet, balance, bets, setBalance, sfx, vibrate]);

  const resetBalance = useCallback(() => {
    setBalance(1000);
    setBets({});
    setResult(null);
    setAnnouncement('Guthaben zurückgesetzt.');
  }, [setBalance]);

  return (
    <div className="flex flex-col items-center gap-3 pb-4">
      <AriaLive message={announcement} />

      <div className="flex items-center justify-between w-full max-w-md text-sm text-surface-700 dark:text-surface-200">
        <div>
          Guthaben: <span className="font-semibold tabular-nums">{balance}</span>
        </div>
        <div>
          Einsatz: <span className="font-semibold tabular-nums">{totalBet}</span>
        </div>
      </div>

      <div className="flex h-32 w-32 items-center justify-center rounded-full bg-slate-900 ring-2 ring-amber-500 dark:bg-slate-950">
        {result === null ? (
          <span className="text-3xl" aria-hidden>
            🎰
          </span>
        ) : (
          <div className="text-center">
            <div
              className={`text-4xl font-extrabold ${
                result === 0 ? 'text-emerald-400' : isRed(result) ? 'text-rose-400' : 'text-white'
              }`}
              aria-label={`Ergebnis ${result} ${result === 0 ? 'Grün' : isRed(result) ? 'Rot' : 'Schwarz'}`}
            >
              {result}
            </div>
            <div className="text-xs text-slate-300">
              {result === 0 ? 'Grün' : isRed(result) ? 'Rot' : 'Schwarz'}
            </div>
          </div>
        )}
      </div>

      <div
        className="flex flex-wrap items-center justify-center gap-2"
        role="group"
        aria-label="Chips"
      >
        {CHIPS.map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setChip(value)}
            aria-pressed={chip === value}
            aria-label={`Chip ${value}`}
            className={`h-12 w-12 rounded-full text-sm font-bold text-white ${
              chip === value ? 'ring-4 ring-amber-300' : ''
            } ${
              value === 5
                ? 'bg-emerald-500'
                : value === 10
                  ? 'bg-sky-500'
                  : value === 25
                    ? 'bg-violet-500'
                    : value === 50
                      ? 'bg-rose-500'
                      : 'bg-amber-500'
            }`}
          >
            {value}
          </button>
        ))}
      </div>

      <div
        className="grid w-full max-w-md grid-cols-6 gap-1"
        role="group"
        aria-label="Einsatzfelder Zahlen"
      >
        <button
          type="button"
          onClick={() => placeBet('0')}
          disabled={spinning}
          aria-label={`Zahl 0${bets['0'] ? ` Einsatz ${bets['0']}` : ''}`}
          className={`col-span-6 min-h-10 rounded bg-emerald-700 text-sm font-bold text-white ${
            bets['0'] ? 'ring-2 ring-amber-300' : ''
          }`}
        >
          0 {bets['0'] ? `(${bets['0']})` : ''}
        </button>
        {Array.from({ length: 36 }).map((_, i) => {
          const n = i + 1;
          const key = String(n);
          const bet = bets[key];
          return (
            <button
              key={n}
              type="button"
              onClick={() => placeBet(key)}
              disabled={spinning}
              aria-label={`Zahl ${n}${bet ? ` Einsatz ${bet}` : ''}`}
              className={`flex min-h-10 flex-col items-center justify-center rounded text-xs font-bold text-white ${
                isRed(n) ? 'bg-rose-700' : 'bg-slate-700'
              } ${bet ? 'ring-2 ring-amber-300' : ''}`}
            >
              <span>{n}</span>
              {bet ? <span className="text-[10px]">{bet}</span> : null}
            </button>
          );
        })}
      </div>

      <div className="grid w-full max-w-md grid-cols-3 gap-1" role="group" aria-label="Außenwetten">
        {OUTSIDE.map((o) => {
          const bet = bets[o.key];
          return (
            <button
              key={o.key}
              type="button"
              onClick={() => placeBet(o.key)}
              disabled={spinning}
              aria-label={`${o.label}${bet ? ` Einsatz ${bet}` : ''}`}
              className={`min-h-10 rounded text-xs font-bold text-white ${o.color} ${
                bet ? 'ring-2 ring-amber-300' : ''
              }`}
            >
              {o.label} {bet ? `(${bet})` : ''}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button variant="primary" size="sm" onClick={spin} disabled={spinning}>
          {spinning ? 'Dreht …' : 'Drehen'}
        </Button>
        <Button variant="ghost" size="sm" onClick={clearBets} disabled={spinning}>
          Einsätze löschen
        </Button>
        {balance <= 0 && (
          <Button variant="secondary" size="sm" onClick={resetBalance}>
            Neues Guthaben (1000)
          </Button>
        )}
      </div>

      <p className="max-w-md text-center text-xs text-surface-500 dark:text-surface-400">
        Setze Chips auf Zahlen (36×), Rot/Schwarz (2×), Gerade/Ungerade (2×), oder 1-18/19-36 (2×).
        Bei Pleite kannst du das Guthaben zurücksetzen.
      </p>
    </div>
  );
}
