import { type CSSProperties, useCallback, useEffect, useRef, useState } from 'react';
import { useAnimationFrame } from '../hooks/useAnimationFrame';
import { useVibration } from '../hooks/useVibration';
import { STORAGE_KEYS } from '../lib/constants';
import { FlappyBirdBestSchema } from '../lib/persistedSchemas';
import { useGameSfx } from '../lib/useGameSfx';
import { useLocalStorage } from '../lib/useLocalStorage';
import AriaLive from './AriaLive';
import Button from './ui/Button';

const W = 400;
const H = 550;
const GRAVITY = 0.35;
const FLAP_FORCE = -6.5;
const PIPE_W = 52;
const PIPE_GAP_START = 150;
const PIPE_GAP_MIN = 100;
const PIPE_SPEED = 2.5;
const BIRD_R = 14;
const GROUND_H = 60;

type Phase = 'ready' | 'playing' | 'dead';

interface Bird {
  x: number;
  y: number;
  vy: number;
  rotation: number;
}

interface Pipe {
  x: number;
  topH: number;
  gap: number;
  scored: boolean;
}

interface State {
  bird: Bird;
  pipes: Pipe[];
  score: number;
  phase: Phase;
  flashTimer: number;
  groundX: number;
}

function createInitial(): State {
  return {
    bird: { x: 80, y: H / 2 - 50, vy: 0, rotation: 0 },
    pipes: [],
    score: 0,
    phase: 'ready',
    flashTimer: 0,
    groundX: 0,
  };
}

function spawnPipe(score: number): Pipe {
  const gap = Math.max(PIPE_GAP_MIN, PIPE_GAP_START - score * 2);
  const minTop = 60;
  const maxTop = H - GROUND_H - gap - 60;
  const topH = minTop + Math.random() * (maxTop - minTop);
  return { x: W + 10, topH, gap, scored: false };
}

function medalFor(score: number): string | null {
  if (score >= 50) return '🥇';
  if (score >= 25) return '🥈';
  if (score >= 10) return '🥉';
  return null;
}

export default function FlappyBirdGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<State>(createInitial());
  const [scoreDisplay, setScoreDisplay] = useState(0);
  const [phaseDisplay, setPhaseDisplay] = useState<Phase>('ready');
  const [announcement, setAnnouncement] = useState('Tippe zum Start.');
  const [best, setBest] = useLocalStorage<number>(
    STORAGE_KEYS.FLAPPY_BIRD_BEST,
    FlappyBirdBestSchema,
    0,
  );

  const sfx = useGameSfx();
  const { vibrate } = useVibration();

  const restart = useCallback(() => {
    stateRef.current = createInitial();
    setScoreDisplay(0);
    setPhaseDisplay('ready');
    setAnnouncement('Tippe zum Start.');
  }, []);

  const flap = useCallback(() => {
    const s = stateRef.current;
    if (s.phase === 'dead') {
      restart();
      return;
    }
    if (s.phase === 'ready') {
      s.phase = 'playing';
      s.pipes.push(spawnPipe(s.score));
      setPhaseDisplay('playing');
      sfx.match();
    }
    if (s.phase === 'playing') {
      s.bird.vy = FLAP_FORCE;
      sfx.pop();
    }
  }, [restart, sfx]);

  useAnimationFrame(() => {
    const s = stateRef.current;

    if (s.phase !== 'playing') {
      if (s.phase === 'ready') {
        s.bird.y = H / 2 - 50 + Math.sin(Date.now() / 300) * 8;
      }
      s.groundX -= 1;
      if (s.groundX < -40) s.groundX += 40;
    } else {
      s.bird.vy += GRAVITY;
      s.bird.y += s.bird.vy;
      s.bird.rotation = Math.min(Math.PI / 4, Math.max(-Math.PI / 4, s.bird.vy * 0.08));

      s.groundX -= PIPE_SPEED;
      if (s.groundX < -40) s.groundX += 40;

      for (let i = s.pipes.length - 1; i >= 0; i--) {
        const p = s.pipes[i];
        if (!p) continue;
        p.x -= PIPE_SPEED;
        if (p.x < -PIPE_W - 10) s.pipes.splice(i, 1);
      }

      const last = s.pipes[s.pipes.length - 1];
      if (!last || last.x < W - 200) s.pipes.push(spawnPipe(s.score));

      for (const p of s.pipes) {
        if (!p.scored && p.x + PIPE_W < s.bird.x) {
          p.scored = true;
          s.score++;
          sfx.match();
        }
      }

      const bx = s.bird.x;
      const by = s.bird.y;

      let died = false;
      if (by + BIRD_R > H - GROUND_H || by - BIRD_R < 0) died = true;
      if (!died) {
        for (const p of s.pipes) {
          if (bx + BIRD_R > p.x && bx - BIRD_R < p.x + PIPE_W) {
            if (by - BIRD_R < p.topH || by + BIRD_R > p.topH + p.gap) {
              died = true;
              break;
            }
          }
        }
      }

      if (died) {
        s.phase = 'dead';
        s.flashTimer = 8;
        setPhaseDisplay('dead');
        sfx.lose();
        vibrate([120, 60, 80]);
        const finalScore = s.score;
        const isBest = finalScore > best;
        if (isBest) setBest(finalScore);
        const medal = medalFor(finalScore);
        setAnnouncement(
          isBest
            ? `Vorbei. Neue Bestmarke ${finalScore} Punkte${medal ? ` ${medal}` : ''}`
            : `Vorbei. ${finalScore} Punkte${medal ? ` ${medal}` : ''}`,
        );
      }
    }

    if (scoreDisplay !== s.score) setScoreDisplay(s.score);

    // Draw
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;

    const grad = ctx.createLinearGradient(0, 0, 0, H - GROUND_H);
    grad.addColorStop(0, '#0a0a1e');
    grad.addColorStop(1, '#1a1a3e');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H - GROUND_H);

    // pipes
    for (const p of s.pipes) {
      ctx.fillStyle = '#0e7490';
      ctx.fillRect(p.x, 0, PIPE_W, p.topH);
      ctx.fillStyle = '#06b6d4';
      ctx.fillRect(p.x + 3, 0, PIPE_W - 6, p.topH - 2);
      ctx.fillStyle = '#0e7490';
      ctx.fillRect(p.x - 4, p.topH - 16, PIPE_W + 8, 16);

      const botY = p.topH + p.gap;
      ctx.fillStyle = '#0e7490';
      ctx.fillRect(p.x, botY, PIPE_W, H - botY);
      ctx.fillStyle = '#06b6d4';
      ctx.fillRect(p.x + 3, botY + 2, PIPE_W - 6, H - botY);
      ctx.fillStyle = '#0e7490';
      ctx.fillRect(p.x - 4, botY, PIPE_W + 8, 16);
    }

    // ground
    ctx.fillStyle = '#92400e';
    ctx.fillRect(0, H - GROUND_H, W, GROUND_H);
    ctx.fillStyle = '#78350f';
    for (let x = s.groundX; x < W + 40; x += 40) {
      ctx.fillRect(x, H - GROUND_H, 20, 4);
    }

    // bird
    ctx.save();
    ctx.translate(s.bird.x, s.bird.y);
    ctx.rotate(s.bird.rotation);
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.ellipse(0, 0, BIRD_R, BIRD_R - 2, 0, 0, Math.PI * 2);
    ctx.fill();
    const wingY = Math.sin(Date.now() / 80) * 3;
    ctx.fillStyle = '#d97706';
    ctx.beginPath();
    ctx.ellipse(-3, wingY, 8, 4, -0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(6, -4, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(7, -4, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f97316';
    ctx.beginPath();
    ctx.moveTo(BIRD_R - 2, -2);
    ctx.lineTo(BIRD_R + 6, 1);
    ctx.lineTo(BIRD_R - 2, 4);
    ctx.fill();
    ctx.restore();

    if (s.phase === 'playing') {
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 36px "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.shadowColor = '#000';
      ctx.shadowBlur = 6;
      ctx.fillText(String(s.score), W / 2, 50);
      ctx.shadowBlur = 0;
    }

    if (s.flashTimer > 0) {
      ctx.fillStyle = `rgba(244, 63, 94, ${s.flashTimer / 16})`;
      ctx.fillRect(0, 0, W, H);
      s.flashTimer--;
    }
  });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        flap();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [flap]);

  return (
    <div className="flex h-full min-h-0 flex-col items-center gap-3 pb-2">
      <AriaLive message={announcement} />

      <div className="flex w-full max-w-[400px] items-center justify-between text-sm text-surface-700 dark:text-surface-200">
        <div>
          Punkte: <span className="font-semibold tabular-nums">{scoreDisplay}</span>
        </div>
        <div>
          Rekord: <span className="font-semibold tabular-nums">{best}</span>
        </div>
      </div>

      <div className="fit-area w-full">
        <div
          className="relative fit-box max-w-[400px]"
          style={{ '--fit-ar': W / H } as CSSProperties}
        >
          <canvas
            ref={canvasRef}
            width={W}
            height={H}
            onPointerDown={(e) => {
              e.preventDefault();
              flap();
            }}
            aria-label="Flappy-Bird-Spielfeld"
            className="h-full w-full rounded-lg bg-slate-900 ring-1 ring-slate-700 dark:bg-slate-950"
          />
          {phaseDisplay !== 'playing' && (
            <div
              role="status"
              className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-lg bg-slate-900/70 text-center text-white"
            >
              <div className="text-2xl font-extrabold tracking-wide">
                {phaseDisplay === 'ready' ? 'FLAPPY BIRD' : 'Vorbei'}
              </div>
              {phaseDisplay === 'dead' && (
                <>
                  <div className="text-lg">
                    {scoreDisplay} Punkte{' '}
                    {medalFor(scoreDisplay) && <span aria-hidden>{medalFor(scoreDisplay)}</span>}
                  </div>
                  <div className="text-xs text-slate-300">Tippe zum Neustart</div>
                </>
              )}
              {phaseDisplay === 'ready' && (
                <div className="text-xs text-slate-300">Leertaste, Klick oder Tap zum Flattern</div>
              )}
            </div>
          )}
        </div>
      </div>

      <Button variant="primary" onClick={flap}>
        {phaseDisplay === 'dead' ? 'Neues Spiel' : phaseDisplay === 'ready' ? 'Starten' : 'Flap'}
      </Button>

      <p className="max-w-md text-center text-xs text-surface-500 dark:text-surface-400">
        Tippe, klicke oder drücke die Leertaste zum Flattern. Komm durch die Lücken zwischen den
        Rohren.
      </p>
    </div>
  );
}
