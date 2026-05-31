import { type CSSProperties, useCallback, useEffect, useRef, useState } from 'react';
import { useAnimationFrame } from '../hooks/useAnimationFrame';
import { useVibration } from '../hooks/useVibration';
import { STORAGE_KEYS } from '../lib/constants';
import { FroggerBestSchema } from '../lib/persistedSchemas';
import { useGameSfx } from '../lib/useGameSfx';
import { useLocalStorage } from '../lib/useLocalStorage';
import AriaLive from './AriaLive';
import Button from './ui/Button';
import Sheet from './ui/Sheet';

const W = 520;
const H = 560;
const ROWS = 13;
const CS = H / ROWS;
const LANE_TYPES = [
  'goal',
  'water',
  'water',
  'water',
  'water',
  'water',
  'safe',
  'road',
  'road',
  'road',
  'road',
  'road',
  'start',
] as const;
type LaneType = (typeof LANE_TYPES)[number];

interface LaneObject {
  x: number;
  y: number;
  w: number;
  h: number;
  speed: number;
  color: string;
}

interface Lane {
  type: LaneType;
  objs: LaneObject[];
}

interface Frog {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface State {
  frog: Frog;
  lives: number;
  score: number;
  level: number;
  goals: boolean[];
  lanes: Lane[];
  gameOver: boolean;
}

const CAR_COLORS = ['#ef4444', '#f97316', '#0ea5e9', '#a855f7'];

function makeLanes(level: number): Lane[] {
  const lanes: Lane[] = [];
  for (let r = 0; r < ROWS; r++) {
    const type = LANE_TYPES[r] ?? 'safe';
    const objs: LaneObject[] = [];
    if (type === 'road') {
      const dir = r % 2 === 0 ? 1 : -1;
      const speed = (0.6 + Math.random() * 0.8 + level * 0.15) * dir;
      const gap = 150 + Math.random() * 80;
      const w = 35 + Math.random() * 30;
      for (let x = -w; x < W + 200; x += gap) {
        objs.push({
          x,
          y: r * CS,
          w,
          h: CS - 4,
          speed,
          color: CAR_COLORS[Math.floor(Math.random() * CAR_COLORS.length)] ?? '#ef4444',
        });
      }
    } else if (type === 'water') {
      const dir = r % 2 === 0 ? 1 : -1;
      const speed = (0.4 + Math.random() * 0.5 + level * 0.1) * dir;
      const w = 90 + Math.random() * 60;
      const gap = w + 30 + Math.random() * 30;
      for (let x = -w; x < W + 200; x += gap) {
        objs.push({ x, y: r * CS, w, h: CS - 2, speed, color: '#92400e' });
      }
    }
    lanes.push({ type, objs });
  }
  return lanes;
}

function createInitial(): State {
  return {
    frog: { x: W / 2 - CS / 2, y: (ROWS - 1) * CS, w: CS - 8, h: CS - 8 },
    lives: 3,
    score: 0,
    level: 1,
    goals: [false, false, false, false, false],
    lanes: makeLanes(1),
    gameOver: false,
  };
}

export default function FroggerGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<State>(createInitial());
  const [hud, setHud] = useState({ score: 0, lives: 3, level: 1 });
  const [overOpen, setOverOpen] = useState(false);
  const [isNewBest, setIsNewBest] = useState(false);
  const [announcement, setAnnouncement] = useState('Pfeile / Tap-Felder zum Hüpfen.');
  const [best, setBest] = useLocalStorage<number>(STORAGE_KEYS.FROGGER_BEST, FroggerBestSchema, 0);

  const sfx = useGameSfx();
  const { vibrate } = useVibration();

  const restart = useCallback(() => {
    stateRef.current = createInitial();
    setHud({ score: 0, lives: 3, level: 1 });
    setOverOpen(false);
    setIsNewBest(false);
    setAnnouncement('Pfeile / Tap-Felder zum Hüpfen.');
  }, []);

  const onDeath = useCallback(() => {
    const s = stateRef.current;
    s.lives--;
    sfx.error();
    vibrate(40);
    if (s.lives <= 0) {
      s.gameOver = true;
      const finalScore = s.score;
      const newBest = finalScore > best;
      if (newBest) setBest(finalScore);
      setIsNewBest(newBest);
      setOverOpen(true);
      setAnnouncement(newBest ? `Vorbei. Neue Bestmarke ${finalScore}` : 'Vorbei');
      sfx.lose();
      vibrate([120, 60, 120]);
    } else {
      s.frog = { x: W / 2 - CS / 2, y: (ROWS - 1) * CS, w: CS - 8, h: CS - 8 };
    }
    setHud({ score: s.score, lives: s.lives, level: s.level });
  }, [best, setBest, sfx, vibrate]);

  const move = useCallback(
    (dr: number, dc: number) => {
      const s = stateRef.current;
      if (s.gameOver) return;
      s.frog.x += dc * CS;
      s.frog.y += dr * CS;
      s.frog.x = Math.max(0, Math.min(W - s.frog.w - 8, s.frog.x));
      s.frog.y = Math.max(0, Math.min((ROWS - 1) * CS, s.frog.y));
      if (dr < 0) {
        s.score += 10;
        setHud({ score: s.score, lives: s.lives, level: s.level });
      }
      sfx.pop();
      vibrate(15);
    },
    [sfx, vibrate],
  );

  useAnimationFrame(() => {
    const s = stateRef.current;
    if (s.gameOver) {
      drawScene();
      return;
    }

    for (const lane of s.lanes) {
      for (const o of lane.objs) {
        o.x += o.speed;
        if (o.speed > 0 && o.x > W + 100) o.x = -o.w - 50;
        if (o.speed < 0 && o.x < -o.w - 100) o.x = W + 50;
      }
    }

    const frogRow = Math.round(s.frog.y / CS);
    const laneType = LANE_TYPES[frogRow];
    if (laneType === 'water') {
      let onLog = false;
      for (const o of s.lanes[frogRow]?.objs ?? []) {
        if (
          s.frog.x + s.frog.w > o.x - 2 &&
          s.frog.x < o.x + o.w + 2 &&
          Math.abs(s.frog.y - o.y) < CS
        ) {
          s.frog.x += o.speed;
          onLog = true;
          break;
        }
      }
      if (!onLog) {
        onDeath();
        return;
      }
    }
    if (laneType === 'road') {
      for (const o of s.lanes[frogRow]?.objs ?? []) {
        if (
          s.frog.x + s.frog.w > o.x + 4 &&
          s.frog.x < o.x + o.w - 4 &&
          Math.abs(s.frog.y - o.y) < CS - 4
        ) {
          onDeath();
          return;
        }
      }
    }
    if (frogRow === 0) {
      const slot = Math.floor((s.frog.x + s.frog.w / 2) / (W / 5));
      if (slot >= 0 && slot < 5 && !s.goals[slot]) {
        s.goals[slot] = true;
        s.score += 100;
        if (s.goals.every(Boolean)) {
          s.level++;
          s.score += 500;
          s.goals = [false, false, false, false, false];
          s.lanes = makeLanes(s.level);
          sfx.win();
        } else {
          sfx.match();
        }
        s.frog = { x: W / 2 - CS / 2, y: (ROWS - 1) * CS, w: CS - 8, h: CS - 8 };
        setHud({ score: s.score, lives: s.lives, level: s.level });
      } else {
        onDeath();
        return;
      }
    }
    if (s.frog.x < -10 || s.frog.x > W + 10) {
      onDeath();
      return;
    }

    drawScene();
  });

  const drawScene = useCallback(() => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const s = stateRef.current;
    for (let r = 0; r < ROWS; r++) {
      const type = LANE_TYPES[r];
      ctx.fillStyle =
        type === 'water'
          ? '#0c4a6e'
          : type === 'road'
            ? '#1f2937'
            : type === 'goal'
              ? '#1e3a8a'
              : '#334155';
      ctx.fillRect(0, r * CS, W, CS);
      if (type === 'road') {
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 1;
        ctx.setLineDash([10, 10]);
        ctx.beginPath();
        ctx.moveTo(0, r * CS + CS / 2);
        ctx.lineTo(W, r * CS + CS / 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }
    for (let i = 0; i < 5; i++) {
      const x = i * (W / 5) + W / 10 - 15;
      ctx.fillStyle = s.goals[i] ? '#10b981' : '#1e3a8a';
      ctx.beginPath();
      ctx.arc(x + 15, CS / 2, 14, 0, Math.PI * 2);
      ctx.fill();
    }
    for (const lane of s.lanes) {
      for (const o of lane.objs) {
        ctx.fillStyle = o.color;
        ctx.fillRect(o.x, o.y + 2, o.w, o.h);
      }
    }
    if (!s.gameOver) {
      ctx.fillStyle = '#10b981';
      ctx.fillRect(s.frog.x + 4, s.frog.y + 4, s.frog.w, s.frog.h);
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(s.frog.x + 12, s.frog.y + 12, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(s.frog.x + s.frog.w - 8, s.frog.y + 12, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          move(-1, 0);
          break;
        case 'ArrowDown':
          e.preventDefault();
          move(1, 0);
          break;
        case 'ArrowLeft':
          e.preventDefault();
          move(0, -1);
          break;
        case 'ArrowRight':
          e.preventDefault();
          move(0, 1);
          break;
        case ' ':
          e.preventDefault();
          if (stateRef.current.gameOver) restart();
          break;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [move, restart]);

  return (
    <div className="flex h-full min-h-0 flex-col items-center gap-3 pb-2">
      <AriaLive message={announcement} />

      <div className="grid w-full max-w-[520px] grid-cols-3 gap-2 text-sm text-surface-700 dark:text-surface-200">
        <div>
          Punkte: <span className="font-semibold tabular-nums">{hud.score}</span>
        </div>
        <div className="text-center">
          Level: <span className="font-semibold tabular-nums">{hud.level}</span>
        </div>
        <div className="text-right">
          Leben: <span className="font-semibold tabular-nums">{hud.lives}</span>
          <span className="mx-2 text-surface-400">·</span>
          Best: <span className="font-semibold tabular-nums">{best}</span>
        </div>
      </div>

      <div className="fit-area mx-auto w-full max-w-[520px]">
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          aria-label="Frogger-Spielfeld"
          className="fit-box rounded-lg bg-slate-900 ring-1 ring-slate-700"
          style={{ '--fit-ar': W / H } as CSSProperties}
        />
      </div>

      <div className="grid w-full max-w-[300px] grid-cols-3 gap-2 sm:hidden">
        <div />
        <button
          type="button"
          aria-label="Nach oben"
          onClick={() => move(-1, 0)}
          className="flex min-h-14 items-center justify-center rounded-xl bg-surface-100 text-2xl active:bg-surface-200 dark:bg-surface-800 dark:active:bg-surface-700"
        >
          ↑
        </button>
        <div />
        <button
          type="button"
          aria-label="Nach links"
          onClick={() => move(0, -1)}
          className="flex min-h-14 items-center justify-center rounded-xl bg-surface-100 text-2xl active:bg-surface-200 dark:bg-surface-800 dark:active:bg-surface-700"
        >
          ←
        </button>
        <button
          type="button"
          aria-label="Nach unten"
          onClick={() => move(1, 0)}
          className="flex min-h-14 items-center justify-center rounded-xl bg-surface-100 text-2xl active:bg-surface-200 dark:bg-surface-800 dark:active:bg-surface-700"
        >
          ↓
        </button>
        <button
          type="button"
          aria-label="Nach rechts"
          onClick={() => move(0, 1)}
          className="flex min-h-14 items-center justify-center rounded-xl bg-surface-100 text-2xl active:bg-surface-200 dark:bg-surface-800 dark:active:bg-surface-700"
        >
          →
        </button>
      </div>

      <Button variant="primary" onClick={restart}>
        Neues Spiel
      </Button>

      <p className="max-w-md text-center text-xs text-surface-500 dark:text-surface-400">
        Bring den Frosch sicher zur Zielreihe oben. Im Wasser musst du auf Baumstämmen reiten.
      </p>

      <Sheet open={overOpen} onClose={() => setOverOpen(false)} title="Spiel vorbei">
        <div className="text-center">
          <div className="mb-2 text-4xl" aria-hidden>
            🐸
          </div>
          {isNewBest && (
            <div className="mb-2 inline-block rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-900 dark:bg-amber-900/40 dark:text-amber-100">
              Neue Bestmarke!
            </div>
          )}
          <p className="mb-4 text-sm text-surface-600 dark:text-surface-300">
            Du hast {hud.score} Punkte erreicht.
          </p>
          <Button variant="primary" block onClick={restart}>
            Nochmal spielen
          </Button>
        </div>
      </Sheet>
    </div>
  );
}
