import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocalStorage } from '../lib/useLocalStorage';
import { STORAGE_KEYS } from '../lib/constants';
import { BreakoutBestSchema } from '../lib/persistedSchemas';
import { useVibration } from '../hooks/useVibration';
import { useAnimationFrame } from '../hooks/useAnimationFrame';
import { particleOpacity, spawnBurst, stepParticles, type Particle } from '../lib/particles';
import BottomSheet from './BottomSheet';
import AriaLive from './AriaLive';

const TRAIL_LENGTH = 6;

const FIELD_W = 320;
const FIELD_H = 480;
const PADDLE_W = 64;
const PADDLE_H = 10;
const BALL_R = 6;
const BRICK_ROWS = 5;
const BRICK_COLS = 8;
const BRICK_W = FIELD_W / BRICK_COLS;
const BRICK_H = 18;
const BRICK_TOP = 40;

const COLORS = ['#ef4444', '#f59e0b', '#eab308', '#22c55e', '#3b82f6'];

interface Brick {
  x: number;
  y: number;
  alive: boolean;
  color: string;
}

interface State {
  paddleX: number;
  ballX: number;
  ballY: number;
  vx: number;
  vy: number;
  bricks: Brick[];
  score: number;
  lives: number;
  status: 'idle' | 'playing' | 'won' | 'lost';
}

function buildBricks(): Brick[] {
  const bricks: Brick[] = [];
  for (let r = 0; r < BRICK_ROWS; r++) {
    for (let c = 0; c < BRICK_COLS; c++) {
      bricks.push({
        x: c * BRICK_W,
        y: BRICK_TOP + r * BRICK_H,
        alive: true,
        color: COLORS[r % COLORS.length]!,
      });
    }
  }
  return bricks;
}

function createState(): State {
  return {
    paddleX: FIELD_W / 2 - PADDLE_W / 2,
    ballX: FIELD_W / 2,
    ballY: FIELD_H - 40,
    vx: 2.6,
    vy: -3.4,
    bricks: buildBricks(),
    score: 0,
    lives: 3,
    status: 'idle',
  };
}

export default function BreakoutGame() {
  const [state, setState] = useState<State>(createState);
  const [best, setBest] = useLocalStorage<number>(
    STORAGE_KEYS.BREAKOUT_BEST,
    BreakoutBestSchema,
    0,
  );
  const [doneOpen, setDoneOpen] = useState(false);
  const [announce, setAnnounce] = useState('');
  const [trail, setTrail] = useState<{ x: number; y: number }[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [paddleFlash, setPaddleFlash] = useState(false);
  const paddleFlashTimerRef = useRef<number | null>(null);
  const stateRef = useRef(state);
  stateRef.current = state;
  const rafRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const finishedRef = useRef(false);
  const { vibrate } = useVibration();

  const flashPaddle = useCallback(() => {
    setPaddleFlash(true);
    if (paddleFlashTimerRef.current !== null) {
      window.clearTimeout(paddleFlashTimerRef.current);
    }
    paddleFlashTimerRef.current = window.setTimeout(() => setPaddleFlash(false), 160);
  }, []);

  useEffect(() => {
    return () => {
      if (paddleFlashTimerRef.current !== null) {
        window.clearTimeout(paddleFlashTimerRef.current);
      }
    };
  }, []);

  const step = useCallback(() => {
    const s = stateRef.current;
    if (s.status !== 'playing') {
      rafRef.current = window.requestAnimationFrame(step);
      return;
    }
    let { ballX, ballY, vx, vy, lives, score } = s;
    let bricks = s.bricks;
    ballX += vx;
    ballY += vy;
    if (ballX < BALL_R) {
      ballX = BALL_R;
      vx = -vx;
    } else if (ballX > FIELD_W - BALL_R) {
      ballX = FIELD_W - BALL_R;
      vx = -vx;
    }
    if (ballY < BALL_R) {
      ballY = BALL_R;
      vy = -vy;
    }
    // paddle
    let paddleHit = false;
    if (ballY > FIELD_H - PADDLE_H - BALL_R - 4 && ballY < FIELD_H - 4) {
      if (ballX > s.paddleX && ballX < s.paddleX + PADDLE_W && vy > 0) {
        vy = -Math.abs(vy);
        const hitPos = (ballX - s.paddleX) / PADDLE_W - 0.5;
        vx = hitPos * 5;
        paddleHit = true;
      }
    }
    // bricks
    let mutated = false;
    const burstParticles: Particle[] = [];
    const newBricks = bricks.map((b) => {
      if (!b.alive) return b;
      if (
        ballX + BALL_R > b.x &&
        ballX - BALL_R < b.x + BRICK_W &&
        ballY + BALL_R > b.y &&
        ballY - BALL_R < b.y + BRICK_H
      ) {
        mutated = true;
        score += 10;
        // simple reflection by deeper axis
        const overlapX = Math.min(ballX + BALL_R - b.x, b.x + BRICK_W - (ballX - BALL_R));
        const overlapY = Math.min(ballY + BALL_R - b.y, b.y + BRICK_H - (ballY - BALL_R));
        if (overlapX < overlapY) vx = -vx;
        else vy = -vy;
        burstParticles.push(
          ...spawnBurst({
            x: b.x + BRICK_W / 2,
            y: b.y + BRICK_H / 2,
            count: 8,
            speed: 1.6,
            color: b.color,
            lifeMs: 500,
            size: 2,
          }),
        );
        return { ...b, alive: false };
      }
      return b;
    });
    if (mutated) bricks = newBricks;
    // bottom
    let status: State['status'] = s.status;
    if (ballY > FIELD_H) {
      lives -= 1;
      if (lives <= 0) {
        status = 'lost';
      } else {
        ballX = FIELD_W / 2;
        ballY = FIELD_H - 40;
        vx = 2.6;
        vy = -3.4;
      }
    }
    if (status !== 'lost') {
      const aliveLeft = bricks.some((b) => b.alive);
      status = !aliveLeft ? 'won' : 'playing';
    }
    // Commit state via updater so concurrent paddle updates aren't clobbered.
    setState((prev) => ({ ...prev, ballX, ballY, vx, vy, bricks, score, lives, status }));
    if (burstParticles.length > 0) {
      setParticles((p) => [...p, ...burstParticles]);
    }
    setTrail((t) => {
      const next = [{ x: ballX, y: ballY }, ...t];
      if (next.length > TRAIL_LENGTH) next.length = TRAIL_LENGTH;
      return next;
    });
    if (paddleHit) {
      vibrate(8);
      flashPaddle();
    }
    rafRef.current = window.requestAnimationFrame(step);
  }, [vibrate, flashPaddle]);

  // particles loop (independent of game step so they keep flying briefly after a hit)
  useAnimationFrame((delta) => {
    setParticles((prev) => stepParticles(prev, delta, 0.05));
  }, particles.length > 0);

  useEffect(() => {
    if (state.status === 'playing') {
      rafRef.current = window.requestAnimationFrame(step);
      return () => {
        if (rafRef.current !== null) window.cancelAnimationFrame(rafRef.current);
      };
    }
  }, [state.status, step]);

  useEffect(() => {
    if ((state.status === 'won' || state.status === 'lost') && !finishedRef.current) {
      finishedRef.current = true;
      if (state.score > best) setBest(state.score);
      setAnnounce(
        state.status === 'won'
          ? `Gewonnen mit ${state.score} Punkten`
          : `Verloren mit ${state.score} Punkten`,
      );
      vibrate(state.status === 'won' ? [40, 30, 60] : [80, 60, 80]);
      const id = window.setTimeout(() => setDoneOpen(true), 400);
      return () => window.clearTimeout(id);
    }
  }, [state.status, state.score, best, setBest, vibrate]);

  const start = () => {
    finishedRef.current = false;
    setDoneOpen(false);
    setTrail([]);
    setParticles([]);
    setPaddleFlash(false);
    setState({ ...createState(), status: 'playing' });
  };

  const movePaddle = useCallback((clientX: number) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const ratio = (clientX - rect.left) / rect.width;
    const px = ratio * FIELD_W - PADDLE_W / 2;
    setState((s) => ({
      ...s,
      paddleX: Math.max(0, Math.min(FIELD_W - PADDLE_W, px)),
    }));
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        setState((s) => ({ ...s, paddleX: Math.max(0, s.paddleX - 24) }));
      } else if (e.key === 'ArrowRight') {
        setState((s) => ({ ...s, paddleX: Math.min(FIELD_W - PADDLE_W, s.paddleX + 24) }));
      } else if (e.key === ' ' && state.status === 'idle') {
        e.preventDefault();
        start();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [state.status]);

  return (
    <div className="flex flex-col items-center gap-3 pb-4">
      <AriaLive message={announce} />

      <div className="grid w-full max-w-md grid-cols-3 gap-2 text-sm text-slate-600 dark:text-slate-300">
        <div>
          Punkte: <span className="font-semibold tabular-nums">{state.score}</span>
        </div>
        <div className="text-center">
          Leben: <span className="font-semibold tabular-nums">{state.lives}</span>
        </div>
        <div className="text-right">
          Best: <span className="font-semibold tabular-nums">{best}</span>
        </div>
      </div>

      <div
        ref={containerRef}
        className="relative w-full max-w-md touch-none select-none overflow-hidden rounded-2xl bg-slate-900 dark:bg-slate-950"
        style={{ aspectRatio: `${FIELD_W} / ${FIELD_H}` }}
        onPointerDown={(e) => {
          e.preventDefault();
          movePaddle(e.clientX);
        }}
        onPointerMove={(e) => {
          if (e.buttons || e.pointerType === 'touch') movePaddle(e.clientX);
        }}
        role="application"
        aria-label="Breakout-Spielfeld"
      >
        <svg viewBox={`0 0 ${FIELD_W} ${FIELD_H}`} className="absolute inset-0 h-full w-full">
          {state.bricks.map(
            (b, i) =>
              b.alive && (
                <rect
                  key={i}
                  x={b.x + 1}
                  y={b.y + 1}
                  width={BRICK_W - 2}
                  height={BRICK_H - 2}
                  rx={2}
                  fill={b.color}
                />
              ),
          )}
          <rect
            x={state.paddleX}
            y={FIELD_H - PADDLE_H - 4}
            width={PADDLE_W}
            height={PADDLE_H}
            rx={3}
            fill={paddleFlash ? '#fde68a' : '#e2e8f0'}
          />
          {trail.map((p, i) => (
            <circle
              key={i}
              cx={p.x}
              cy={p.y}
              r={BALL_R * (1 - i / TRAIL_LENGTH)}
              fill="#fcd34d"
              opacity={(1 - i / TRAIL_LENGTH) * 0.35}
            />
          ))}
          <circle cx={state.ballX} cy={state.ballY} r={BALL_R} fill="#fcd34d" />
          {particles.map((p, i) => (
            <circle
              key={i}
              cx={p.x}
              cy={p.y}
              r={p.size}
              fill={p.color}
              opacity={particleOpacity(p)}
            />
          ))}
        </svg>
        {state.status === 'idle' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <button
              type="button"
              onClick={start}
              className="min-h-12 rounded-xl bg-brand-600 px-6 py-3 text-base font-medium text-white hover:bg-brand-700"
            >
              Starten
            </button>
          </div>
        )}
      </div>

      <p className="max-w-md text-center text-xs text-slate-500">
        Bewege das Paddel mit dem Finger oder den Pfeiltasten. Halte den Ball im Spiel und räume
        alle Ziegel ab.
      </p>

      <BottomSheet
        open={doneOpen}
        onClose={() => setDoneOpen(false)}
        title={state.status === 'won' ? 'Gewonnen!' : 'Spiel vorbei'}
      >
        <div className="text-center">
          <div className="mb-2 text-4xl" aria-hidden>
            {state.status === 'won' ? '🏆' : '💔'}
          </div>
          <p className="mb-4 text-sm text-slate-600 dark:text-slate-300">
            {state.status === 'won'
              ? `Alle Ziegel abgeräumt mit ${state.score} Punkten.`
              : `Du erreichst ${state.score} Punkte.`}
          </p>
          <button
            type="button"
            onClick={start}
            className="min-h-12 w-full rounded-xl bg-brand-600 px-4 text-sm font-medium text-white hover:bg-brand-700"
          >
            Nochmal spielen
          </button>
        </div>
      </BottomSheet>
    </div>
  );
}
