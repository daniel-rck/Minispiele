import { useCallback, useEffect, useRef, useState } from 'react';
import {
  LEVELS,
  isSolved,
  loadLevel,
  move,
  undo,
  type SokobanDirection,
  type SokobanState,
} from '../lib/sokoban';
import { useLocalStorage } from '../lib/useLocalStorage';
import { STORAGE_KEYS } from '../lib/constants';
import { SokobanBestSchema, SokobanLevelSchema } from '../lib/persistedSchemas';
import { useVibration } from '../hooks/useVibration';
import Sheet from './ui/Sheet';
import AriaLive from './AriaLive';

export default function SokobanGame() {
  const [levelIdx, setLevelIdx] = useLocalStorage<number>(
    STORAGE_KEYS.SOKOBAN_LEVEL,
    SokobanLevelSchema,
    0,
  );
  const [bestMap, setBestMap] = useLocalStorage<Record<string, number>>(
    STORAGE_KEYS.SOKOBAN_BEST,
    SokobanBestSchema,
    {},
  );
  const [state, setState] = useState<SokobanState>(() => loadLevel(levelIdx));
  const [winOpen, setWinOpen] = useState(false);
  const [scoreIsNew, setScoreIsNew] = useState(false);
  const [announce, setAnnounce] = useState('');
  const wonRef = useRef(false);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const { vibrate } = useVibration();

  const solved = isSolved(state);

  useEffect(() => {
    if (solved && !wonRef.current) {
      wonRef.current = true;
      const key = String(levelIdx);
      const prev = bestMap[key];
      if (prev === undefined || state.moves < prev) {
        setBestMap({ ...bestMap, [key]: state.moves });
        setScoreIsNew(true);
      } else {
        setScoreIsNew(false);
      }
      setWinOpen(true);
      setAnnounce(`Level gelöst in ${state.moves} Zügen`);
      vibrate([40, 30, 60]);
    }
  }, [solved, state.moves, levelIdx, bestMap, setBestMap, vibrate]);

  const restart = useCallback(
    (idx: number = levelIdx) => {
      setState(loadLevel(idx));
      setWinOpen(false);
      setScoreIsNew(false);
      wonRef.current = false;
    },
    [levelIdx],
  );

  const changeLevel = (n: number) => {
    setLevelIdx(n);
    restart(n);
  };

  const nextLevel = () => {
    const n = (levelIdx + 1) % LEVELS.length;
    changeLevel(n);
  };

  const handleMove = useCallback(
    (dir: SokobanDirection) => {
      if (solved) return;
      setState((s) => {
        const next = move(s, dir);
        if (next !== s) vibrate(10);
        return next;
      });
    },
    [solved, vibrate],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      let dir: SokobanDirection | null = null;
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          dir = 'up';
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          dir = 'down';
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          dir = 'left';
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          dir = 'right';
          break;
        case 'u':
        case 'U':
        case 'z':
        case 'Z':
          e.preventDefault();
          setState((s) => undo(s));
          return;
      }
      if (dir) {
        e.preventDefault();
        handleMove(dir);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleMove]);

  const onTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    const t = e.touches[0];
    if (!t) return;
    touchStartRef.current = { x: t.clientX, y: t.clientY };
  };

  const onTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    const start = touchStartRef.current;
    const t = e.changedTouches[0];
    if (!start || !t) return;
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;
    if (Math.abs(dx) < 20 && Math.abs(dy) < 20) return;
    if (Math.abs(dx) > Math.abs(dy)) handleMove(dx > 0 ? 'right' : 'left');
    else handleMove(dy > 0 ? 'down' : 'up');
    touchStartRef.current = null;
  };

  const best = bestMap[String(levelIdx)];

  return (
    <div className="flex flex-col items-center gap-3 pb-4">
      <AriaLive message={announce} />

      <div className="flex flex-wrap items-center justify-center gap-3">
        <label className="flex items-center gap-2 text-sm">
          <span className="text-slate-600 dark:text-slate-300">Level:</span>
          <select
            value={levelIdx}
            onChange={(e) => changeLevel(Number(e.target.value))}
            className="min-h-11 rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-900"
          >
            {LEVELS.map((_, i) => (
              <option key={i} value={i}>
                Level {i + 1}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid w-full max-w-md grid-cols-2 gap-2 text-sm text-slate-600 dark:text-slate-300">
        <div>
          Züge: <span className="font-semibold tabular-nums">{state.moves}</span>
        </div>
        <div className="text-right">
          {best !== undefined ? (
            <>
              Best: <span className="font-semibold tabular-nums">{best}</span>
            </>
          ) : (
            <span className="text-slate-400">—</span>
          )}
        </div>
      </div>

      <div
        className="touch-none select-none rounded-2xl bg-slate-800 p-2 dark:bg-slate-900"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <div
          className="grid gap-px"
          style={{ gridTemplateColumns: `repeat(${state.cols}, minmax(0, 1fr))` }}
          role="grid"
          aria-label="Sokoban-Spielfeld"
        >
          {Array.from({ length: state.rows * state.cols }, (_, idx) => {
            const wall = state.walls[idx];
            const target = state.targets[idx];
            const box = state.boxes[idx];
            const player = state.player === idx;
            let content = '';
            let cls = 'bg-amber-50 dark:bg-amber-900/20';
            if (wall) {
              cls = 'bg-slate-600 dark:bg-slate-700';
            } else if (player && target) {
              content = '🙂';
              cls = 'bg-emerald-200 dark:bg-emerald-900/40';
            } else if (player) {
              content = '🙂';
            } else if (box && target) {
              content = '🟩';
              cls = 'bg-emerald-300 dark:bg-emerald-900/40';
            } else if (box) {
              content = '📦';
            } else if (target) {
              content = '·';
              cls = 'bg-emerald-100 dark:bg-emerald-900/30';
            }
            return (
              <div
                key={idx}
                className={`flex aspect-square min-w-[26px] items-center justify-center text-base sm:text-xl ${cls}`}
                aria-label={
                  wall ? 'Wand' : player ? 'Spieler' : box ? 'Kiste' : target ? 'Ziel' : 'Boden'
                }
              >
                {content}
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid w-full max-w-xs grid-cols-3 gap-2" role="group" aria-label="Steuerung">
        <span />
        <button
          type="button"
          onClick={() => handleMove('up')}
          className="min-h-12 rounded-xl bg-slate-100 text-lg font-bold dark:bg-slate-800"
          aria-label="Hoch"
        >
          ↑
        </button>
        <span />
        <button
          type="button"
          onClick={() => handleMove('left')}
          className="min-h-12 rounded-xl bg-slate-100 text-lg font-bold dark:bg-slate-800"
          aria-label="Links"
        >
          ←
        </button>
        <button
          type="button"
          onClick={() => setState((s) => undo(s))}
          className="min-h-12 rounded-xl bg-slate-100 text-sm font-bold dark:bg-slate-800"
          aria-label="Rückgängig"
        >
          ↩
        </button>
        <button
          type="button"
          onClick={() => handleMove('right')}
          className="min-h-12 rounded-xl bg-slate-100 text-lg font-bold dark:bg-slate-800"
          aria-label="Rechts"
        >
          →
        </button>
        <span />
        <button
          type="button"
          onClick={() => handleMove('down')}
          className="min-h-12 rounded-xl bg-slate-100 text-lg font-bold dark:bg-slate-800"
          aria-label="Runter"
        >
          ↓
        </button>
        <span />
      </div>

      <button
        type="button"
        onClick={() => restart()}
        className="min-h-12 w-full max-w-md rounded-xl bg-brand-600 px-4 text-sm font-medium text-white hover:bg-brand-700"
      >
        Level neustarten
      </button>

      <Sheet open={winOpen} onClose={() => setWinOpen(false)} title="Level gelöst!">
        <div className="text-center">
          <div className="mb-2 text-4xl" aria-hidden>
            📦
          </div>
          {scoreIsNew && (
            <div className="mb-2 inline-block rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-900 dark:bg-amber-900/40 dark:text-amber-100">
              Neue Bestleistung!
            </div>
          )}
          <p className="mb-4 text-sm text-slate-600 dark:text-slate-300">
            Level {levelIdx + 1} in {state.moves} Zügen geschafft.
          </p>
          <button
            type="button"
            onClick={nextLevel}
            className="min-h-12 w-full rounded-xl bg-brand-600 px-4 text-sm font-medium text-white hover:bg-brand-700"
          >
            Nächstes Level
          </button>
        </div>
      </Sheet>
    </div>
  );
}
