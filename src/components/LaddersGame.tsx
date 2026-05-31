import { useCallback, useEffect, useRef, useState } from 'react';
import { useVibration } from '../hooks/useVibration';
import { STORAGE_KEYS } from '../lib/constants';
import { DiceSound } from '../lib/diceSound';
import {
  applyDieRoll,
  BOARD_SIZE,
  cellToCoords,
  createInitialState,
  FINISH,
  type GameState,
  LADDERS,
  PLAYER_COUNT,
  resolveSpecial,
  rollDie,
  SNAKES,
} from '../lib/laddersAndSnakes';
import { LadderBestSchema } from '../lib/persistedSchemas';
import { useLocalStorage } from '../lib/useLocalStorage';
import AriaLive from './AriaLive';
import Button from './ui/Button';
import Sheet from './ui/Sheet';

const PLAYER_COLOURS = ['#3b82f6', '#ef4444', '#22c55e', '#eab308'];
const PLAYER_NAMES = ['Du', 'KI 1', 'KI 2', 'KI 3'];
const AI_DELAY_MS = 700;
const SPECIAL_DELAY_MS = 350;

interface CanvasGeometry {
  size: number;
  cell: number;
}

function cellCenter(cell: number, geom: CanvasGeometry): { x: number; y: number } {
  if (cell <= 0) return { x: -30, y: geom.size + 20 };
  const { col, row } = cellToCoords(cell);
  const x = col * geom.cell + geom.cell / 2;
  const y = (BOARD_SIZE - 1 - row) * geom.cell + geom.cell / 2;
  return { x, y };
}

function drawBoard(ctx: CanvasRenderingContext2D, geom: CanvasGeometry): void {
  const { size, cell } = geom;
  ctx.fillStyle = '#16213e';
  ctx.fillRect(0, 0, size, size);

  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const idx = r * BOARD_SIZE + (r % 2 === 0 ? c : BOARD_SIZE - 1 - c);
      const num = idx + 1;
      const x = c * cell;
      const y = (BOARD_SIZE - 1 - r) * cell;
      ctx.fillStyle = (r + c) % 2 === 0 ? '#1a2a4e' : '#16213e';
      ctx.fillRect(x, y, cell, cell);
      ctx.fillStyle = 'rgba(226,232,240,0.55)';
      ctx.font = `${Math.floor(cell * 0.22)}px system-ui, sans-serif`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText(String(num), x + 4, y + 4);
    }
  }
}

function drawSpecials(ctx: CanvasRenderingContext2D, geom: CanvasGeometry): void {
  ctx.lineWidth = 4;
  ctx.setLineDash([8, 4]);

  ctx.strokeStyle = '#22c55e';
  ctx.fillStyle = '#22c55e';
  for (const [fromStr, to] of Object.entries(LADDERS)) {
    const from = Number(fromStr);
    const a = cellCenter(from, geom);
    const b = cellCenter(to, geom);
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
    ctx.font = `bold ${Math.floor(geom.cell * 0.3)}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('↑', a.x + geom.cell * 0.25, a.y - geom.cell * 0.1);
  }

  ctx.strokeStyle = '#ef4444';
  ctx.fillStyle = '#ef4444';
  for (const [fromStr, to] of Object.entries(SNAKES)) {
    const from = Number(fromStr);
    const a = cellCenter(from, geom);
    const b = cellCenter(to, geom);
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
    ctx.font = `bold ${Math.floor(geom.cell * 0.3)}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('↓', a.x + geom.cell * 0.25, a.y - geom.cell * 0.1);
  }

  ctx.setLineDash([]);
}

function drawTokens(
  ctx: CanvasRenderingContext2D,
  geom: CanvasGeometry,
  positions: number[],
  current: number,
  gameOver: boolean,
): void {
  const radius = Math.max(6, geom.cell * 0.18);
  const offsets: [number, number][] = [
    [-radius * 0.8, -radius * 0.8],
    [radius * 0.8, -radius * 0.8],
    [-radius * 0.8, radius * 0.8],
    [radius * 0.8, radius * 0.8],
  ];
  positions.forEach((cell, p) => {
    const center = cellCenter(cell, geom);
    const offset = offsets[p] ?? [0, 0];
    const x = center.x + offset[0];
    const y = center.y + offset[1];
    ctx.fillStyle = PLAYER_COLOURS[p] ?? '#888';
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = `bold ${Math.floor(radius * 1.1)}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(p === 0 ? 'Du' : String(p), x, y + 1);
    if (p === current && !gameOver) {
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y, radius + 2, 0, Math.PI * 2);
      ctx.stroke();
    }
  });
}

export default function LaddersGame() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [state, setState] = useState<GameState>(() => createInitialState());
  const [best, setBest] = useLocalStorage<number | null>(
    STORAGE_KEYS.LADDERS_BEST,
    LadderBestSchema,
    null,
  );
  const [winOpen, setWinOpen] = useState(false);
  const [scoreIsNew, setScoreIsNew] = useState(false);
  const [message, setMessage] = useState('Dein Zug — würfle!');
  const [announce, setAnnounce] = useState('');
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const { vibrate } = useVibration();
  const diceSoundRef = useRef<DiceSound | null>(null);
  if (diceSoundRef.current === null) diceSoundRef.current = new DiceSound();

  const cleanup = useCallback(() => {
    for (const t of timersRef.current) clearTimeout(t);
    timersRef.current = [];
  }, []);

  useEffect(() => cleanup, [cleanup]);

  useEffect(
    () => () => {
      diceSoundRef.current?.dispose();
      diceSoundRef.current = null;
    },
    [],
  );

  // Draw whenever the relevant slice of state changes.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const size = canvas.width;
    const geom: CanvasGeometry = { size, cell: size / BOARD_SIZE };
    drawBoard(ctx, geom);
    drawSpecials(ctx, geom);
    drawTokens(ctx, geom, state.positions, state.current, state.status === 'won');
  }, [state.positions, state.current, state.status]);

  const moveAndFinish = useCallback((playerIdx: number, roll: number) => {
    setState((s) => {
      const newPos = applyDieRoll(s.positions[playerIdx] ?? 0, roll);
      const positions = s.positions.slice();
      positions[playerIdx] = newPos;
      return { ...s, positions, lastRoll: roll, status: 'rolling' };
    });

    const t1 = setTimeout(() => {
      setState((s) => {
        const intermediate = s.positions[playerIdx] ?? 0;
        const { dest, via } = resolveSpecial(intermediate);
        const positions = s.positions.slice();
        positions[playerIdx] = dest;
        if (via === 'ladder') {
          setMessage(`${PLAYER_NAMES[playerIdx]}: Leiter! ${intermediate} → ${dest}`);
        } else if (via === 'snake') {
          setMessage(`${PLAYER_NAMES[playerIdx]}: Schlange! ${intermediate} → ${dest}`);
        }
        if (dest === FINISH) {
          return { ...s, positions, status: 'won', winner: playerIdx };
        }
        const nextPlayer = (s.current + 1) % PLAYER_COUNT;
        return { ...s, positions, current: nextPlayer, status: 'idle' };
      });
    }, SPECIAL_DELAY_MS);
    timersRef.current.push(t1);
  }, []);

  // AI loop — when it's an AI's turn and the game isn't over, schedule their roll.
  useEffect(() => {
    if (state.status !== 'idle') return;
    if (state.current === 0) return;
    const aiIdx = state.current;
    const t = setTimeout(() => {
      const roll = rollDie();
      diceSoundRef.current?.playRoll(280, 1);
      const settleId = setTimeout(() => diceSoundRef.current?.playSettle(1), 280);
      timersRef.current.push(settleId);
      setMessage(`${PLAYER_NAMES[aiIdx]} würfelt ${roll}.`);
      moveAndFinish(aiIdx, roll);
    }, AI_DELAY_MS);
    timersRef.current.push(t);
    return () => clearTimeout(t);
  }, [state.status, state.current, moveAndFinish]);

  // Win detection — open the sheet, persist best turns.
  useEffect(() => {
    if (state.status !== 'won' || !winOpen === false) return;
    const isHumanWin = state.winner === 0;
    if (isHumanWin && state.humanTurns > 0) {
      if (best === null || state.humanTurns < best) {
        setBest(state.humanTurns);
        setScoreIsNew(true);
      } else {
        setScoreIsNew(false);
      }
    } else {
      setScoreIsNew(false);
    }
    setWinOpen(true);
    setAnnounce(`${PLAYER_NAMES[state.winner ?? 0]} hat gewonnen.`);
    vibrate(state.winner === 0 ? [50, 30, 80] : 30);
  }, [state.status, state.winner, state.humanTurns, best, setBest, vibrate, winOpen]);

  const handleRoll = () => {
    if (state.status !== 'idle' || state.current !== 0) return;
    const roll = rollDie();
    diceSoundRef.current?.playRoll(320, 1);
    const settleId = setTimeout(() => diceSoundRef.current?.playSettle(1), 320);
    timersRef.current.push(settleId);
    setMessage(`Du würfelst ${roll}.`);
    vibrate(20);
    setState((s) => ({ ...s, humanTurns: s.humanTurns + 1 }));
    moveAndFinish(0, roll);
  };

  const restart = () => {
    cleanup();
    setState(createInitialState());
    setWinOpen(false);
    setScoreIsNew(false);
    setMessage('Dein Zug — würfle!');
    setAnnounce('Neue Runde gestartet.');
  };

  return (
    <div className="flex h-full min-h-0 flex-col items-center gap-3 pb-2">
      <AriaLive message={announce} />

      <p
        className="min-h-[1.4rem] text-center text-sm font-semibold text-amber-600 dark:text-amber-400"
        role="status"
      >
        {message}
      </p>

      <div className="fit-area mx-auto w-full max-w-md">
        <canvas
          ref={canvasRef}
          width={500}
          height={500}
          aria-label={`Leiterspiel-Brett, du bist auf Feld ${state.positions[0] ?? 0} von ${FINISH}`}
          className="fit-box block rounded-2xl"
        />
      </div>

      <div className="flex w-full max-w-md items-center justify-between gap-3">
        <div
          className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-2xl font-extrabold tabular-nums text-slate-900 shadow"
          title={`Letzter Würfelwurf: ${state.lastRoll || '—'}`}
        >
          {state.lastRoll || '—'}
        </div>
        <Button
          variant="primary"
          onClick={handleRoll}
          disabled={state.status !== 'idle' || state.current !== 0}
        >
          Würfeln
        </Button>
        <Button variant="secondary" onClick={restart}>
          Neu
        </Button>
      </div>

      <div className="grid w-full max-w-md grid-cols-2 gap-2 text-sm text-slate-600 dark:text-slate-300">
        <div>
          Züge: <span className="font-semibold tabular-nums">{state.humanTurns}</span>
        </div>
        <div className="text-right">
          Best: <span className="font-semibold tabular-nums">{best !== null ? best : '—'}</span>
        </div>
      </div>

      <p className="max-w-md text-center text-xs text-slate-500">
        Würfle dich von Feld 1 nach 100. Grüne Leitern bringen dich nach oben, rote Schlangen
        rutschen zurück. Wer das Feld 100 zuerst exakt trifft, gewinnt.
      </p>

      <Sheet
        open={winOpen}
        onClose={() => setWinOpen(false)}
        title={state.winner === 0 ? 'Gewonnen!' : 'Verloren'}
      >
        <div className="text-center">
          <div className="mb-2 text-4xl" aria-hidden>
            {state.winner === 0 ? '🏆' : '🪜'}
          </div>
          {scoreIsNew && (
            <div className="mb-2 inline-block rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-900 dark:bg-amber-900/40 dark:text-amber-100">
              Neue Bestleistung!
            </div>
          )}
          <p className="mb-4 text-sm text-slate-600 dark:text-slate-300">
            {state.winner === 0
              ? `Du hast in ${state.humanTurns} Zügen gewonnen.`
              : `${PLAYER_NAMES[state.winner ?? 0]} war schneller.`}
          </p>
          <Button variant="primary" block onClick={restart}>
            Nochmal spielen
          </Button>
        </div>
      </Sheet>
    </div>
  );
}
