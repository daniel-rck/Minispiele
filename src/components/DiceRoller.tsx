import { useCallback, useEffect, useRef, useState } from 'react';
import {
  DICE_COLOR_PALETTE,
  DICE_PRESETS,
  DIE_FACES,
  DIE_TYPES,
  MAX_DICE,
  buildPreset,
  createDie,
  readableTextColor,
  rollAll,
  rollDie,
  setDieType,
  sumValues,
  toggleHeld,
  type Die,
  type DieType,
} from '../lib/dice';
import { ANIMATION, STORAGE_KEYS } from '../lib/constants';
import { PersistedDiceSchema, type PersistedDie } from '../lib/persistedSchemas';

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

function D6Pips({ value, color }: { value: number; color: string }) {
  const dots = D6_PIP_POSITIONS[value] ?? [];
  return (
    <svg viewBox="0 0 60 60" aria-hidden className="w-full h-full" role="img">
      {dots.map(([col, row], i) => (
        <circle key={i} cx={15 + col * 15} cy={15 + row * 15} r={5.5} fill={color} />
      ))}
    </svg>
  );
}

function DieFace({ die, rolling }: { die: Die; rolling: boolean }) {
  const fg = readableTextColor(die.color);
  return (
    <div
      className={`relative aspect-square w-full rounded-2xl shadow-inner border border-black/10 dark:border-white/10 flex items-center justify-center transition-transform duration-200 ${
        rolling ? 'scale-95 rotate-6' : 'scale-100 rotate-0'
      }`}
      style={{ backgroundColor: die.color }}
      aria-label={`Würfel ${die.type}: ${die.value}`}
    >
      {die.type === 'd6' ? (
        <div className="w-3/4 h-3/4" style={{ color: fg }}>
          <D6Pips value={die.value} color={fg} />
        </div>
      ) : (
        <div className="text-3xl sm:text-4xl font-bold tabular-nums" style={{ color: fg }}>
          {die.value}
        </div>
      )}
      <div
        className="absolute bottom-1 right-2 text-[10px] sm:text-xs font-medium uppercase opacity-70"
        style={{ color: fg }}
      >
        {die.type}
      </div>
    </div>
  );
}

export default function DiceRoller() {
  const [dice, setDice] = useState<Die[]>(() => loadDice() ?? defaultDice());
  const [rollingIds, setRollingIds] = useState<ReadonlySet<string>>(new Set());
  const rollTimeoutsRef = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    persistDice(dice);
  }, [dice]);

  useEffect(() => {
    const timeouts = rollTimeoutsRef.current;
    return () => {
      timeouts.forEach((t) => window.clearTimeout(t));
      timeouts.clear();
    };
  }, []);

  const animateRoll = useCallback((ids: readonly string[]) => {
    if (ids.length === 0) return;
    const timeouts = rollTimeoutsRef.current;
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
      }, ANIMATION.DICE_ROLL_MS);
      timeouts.set(id, t);
    });
  }, []);

  const handleRollAll = useCallback(() => {
    setDice((prev) => {
      const next = rollAll(prev);
      animateRoll(next.filter((d, i) => d !== prev[i]).map((d) => d.id));
      return next;
    });
  }, [animateRoll]);

  const handleRollOne = useCallback(
    (id: string) => {
      setDice((prev) => {
        let changed = false;
        const next = prev.map((d) => {
          if (d.id !== id) return d;
          changed = true;
          return rollDie(d);
        });
        if (changed) animateRoll([id]);
        return next;
      });
    },
    [animateRoll],
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

  const handlePreset = useCallback((presetId: string) => {
    const preset = DICE_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    setDice(buildPreset(preset));
  }, []);

  const heldCount = dice.filter((d) => d.held).length;
  const sum = sumValues(dice);

  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 flex flex-wrap gap-2 items-center">
        <span className="text-sm text-slate-600 dark:text-slate-300">Vorlagen:</span>
        {DICE_PRESETS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => handlePreset(p.id)}
            className="rounded-lg border border-slate-300 dark:border-slate-700 px-2.5 py-1 text-sm hover:border-brand-300"
          >
            {p.label} <span className="text-slate-500 dark:text-slate-400">({p.description})</span>
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={handleAddDie}
            disabled={dice.length >= MAX_DICE}
            className="rounded-lg border border-slate-300 dark:border-slate-700 px-2.5 py-1 text-sm disabled:opacity-50 hover:border-brand-300"
          >
            + Würfel
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleRollAll}
          className="rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-medium px-4 py-2.5 text-base"
        >
          🎲 Würfeln
        </button>
        <button
          type="button"
          onClick={handleReleaseAll}
          disabled={heldCount === 0}
          className="rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-1.5 text-sm disabled:opacity-50 hover:border-brand-300"
        >
          Alle freigeben
        </button>
        <div className="ml-auto text-sm text-slate-600 dark:text-slate-300">
          Summe: <span className="font-semibold tabular-nums">{sum}</span>
          {heldCount > 0 && (
            <span className="ml-3">
              gehalten: <span className="font-semibold tabular-nums">{heldCount}</span>
            </span>
          )}
        </div>
      </div>

      <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {dice.map((die) => {
          const rolling = rollingIds.has(die.id);
          return (
            <li
              key={die.id}
              className={`rounded-2xl border-2 p-3 flex flex-col gap-2 bg-white dark:bg-slate-900 transition ${
                die.held
                  ? 'border-brand-500 ring-2 ring-brand-500/30'
                  : 'border-slate-200 dark:border-slate-800'
              }`}
            >
              <button
                type="button"
                onClick={() => handleRollOne(die.id)}
                aria-label={`Würfel ${die.type} (${die.value}) neu werfen`}
                className="w-full"
              >
                <DieFace die={die} rolling={rolling} />
              </button>
              <div className="flex items-center gap-2 flex-wrap">
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
                  className="rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs px-1 py-0.5"
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
                  className="ml-auto rounded-md border border-slate-300 dark:border-slate-700 text-xs px-1.5 py-0.5 disabled:opacity-50 hover:border-red-400"
                >
                  ✕
                </button>
              </div>
              <div className="flex items-center gap-1 flex-wrap">
                {DICE_COLOR_PALETTE.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => handleColorChange(die.id, c)}
                    aria-label={`Farbe ${c}`}
                    aria-pressed={die.color.toLowerCase() === c.toLowerCase()}
                    className={`h-5 w-5 rounded-full border ${
                      die.color.toLowerCase() === c.toLowerCase()
                        ? 'border-brand-500 ring-2 ring-brand-500/40'
                        : 'border-slate-300 dark:border-slate-700'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
                <label
                  className="relative ml-1 h-5 w-5 rounded-full border border-slate-300 dark:border-slate-700 cursor-pointer overflow-hidden"
                  title="Eigene Farbe"
                >
                  <span
                    aria-hidden
                    className="absolute inset-0 rounded-full"
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
                    className="absolute inset-0 h-full w-full opacity-0 cursor-pointer"
                  />
                </label>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
