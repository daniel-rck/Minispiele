import { type CSSProperties, useCallback, useEffect, useRef, useState } from 'react';
import { useAnimationFrame } from '../hooks/useAnimationFrame';
import { useVibration } from '../hooks/useVibration';
import { STORAGE_KEYS } from '../lib/constants';
import { DoodleJumpBestSchema } from '../lib/persistedSchemas';
import { useGameSfx } from '../lib/useGameSfx';
import { useLocalStorage } from '../lib/useLocalStorage';
import AriaLive from './AriaLive';
import Button from './ui/Button';
import Sheet from './ui/Sheet';

const W = 400;
const H = 600;
const PLAYER_W = 30;
const PLAYER_H = 30;
const GRAVITY = 0.4;
const JUMP_VELOCITY = -11;
const SPRING_VELOCITY = -18;
// Reference frame duration: physics constants are tuned in px per 60fps frame.
const BASE_FRAME_MS = 1000 / 60;

type PlatformType = 'normal' | 'moving' | 'fragile' | 'spring';

interface Platform {
  x: number;
  y: number;
  w: number;
  type: PlatformType;
  vx: number;
  broken?: boolean;
}

interface Player {
  x: number;
  y: number;
  vy: number;
}

interface State {
  player: Player;
  platforms: Platform[];
  score: number;
  gameOver: boolean;
  started: boolean;
}

function createInitial(): State {
  const platforms: Platform[] = [];
  for (let i = 0; i < 8; i++) {
    platforms.push(makePlatform(Math.random() * (W - 70), H - i * 80, 0));
  }
  platforms.push({ x: W / 2 - 35, y: H - 40, w: 70, type: 'normal', vx: 0 });
  return {
    player: { x: W / 2, y: H - 100, vy: 0 },
    platforms,
    score: 0,
    gameOver: false,
    started: false,
  };
}

function makePlatform(x: number, y: number, score: number): Platform {
  const r = Math.random();
  let type: PlatformType = 'normal';
  let vx = 0;
  if (r < 0.15 && score > 500) type = 'fragile';
  else if (r < 0.3 && score > 200) {
    type = 'moving';
    vx = 1 + Math.random() * 1.5;
  } else if (r < 0.38 && score > 800) type = 'spring';
  return { x, y, w: 70, type, vx };
}

type ControlKey = 'left' | 'right';

export default function DoodleJumpGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<State>(createInitial());
  const keysRef = useRef<Record<ControlKey, boolean>>({ left: false, right: false });
  const [scoreDisplay, setScoreDisplay] = useState(0);
  const [overOpen, setOverOpen] = useState(false);
  const [isNewBest, setIsNewBest] = useState(false);
  const [announcement, setAnnouncement] = useState('Pfeiltasten links / rechts. Tippe zum Start.');
  const [best, setBest] = useLocalStorage<number>(
    STORAGE_KEYS.DOODLE_JUMP_BEST,
    DoodleJumpBestSchema,
    0,
  );

  const sfx = useGameSfx();
  const { vibrate } = useVibration();

  const restart = useCallback(() => {
    stateRef.current = createInitial();
    setScoreDisplay(0);
    setOverOpen(false);
    setIsNewBest(false);
    setAnnouncement('Pfeiltasten links / rechts. Tippe zum Start.');
  }, []);

  const handleGameOver = useCallback(
    (finalScore: number) => {
      const newBest = finalScore > best;
      if (newBest) setBest(finalScore);
      setIsNewBest(newBest);
      setOverOpen(true);
      setAnnouncement(newBest ? `Vorbei. Neue Bestmarke ${finalScore} m.` : 'Vorbei.');
      sfx.lose();
      vibrate([120, 60, 120]);
    },
    [best, setBest, sfx, vibrate],
  );

  const startJump = useCallback(() => {
    if (!stateRef.current.started && !stateRef.current.gameOver) {
      stateRef.current.started = true;
      stateRef.current.player.vy = JUMP_VELOCITY;
    }
  }, []);

  useAnimationFrame((deltaMs) => {
    const s = stateRef.current;
    if (s.gameOver) return;
    const frames = deltaMs / BASE_FRAME_MS;

    const keys = keysRef.current;
    if (keys.left) s.player.x -= 5 * frames;
    if (keys.right) s.player.x += 5 * frames;
    if (s.player.x < -PLAYER_W) s.player.x = W;
    if (s.player.x > W) s.player.x = -PLAYER_W;

    if (s.started) {
      s.player.vy += GRAVITY * frames;
      const prevBottom = s.player.y + PLAYER_H;
      s.player.y += s.player.vy * frames;

      // platform collision when falling — swept check so fast falls can't
      // tunnel through the 12px landing band in a single frame
      if (s.player.vy > 0) {
        for (const p of s.platforms) {
          if (p.broken) continue;
          if (
            s.player.x + PLAYER_W > p.x &&
            s.player.x < p.x + p.w &&
            prevBottom <= p.y + 12 &&
            s.player.y + PLAYER_H > p.y
          ) {
            if (p.type === 'fragile') {
              p.broken = true;
              sfx.pop();
              continue;
            }
            if (p.type === 'spring') {
              s.player.vy = SPRING_VELOCITY;
              sfx.match();
              vibrate(20);
            } else {
              s.player.vy = JUMP_VELOCITY;
              sfx.pop();
            }
          }
        }
      }

      for (const p of s.platforms) {
        if (p.type === 'moving') {
          p.x += p.vx * frames;
          if (p.x < 0 || p.x + p.w > W) p.vx *= -1;
        }
      }

      // scroll camera up
      if (s.player.y < H / 3) {
        const diff = H / 3 - s.player.y;
        s.player.y = H / 3;
        for (const p of s.platforms) p.y += diff;
        s.score += Math.floor(diff);
      }

      s.platforms = s.platforms.filter((p) => p.y < H + 50 && !p.broken);
      while (s.platforms.length < 8) {
        const topY = s.platforms.length === 0 ? 0 : Math.min(...s.platforms.map((p) => p.y));
        const gap = 50 + Math.random() * 40 + (s.score > 2000 ? 20 : 0);
        s.platforms.push(makePlatform(Math.random() * (W - 70), topY - gap, s.score));
      }

      if (s.player.y > H + 50) {
        s.gameOver = true;
        handleGameOver(s.score);
      }
    }

    if (scoreDisplay !== s.score) setScoreDisplay(s.score);

    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, W, H);

    const colors: Record<PlatformType, string> = {
      normal: '#10b981',
      moving: '#0ea5e9',
      fragile: '#92400e',
      spring: '#f43f5e',
    };
    for (const p of s.platforms) {
      if (p.broken) continue;
      ctx.fillStyle = colors[p.type];
      ctx.beginPath();
      const rrr = ctx as CanvasRenderingContext2D & {
        roundRect?: (x: number, y: number, w: number, h: number, r: number) => void;
      };
      if (rrr.roundRect) rrr.roundRect(p.x, p.y, p.w, 10, 4);
      else ctx.rect(p.x, p.y, p.w, 10);
      ctx.fill();
      if (p.type === 'spring') {
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(p.x + p.w / 2 - 4, p.y - 8, 8, 8);
      }
    }

    if (!s.gameOver) {
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      const rrr = ctx as CanvasRenderingContext2D & {
        roundRect?: (x: number, y: number, w: number, h: number, r: number) => void;
      };
      if (rrr.roundRect) rrr.roundRect(s.player.x, s.player.y, PLAYER_W, PLAYER_H, 6);
      else ctx.rect(s.player.x, s.player.y, PLAYER_W, PLAYER_H);
      ctx.fill();
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(s.player.x + 10, s.player.y + 12, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(s.player.x + 20, s.player.y + 12, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  });

  const setKey = useCallback((key: ControlKey, value: boolean) => {
    keysRef.current[key] = value;
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat) return;
      switch (e.key) {
        case 'ArrowLeft':
        case 'a':
        case 'A':
          setKey('left', true);
          startJump();
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          setKey('right', true);
          startJump();
          break;
        case ' ':
          e.preventDefault();
          if (stateRef.current.gameOver) restart();
          else startJump();
          break;
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') setKey('left', false);
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') setKey('right', false);
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [restart, setKey, startJump]);

  const touchHandlers = (key: ControlKey) => ({
    onPointerDown: (e: React.PointerEvent) => {
      e.preventDefault();
      setKey(key, true);
      startJump();
    },
    onPointerUp: () => setKey(key, false),
    onPointerLeave: () => setKey(key, false),
    onPointerCancel: () => setKey(key, false),
  });

  return (
    <div className="flex h-full min-h-0 flex-col items-center gap-3 pb-2">
      <AriaLive message={announcement} />

      <div className="flex w-full max-w-[400px] items-center justify-between text-sm text-surface-700 dark:text-surface-200">
        <div>
          Höhe: <span className="font-semibold tabular-nums">{scoreDisplay}</span> m
        </div>
        <div>
          Best: <span className="font-semibold tabular-nums">{best}</span> m
        </div>
      </div>

      <div className="fit-area mx-auto w-full max-w-[400px]">
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          aria-label="Doodle-Jump-Spielfeld"
          className="fit-box rounded-lg bg-slate-900 ring-1 ring-slate-700 dark:bg-slate-950"
          style={{ '--fit-ar': W / H } as CSSProperties}
        />
      </div>

      <div className="grid w-full max-w-[400px] grid-cols-2 gap-2 sm:hidden">
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
          aria-label="Nach rechts"
          className="flex min-h-14 touch-none select-none items-center justify-center rounded-xl bg-surface-100 text-2xl active:bg-surface-200 dark:bg-surface-800 dark:active:bg-surface-700"
          {...touchHandlers('right')}
        >
          →
        </button>
      </div>

      <Button variant="primary" onClick={restart}>
        Neues Spiel
      </Button>

      <p className="max-w-md text-center text-xs text-surface-500 dark:text-surface-400">
        Pfeiltasten links/rechts. Grüne Plattformen stabil, blaue beweglich, braune fragil, rote
        federn dich hoch. Bildschirmrand wickelt um.
      </p>

      <Sheet open={overOpen} onClose={() => setOverOpen(false)} title="Spiel vorbei">
        <div className="text-center">
          <div className="mb-2 text-4xl" aria-hidden>
            🪂
          </div>
          {isNewBest && (
            <div className="mb-2 inline-block rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-900 dark:bg-amber-900/40 dark:text-amber-100">
              Neue Bestmarke!
            </div>
          )}
          <p className="mb-4 text-sm text-surface-600 dark:text-surface-300">
            Du hast {scoreDisplay} m erreicht.
          </p>
          <Button variant="primary" block onClick={restart}>
            Nochmal spielen
          </Button>
        </div>
      </Sheet>
    </div>
  );
}
