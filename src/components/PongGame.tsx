import { type CSSProperties, useCallback, useEffect, useRef, useState } from 'react';
import { useAnimationFrame } from '../hooks/useAnimationFrame';
import { useVibration } from '../hooks/useVibration';
import { STORAGE_KEYS } from '../lib/constants';
import { type PongDifficulty, PongDifficultySchema } from '../lib/persistedSchemas';
import { useGameSfx } from '../lib/useGameSfx';
import { useLocalStorage } from '../lib/useLocalStorage';
import AriaLive from './AriaLive';
import Button from './ui/Button';

const W = 700;
const H = 450;
const PADDLE_W = 12;
const PADDLE_H = 80;
const BALL_R = 8;
const WIN_SCORE = 11;
// Reference frame duration: speeds are tuned in px per 60fps frame.
const BASE_FRAME_MS = 1000 / 60;
const AI_SPEED: Record<PongDifficulty, number> = { easy: 2.5, medium: 4.5, hard: 7 };
const AI_REACT: Record<PongDifficulty, number> = { easy: 0.55, medium: 0.75, hard: 0.95 };
const DIFF_LABEL: Record<PongDifficulty, string> = {
  easy: 'Leicht',
  medium: 'Mittel',
  hard: 'Schwer',
};

interface Ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

interface State {
  leftY: number;
  rightY: number;
  ball: Ball;
  scoreL: number;
  scoreR: number;
  running: boolean;
  gameOver: boolean;
  message: string;
}

function makeBall(dir: 1 | -1): Ball {
  const angle = Math.random() * 0.8 - 0.4;
  const speed = 5;
  return {
    x: W / 2,
    y: H / 2,
    vx: speed * Math.cos(angle) * dir,
    vy: speed * Math.sin(angle),
  };
}

function makeInitial(): State {
  return {
    leftY: H / 2 - PADDLE_H / 2,
    rightY: H / 2 - PADDLE_H / 2,
    ball: makeBall(1),
    scoreL: 0,
    scoreR: 0,
    running: false,
    gameOver: false,
    message: 'Leertaste oder Tap zum Starten. W/S oder Pfeiltasten steuern.',
  };
}

export default function PongGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<State>(makeInitial());
  const keysRef = useRef<{ up: boolean; down: boolean }>({ up: false, down: false });
  const [hud, setHud] = useState({
    scoreL: 0,
    scoreR: 0,
    message: '',
    running: false,
    gameOver: false,
  });
  const [difficulty, setDifficulty] = useLocalStorage<PongDifficulty>(
    STORAGE_KEYS.PONG_DIFFICULTY,
    PongDifficultySchema,
    'medium',
  );
  const [announcement, setAnnouncement] = useState('Pong — Leertaste startet.');

  const sfx = useGameSfx();
  const { vibrate } = useVibration();

  const syncHud = useCallback(() => {
    const s = stateRef.current;
    setHud({
      scoreL: s.scoreL,
      scoreR: s.scoreR,
      message: s.message,
      running: s.running,
      gameOver: s.gameOver,
    });
  }, []);

  const restart = useCallback(() => {
    stateRef.current = makeInitial();
    syncHud();
    setAnnouncement('Neues Spiel.');
  }, [syncHud]);

  const togglePlay = useCallback(() => {
    const s = stateRef.current;
    if (s.gameOver) {
      restart();
      return;
    }
    s.running = !s.running;
    s.message = s.running ? '' : 'Pausiert.';
    syncHud();
  }, [restart, syncHud]);

  useAnimationFrame((deltaMs) => {
    const s = stateRef.current;
    const frames = deltaMs / BASE_FRAME_MS;
    if (s.running && !s.gameOver) {
      const keys = keysRef.current;
      if (keys.up) s.leftY -= 6 * frames;
      if (keys.down) s.leftY += 6 * frames;
      s.leftY = Math.max(0, Math.min(H - PADDLE_H, s.leftY));

      const speed = AI_SPEED[difficulty];
      const react = AI_REACT[difficulty];
      let targetY = H / 2;
      if (s.ball.vx > 0) {
        const t = (W - 20 - PADDLE_W - s.ball.x) / Math.max(0.01, s.ball.vx);
        let predict = s.ball.y + s.ball.vy * t * react;
        for (let i = 0; i < 10; i++) {
          if (predict < 0) predict = -predict;
          else if (predict > H) predict = 2 * H - predict;
          else break;
        }
        targetY = predict;
      }
      const center = s.rightY + PADDLE_H / 2;
      const dy = targetY - center;
      if (Math.abs(dy) > 4) {
        s.rightY += Math.sign(dy) * Math.min(speed * frames, Math.abs(dy));
      }
      s.rightY = Math.max(0, Math.min(H - PADDLE_H, s.rightY));

      // ball — in Teilschritten von max. 1 Referenz-Frame, damit der Ball bei
      // großen Frame-Deltas nicht durch ein Paddle hindurchspringt
      let remaining = frames;
      while (remaining > 0.001) {
        const step = Math.min(1, remaining);
        remaining -= step;
        s.ball.x += s.ball.vx * step;
        s.ball.y += s.ball.vy * step;
        if (s.ball.y - BALL_R < 0) {
          s.ball.y = BALL_R;
          s.ball.vy = Math.abs(s.ball.vy);
        }
        if (s.ball.y + BALL_R > H) {
          s.ball.y = H - BALL_R;
          s.ball.vy = -Math.abs(s.ball.vy);
        }
        // paddle collisions
        if (s.ball.vx < 0 && s.ball.x - BALL_R <= 20 + PADDLE_W && s.ball.x - BALL_R >= 16) {
          if (s.ball.y >= s.leftY && s.ball.y <= s.leftY + PADDLE_H) {
            const hit = (s.ball.y - s.leftY - PADDLE_H / 2) / (PADDLE_H / 2);
            const angle = (hit * Math.PI) / 3.5;
            const sp = Math.min(12, Math.hypot(s.ball.vx, s.ball.vy) + 0.3);
            s.ball.vx = sp * Math.cos(angle);
            s.ball.vy = sp * Math.sin(angle);
            s.ball.x = 20 + PADDLE_W + BALL_R;
            sfx.pop();
            vibrate(10);
          }
        }
        if (
          s.ball.vx > 0 &&
          s.ball.x + BALL_R >= W - 20 - PADDLE_W &&
          s.ball.x + BALL_R <= W - 16
        ) {
          if (s.ball.y >= s.rightY && s.ball.y <= s.rightY + PADDLE_H) {
            const hit = (s.ball.y - s.rightY - PADDLE_H / 2) / (PADDLE_H / 2);
            const angle = Math.PI - (hit * Math.PI) / 3.5;
            const sp = Math.min(12, Math.hypot(s.ball.vx, s.ball.vy) + 0.3);
            s.ball.vx = -sp * Math.cos(Math.PI - angle);
            s.ball.vy = sp * Math.sin(angle);
            s.ball.x = W - 20 - PADDLE_W - BALL_R;
            sfx.pop();
          }
        }
        // scoring
        if (s.ball.x < -BALL_R) {
          s.scoreR++;
          if (s.scoreR >= WIN_SCORE) {
            s.gameOver = true;
            s.running = false;
            s.message = 'Computer gewinnt.';
            setAnnouncement('Computer gewinnt.');
            sfx.lose();
            vibrate([120, 60, 80]);
          } else {
            s.ball = makeBall(1);
            sfx.error();
          }
          syncHud();
          break;
        }
        if (s.ball.x > W + BALL_R) {
          s.scoreL++;
          if (s.scoreL >= WIN_SCORE) {
            s.gameOver = true;
            s.running = false;
            s.message = 'Du gewinnst!';
            setAnnouncement('Du gewinnst!');
            sfx.win();
            vibrate([60, 40, 120]);
          } else {
            s.ball = makeBall(-1);
            sfx.match();
          }
          syncHud();
          break;
        }
      }
    }

    // draw
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, W, H);
    ctx.setLineDash([8, 8]);
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(W / 2, 0);
    ctx.lineTo(W / 2, H);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(20, s.leftY, PADDLE_W, PADDLE_H);
    ctx.fillStyle = '#f43f5e';
    ctx.fillRect(W - 20 - PADDLE_W, s.rightY, PADDLE_W, PADDLE_H);
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(s.ball.x, s.ball.y, BALL_R, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.04)';
    ctx.font = 'bold 100px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(String(s.scoreL), W / 4, H / 2 + 35);
    ctx.fillText(String(s.scoreR), (3 * W) / 4, H / 2 + 35);
  });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        keysRef.current.up = true;
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        e.preventDefault();
        keysRef.current.down = true;
      } else if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        togglePlay();
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') keysRef.current.up = false;
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') keysRef.current.down = false;
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [togglePlay]);

  const press = (key: 'up' | 'down', value: boolean) => () => {
    keysRef.current[key] = value;
  };

  return (
    <div className="flex h-full min-h-0 flex-col items-center gap-3 pb-2">
      <AriaLive message={announcement} />

      <div className="flex flex-wrap items-center justify-center gap-2">
        <label className="flex items-center gap-2 text-sm text-surface-700 dark:text-surface-200">
          KI:
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value as PongDifficulty)}
            className="min-h-11 rounded-lg border border-surface-300 bg-surface-50 px-3 text-sm dark:border-surface-700 dark:bg-surface-900"
          >
            {(['easy', 'medium', 'hard'] as const).map((d) => (
              <option key={d} value={d}>
                {DIFF_LABEL[d]}
              </option>
            ))}
          </select>
        </label>
        <Button variant="primary" size="sm" onClick={togglePlay}>
          {hud.gameOver ? 'Neues Spiel' : hud.running ? 'Pause' : 'Start'}
        </Button>
      </div>

      <div className="flex w-full max-w-[700px] items-center justify-between text-sm text-surface-700 dark:text-surface-200">
        <div>
          Du: <span className="font-semibold tabular-nums">{hud.scoreL}</span>
        </div>
        <div className="font-semibold">{hud.message || 'Erster mit 11 gewinnt.'}</div>
        <div>
          PC: <span className="font-semibold tabular-nums">{hud.scoreR}</span>
        </div>
      </div>

      <div className="fit-area mx-auto w-full max-w-[700px]">
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          aria-label="Pong-Spielfeld"
          className="fit-box rounded-lg bg-slate-900 ring-1 ring-slate-700"
          style={{ '--fit-ar': W / H, touchAction: 'none' } as CSSProperties}
        />
      </div>

      <div className="grid w-full max-w-md grid-cols-2 gap-2 sm:hidden">
        <button
          type="button"
          aria-label="Schläger nach oben"
          onPointerDown={(e) => {
            e.preventDefault();
            keysRef.current.up = true;
          }}
          onPointerUp={press('up', false)}
          onPointerLeave={press('up', false)}
          onPointerCancel={press('up', false)}
          className="flex min-h-14 items-center justify-center rounded-xl bg-surface-100 text-2xl active:bg-surface-200 dark:bg-surface-800 dark:active:bg-surface-700"
        >
          ↑
        </button>
        <button
          type="button"
          aria-label="Schläger nach unten"
          onPointerDown={(e) => {
            e.preventDefault();
            keysRef.current.down = true;
          }}
          onPointerUp={press('down', false)}
          onPointerLeave={press('down', false)}
          onPointerCancel={press('down', false)}
          className="flex min-h-14 items-center justify-center rounded-xl bg-surface-100 text-2xl active:bg-surface-200 dark:bg-surface-800 dark:active:bg-surface-700"
        >
          ↓
        </button>
      </div>

      <p className="max-w-md text-center text-xs text-surface-500 dark:text-surface-400">
        Leertaste / Klick startet und pausiert. Steuere den linken Schläger mit W/S oder den
        Pfeiltasten.
      </p>
    </div>
  );
}
