import { type CSSProperties, useCallback, useEffect, useRef, useState } from 'react';
import { useAnimationFrame } from '../hooks/useAnimationFrame';
import { useVibration } from '../hooks/useVibration';
import { STORAGE_KEYS } from '../lib/constants';
import { AsteroidsBestSchema } from '../lib/persistedSchemas';
import { useGameSfx } from '../lib/useGameSfx';
import { useLocalStorage } from '../lib/useLocalStorage';
import AriaLive from './AriaLive';
import Button from './ui/Button';
import Sheet from './ui/Sheet';

const W = 700;
const H = 500;
const SHIP_RADIUS = 12;
// Reference frame duration: physics constants are tuned in px per 60fps frame.
const BASE_FRAME_MS = 1000 / 60;
const SIZE_RADIUS: readonly number[] = [40, 25, 12];
const SIZE_SCORE: readonly number[] = [100, 50, 20];

interface Ship {
  x: number;
  y: number;
  angle: number;
  vx: number;
  vy: number;
}

interface Asteroid {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: 1 | 2 | 3;
  r: number;
  verts: number[];
  rot: number;
  rotSpeed: number;
}

interface Bullet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
}

interface GameState {
  ship: Ship;
  asteroids: Asteroid[];
  bullets: Bullet[];
  particles: Particle[];
  score: number;
  lives: number;
  level: number;
  gameOver: boolean;
  invincible: boolean;
  invTimer: number;
  shootCooldown: number;
}

function makeAsteroid(x: number, y: number, size: 1 | 2 | 3): Asteroid {
  const speed = 1 + Math.random() * 1.5;
  const angle = Math.random() * Math.PI * 2;
  const r = SIZE_RADIUS[3 - size] ?? 12;
  const verts: number[] = [];
  const n = 8 + Math.floor(Math.random() * 4);
  for (let i = 0; i < n; i++) verts.push(r * (0.7 + Math.random() * 0.3));
  return {
    x,
    y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    size,
    r,
    verts,
    rot: Math.random() * Math.PI * 2,
    rotSpeed: (Math.random() - 0.5) * 0.03,
  };
}

function spawnAsteroids(state: GameState, n: number): void {
  for (let i = 0; i < n; i++) {
    let x = 0;
    let y = 0;
    let safe = false;
    for (let tries = 0; tries < 50 && !safe; tries++) {
      x = Math.random() * W;
      y = Math.random() * H;
      safe = Math.hypot(x - state.ship.x, y - state.ship.y) >= 100;
    }
    state.asteroids.push(makeAsteroid(x, y, 3));
  }
}

function createState(): GameState {
  const state: GameState = {
    ship: { x: W / 2, y: H / 2, angle: 0, vx: 0, vy: 0 },
    asteroids: [],
    bullets: [],
    particles: [],
    score: 0,
    lives: 3,
    level: 1,
    gameOver: false,
    invincible: true,
    invTimer: 120,
    shootCooldown: 0,
  };
  spawnAsteroids(state, 4);
  return state;
}

type ControlKey = 'left' | 'right' | 'thrust' | 'fire';

export default function AsteroidsGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<GameState>(createState());
  const keysRef = useRef<Record<ControlKey, boolean>>({
    left: false,
    right: false,
    thrust: false,
    fire: false,
  });
  const [hudScore, setHudScore] = useState(0);
  const [hudLives, setHudLives] = useState(3);
  const [hudLevel, setHudLevel] = useState(1);
  const [overOpen, setOverOpen] = useState(false);
  const [isNewBest, setIsNewBest] = useState(false);
  const [announcement, setAnnouncement] = useState('Bereit');
  const [best, setBest] = useLocalStorage<number>(
    STORAGE_KEYS.ASTEROIDS_BEST,
    AsteroidsBestSchema,
    0,
  );

  const sfx = useGameSfx();
  const { vibrate } = useVibration();

  const restart = useCallback(() => {
    stateRef.current = createState();
    setHudScore(0);
    setHudLives(3);
    setHudLevel(1);
    setOverOpen(false);
    setIsNewBest(false);
    setAnnouncement('Neues Spiel gestartet');
  }, []);

  const handleGameOver = useCallback(
    (finalScore: number) => {
      const newBest = finalScore > best;
      if (newBest) setBest(finalScore);
      setIsNewBest(newBest);
      setOverOpen(true);
      setAnnouncement(newBest ? `Spiel vorbei. Neue Bestmarke ${finalScore}` : 'Spiel vorbei');
      sfx.lose();
      vibrate([120, 60, 120]);
    },
    [best, setBest, sfx, vibrate],
  );

  useAnimationFrame((deltaMs) => {
    const s = stateRef.current;
    if (s.gameOver) return;
    const frames = deltaMs / BASE_FRAME_MS;

    // controls
    const keys = keysRef.current;
    if (keys.left) s.ship.angle -= 0.07 * frames;
    if (keys.right) s.ship.angle += 0.07 * frames;
    if (keys.thrust) {
      s.ship.vx += Math.cos(s.ship.angle) * 0.12 * frames;
      s.ship.vy += Math.sin(s.ship.angle) * 0.12 * frames;
    }
    const drag = 0.99 ** frames;
    s.ship.vx *= drag;
    s.ship.vy *= drag;
    s.ship.x = (s.ship.x + s.ship.vx * frames + W) % W;
    s.ship.y = (s.ship.y + s.ship.vy * frames + H) % H;

    if (s.invincible) {
      s.invTimer -= frames;
      if (s.invTimer <= 0) s.invincible = false;
    }

    if (s.shootCooldown > 0) s.shootCooldown -= frames;
    if (keys.fire && s.shootCooldown <= 0) {
      s.bullets.push({
        x: s.ship.x + Math.cos(s.ship.angle) * 15,
        y: s.ship.y + Math.sin(s.ship.angle) * 15,
        vx: Math.cos(s.ship.angle) * 7,
        vy: Math.sin(s.ship.angle) * 7,
        life: 60,
      });
      s.shootCooldown = 8;
      sfx.pop();
    }

    for (const b of s.bullets) {
      b.x += b.vx * frames;
      b.y += b.vy * frames;
      b.life -= frames;
    }
    s.bullets = s.bullets.filter((b) => b.life > 0);

    for (const a of s.asteroids) {
      a.x = (a.x + a.vx * frames + W) % W;
      a.y = (a.y + a.vy * frames + H) % H;
      a.rot += a.rotSpeed * frames;
    }

    // bullet-asteroid collision
    for (let i = s.bullets.length - 1; i >= 0; i--) {
      const b = s.bullets[i];
      if (!b) continue;
      for (let j = s.asteroids.length - 1; j >= 0; j--) {
        const a = s.asteroids[j];
        if (!a) continue;
        if (Math.hypot(b.x - a.x, b.y - a.y) < a.r) {
          s.score += SIZE_SCORE[3 - a.size] ?? 0;
          for (let k = 0; k < 6; k++) {
            s.particles.push({
              x: a.x,
              y: a.y,
              vx: (Math.random() - 0.5) * 4,
              vy: (Math.random() - 0.5) * 4,
              life: 20 + Math.random() * 15,
            });
          }
          if (a.size > 1) {
            const next = (a.size - 1) as 1 | 2;
            s.asteroids.push(makeAsteroid(a.x, a.y, next));
            s.asteroids.push(makeAsteroid(a.x, a.y, next));
          }
          s.asteroids.splice(j, 1);
          s.bullets.splice(i, 1);
          sfx.pop();
          break;
        }
      }
    }

    // ship-asteroid collision
    if (!s.invincible) {
      for (const a of s.asteroids) {
        if (Math.hypot(s.ship.x - a.x, s.ship.y - a.y) < a.r + SHIP_RADIUS) {
          s.lives--;
          for (let k = 0; k < 15; k++) {
            s.particles.push({
              x: s.ship.x,
              y: s.ship.y,
              vx: (Math.random() - 0.5) * 5,
              vy: (Math.random() - 0.5) * 5,
              life: 25 + Math.random() * 15,
            });
          }
          vibrate(40);
          sfx.error();
          if (s.lives <= 0) {
            s.gameOver = true;
            setHudScore(s.score);
            setHudLives(0);
            handleGameOver(s.score);
            return;
          }
          s.ship.x = W / 2;
          s.ship.y = H / 2;
          s.ship.vx = 0;
          s.ship.vy = 0;
          s.invincible = true;
          s.invTimer = 120;
          break;
        }
      }
    }

    if (s.asteroids.length === 0) {
      s.level++;
      spawnAsteroids(s, 3 + s.level);
      sfx.match();
    }

    for (const p of s.particles) {
      p.x += p.vx * frames;
      p.y += p.vy * frames;
      p.life -= frames;
    }
    s.particles = s.particles.filter((p) => p.life > 0);

    // sync HUD periodically (avoid setState per frame storms)
    if (hudScore !== s.score) setHudScore(s.score);
    if (hudLives !== s.lives) setHudLives(s.lives);
    if (hudLevel !== s.level) setHudLevel(s.level);

    // draw
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, W, H);

    if (!s.gameOver && (!s.invincible || Math.floor(s.invTimer / 4) % 2 === 0)) {
      ctx.save();
      ctx.translate(s.ship.x, s.ship.y);
      ctx.rotate(s.ship.angle);
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(15, 0);
      ctx.lineTo(-10, -9);
      ctx.lineTo(-6, 0);
      ctx.lineTo(-10, 9);
      ctx.closePath();
      ctx.stroke();
      if (keys.thrust) {
        ctx.fillStyle = '#f97316';
        ctx.beginPath();
        ctx.moveTo(-8, -4);
        ctx.lineTo(-16, 0);
        ctx.lineTo(-8, 4);
        ctx.fill();
      }
      ctx.restore();
    }

    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1.5;
    for (const a of s.asteroids) {
      ctx.save();
      ctx.translate(a.x, a.y);
      ctx.rotate(a.rot);
      ctx.beginPath();
      for (let i = 0; i < a.verts.length; i++) {
        const angle = (i / a.verts.length) * Math.PI * 2;
        const r = a.verts[i] ?? a.r;
        if (i === 0) ctx.moveTo(Math.cos(angle) * r, Math.sin(angle) * r);
        else ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
      }
      ctx.closePath();
      ctx.stroke();
      ctx.restore();
    }

    ctx.fillStyle = '#fde047';
    for (const b of s.bullets) {
      ctx.beginPath();
      ctx.arc(b.x, b.y, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    for (const p of s.particles) {
      const alpha = Math.max(0, Math.min(1, p.life / 35));
      ctx.fillStyle = `rgba(251, 191, 36, ${alpha})`;
      ctx.fillRect(p.x - 1, p.y - 1, 3, 3);
    }
  });

  const setKey = useCallback((key: ControlKey, value: boolean) => {
    keysRef.current[key] = value;
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      switch (e.key) {
        case 'ArrowLeft':
        case 'a':
        case 'A':
          setKey('left', true);
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          setKey('right', true);
          break;
        case 'ArrowUp':
        case 'w':
        case 'W':
          setKey('thrust', true);
          break;
        case ' ':
          e.preventDefault();
          setKey('fire', true);
          if (stateRef.current.gameOver) restart();
          break;
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowLeft':
        case 'a':
        case 'A':
          setKey('left', false);
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          setKey('right', false);
          break;
        case 'ArrowUp':
        case 'w':
        case 'W':
          setKey('thrust', false);
          break;
        case ' ':
          setKey('fire', false);
          break;
      }
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [restart, setKey]);

  const touchHandlers = (key: ControlKey) => ({
    onPointerDown: (e: React.PointerEvent) => {
      e.preventDefault();
      setKey(key, true);
      if (key === 'fire' && stateRef.current.gameOver) restart();
    },
    onPointerUp: (e: React.PointerEvent) => {
      e.preventDefault();
      setKey(key, false);
    },
    onPointerLeave: () => setKey(key, false),
    onPointerCancel: () => setKey(key, false),
  });

  return (
    <div className="flex h-full min-h-0 flex-col items-center gap-3 pb-2">
      <AriaLive message={announcement} />

      <div className="grid w-full max-w-[700px] grid-cols-3 gap-2 text-sm text-surface-700 dark:text-surface-200">
        <div>
          Punkte: <span className="font-semibold tabular-nums">{hudScore}</span>
        </div>
        <div className="text-center">
          Level: <span className="font-semibold tabular-nums">{hudLevel}</span>
        </div>
        <div className="text-right">
          Leben: <span className="font-semibold tabular-nums">{hudLives}</span>
          <span className="mx-2 text-surface-400">·</span>
          Best: <span className="font-semibold tabular-nums">{best}</span>
        </div>
      </div>

      <div className="fit-area mx-auto w-full max-w-[700px]">
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          aria-label="Asteroids-Spielfeld"
          className="fit-box rounded-lg bg-slate-900 ring-1 ring-slate-700 dark:bg-slate-950"
          style={{ '--fit-ar': W / H } as CSSProperties}
        />
      </div>

      <div className="grid w-full max-w-md grid-cols-4 gap-2 sm:hidden">
        <button
          type="button"
          aria-label="Nach links"
          className="flex min-h-14 touch-none select-none items-center justify-center rounded-xl bg-surface-100 text-2xl active:bg-surface-200 dark:bg-surface-800 dark:active:bg-surface-700"
          {...touchHandlers('left')}
        >
          ←
        </button>
        <button
          type="button"
          aria-label="Schub"
          className="flex min-h-14 touch-none select-none items-center justify-center rounded-xl bg-surface-100 text-2xl active:bg-surface-200 dark:bg-surface-800 dark:active:bg-surface-700"
          {...touchHandlers('thrust')}
        >
          ↑
        </button>
        <button
          type="button"
          aria-label="Nach rechts"
          className="flex min-h-14 touch-none select-none items-center justify-center rounded-xl bg-surface-100 text-2xl active:bg-surface-200 dark:bg-surface-800 dark:active:bg-surface-700"
          {...touchHandlers('right')}
        >
          →
        </button>
        <button
          type="button"
          aria-label="Schießen"
          className="flex min-h-14 touch-none select-none items-center justify-center rounded-xl bg-amber-500 text-2xl text-white active:bg-amber-600"
          {...touchHandlers('fire')}
        >
          ●
        </button>
      </div>

      <Button variant="primary" onClick={restart} className="max-w-md">
        Neues Spiel
      </Button>

      <p className="max-w-md text-center text-xs text-surface-500 dark:text-surface-400">
        Pfeiltasten zum Drehen / Schub. Leertaste zum Schießen. Mobil: Buttons.
      </p>

      <Sheet open={overOpen} onClose={() => setOverOpen(false)} title="Spiel vorbei">
        <div className="text-center">
          <div className="mb-2 text-4xl" aria-hidden>
            💥
          </div>
          {isNewBest && (
            <div className="mb-2 inline-block rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-900 dark:bg-amber-900/40 dark:text-amber-100">
              Neue Bestmarke!
            </div>
          )}
          <p className="mb-4 text-sm text-surface-600 dark:text-surface-300">
            Du hast {hudScore} Punkte erreicht.
          </p>
          <Button variant="primary" block onClick={restart}>
            Nochmal spielen
          </Button>
        </div>
      </Sheet>
    </div>
  );
}
