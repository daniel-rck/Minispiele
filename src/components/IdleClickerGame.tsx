import { useCallback, useEffect, useMemo, useState } from 'react';
import { useVibration } from '../hooks/useVibration';
import { STORAGE_KEYS } from '../lib/constants';
import {
  buyUpgrade,
  canPrestige,
  clickPower,
  createInitialState,
  doClick,
  doPrestige,
  formatNumber,
  IDLE_PRESTIGE_THRESHOLD,
  IDLE_UPGRADES,
  type IdleState,
  perSecond,
  tickState,
  upgradeCost,
} from '../lib/idleClicker';
import { IdleClickerSaveSchema } from '../lib/persistedSchemas';
import { useLocalStorage } from '../lib/useLocalStorage';
import AriaLive from './AriaLive';
import Button from './ui/Button';

const TICK_MS = 100;

interface SavedState {
  version: 1;
  points: number;
  totalEarned: number;
  multiplier: number;
  upgradeCounts: number[];
}

function toSaved(state: IdleState): SavedState {
  return {
    version: 1,
    points: state.points,
    totalEarned: state.totalEarned,
    multiplier: state.multiplier,
    upgradeCounts: state.upgradeCounts,
  };
}

function fromSaved(saved: SavedState): IdleState {
  const counts = IDLE_UPGRADES.map((_, i) => saved.upgradeCounts[i] ?? 0);
  return {
    points: saved.points,
    totalEarned: saved.totalEarned,
    multiplier: saved.multiplier,
    upgradeCounts: counts,
  };
}

export default function IdleClickerGame() {
  const [saved, setSaved] = useLocalStorage<SavedState>(
    STORAGE_KEYS.IDLE_CLICKER_SAVE,
    IdleClickerSaveSchema,
    toSaved(createInitialState()),
  );
  const [state, setState] = useState<IdleState>(() => fromSaved(saved));
  const [announce, setAnnounce] = useState('');
  const [pulse, setPulse] = useState(false);
  const { vibrate } = useVibration();

  // Persist roughly every 5 seconds.
  useEffect(() => {
    const id = setInterval(() => setSaved(toSaved(state)), 5000);
    return () => clearInterval(id);
  }, [state, setSaved]);

  useEffect(() => {
    return () => {
      setSaved(toSaved(state));
    };
  }, [state, setSaved]);

  useEffect(() => {
    const id = setInterval(() => {
      setState((s) => tickState(s, TICK_MS / 1000));
    }, TICK_MS);
    return () => clearInterval(id);
  }, []);

  const power = useMemo(() => clickPower(state), [state]);
  const rate = useMemo(() => perSecond(state), [state]);
  const prestigeReady = canPrestige(state);

  const handleClick = useCallback(() => {
    vibrate(10);
    setState((s) => doClick(s));
    setPulse(true);
    setTimeout(() => setPulse(false), 120);
  }, [vibrate]);

  const handleBuy = (idx: number) => {
    setState((s) => {
      const cost = upgradeCost(s, idx);
      if (s.points < cost) return s;
      vibrate(20);
      return buyUpgrade(s, idx);
    });
  };

  const handlePrestige = () => {
    if (!prestigeReady) return;
    setState((s) => doPrestige(s));
    vibrate([60, 30, 60]);
    setAnnounce('Prestige! Multiplikator erhöht.');
  };

  const handleReset = () => {
    const fresh = createInitialState();
    setState(fresh);
    setSaved(toSaved(fresh));
    setAnnounce('Komplett zurückgesetzt.');
  };

  return (
    <div className="flex flex-col items-center gap-3 pb-4">
      <AriaLive message={announce} />

      <p
        className="text-4xl font-extrabold tabular-nums text-amber-500 dark:text-amber-400"
        aria-live="off"
      >
        {formatNumber(state.points)}
      </p>
      <p className="text-xs text-slate-500">
        {formatNumber(rate)}/s · Klick: {formatNumber(power)} · Multiplikator: {state.multiplier}×
      </p>

      <button
        type="button"
        onClick={handleClick}
        aria-label="Klicken"
        className={`min-h-32 min-w-32 rounded-full border-4 border-amber-400 bg-gradient-to-br from-amber-300 to-amber-600 text-lg font-extrabold text-slate-900 shadow-[0_6px_20px_rgba(251,191,36,0.35)] transition-transform active:scale-95 ${
          pulse ? 'scale-105 shadow-[0_0_30px_rgba(251,191,36,0.6)]' : ''
        }`}
      >
        Klick!
      </button>

      <div className="flex w-full max-w-md flex-col gap-1.5">
        {IDLE_UPGRADES.map((u, i) => {
          const cost = upgradeCost(state, i);
          const canBuy = state.points >= cost;
          const count = state.upgradeCounts[i] ?? 0;
          return (
            <button
              key={u.id}
              type="button"
              onClick={() => handleBuy(i)}
              disabled={!canBuy}
              className={`flex w-full items-center justify-between gap-3 rounded-xl border px-3 py-2 text-left transition-colors ${
                canBuy
                  ? 'border-amber-400 bg-white hover:bg-amber-50 dark:bg-slate-900 dark:hover:bg-amber-900/30'
                  : 'border-slate-300 bg-slate-50 opacity-50 dark:border-slate-700 dark:bg-slate-900'
              }`}
            >
              <div>
                <div className="text-sm font-bold text-amber-600 dark:text-amber-400">{u.name}</div>
                <div className="text-xs text-slate-500">
                  {u.desc} · besessen: {count}
                </div>
              </div>
              <div className="text-sm font-bold tabular-nums text-amber-600 dark:text-amber-400">
                {formatNumber(cost)}
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex w-full max-w-md flex-col items-center gap-1">
        <Button
          variant="highlight"
          onClick={handlePrestige}
          disabled={!prestigeReady}
          aria-label="Prestige auslösen"
        >
          Prestige ({state.multiplier + Math.floor(Math.log10(Math.max(state.totalEarned, 1)))}×)
        </Button>
        <p className="text-center text-xs text-slate-500">
          Prestige ab {formatNumber(IDLE_PRESTIGE_THRESHOLD)} Gesamtpunkten. Setzt alle Upgrades
          zurück, erhöht aber dauerhaft den Multiplikator.
        </p>
      </div>

      <Button variant="ghost" onClick={handleReset} aria-label="Spielstand löschen">
        Spielstand löschen
      </Button>
    </div>
  );
}
