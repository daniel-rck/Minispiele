import { useCallback, useEffect, useRef, useState } from 'react';
import { ANIMATION, HAPTICS, STORAGE_KEYS } from '../lib/constants';
import {
  buildPreset,
  createDie,
  DICE_COLOR_PALETTE,
  DICE_PRESETS,
  DIE_FACES,
  DIE_TYPES,
  type Die,
  type DieType,
  MAX_DICE,
  maxValue,
  minValue,
  type RollMode,
  readableTextColor,
  rollAllWithMode,
  rollDie,
  rollWithMode,
  setDieType,
  sumValues,
  toggleHeld,
} from '../lib/dice';
import { parseNotation } from '../lib/diceNotation';
import { DiceSound } from '../lib/diceSound';
import {
  type DiceHistory,
  type DiceHistoryEntry,
  DiceHistorySchema,
  DiceModifierSchema,
  DiceRollDurationSchema,
  PersistedDiceSchema,
  type PersistedDie,
} from '../lib/persistedSchemas';
import { useLocalStorage } from '../lib/useLocalStorage';
import AriaLive from './AriaLive';
import Button from './ui/Button';
import Sheet from './ui/Sheet';

const D6_PIP_POSITIONS: Record<number, ReadonlyArray<readonly [number, number]>> = {
  1: [[1, 1]],
  2: [
    [0, 0],
    [2, 2],
  ],
  3: [
    [0, 0],
    [1, 1],
    [2, 2],
  ],
  4: [
    [0, 0],
    [0, 2],
    [2, 0],
    [2, 2],
  ],
  5: [
    [0, 0],
    [0, 2],
    [1, 1],
    [2, 0],
    [2, 2],
  ],
  6: [
    [0, 0],
    [0, 1],
    [0, 2],
    [2, 0],
    [2, 1],
    [2, 2],
  ],
};

const HISTORY_MAX = 20;

function hydrateDice(persisted: readonly PersistedDie[]): Die[] {
  return persisted.slice(0, MAX_DICE).map((d) => ({
    ...createDie(d.type, d.color),
    color: d.color,
    held: d.held,
    value: Math.min(Math.max(1, Math.floor(d.value)), DIE_FACES[d.type]),
  }));
}

function defaultDice(): Die[] {
  const preset = DICE_PRESETS[0];
  if (preset) return buildPreset(preset);
  return [createDie('d6', DICE_COLOR_PALETTE[0] ?? '#f8fafc')];
}

function loadDice(): Die[] | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.DICE_STATE);
    if (!raw) return null;
    const parsed = PersistedDiceSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) return null;
    if (parsed.data.length === 0) return null;
    const filtered = parsed.data.filter((d) => (DIE_TYPES as readonly DieType[]).includes(d.type));
    return filtered.length > 0 ? hydrateDice(filtered) : null;
  } catch {
    return null;
  }
}

function persistDice(dice: readonly Die[]): void {
  if (typeof window === 'undefined') return;
  try {
    const slim: PersistedDie[] = dice.map((d) => ({
      type: d.type,
      color: d.color,
      value: d.value,
      held: d.held,
    }));
    window.localStorage.setItem(STORAGE_KEYS.DICE_STATE, JSON.stringify(slim));
  } catch (err) {
    console.warn('persistDice: write failed', err);
  }
}

function vibrate(pattern: number | number[]): void {
  if (typeof navigator === 'undefined') return;
  if (typeof navigator.vibrate === 'function') {
    try {
      navigator.vibrate(pattern);
    } catch {
      /* no-op */
    }
  }
}

function buildHistoryEntry(dice: readonly Die[], modifier: number): DiceHistoryEntry {
  return {
    id: `h-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    at: Date.now(),
    sum: sumValues(dice) + modifier,
    dice: dice.map((d) => ({ type: d.type, value: d.value })),
  };
}

function formatModifier(modifier: number): string {
  if (modifier === 0) return '';
  return modifier > 0 ? ` +${modifier}` : ` ${modifier}`;
}

function modeLabel(mode: RollMode): string {
  switch (mode) {
    case 'advantage':
      return 'Vorteil';
    case 'disadvantage':
      return 'Nachteil';
    default:
      return 'Normal';
  }
}

function D6Pips({ value, color }: { value: number; color: string }) {
  const dots = D6_PIP_POSITIONS[value] ?? [];
  return (
    <svg viewBox="0 0 60 60" aria-hidden className="h-full w-full" role="img">
      {dots.map(([col, row], i) => (
        <circle key={i} cx={15 + col * 15} cy={15 + row * 15} r={5.5} fill={color} />
      ))}
    </svg>
  );
}

function DieFace({
  die,
  rolling,
  displayValue,
  rollDurationMs,
}: {
  die: Die;
  rolling: boolean;
  displayValue: number;
  rollDurationMs: number;
}) {
  const fg = readableTextColor(die.color);
  return (
    <div className="dice-perspective">
      <div
        key={rolling ? `roll-${rollDurationMs}` : 'idle'}
        className={`relative flex aspect-square w-full items-center justify-center rounded-2xl border border-black/10 shadow-inner dark:border-white/10 ${
          rolling ? 'dice-tumble' : ''
        }`}
        style={{
          backgroundColor: die.color,
          animationDuration: rolling ? `${rollDurationMs}ms` : undefined,
        }}
        aria-label={`Würfel ${die.type}: ${die.value}`}
      >
        {die.type === 'd6' ? (
          <div className="h-3/4 w-3/4" style={{ color: fg }}>
            <D6Pips value={displayValue} color={fg} />
          </div>
        ) : (
          <div className="text-3xl font-bold tabular-nums sm:text-4xl" style={{ color: fg }}>
            {displayValue}
          </div>
        )}
        <div
          className="absolute right-2 bottom-1 text-[10px] font-medium uppercase opacity-70 sm:text-xs"
          style={{ color: fg }}
        >
          {die.type}
        </div>
      </div>
    </div>
  );
}

export default function DiceRoller() {
  const [dice, setDice] = useState<Die[]>(() => loadDice() ?? defaultDice());
  const [rollingIds, setRollingIds] = useState<ReadonlySet<string>>(new Set());
  const [cycleValues, setCycleValues] = useState<ReadonlyMap<string, number>>(new Map());
  const [mode, setMode] = useState<RollMode>('normal');
  const [notationInput, setNotationInput] = useState('');
  const [notationError, setNotationError] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [modifier, setModifier] = useLocalStorage<number>(
    STORAGE_KEYS.DICE_MODIFIER,
    DiceModifierSchema,
    0,
  );
  const [rollDuration, setRollDuration] = useLocalStorage<number>(
    STORAGE_KEYS.DICE_ROLL_DURATION,
    DiceRollDurationSchema,
    ANIMATION.DICE_ROLL_DEFAULT_MS,
  );
  const [history, setHistory] = useLocalStorage<DiceHistory>(
    STORAGE_KEYS.DICE_HISTORY,
    DiceHistorySchema,
    [],
  );
  const [lastAnnouncement, setLastAnnouncement] = useState('');

  const rollTimeoutsRef = useRef<Map<string, number>>(new Map());
  const settleTimeoutRef = useRef<number | null>(null);
  const cycleIntervalRef = useRef<number | null>(null);
  const diceRef = useRef<Die[]>(dice);
  diceRef.current = dice;
  const rollingIdsRef = useRef<ReadonlySet<string>>(rollingIds);
  rollingIdsRef.current = rollingIds;
  const soundRef = useRef<DiceSound | null>(null);
  if (soundRef.current === null) soundRef.current = new DiceSound();

  useEffect(() => {
    if (rollingIds.size === 0) {
      if (cycleIntervalRef.current !== null) {
        window.clearInterval(cycleIntervalRef.current);
        cycleIntervalRef.current = null;
      }
      if (cycleValues.size > 0) setCycleValues(new Map());
      return;
    }
    if (cycleIntervalRef.current !== null) return;
    const tick = () => {
      const active = rollingIdsRef.current;
      if (active.size === 0) return;
      const next = new Map<string, number>();
      const currentDice = diceRef.current;
      currentDice.forEach((d) => {
        if (active.has(d.id)) {
          const faces = DIE_FACES[d.type];
          next.set(d.id, Math.floor(Math.random() * faces) + 1);
        }
      });
      setCycleValues(next);
    };
    tick();
    cycleIntervalRef.current = window.setInterval(tick, ANIMATION.DICE_CYCLE_INTERVAL_MS);
    return () => {
      if (cycleIntervalRef.current !== null) {
        window.clearInterval(cycleIntervalRef.current);
        cycleIntervalRef.current = null;
      }
    };
  }, [rollingIds, cycleValues.size]);

  useEffect(() => {
    persistDice(dice);
  }, [dice]);

  useEffect(() => {
    const timeouts = rollTimeoutsRef.current;
    return () => {
      timeouts.forEach((t) => window.clearTimeout(t));
      timeouts.clear();
      if (settleTimeoutRef.current !== null) {
        window.clearTimeout(settleTimeoutRef.current);
        settleTimeoutRef.current = null;
      }
      soundRef.current?.dispose();
      soundRef.current = null;
    };
  }, []);

  const animateRoll = useCallback(
    (ids: readonly string[]) => {
      if (ids.length === 0) return;
      const timeouts = rollTimeoutsRef.current;
      soundRef.current?.playRoll(rollDuration, ids.length);
      setRollingIds((prev) => {
        const next = new Set(prev);
        ids.forEach((id) => next.add(id));
        return next;
      });
      ids.forEach((id) => {
        const existing = timeouts.get(id);
        if (existing !== undefined) window.clearTimeout(existing);
        const t = window.setTimeout(() => {
          timeouts.delete(id);
          setRollingIds((prev) => {
            if (!prev.has(id)) return prev;
            const next = new Set(prev);
            next.delete(id);
            return next;
          });
        }, rollDuration);
        timeouts.set(id, t);
      });
      if (settleTimeoutRef.current !== null) window.clearTimeout(settleTimeoutRef.current);
      settleTimeoutRef.current = window.setTimeout(() => {
        settleTimeoutRef.current = null;
        soundRef.current?.playSettle(ids.length);
      }, rollDuration);
    },
    [rollDuration],
  );

  const recordHistory = useCallback(
    (next: readonly Die[]) => {
      const entry = buildHistoryEntry(next, modifier);
      setHistory((prev) => [entry, ...prev].slice(0, HISTORY_MAX));
      const summary =
        next.length === 1 ? `${entry.sum}` : `Summe ${entry.sum} aus ${next.length} Würfeln`;
      setLastAnnouncement(`${summary} (${modeLabel(mode)})`);
    },
    [mode, modifier, setHistory],
  );

  const handleRollAll = useCallback(() => {
    vibrate(HAPTICS.DICE_TAP);
    setDice((prev) => {
      const next = rollAllWithMode(prev, mode);
      animateRoll(next.filter((d, i) => d !== prev[i]).map((d) => d.id));
      recordHistory(next);
      if (mode !== 'normal') setMode('normal');
      return next;
    });
  }, [animateRoll, mode, recordHistory]);

  const handleRollOne = useCallback(
    (id: string) => {
      setDice((prev) => {
        let changed = false;
        const next = prev.map((d) => {
          if (d.id !== id) return d;
          changed = true;
          return mode === 'normal' ? rollDie(d) : rollWithMode(d, mode);
        });
        if (changed) {
          vibrate(HAPTICS.DICE_TAP);
          animateRoll([id]);
          recordHistory(next);
        }
        return next;
      });
    },
    [animateRoll, mode, recordHistory],
  );

  const handleToggleHold = useCallback((id: string) => {
    setDice((prev) => prev.map((d) => (d.id === id ? toggleHeld(d) : d)));
  }, []);

  const handleColorChange = useCallback((id: string, color: string) => {
    setDice((prev) => prev.map((d) => (d.id === id ? { ...d, color } : d)));
  }, []);

  const handleTypeChange = useCallback((id: string, type: DieType) => {
    setDice((prev) => prev.map((d) => (d.id === id ? setDieType(d, type) : d)));
  }, []);

  const handleAddDie = useCallback(() => {
    setDice((prev) => {
      if (prev.length >= MAX_DICE) return prev;
      const last = prev[prev.length - 1];
      const type = last?.type ?? 'd6';
      const color = last?.color ?? DICE_COLOR_PALETTE[0] ?? '#f8fafc';
      return [...prev, createDie(type, color)];
    });
  }, []);

  const handleRemoveDie = useCallback((id: string) => {
    setDice((prev) => (prev.length <= 1 ? prev : prev.filter((d) => d.id !== id)));
  }, []);

  const handleReleaseAll = useCallback(() => {
    setDice((prev) => prev.map((d) => (d.held ? { ...d, held: false } : d)));
  }, []);

  const handlePreset = useCallback(
    (presetId: string) => {
      const preset = DICE_PRESETS.find((p) => p.id === presetId);
      if (!preset) return;
      setDice(buildPreset(preset));
      setModifier(0);
    },
    [setModifier],
  );

  const handleNotationApply = useCallback(() => {
    const parsed = parseNotation(notationInput);
    if (!parsed) {
      setNotationError('Ungültig — z. B. 3d6+2, d20');
      return;
    }
    const color = DICE_COLOR_PALETTE[0] ?? '#f8fafc';
    const next: Die[] = Array.from({ length: parsed.count }, () => createDie(parsed.type, color));
    setDice(next);
    setModifier(parsed.modifier);
    setNotationError(null);
    setNotationInput('');
  }, [notationInput, setModifier]);

  const handleClearHistory = useCallback(() => {
    setHistory([]);
  }, [setHistory]);

  const heldCount = dice.filter((d) => d.held).length;
  const rawSum = sumValues(dice);
  const sum = rawSum + modifier;
  const min = dice.length > 1 ? minValue(dice) : null;
  const max = dice.length > 1 ? maxValue(dice) : null;

  return (
    <div className="flex flex-col gap-4 pb-32">
      <AriaLive message={lastAnnouncement} />

      <div className="rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500 uppercase">Vorlagen</span>
          <button
            type="button"
            onClick={handleAddDie}
            disabled={dice.length >= MAX_DICE}
            className="min-h-9 rounded-lg border border-slate-300 px-2 py-1 text-xs hover:border-brand-300 disabled:opacity-50 dark:border-slate-700"
          >
            + Würfel
          </button>
        </div>
        <div className="-mx-1 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:thin]">
          {DICE_PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => handlePreset(p.id)}
              className="min-h-11 shrink-0 snap-start rounded-lg border border-slate-300 px-3 py-1.5 text-sm whitespace-nowrap hover:border-brand-300 dark:border-slate-700"
            >
              <span className="font-medium">{p.label}</span>{' '}
              <span className="text-slate-500 dark:text-slate-400">({p.description})</span>
            </button>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <label className="flex flex-1 items-center gap-2 text-sm">
            <span className="text-slate-600 dark:text-slate-300">Notation:</span>
            <input
              type="text"
              value={notationInput}
              onChange={(e) => {
                setNotationInput(e.target.value);
                setNotationError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleNotationApply();
              }}
              placeholder="3d6+2"
              inputMode="text"
              enterKeyHint="go"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              className="min-h-11 min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-base dark:border-slate-700 dark:bg-slate-900"
            />
          </label>
          <button
            type="button"
            onClick={handleNotationApply}
            disabled={notationInput.trim().length === 0}
            className="min-h-11 rounded-lg border border-brand-500 px-3 py-1.5 text-sm font-medium text-brand-700 hover:bg-brand-50 disabled:opacity-50 dark:text-brand-300 dark:hover:bg-brand-900/30"
          >
            Setzen
          </button>
        </div>
        {notationError && (
          <p role="alert" className="mt-2 text-xs text-red-600 dark:text-red-400">
            {notationError}
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
        <div>
          Summe: <span className="font-semibold tabular-nums">{sum}</span>
          {modifier !== 0 && (
            <span className="ml-1 text-xs text-slate-500">
              ({rawSum}
              {formatModifier(modifier)})
            </span>
          )}
        </div>
        {modifier !== 0 && (
          <button
            type="button"
            onClick={() => setModifier(0)}
            aria-label={`Modifier${formatModifier(modifier)} entfernen`}
            className="inline-flex min-h-9 items-center gap-1 rounded-full border border-brand-300 bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-800 hover:border-brand-500 dark:border-brand-700 dark:bg-brand-900/30 dark:text-brand-200"
          >
            <span className="tabular-nums">{formatModifier(modifier).trim()}</span>
            <span aria-hidden>✕</span>
          </button>
        )}
        {min !== null && (
          <div>
            Min: <span className="font-semibold tabular-nums">{min}</span>
          </div>
        )}
        {max !== null && (
          <div>
            Max: <span className="font-semibold tabular-nums">{max}</span>
          </div>
        )}
        {heldCount > 0 && (
          <div>
            gehalten: <span className="font-semibold tabular-nums">{heldCount}</span>
          </div>
        )}
        <button
          type="button"
          onClick={handleReleaseAll}
          disabled={heldCount === 0}
          className="min-h-9 rounded-lg border border-slate-300 px-2 py-1 text-xs hover:border-brand-300 disabled:opacity-50 dark:border-slate-700"
        >
          Alle freigeben
        </button>
        <button
          type="button"
          onClick={() => setHistoryOpen(true)}
          className="ml-auto min-h-9 rounded-lg border border-slate-300 px-2 py-1 text-xs hover:border-brand-300 dark:border-slate-700"
        >
          Verlauf
          {history.length > 0 && (
            <span className="ml-1 inline-block rounded-full bg-brand-100 px-1.5 py-0.5 text-[10px] font-semibold text-brand-700 dark:bg-brand-900/50 dark:text-brand-200">
              {history.length}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => setSettingsOpen(true)}
          aria-label="Einstellungen"
          className="min-h-9 rounded-lg border border-slate-300 px-2 py-1 text-xs hover:border-brand-300 dark:border-slate-700"
        >
          ⚙︎
        </button>
      </div>

      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {dice.map((die) => {
          const rolling = rollingIds.has(die.id);
          return (
            <li
              key={die.id}
              className={`flex flex-col gap-2 rounded-2xl border-2 bg-white p-3 transition dark:bg-slate-900 ${
                die.held
                  ? 'border-brand-500 ring-2 ring-brand-500/30'
                  : 'border-slate-200 dark:border-slate-800'
              }`}
            >
              <button
                type="button"
                onClick={() => handleRollOne(die.id)}
                aria-label={`Würfel ${die.type} (${die.value}) neu werfen`}
                className="w-full touch-manipulation"
              >
                <DieFace
                  die={die}
                  rolling={rolling}
                  displayValue={rolling ? (cycleValues.get(die.id) ?? die.value) : die.value}
                  rollDurationMs={rollDuration}
                />
              </button>
              <div className="flex flex-wrap items-center gap-2">
                <label className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={die.held}
                    onChange={() => handleToggleHold(die.id)}
                    className="h-4 w-4"
                  />
                  Halten
                </label>
                <select
                  value={die.type}
                  onChange={(e) => handleTypeChange(die.id, e.target.value as DieType)}
                  aria-label="Würfeltyp"
                  className="rounded-md border border-slate-300 bg-white px-1 py-0.5 text-xs dark:border-slate-700 dark:bg-slate-900"
                >
                  {DIE_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t.toUpperCase()}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => handleRemoveDie(die.id)}
                  disabled={dice.length <= 1}
                  aria-label="Würfel entfernen"
                  className="ml-auto rounded-md border border-slate-300 px-1.5 py-0.5 text-xs hover:border-red-400 disabled:opacity-50 dark:border-slate-700"
                >
                  ✕
                </button>
              </div>
              <div className="-mx-1 flex gap-0.5 overflow-x-auto px-1 pb-1 [scrollbar-width:thin]">
                {DICE_COLOR_PALETTE.map((c) => {
                  const active = die.color.toLowerCase() === c.toLowerCase();
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => handleColorChange(die.id, c)}
                      aria-label={`Farbe ${c}`}
                      aria-pressed={active}
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
                    >
                      <span
                        aria-hidden
                        className={`h-7 w-7 rounded-full border ${
                          active
                            ? 'border-brand-500 ring-2 ring-brand-500/40'
                            : 'border-slate-300 dark:border-slate-700'
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    </button>
                  );
                })}
                <label
                  className="relative flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center"
                  title="Eigene Farbe"
                >
                  <span
                    aria-hidden
                    className="h-7 w-7 rounded-full border border-slate-300 dark:border-slate-700"
                    style={{
                      background:
                        'conic-gradient(from 90deg, #ef4444, #f97316, #eab308, #22c55e, #06b6d4, #3b82f6, #8b5cf6, #ec4899, #ef4444)',
                    }}
                  />
                  <input
                    type="color"
                    aria-label="Eigene Farbe wählen"
                    value={die.color}
                    onChange={(e) => handleColorChange(die.id, e.target.value)}
                    className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                  />
                </label>
              </div>
            </li>
          );
        })}
      </ul>

      <div
        className="fixed inset-x-0 bottom-0 z-10 border-t border-slate-200 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="mx-auto max-w-3xl px-4 py-3">
          <div
            role="radiogroup"
            aria-label="Wurfmodus"
            className="mb-2 flex justify-center gap-1 text-xs"
          >
            {(['normal', 'advantage', 'disadvantage'] as const).map((m) => (
              <button
                key={m}
                type="button"
                role="radio"
                aria-checked={mode === m}
                onClick={() => setMode(m)}
                className={`min-h-9 rounded-full border px-3 py-1 ${
                  mode === m
                    ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-200'
                    : 'border-slate-300 hover:border-brand-300 dark:border-slate-700'
                }`}
              >
                {modeLabel(m)}
              </button>
            ))}
          </div>
          <Button
            variant="primary"
            size="lg"
            block
            className="touch-manipulation"
            onClick={handleRollAll}
          >
            🎲 Würfeln{mode !== 'normal' ? ` · ${modeLabel(mode)}` : ''}
          </Button>
        </div>
      </div>

      <Sheet open={settingsOpen} onClose={() => setSettingsOpen(false)} title="Einstellungen">
        <div className="flex flex-col gap-4">
          <div>
            <div className="mb-1 flex items-baseline justify-between">
              <label htmlFor="dice-roll-duration" className="text-sm font-medium">
                Würfel-Animation
              </label>
              <span className="text-xs tabular-nums text-slate-500">
                {(rollDuration / 1000).toFixed(1)}s
              </span>
            </div>
            <input
              id="dice-roll-duration"
              type="range"
              min={ANIMATION.DICE_ROLL_MIN_MS}
              max={ANIMATION.DICE_ROLL_MAX_MS}
              step={50}
              value={rollDuration}
              onChange={(e) => setRollDuration(Number(e.target.value))}
              className="w-full"
            />
            <div className="mt-2 flex flex-wrap gap-2">
              {(
                [
                  ['Schnell', 400],
                  ['Normal', ANIMATION.DICE_ROLL_DEFAULT_MS],
                  ['Langsam', 1600],
                ] as const
              ).map(([label, ms]) => {
                const active = rollDuration === ms;
                return (
                  <button
                    key={label}
                    type="button"
                    onClick={() => setRollDuration(ms)}
                    aria-pressed={active}
                    className={`min-h-9 rounded-full border px-3 py-1 text-xs ${
                      active
                        ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-200'
                        : 'border-slate-300 hover:border-brand-300 dark:border-slate-700'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              const ids = diceRef.current.map((d) => d.id);
              animateRoll(ids);
            }}
            className="min-h-11 rounded-lg border border-brand-500 px-3 text-sm font-medium text-brand-700 hover:bg-brand-50 dark:text-brand-300 dark:hover:bg-brand-900/30"
          >
            Vorschau
          </button>
        </div>
      </Sheet>

      <Sheet
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        title={`Verlauf (${history.length})`}
      >
        {history.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-500">Noch keine Würfe.</p>
        ) : (
          <>
            <ul className="max-h-[60vh] divide-y divide-slate-200 overflow-y-auto dark:divide-slate-800">
              {history.map((entry) => (
                <li key={entry.id} className="flex items-center justify-between py-2 text-sm">
                  <span className="text-slate-600 dark:text-slate-300">
                    {entry.dice.map((d, i) => (
                      <span key={i} className="mr-1.5">
                        <span className="text-xs text-slate-400">{d.type}</span>{' '}
                        <span className="font-medium tabular-nums">{d.value}</span>
                      </span>
                    ))}
                  </span>
                  <span className="font-semibold tabular-nums">{entry.sum}</span>
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={handleClearHistory}
              className="mt-4 min-h-11 w-full rounded-lg border border-red-300 px-3 text-sm text-red-700 hover:bg-red-50 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-950/40"
            >
              Verlauf löschen
            </button>
          </>
        )}
      </Sheet>
    </div>
  );
}
