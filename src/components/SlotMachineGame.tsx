import { useCallback, useEffect, useRef, useState } from 'react';
import { useVibration } from '../hooks/useVibration';
import { STORAGE_KEYS } from '../lib/constants';
import { SlotMachineBestSchema } from '../lib/persistedSchemas';
import {
  clampBet,
  evaluatePayout,
  pickSymbol,
  SLOT_BET_STEP,
  SLOT_INITIAL_BALANCE,
  SLOT_MAX_BET,
  SLOT_MIN_BET,
  SLOT_SYMBOLS,
  type SlotSymbol,
  spinReels,
} from '../lib/slotMachine';
import { useGameSfx } from '../lib/useGameSfx';
import { useLocalStorage } from '../lib/useLocalStorage';
import AriaLive from './AriaLive';
import Button from './ui/Button';

type ReelState = [SlotSymbol, SlotSymbol, SlotSymbol];

const REEL_TICK_MS = 60;
const REEL_STOP_DELAYS = [600, 1000, 1400] as const;

export default function SlotMachineGame() {
  const [balance, setBalance] = useState(SLOT_INITIAL_BALANCE);
  const [bet, setBet] = useState(10);
  const [reels, setReels] = useState<ReelState>(['🍒', '🍋', '🍒']);
  const [winningReels, setWinningReels] = useState<number[]>([]);
  const [spinning, setSpinning] = useState(false);
  const [message, setMessage] = useState('Drücke SPIN!');
  const [lastWin, setLastWin] = useState(0);
  const [announce, setAnnounce] = useState('');
  const [maxBalance, setMaxBalance] = useLocalStorage<number>(
    STORAGE_KEYS.SLOT_MACHINE_BEST,
    SlotMachineBestSchema,
    SLOT_INITIAL_BALANCE,
  );
  const tickerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const { vibrate } = useVibration();
  const sfx = useGameSfx();

  useEffect(() => {
    if (balance > maxBalance) setMaxBalance(balance);
  }, [balance, maxBalance, setMaxBalance]);

  const cleanup = useCallback(() => {
    if (tickerRef.current) clearInterval(tickerRef.current);
    tickerRef.current = null;
    for (const t of timersRef.current) clearTimeout(t);
    timersRef.current = [];
  }, []);

  useEffect(() => cleanup, [cleanup]);

  const adjustBet = (delta: number) => {
    if (spinning) return;
    setBet((b) => clampBet(b + delta, balance));
  };

  const spin = useCallback(() => {
    if (spinning) return;
    if (balance < bet) {
      setMessage('Nicht genug Guthaben.');
      return;
    }
    cleanup();
    const finalReels = spinReels();
    const currentBet = bet;
    setSpinning(true);
    setBalance((b) => b - currentBet);
    setWinningReels([]);
    setMessage('…');
    setLastWin(0);
    vibrate(15);

    tickerRef.current = setInterval(() => {
      setReels(() => [pickSymbol(), pickSymbol(), pickSymbol()] as ReelState);
    }, REEL_TICK_MS);

    REEL_STOP_DELAYS.forEach((delay, i) => {
      const finalSym = finalReels[i] as SlotSymbol;
      const t = setTimeout(() => {
        setReels((prev) => {
          const next = [...prev] as ReelState;
          next[i as 0 | 1 | 2] = finalSym;
          return next;
        });
        sfx.reelTick();
        if (i === REEL_STOP_DELAYS.length - 1) {
          if (tickerRef.current) clearInterval(tickerRef.current);
          tickerRef.current = null;
          const payout = evaluatePayout(finalReels);
          const winnings = currentBet * payout.multiplier;
          setLastWin(winnings);
          setWinningReels(payout.winningReels);
          setBalance((b) => b + winnings);
          setSpinning(false);
          if (winnings > 0) {
            const txt = `${payout.label}: ${payout.multiplier}× — Gewinn ${winnings}`;
            setMessage(txt);
            setAnnounce(txt);
            vibrate(payout.multiplier >= 15 ? [60, 30, 60, 30, 60] : 30);
            sfx.win();
          } else {
            setMessage('Kein Gewinn.');
          }
        }
      }, delay);
      timersRef.current.push(t);
    });
  }, [balance, bet, spinning, cleanup, vibrate, sfx]);

  const restart = () => {
    cleanup();
    setBalance(SLOT_INITIAL_BALANCE);
    setBet(10);
    setReels(['🍒', '🍋', '🍒']);
    setWinningReels([]);
    setSpinning(false);
    setMessage('Drücke SPIN!');
    setLastWin(0);
    setAnnounce('Guthaben zurückgesetzt.');
  };

  const canSpin = !spinning && balance >= bet;

  return (
    <div className="flex flex-col items-center gap-4 pb-4">
      <AriaLive message={announce} />

      <div className="w-full max-w-md rounded-3xl border-2 border-amber-400 bg-slate-100 px-4 py-6 text-center shadow-inner dark:bg-slate-900">
        <p
          className="min-h-[1.6rem] text-base font-semibold text-amber-600 dark:text-amber-400"
          role="status"
        >
          {message}
        </p>
        <div className="my-4 flex justify-center gap-3">
          {reels.map((sym, i) => (
            <div
              key={`reel-${i}`}
              title={`Walze ${i + 1}: ${sym}`}
              className={`flex h-24 w-20 items-center justify-center rounded-xl border-2 text-5xl transition-colors ${
                winningReels.includes(i)
                  ? 'border-amber-400 bg-amber-100 shadow-[0_0_15px_rgba(251,191,36,0.5)] dark:bg-amber-900/40'
                  : 'border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-950'
              }`}
            >
              {sym}
            </div>
          ))}
        </div>

        <div className="mb-3 flex items-center justify-center gap-3 text-sm text-slate-700 dark:text-slate-200">
          <span>Einsatz:</span>
          <button
            type="button"
            onClick={() => adjustBet(-SLOT_BET_STEP)}
            disabled={spinning || bet <= SLOT_MIN_BET}
            aria-label="Einsatz verringern"
            className="min-h-11 min-w-11 rounded-lg border border-slate-300 bg-white text-lg font-bold disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800"
          >
            −
          </button>
          <span className="min-w-12 text-center font-bold tabular-nums text-amber-600 dark:text-amber-400">
            {bet}
          </span>
          <button
            type="button"
            onClick={() => adjustBet(SLOT_BET_STEP)}
            disabled={spinning || bet >= SLOT_MAX_BET || bet >= balance}
            aria-label="Einsatz erhöhen"
            className="min-h-11 min-w-11 rounded-lg border border-slate-300 bg-white text-lg font-bold disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800"
          >
            +
          </button>
        </div>

        <Button variant="primary" onClick={spin} disabled={!canSpin}>
          {spinning ? '…' : 'SPIN'}
        </Button>
      </div>

      <div className="grid w-full max-w-md grid-cols-3 gap-2 text-sm text-slate-600 dark:text-slate-300">
        <div>
          Guthaben:{' '}
          <span className="font-semibold tabular-nums text-amber-600 dark:text-amber-400">
            {balance}
          </span>
        </div>
        <div className="text-center">
          Gewinn: <span className="font-semibold tabular-nums">{lastWin}</span>
        </div>
        <div className="text-right">
          Best: <span className="font-semibold tabular-nums">{maxBalance}</span>
        </div>
      </div>

      <Button variant="secondary" block className="max-w-md" onClick={restart}>
        Neu starten
      </Button>

      <details className="w-full max-w-md rounded-xl border border-slate-300 bg-white p-3 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
        <summary className="cursor-pointer text-sm font-semibold text-slate-700 dark:text-slate-200">
          Gewinntabelle
        </summary>
        <ul className="mt-2 space-y-0.5">
          <li>3× 💎 = 50× Einsatz</li>
          <li>3× 7️⃣ = 30× Einsatz</li>
          <li>3× 🍀 = 20× Einsatz</li>
          <li>3× 🔔 = 15× Einsatz</li>
          <li>3× 🍊 = 10× Einsatz</li>
          <li>3× 🍋 = 8× Einsatz</li>
          <li>3× 🍒 = 5× Einsatz</li>
          <li>2× 💎 = 5× Einsatz</li>
          <li>2× 7️⃣ = 3× Einsatz</li>
          <li>Doppelkirsche (irgendwo) = 2× Einsatz</li>
        </ul>
        <p className="mt-2 text-slate-500">Symbol-Vorrat: {SLOT_SYMBOLS.join(' ')}</p>
      </details>
    </div>
  );
}
