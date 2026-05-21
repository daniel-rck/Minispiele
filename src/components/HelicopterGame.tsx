import { useCallback, useEffect, useRef, useState } from 'react';
import { useAnimationFrame } from '../hooks/useAnimationFrame';
import { useVibration } from '../hooks/useVibration';
import { STORAGE_KEYS } from '../lib/constants';
import { HelicopterBestSchema } from '../lib/persistedSchemas';
import { useGameSfx } from '../lib/useGameSfx';
import { useLocalStorage } from '../lib/useLocalStorage';
import AriaLive from './AriaLive';
import Button from './ui/Button';

const W = 700;
const H = 400;
const HELI_X = 100;
const HELI_W = 40;
const HELI_H = 20;
const GRAVITY = 0.35;
const LIFT = -0.65;
const SPEED = 3;

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
}

interface Obstacle {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface State {
  heliY: number;
  heliVy: number;
  scrollX: number;
  score: number;
  gameOver: boolean;
  started: boolean;
  pressing: boolean;
  obstacles: Obstacle[];
  particles: Particle[];
  ceil: number[];
  floor: number[];
}

function makeInitial(): State {
  const ceil: number[] = [];
  const floor: number[] = [];
  const gap = H * 0.6;
  for (let x = 0; x < W + 200; x += 20) {
    const t = x * 0.005;
    const mid = H / 2 + Math.sin(t) * 40;
    ceil.push(mid - gap / 2 + Math.sin(t * 2) * 20);
    floor.push(mid + gap / 2 + Math.cos(t * 1.5) * 20);
  }
  return {
    heliY: H / 2,
    heliVy: 0,
    scrollX: 0,
    score: 0,
    gameOver: false,
    started: false,
    pressing: false,
    obstacles: [],
    particles: [],
    ceil,
    floor,
  };
}

export default function HelicopterGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<State>(makeInitial());
  const [hudScore, setHudScore] = useState(0);
  const [announcement, setAnnouncement] = useState(
    'Klicken/Leertaste gedrückt halten zum Steigen.',
  );
  const [overOpen, setOverOpen] = useState(false);
  const [isNewBest, setIsNewBest] = useState(false);
  const [best, setBest] = useLocalStorage<number>(
    STORAGE_KEYS.HELICOPTER_BEST,
    HelicopterBestSchema,
    0,
  );

  const sfx = useGameSfx();
  const { vibrate } = useVibration();

  const restart = useCallback(() => {
    stateRef.current = makeInitial();
    setHudScore(0);
    setOverOpen(false);
    setIsNewBest(false);
    setAnnouncement('Klicken/Leertaste gedrückt halten zum Steigen.');
  }, []);

  const onPress = useCallback(() => {
    const s = stateRef.current;
    if (s.gameOver) {
      restart();
      return;
    }
    s.started = true;
    s.pressing = true;
  }, [restart]);

  const onRelease = useCallback(() => {
    stateRef.current.pressing = false;
  }, []);

  useAnimationFrame(() => {
    const s = stateRef.current;
    if (!s.gameOver && s.started) {
      if (s.pressing) s.heliVy += LIFT;
      s.heliVy += GRAVITY;
      s.heliVy = Math.max(-6, Math.min(6, s.heliVy));
      s.heliY += s.heliVy;
      s.scrollX += SPEED;
      s.score = Math.floor(s.scrollX / 10);

      while (s.ceil.length < (s.scrollX + W + 200) / 20) {
        const lastIdx = s.ceil.length - 1;
        const t = (s.scrollX + lastIdx * 20) * 0.005;
        const gap = Math.max(H * 0.3, H * 0.6 - s.score * 0.15);
        const mid = H / 2 + Math.sin(t) * 60 + Math.cos(t * 0.7) * 30;
        s.ceil.push(Math.max(20, mid - gap / 2 + Math.sin(t * 2) * 25));
        s.floor.push(Math.min(H - 20, mid + gap / 2 + Math.cos(t * 1.5) * 25));
      }

      if (Math.random() < 0.02 + s.score * 0.0002) {
        const idx = Math.floor((s.scrollX + W) / 20);
        const ceil = s.ceil[idx] ?? 80;
        const floor = s.floor[idx] ?? H - 80;
        const y = ceil + 30 + Math.random() * Math.max(20, floor - ceil - 80);
        s.obstacles.push({
          x: W + s.scrollX,
          y,
          w: 20 + Math.random() * 20,
          h: 30 + Math.random() * 40,
        });
      }

      const idx = Math.floor((s.scrollX + HELI_X) / 20);
      const ceil = s.ceil[idx] ?? 0;
      const floor = s.floor[idx] ?? H;
      let died = false;
      if (s.heliY - HELI_H / 2 < ceil || s.heliY + HELI_H / 2 > floor) died = true;
      if (!died) {
        for (const o of s.obstacles) {
          const ox = o.x - s.scrollX;
          if (
            HELI_X + HELI_W / 2 > ox &&
            HELI_X - HELI_W / 2 < ox + o.w &&
            s.heliY + HELI_H / 2 > o.y &&
            s.heliY - HELI_H / 2 < o.y + o.h
          ) {
            died = true;
            break;
          }
        }
      }
      if (died) {
        s.gameOver = true;
        for (let i = 0; i < 20; i++) {
          s.particles.push({
            x: HELI_X,
            y: s.heliY,
            vx: (Math.random() - 0.5) * 6,
            vy: (Math.random() - 0.5) * 6,
            life: 30 + Math.random() * 20,
          });
        }
        const finalScore = s.score;
        const newBest = finalScore > best;
        if (newBest) setBest(finalScore);
        setIsNewBest(newBest);
        setOverOpen(true);
        setAnnouncement(newBest ? `Vorbei. Neue Bestmarke ${finalScore} m.` : 'Vorbei.');
        sfx.lose();
        vibrate([120, 60, 80]);
      }
      s.obstacles = s.obstacles.filter((o) => o.x - s.scrollX > -50);
    }
    if (hudScore !== s.score) setHudScore(s.score);

    // draw
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = '#1e3a8a';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    for (let i = 0; i < s.ceil.length; i++) {
      const x = i * 20 - s.scrollX;
      if (x < -20 || x > W + 20) continue;
      ctx.lineTo(x, s.ceil[i] ?? 0);
    }
    ctx.lineTo(W, 0);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(0, H);
    for (let i = 0; i < s.floor.length; i++) {
      const x = i * 20 - s.scrollX;
      if (x < -20 || x > W + 20) continue;
      ctx.lineTo(x, s.floor[i] ?? H);
    }
    ctx.lineTo(W, H);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#f43f5e';
    for (const o of s.obstacles) {
      const ox = o.x - s.scrollX;
      ctx.fillRect(ox, o.y, o.w, o.h);
    }

    if (!s.gameOver) {
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(HELI_X - HELI_W / 2, s.heliY - HELI_H / 2, HELI_W, HELI_H);
      ctx.fillStyle = '#e5e7eb';
      ctx.fillRect(HELI_X - HELI_W / 2 - 8, s.heliY - 2, 8, 4);
      ctx.fillRect(HELI_X - HELI_W / 3, s.heliY - HELI_H / 2 - 4, HELI_W * 0.7, 3);
    }

    for (const p of s.particles) {
      ctx.fillStyle = `rgba(251, 191, 36, ${Math.max(0, p.life / 50)})`;
      ctx.fillRect(p.x - 2, p.y - 2, 4, 4);
      p.x += p.vx;
      p.y += p.vy;
      p.life--;
    }
    s.particles = s.particles.filter((p) => p.life > 0);

    if (!s.started && !s.gameOver) {
      ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 20px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Klicken/Leertaste zum Starten', W / 2, H / 2);
    }
  });

  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        onPress();
      }
    };
    const onUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') onRelease();
    };
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    return () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup', onUp);
    };
  }, [onPress, onRelease]);

  return (
    <div className="flex flex-col items-center gap-3 pb-4">
      <AriaLive message={announcement} />

      <div className="flex w-full max-w-[700px] items-center justify-between text-sm text-surface-700 dark:text-surface-200">
        <div>
          Distanz: <span className="font-semibold tabular-nums">{hudScore}</span> m
        </div>
        <div>
          Best: <span className="font-semibold tabular-nums">{best}</span> m
        </div>
      </div>

      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        onPointerDown={(e) => {
          e.preventDefault();
          onPress();
        }}
        onPointerUp={onRelease}
        onPointerLeave={onRelease}
        onPointerCancel={onRelease}
        aria-label="Helikopter-Spielfeld"
        className="w-full max-w-[700px] rounded-lg bg-slate-900 ring-1 ring-slate-700 dark:bg-slate-950"
        style={{ aspectRatio: `${W}/${H}`, height: 'auto', touchAction: 'none' }}
      />

      <Button variant="primary" onClick={restart}>
        Neues Spiel
      </Button>

      <p className="max-w-md text-center text-xs text-surface-500 dark:text-surface-400">
        Halte gedrückt zum Steigen, lass los zum Sinken. Weiche der Decke, dem Boden und den roten
        Blöcken aus.
      </p>

      {overOpen && (
        <div
          role="status"
          className="rounded-2xl bg-surface-100 px-5 py-4 text-center dark:bg-surface-800"
        >
          <div className="mb-2 text-3xl" aria-hidden>
            🚁
          </div>
          {isNewBest && (
            <div className="mb-2 inline-block rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-900 dark:bg-amber-900/40 dark:text-amber-100">
              Neue Bestmarke!
            </div>
          )}
          <p className="mb-3 text-sm text-surface-600 dark:text-surface-300">
            Distanz: {hudScore} m
          </p>
          <Button variant="primary" size="sm" onClick={restart}>
            Nochmal spielen
          </Button>
        </div>
      )}
    </div>
  );
}
