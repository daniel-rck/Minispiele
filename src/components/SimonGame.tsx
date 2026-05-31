import { useCallback, useEffect, useRef, useState } from 'react';
import { useVibration } from '../hooks/useVibration';
import { useWakeLock } from '../hooks/useWakeLock';
import { ANIMATION, STORAGE_KEYS } from '../lib/constants';
import { SimonBestSchema } from '../lib/persistedSchemas';
import {
  createInitialState,
  extendSequence,
  flashDurationMs,
  pressColor,
  type SimonColor,
  type SimonState,
  startInput,
} from '../lib/simon';
import { ToneAudio } from '../lib/toneAudio';
import { useLocalStorage } from '../lib/useLocalStorage';
import AriaLive from './AriaLive';
import Button from './ui/Button';
import Sheet from './ui/Sheet';

interface PadDef {
  label: string;
  freq: number;
  base: string;
  flash: string;
  position: string;
}

type PadTuple = readonly [PadDef, PadDef, PadDef, PadDef];

const PADS: PadTuple = [
  {
    label: 'Grün',
    freq: 329.63,
    base: 'bg-emerald-600 hover:bg-emerald-500',
    flash: 'bg-emerald-300',
    position: 'rounded-tl-[60%]',
  },
  {
    label: 'Rot',
    freq: 261.63,
    base: 'bg-red-600 hover:bg-red-500',
    flash: 'bg-red-300',
    position: 'rounded-tr-[60%]',
  },
  {
    label: 'Gelb',
    freq: 220.0,
    base: 'bg-amber-500 hover:bg-amber-400',
    flash: 'bg-amber-200',
    position: 'rounded-bl-[60%]',
  },
  {
    label: 'Blau',
    freq: 164.81,
    base: 'bg-sky-600 hover:bg-sky-500',
    flash: 'bg-sky-300',
    position: 'rounded-br-[60%]',
  },
];

const ERROR_FREQ_HZ = 90;
const ERROR_DURATION_MS = 500;
const ROUND_GAP_MS = 700;
const INITIAL_DELAY_MS = 500;

export default function SimonGame() {
  const [state, setState] = useState<SimonState>(createInitialState);
  const [activePad, setActivePad] = useState<SimonColor | null>(null);
  const [best, setBest] = useLocalStorage<number>(STORAGE_KEYS.SIMON_BEST, SimonBestSchema, 0);
  const [lostOpen, setLostOpen] = useState(false);
  const [scoreIsNew, setScoreIsNew] = useState(false);
  const [announcement, setAnnouncement] = useState('');

  const audioRef = useRef<ToneAudio | null>(null);
  const timeoutsRef = useRef<number[]>([]);
  if (audioRef.current === null) audioRef.current = new ToneAudio();

  const { vibrate } = useVibration();
  useWakeLock(state.phase === 'showing' || state.phase === 'input');

  const clearTimeouts = useCallback(() => {
    for (const id of timeoutsRef.current) window.clearTimeout(id);
    timeoutsRef.current = [];
  }, []);

  useEffect(
    () => () => {
      clearTimeouts();
      audioRef.current?.dispose();
      audioRef.current = null;
    },
    [clearTimeouts],
  );

  const playFlash = useCallback((color: SimonColor, durationMs: number, withSound: boolean) => {
    setActivePad(color);
    if (withSound) audioRef.current?.playTone(PADS[color].freq, durationMs);
    const id = window.setTimeout(() => {
      setActivePad((current) => (current === color ? null : current));
    }, durationMs);
    timeoutsRef.current.push(id);
  }, []);

  useEffect(() => {
    if (state.phase !== 'showing') return;
    clearTimeouts();
    const dur = flashDurationMs(state.level);
    const gap = ANIMATION.SIMON_GAP_MS;
    let delay = INITIAL_DELAY_MS;
    for (const color of state.sequence) {
      const captured = color;
      const id = window.setTimeout(() => playFlash(captured, dur, true), delay);
      timeoutsRef.current.push(id);
      delay += dur + gap;
    }
    const switchToInput = window.setTimeout(() => {
      setState((s) => (s.phase === 'showing' ? startInput(s) : s));
    }, delay);
    timeoutsRef.current.push(switchToInput);
  }, [state.phase, state.sequence, state.level, clearTimeouts, playFlash]);

  const handleStart = useCallback(() => {
    clearTimeouts();
    audioRef.current?.prime();
    audioRef.current?.resume();
    setLostOpen(false);
    setScoreIsNew(false);
    setState(() => extendSequence(createInitialState(), Math.random));
    setAnnouncement('Spiel gestartet');
  }, [clearTimeouts]);

  const handlePadPress = useCallback(
    (color: SimonColor) => {
      if (state.phase !== 'input') return;
      const expected = state.sequence[state.inputIdx];
      if (expected === undefined) return;
      const isCorrect = expected === color;
      vibrate(20);
      playFlash(color, ANIMATION.SIMON_PRESS_MS, isCorrect);

      const { state: next, correct, completed } = pressColor(state, color);
      setState(next);

      if (!correct) {
        audioRef.current?.playTone(ERROR_FREQ_HZ, ERROR_DURATION_MS, { type: 'sawtooth' });
        vibrate([80, 60, 80]);
        const reached = state.level;
        const completedLevels = Math.max(0, reached - 1);
        if (completedLevels > best) {
          setBest(completedLevels);
          setScoreIsNew(true);
        } else {
          setScoreIsNew(false);
        }
        setAnnouncement(`Verloren auf Level ${reached}`);
        const openId = window.setTimeout(() => setLostOpen(true), 400);
        timeoutsRef.current.push(openId);
        return;
      }

      if (completed) {
        setAnnouncement(`Level ${state.level} geschafft`);
        const id = window.setTimeout(() => {
          setState((s) =>
            s.phase === 'input' && s.inputIdx === s.sequence.length
              ? extendSequence(s, Math.random)
              : s,
          );
        }, ROUND_GAP_MS);
        timeoutsRef.current.push(id);
      }
    },
    [state, best, setBest, vibrate, playFlash],
  );

  const showStart = state.phase === 'idle' || state.phase === 'lost';
  const showingLabel =
    state.phase === 'showing'
      ? 'Schau zu …'
      : state.phase === 'input'
        ? `Du bist dran (${state.inputIdx + 1} / ${state.sequence.length})`
        : state.phase === 'lost'
          ? 'Verloren'
          : 'Bereit';

  return (
    <div className="flex h-full min-h-0 flex-col items-center gap-4 pb-2">
      <AriaLive message={announcement} />

      <div className="grid w-full grid-cols-3 gap-2 text-sm text-slate-600 dark:text-slate-300">
        <div>
          Level: <span className="font-semibold tabular-nums">{Math.max(1, state.level)}</span>
        </div>
        <div className="text-center" aria-live="polite">
          {showingLabel}
        </div>
        <div className="text-right">
          Best: <span className="font-semibold tabular-nums">{best}</span>
        </div>
      </div>

      <div className="fit-area w-full">
        <div
          className="grid fit-box max-w-md grid-cols-2 grid-rows-2 gap-2 rounded-full bg-slate-900 p-2 dark:bg-slate-950 sm:max-w-lg"
          role="group"
          aria-label="Simon-Felder"
        >
          {PADS.map((pad, idx) => {
            const color = idx as SimonColor;
            const isActive = activePad === color;
            const disabled = state.phase !== 'input';
            return (
              <button
                key={pad.label}
                type="button"
                onClick={() => handlePadPress(color)}
                disabled={disabled}
                aria-label={pad.label}
                className={`relative h-full w-full transition-transform select-none ${pad.position} ${
                  isActive ? pad.flash : pad.base
                } ${disabled ? 'cursor-not-allowed opacity-80' : 'active:scale-[0.98]'}`}
              />
            );
          })}
        </div>
      </div>

      {showStart && (
        <Button variant="primary" block className="max-w-md" onClick={handleStart}>
          {state.phase === 'lost' ? 'Nochmal spielen' : 'Starten'}
        </Button>
      )}

      <Sheet open={lostOpen} onClose={() => setLostOpen(false)} title="Spiel vorbei">
        <div className="text-center">
          <div className="mb-2 text-4xl" aria-hidden>
            💥
          </div>
          {scoreIsNew && (
            <div className="mb-2 inline-block rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-900 dark:bg-amber-900/40 dark:text-amber-100">
              Neue Bestmarke!
            </div>
          )}
          <p className="mb-4 text-sm text-slate-600 dark:text-slate-300">
            Du hast Level {Math.max(0, state.level - 1)} erreicht.
          </p>
          <Button variant="primary" block onClick={handleStart}>
            Nochmal spielen
          </Button>
        </div>
      </Sheet>
    </div>
  );
}
