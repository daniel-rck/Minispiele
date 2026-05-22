import { useCallback, useEffect, useRef, useState } from 'react';
import { useVibration } from '../hooks/useVibration';
import { STORAGE_KEYS } from '../lib/constants';
import { WhackAMoleBestSchema } from '../lib/persistedSchemas';
import { useGameSfx } from '../lib/useGameSfx';
import { useLocalStorage } from '../lib/useLocalStorage';
import AriaLive from './AriaLive';
import Button from './ui/Button';

const HOLES = 9;
const GAME_DURATION = 30;

export default function WhackAMoleGame() {
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [active, setActive] = useState<Set<number>>(() => new Set());
  const [running, setRunning] = useState(false);
  const [announcement, setAnnouncement] = useState('Klicke „Neues Spiel" zum Starten.');
  const [best, setBest] = useLocalStorage<number>(
    STORAGE_KEYS.WHACK_A_MOLE_BEST,
    WhackAMoleBestSchema,
    0,
  );
  const startedAt = useRef<number | null>(null);
  const moleTimeoutRef = useRef<number | null>(null);
  const hideTimeoutsRef = useRef<Map<number, number>>(new Map());

  const sfx = useGameSfx();
  const { vibrate } = useVibration();

  const cleanup = useCallback(() => {
    if (moleTimeoutRef.current) {
      window.clearTimeout(moleTimeoutRef.current);
      moleTimeoutRef.current = null;
    }
    for (const id of hideTimeoutsRef.current.values()) window.clearTimeout(id);
    hideTimeoutsRef.current.clear();
    // Invalidate any in-flight spawnMole callbacks — they guard on this ref.
    startedAt.current = null;
  }, []);

  useEffect(() => () => cleanup(), [cleanup]);

  const endGame = useCallback(
    (finalScore: number) => {
      setRunning(false);
      cleanup();
      setActive(new Set());
      if (finalScore > best) {
        setBest(finalScore);
        setAnnouncement(`Zeit vorbei. Neue Bestmarke: ${finalScore} Punkte.`);
        sfx.win();
        vibrate([60, 40, 120]);
      } else {
        setAnnouncement(`Zeit vorbei. ${finalScore} Punkte.`);
        sfx.lose();
      }
    },
    [best, setBest, sfx, vibrate, cleanup],
  );

  const spawnMole = useCallback(() => {
    if (!startedAt.current) return;
    const elapsed = Math.floor((Date.now() - startedAt.current) / 1000);
    const maxActive = Math.min(1 + Math.floor(elapsed / 8), 4);

    setActive((current) => {
      if (current.size >= maxActive) {
        moleTimeoutRef.current = window.setTimeout(spawnMole, 200);
        return current;
      }
      let hole = -1;
      for (let attempts = 0; attempts < 20; attempts++) {
        const h = Math.floor(Math.random() * HOLES);
        if (!current.has(h)) {
          hole = h;
          break;
        }
      }
      if (hole < 0) {
        moleTimeoutRef.current = window.setTimeout(spawnMole, 200);
        return current;
      }
      const next = new Set(current);
      next.add(hole);
      const showTime = Math.max(600, 1200 - elapsed * 20);
      const hideId = window.setTimeout(() => {
        setActive((s) => {
          if (!s.has(hole)) return s;
          const n = new Set(s);
          n.delete(hole);
          return n;
        });
        hideTimeoutsRef.current.delete(hole);
      }, showTime);
      hideTimeoutsRef.current.set(hole, hideId);
      const spawnDelay = Math.max(500, 900 - elapsed * 15);
      moleTimeoutRef.current = window.setTimeout(spawnMole, spawnDelay);
      return next;
    });
  }, []);

  const startGame = useCallback(() => {
    cleanup();
    setScore(0);
    setTimeLeft(GAME_DURATION);
    setActive(new Set());
    setRunning(true);
    setAnnouncement('Erwische die Maulwürfe.');
    startedAt.current = Date.now();
    window.setTimeout(spawnMole, 300);
  }, [cleanup, spawnMole]);

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      if (!startedAt.current) return;
      const elapsed = Math.floor((Date.now() - startedAt.current) / 1000);
      const left = Math.max(0, GAME_DURATION - elapsed);
      setTimeLeft(left);
      if (left <= 0) {
        endGame(score);
      }
    }, 250);
    return () => window.clearInterval(id);
  }, [running, score, endGame]);

  const whack = useCallback(
    (i: number) => {
      if (!running) return;
      setActive((s) => {
        if (!s.has(i)) {
          // Miss
          vibrate(40);
          sfx.error();
          return s;
        }
        // Hit
        vibrate(20);
        sfx.match();
        setScore((sc) => sc + 1);
        const hide = hideTimeoutsRef.current.get(i);
        if (hide) {
          window.clearTimeout(hide);
          hideTimeoutsRef.current.delete(i);
        }
        const n = new Set(s);
        n.delete(i);
        return n;
      });
    },
    [running, sfx, vibrate],
  );

  return (
    <div className="flex flex-col items-center gap-3 pb-4">
      <AriaLive message={announcement} />

      <div className="grid w-full max-w-md grid-cols-3 gap-2 text-sm text-surface-700 dark:text-surface-200">
        <div>
          Punkte: <span className="font-semibold tabular-nums">{score}</span>
        </div>
        <div className="text-center">
          Zeit: <span className="font-semibold tabular-nums">{timeLeft}</span>s
        </div>
        <div className="text-right">
          Best: <span className="font-semibold tabular-nums">{best}</span>
        </div>
      </div>

      <Button variant="primary" onClick={startGame}>
        {running ? 'Neu starten' : 'Neues Spiel'}
      </Button>

      <div
        className="grid w-full max-w-md grid-cols-3 gap-3 rounded-2xl bg-emerald-800 p-3"
        role="group"
        aria-label="Whack-a-Mole-Feld"
      >
        {Array.from({ length: HOLES }).map((_, i) => {
          const isUp = active.has(i);
          return (
            <button
              key={i}
              type="button"
              onClick={() => whack(i)}
              disabled={!running}
              aria-label={`Loch ${i + 1}${isUp ? ' — Maulwurf!' : ''}`}
              className="relative aspect-square overflow-hidden rounded-full bg-amber-900 ring-2 ring-amber-950 transition-colors active:bg-amber-800 disabled:cursor-not-allowed"
            >
              <span
                aria-hidden
                className={`absolute inset-x-2 bottom-0 flex h-2/3 items-end justify-center text-4xl transition-transform duration-150 ${
                  isUp ? 'translate-y-0' : 'translate-y-full'
                }`}
              >
                🐹
              </span>
            </button>
          );
        })}
      </div>

      <p className="max-w-md text-center text-xs text-surface-500 dark:text-surface-400">
        30 Sekunden. Klicke Maulwürfe, sobald sie auftauchen — je länger das Spiel dauert, desto
        schneller werden sie.
      </p>
    </div>
  );
}
