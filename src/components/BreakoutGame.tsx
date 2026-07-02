import { useCallback, useEffect, useRef, useState } from 'react';
import { useAnimationFrame } from '../hooks/useAnimationFrame';
import { useVibration } from '../hooks/useVibration';
import { STORAGE_KEYS } from '../lib/constants';
import { type Particle, particleOpacity, spawnBurst, stepParticles } from '../lib/particles';
import { BreakoutBestSchema } from '../lib/persistedSchemas';
import { useGameSfx } from '../lib/useGameSfx';
import { useLocalStorage } from '../lib/useLocalStorage';
import AriaLive from './AriaLive';
import Button from './ui/Button';
import Sheet from './ui/Sheet';

// Reference frame duration: speeds are tuned in px per 60fps frame.
const BASE_FRAME_MS = 1000 / 60;
const TRAIL_LENGTH = 6;

const FIELD_W = 480;
const FIELD_H = 400;
const PADDLE_H = 10;
const PADDLE_Y = FIELD_H - 20;
const BASE_PADDLE_W = 72;
const MAX_PADDLE_W = 132;
const BALL_R = 5;
const BRICK_ROWS = 7;
const BRICK_COLS = 10;
const BRICK_LEFT = 8;
const BRICK_TOP = 28;
const BRICK_GAP = 2;
const BRICK_W = (FIELD_W - 2 * BRICK_LEFT - BRICK_GAP * (BRICK_COLS - 1)) / BRICK_COLS;
const BRICK_H = 14;

const ROW_COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899'];
const ROW_POINTS = [70, 60, 50, 40, 30, 20, 10];

const POWERUP_DROP_CHANCE = 0.22;
const POWERUP_SPEED = 1.4;
const POWERUP_R = 8;

type PowerUpType = 'wide' | 'slow';

const POWERUP_COLORS: Record<PowerUpType, string> = {
  wide: '#22c55e',
  slow: '#f97316',
};

const POWERUP_LABELS: Record<PowerUpType, string> = {
  wide: 'W',
  slow: 'S',
};

interface Brick {
  col: number;
  row: number;
  x: number;
  y: number;
  alive: boolean;
  color: string;
  points: number;
  hp: number;
  maxHp: number;
}

interface PowerUp {
  id: number;
  x: number;
  y: number;
  type: PowerUpType;
}

type Status = 'idle' | 'ready' | 'playing' | 'lost';

interface State {
  paddleX: number;
  paddleW: number;
  ballX: number;
  ballY: number;
  vx: number;
  vy: number;
  stuck: boolean;
  bricks: Brick[];
  powerUps: PowerUp[];
  score: number;
  lives: number;
  level: number;
  status: Status;
}

function baseSpeedForLevel(level: number): number {
  return 3.2 + Math.min(level - 1, 6) * 0.35;
}

function buildBricks(level: number): Brick[] {
  const bricks: Brick[] = [];
  for (let r = 0; r < BRICK_ROWS; r++) {
    for (let c = 0; c < BRICK_COLS; c++) {
      const hp = r < 2 && level >= 2 ? 2 : 1;
      bricks.push({
        col: c,
        row: r,
        x: BRICK_LEFT + c * (BRICK_W + BRICK_GAP),
        y: BRICK_TOP + r * (BRICK_H + BRICK_GAP),
        alive: true,
        color: ROW_COLORS[r]!,
        points: ROW_POINTS[r]!,
        hp,
        maxHp: hp,
      });
    }
  }
  return bricks;
}

function spawnBall(
  level: number,
  paddleX: number,
  paddleW: number,
): Pick<State, 'ballX' | 'ballY' | 'vx' | 'vy' | 'stuck'> {
  const speed = baseSpeedForLevel(level);
  return {
    ballX: paddleX + paddleW / 2,
    ballY: PADDLE_Y - BALL_R - 1,
    vx: speed * 0.6,
    vy: -speed,
    stuck: true,
  };
}

function createState(): State {
  const paddleW = BASE_PADDLE_W;
  const paddleX = FIELD_W / 2 - paddleW / 2;
  return {
    paddleX,
    paddleW,
    ...spawnBall(1, paddleX, paddleW),
    bricks: buildBricks(1),
    powerUps: [],
    score: 0,
    lives: 3,
    level: 1,
    status: 'idle',
  };
}

let powerUpIdSeed = 1;

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
  const lastTimeRef = useRef<number | null>(null);
  const frameAccRef = useRef(0);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const finishedRef = useRef(false);
  const lastLevelRef = useRef(1);
  const { vibrate } = useVibration();
  const sfx = useGameSfx();

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

  const step = useCallback(
    (now: number) => {
      const s = stateRef.current;
      if (s.status !== 'playing') {
        lastTimeRef.current = now;
        rafRef.current = window.requestAnimationFrame(step);
        return;
      }
      // Fixed-timestep: die Physik ist in px pro 60fps-Frame getunt, also wird
      // pro RAF so oft simuliert, wie ganze Referenz-Frames vergangen sind —
      // auf 120-Hz-Displays lief das Spiel sonst doppelt so schnell.
      const prev = lastTimeRef.current ?? now - BASE_FRAME_MS;
      lastTimeRef.current = now;
      frameAccRef.current = Math.min(
        frameAccRef.current + Math.min(now - prev, 100),
        4 * BASE_FRAME_MS,
      );
      const iterations = Math.floor(frameAccRef.current / BASE_FRAME_MS);
      frameAccRef.current -= iterations * BASE_FRAME_MS;
      if (iterations === 0) {
        rafRef.current = window.requestAnimationFrame(step);
        return;
      }
      let { ballX, ballY, vx, vy, lives, score, paddleW, level } = s;
      let status: Status = s.status;
      let bricks = s.bricks;
      let powerUps = s.powerUps;
      let paddleHit = false;
      let caughtPowerUp: PowerUpType | null = null;
      let stuck = false;
      const burstParticles: Particle[] = [];

      for (let iter = 0; iter < iterations && status === 'playing'; iter++) {
        // Move ball (unless stuck, but in 'playing' state it's never stuck)
        ballX += vx;
        ballY += vy;

        // Wall bounces
        if (ballX < BALL_R) {
          ballX = BALL_R;
          vx = Math.abs(vx);
        } else if (ballX > FIELD_W - BALL_R) {
          ballX = FIELD_W - BALL_R;
          vx = -Math.abs(vx);
        }
        if (ballY < BALL_R) {
          ballY = BALL_R;
          vy = Math.abs(vy);
        }

        // Paddle bounce
        if (vy > 0 && ballY + BALL_R >= PADDLE_Y && ballY + BALL_R <= PADDLE_Y + PADDLE_H) {
          if (ballX > s.paddleX && ballX < s.paddleX + paddleW) {
            const hitPos = (ballX - s.paddleX - paddleW / 2) / (paddleW / 2);
            const speed = Math.sqrt(vx * vx + vy * vy);
            const angle = hitPos * (Math.PI / 3);
            vx = speed * Math.sin(angle);
            vy = -Math.abs(speed * Math.cos(angle));
            ballY = PADDLE_Y - BALL_R - 1;
            paddleHit = true;
          }
        }

        // Brick collisions
        let mutated = false;
        let bounced = false;
        let scoreDelta = 0;
        const newPowerUps: PowerUp[] = [];
        const newBricks = bricks.map((b) => {
          if (!b.alive) return b;
          if (
            ballX + BALL_R > b.x &&
            ballX - BALL_R < b.x + BRICK_W &&
            ballY + BALL_R > b.y &&
            ballY - BALL_R < b.y + BRICK_H
          ) {
            const overlapX = Math.min(ballX + BALL_R - b.x, b.x + BRICK_W - (ballX - BALL_R));
            const overlapY = Math.min(ballY + BALL_R - b.y, b.y + BRICK_H - (ballY - BALL_R));
            // Nur am ersten getroffenen Stein abprallen — zwei gleichzeitige
            // Treffer hoben die Richtungsumkehr sonst wieder auf
            if (!bounced) {
              if (overlapX < overlapY) vx = -vx;
              else vy = -vy;
              bounced = true;
            }

            mutated = true;
            const remaining = b.hp - 1;
            if (remaining <= 0) {
              scoreDelta += b.points * level;
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
              if (Math.random() < POWERUP_DROP_CHANCE) {
                const type: PowerUpType = Math.random() < 0.55 ? 'wide' : 'slow';
                newPowerUps.push({
                  id: powerUpIdSeed++,
                  x: b.x + BRICK_W / 2,
                  y: b.y + BRICK_H / 2,
                  type,
                });
              }
              return { ...b, alive: false, hp: 0 };
            }
            return { ...b, hp: remaining };
          }
          return b;
        });
        if (mutated) {
          bricks = newBricks;
          score += scoreDelta;
          sfx.pop();
        }
        if (newPowerUps.length > 0) {
          powerUps = [...powerUps, ...newPowerUps];
        }

        // Power-up movement and catch
        let caughtThisStep: PowerUpType | null = null;
        if (powerUps.length > 0) {
          const next: PowerUp[] = [];
          for (const p of powerUps) {
            const ny = p.y + POWERUP_SPEED;
            if (ny > FIELD_H + POWERUP_R) continue;
            if (
              ny + POWERUP_R >= PADDLE_Y &&
              ny - POWERUP_R <= PADDLE_Y + PADDLE_H &&
              p.x >= s.paddleX &&
              p.x <= s.paddleX + paddleW
            ) {
              caughtThisStep = p.type;
              caughtPowerUp = p.type;
              continue;
            }
            next.push({ ...p, y: ny });
          }
          powerUps = next;
        }
        if (caughtThisStep === 'wide') {
          paddleW = Math.min(MAX_PADDLE_W, paddleW + 18);
        } else if (caughtThisStep === 'slow') {
          vx *= 0.78;
          vy *= 0.78;
        }

        // Ball lost
        if (ballY > FIELD_H + BALL_R) {
          lives -= 1;
          if (lives <= 0) {
            status = 'lost';
          } else {
            const respawn = spawnBall(level, s.paddleX, paddleW);
            ballX = respawn.ballX;
            ballY = respawn.ballY;
            vx = respawn.vx;
            vy = respawn.vy;
            stuck = true;
            status = 'ready';
          }
        }

        // Level complete
        if (status === 'playing' && !bricks.some((b) => b.alive)) {
          level += 1;
          bricks = buildBricks(level);
          const respawn = spawnBall(level, s.paddleX, BASE_PADDLE_W);
          ballX = respawn.ballX;
          ballY = respawn.ballY;
          vx = respawn.vx;
          vy = respawn.vy;
          paddleW = BASE_PADDLE_W;
          powerUps = [];
          stuck = true;
          status = 'ready';
        }
      }

      setState((p) => ({
        ...p,
        ballX,
        ballY,
        vx,
        vy,
        bricks,
        powerUps,
        paddleW,
        score,
        lives,
        level,
        status,
        stuck,
      }));
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
      if (caughtPowerUp) {
        vibrate([12, 20, 12]);
        sfx.win();
      }
      rafRef.current = window.requestAnimationFrame(step);
    },
    [vibrate, flashPaddle, sfx],
  );

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
    if (state.status === 'lost' && !finishedRef.current) {
      finishedRef.current = true;
      if (state.score > best) setBest(state.score);
      setAnnounce(`Verloren mit ${state.score} Punkten in Level ${state.level}`);
      vibrate([80, 60, 80]);
      sfx.lose();
      const id = window.setTimeout(() => setDoneOpen(true), 400);
      return () => window.clearTimeout(id);
    }
  }, [state.status, state.score, state.level, best, setBest, vibrate, sfx]);

  useEffect(() => {
    if (state.level !== lastLevelRef.current && state.status === 'ready') {
      lastLevelRef.current = state.level;
      if (state.level > 1) {
        setAnnounce(`Level ${state.level} erreicht`);
      }
    }
  }, [state.level, state.status]);

  const start = useCallback(() => {
    finishedRef.current = false;
    setDoneOpen(false);
    setTrail([]);
    setParticles([]);
    setPaddleFlash(false);
    lastLevelRef.current = 1;
    setState({ ...createState(), status: 'ready' });
  }, []);

  const launch = useCallback(() => {
    setState((s) => {
      if (s.status !== 'ready') return s;
      return { ...s, stuck: false, status: 'playing' };
    });
  }, []);

  const movePaddle = useCallback((clientX: number) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (rect.width <= 0) return;
    const ratio = (clientX - rect.left) / rect.width;
    setState((s) => {
      const px = Math.max(0, Math.min(FIELD_W - s.paddleW, ratio * FIELD_W - s.paddleW / 2));
      if (s.stuck) {
        return { ...s, paddleX: px, ballX: px + s.paddleW / 2 };
      }
      return { ...s, paddleX: px };
    });
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const canSteer = state.status === 'playing' || state.status === 'ready';
      if (e.key === 'ArrowLeft' && canSteer) {
        setState((s) => {
          const px = Math.max(0, s.paddleX - 22);
          if (s.stuck) return { ...s, paddleX: px, ballX: px + s.paddleW / 2 };
          return { ...s, paddleX: px };
        });
      } else if (e.key === 'ArrowRight' && canSteer) {
        setState((s) => {
          const px = Math.min(FIELD_W - s.paddleW, s.paddleX + 22);
          if (s.stuck) return { ...s, paddleX: px, ballX: px + s.paddleW / 2 };
          return { ...s, paddleX: px };
        });
      } else if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        if (state.status === 'idle' || state.status === 'lost') start();
        else if (state.status === 'ready') launch();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [state.status, start, launch]);

  return (
    <div className="flex flex-col items-center gap-3 pb-4">
      <AriaLive message={announce} />

      <div className="grid w-full max-w-md grid-cols-4 gap-1 text-sm text-slate-600 dark:text-slate-300">
        <div>
          Punkte: <span className="font-semibold tabular-nums">{state.score}</span>
        </div>
        <div className="text-center">
          Level: <span className="font-semibold tabular-nums">{state.level}</span>
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
          // Capture, damit der Drag weiterläuft, wenn der Finger das Feld verlässt
          e.currentTarget.setPointerCapture?.(e.pointerId);
          movePaddle(e.clientX);
          if (state.status === 'ready') launch();
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
                <g key={i}>
                  <rect
                    x={b.x}
                    y={b.y}
                    width={BRICK_W}
                    height={BRICK_H}
                    rx={2}
                    fill={b.hp > 1 ? '#f1f5f9' : b.color}
                  />
                  {b.hp > 1 && (
                    <rect
                      x={b.x + 2}
                      y={b.y + 2}
                      width={BRICK_W - 4}
                      height={BRICK_H - 4}
                      rx={1.5}
                      fill={b.color}
                    />
                  )}
                </g>
              ),
          )}
          {state.powerUps.map((p) => (
            <g key={p.id}>
              <circle cx={p.x} cy={p.y} r={POWERUP_R} fill={POWERUP_COLORS[p.type]} />
              <text
                x={p.x}
                y={p.y + 3.5}
                textAnchor="middle"
                fontSize="10"
                fontWeight="bold"
                fill="#fff"
              >
                {POWERUP_LABELS[p.type]}
              </text>
            </g>
          ))}
          <rect
            x={state.paddleX}
            y={PADDLE_Y}
            width={state.paddleW}
            height={PADDLE_H}
            rx={4}
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
            <Button variant="primary" onClick={start}>
              Starten
            </Button>
          </div>
        )}
        {state.status === 'ready' && state.lives > 0 && (
          <div className="pointer-events-none absolute inset-x-0 bottom-12 flex justify-center">
            <span className="rounded-full bg-black/70 px-3 py-1 text-xs text-slate-100">
              Tippen oder Leertaste zum Starten
            </span>
          </div>
        )}
      </div>

      <p className="max-w-md text-center text-xs text-slate-500">
        Bewege das Paddel mit dem Finger oder den Pfeiltasten. Räume Ziegel ab, fange grüne (W) für
        ein breiteres Paddel und orange (S) für langsameren Ball. Ab Level 2 brauchen die obersten
        Reihen zwei Treffer.
      </p>

      <Sheet open={doneOpen} onClose={() => setDoneOpen(false)} title="Spiel vorbei">
        <div className="text-center">
          <div className="mb-2 text-4xl" aria-hidden>
            💔
          </div>
          <p className="mb-4 text-sm text-slate-600 dark:text-slate-300">
            Du erreichst {state.score} Punkte in Level {state.level}.
          </p>
          <Button variant="primary" block onClick={start}>
            Nochmal spielen
          </Button>
        </div>
      </Sheet>
    </div>
  );
}
