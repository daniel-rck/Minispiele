import { useCallback, useEffect, useState } from 'react';
import { useVibration } from '../hooks/useVibration';
import { useGameSfx } from '../lib/useGameSfx';
import AriaLive from './AriaLive';
import Button from './ui/Button';

const SHAPES = ['●', '◆', '■', '★', '▲', '✚'];
const COLOR_CLASSES = [
  'text-rose-500',
  'text-sky-500',
  'text-emerald-500',
  'text-amber-400',
  'text-violet-500',
  'text-orange-500',
];
const BOARD_SIZE = 11; // 11×11 fixed
const CENTER = Math.floor(BOARD_SIZE / 2);
const HAND_SIZE = 6;

interface Tile {
  color: number;
  shape: number;
}

interface Placement {
  r: number;
  c: number;
  tile: Tile;
}

type Board = (Tile | null)[][];

function emptyBoard(): Board {
  return Array.from({ length: BOARD_SIZE }, () => Array<Tile | null>(BOARD_SIZE).fill(null));
}

function createBag(): Tile[] {
  const bag: Tile[] = [];
  for (let c = 0; c < 6; c++)
    for (let s = 0; s < 6; s++) for (let d = 0; d < 3; d++) bag.push({ color: c, shape: s });
  for (let i = bag.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const a = bag[i];
    const b = bag[j];
    if (a && b) {
      bag[i] = b;
      bag[j] = a;
    }
  }
  return bag;
}

function adjacentHas(
  board: Board,
  placements: readonly Placement[],
  r: number,
  c: number,
): boolean {
  const dirs = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ];
  return dirs.some(([dr = 0, dc = 0]) => {
    const nr = r + dr;
    const nc = c + dc;
    if (nr < 0 || nr >= BOARD_SIZE || nc < 0 || nc >= BOARD_SIZE) return false;
    if (board[nr]?.[nc]) return true;
    return placements.some((p) => p.r === nr && p.c === nc);
  });
}

interface State {
  bag: Tile[];
  hand: Tile[];
  aiHand: Tile[];
  board: Board;
  placements: Placement[];
  selected: number | null;
  scoreP: number;
  scoreAi: number;
  turn: 'player' | 'ai';
  gameOver: boolean;
}

function makeInitial(): State {
  const bag = createBag();
  const hand: Tile[] = [];
  const aiHand: Tile[] = [];
  for (let i = 0; i < HAND_SIZE; i++) {
    const t1 = bag.pop();
    const t2 = bag.pop();
    if (t1) hand.push(t1);
    if (t2) aiHand.push(t2);
  }
  return {
    bag,
    hand,
    aiHand,
    board: emptyBoard(),
    placements: [],
    selected: null,
    scoreP: 0,
    scoreAi: 0,
    turn: 'player',
    gameOver: false,
  };
}

export default function QwirkleGame() {
  const [state, setState] = useState<State>(() => makeInitial());
  const [announcement, setAnnouncement] = useState('Wähle einen Stein und platziere ihn.');

  const sfx = useGameSfx();
  const { vibrate } = useVibration();

  const restart = useCallback(() => {
    setState(makeInitial());
    setAnnouncement('Neues Spiel. Du bist dran.');
  }, []);

  const selectTile = useCallback((i: number) => {
    setState((s) => ({ ...s, selected: s.selected === i ? null : i }));
  }, []);

  const placeAt = useCallback(
    (r: number, c: number) => {
      if (state.gameOver || state.turn !== 'player' || state.selected === null) return;
      if (state.board[r]?.[c] || state.placements.some((p) => p.r === r && p.c === c)) return;
      const isFirstMove = state.board.flat().every((cell) => cell === null);
      const hasNeighbor = adjacentHas(state.board, state.placements, r, c);
      if (!isFirstMove && !hasNeighbor) return;
      if (state.placements.length > 0 && !hasNeighbor) return;
      const tile = state.hand[state.selected];
      if (!tile) return;
      vibrate(15);
      sfx.pop();
      setState((s) => {
        const nextHand = s.hand.filter((_, i) => i !== s.selected);
        return {
          ...s,
          hand: nextHand,
          placements: [...s.placements, { r, c, tile }],
          selected: null,
        };
      });
    },
    [state, sfx, vibrate],
  );

  const undo = useCallback(() => {
    setState((s) => {
      const returned = s.placements.map((p) => p.tile);
      return { ...s, hand: [...s.hand, ...returned], placements: [], selected: null };
    });
  }, []);

  const confirmPlay = useCallback(() => {
    if (state.placements.length === 0) return;
    sfx.match();
    vibrate([30, 20, 60]);
    setState((s) => {
      const next = s.board.map((row) => [...row]);
      for (const p of s.placements) next[p.r]![p.c] = p.tile;
      const drawCount = Math.min(HAND_SIZE - s.hand.length, s.bag.length);
      const newBag = [...s.bag];
      const drawn: Tile[] = [];
      for (let i = 0; i < drawCount; i++) {
        const t = newBag.pop();
        if (t) drawn.push(t);
      }
      return {
        ...s,
        board: next,
        hand: [...s.hand, ...drawn],
        bag: newBag,
        placements: [],
        scoreP: s.scoreP + s.placements.length,
        turn: 'ai',
      };
    });
    setAnnouncement('KI ist dran …');
  }, [state.placements.length, sfx, vibrate]);

  const passTurn = useCallback(() => {
    setState((s) => {
      const returned = s.placements.map((p) => p.tile);
      return {
        ...s,
        hand: [...s.hand, ...returned],
        placements: [],
        selected: null,
        turn: 'ai',
      };
    });
    setAnnouncement('Du passt. KI ist dran.');
  }, []);

  useEffect(() => {
    if (state.turn !== 'ai' || state.gameOver) return;
    const id = window.setTimeout(() => {
      setState((s) => {
        const next: Board = s.board.map((row) => [...row]);
        // collect candidate positions
        const candidates: [number, number][] = [];
        if (next.flat().every((c) => c === null)) {
          candidates.push([CENTER, CENTER]);
        } else {
          for (let r = 0; r < BOARD_SIZE; r++) {
            for (let c = 0; c < BOARD_SIZE; c++) {
              if (next[r]?.[c]) {
                for (const [dr, dc] of [
                  [-1, 0],
                  [1, 0],
                  [0, -1],
                  [0, 1],
                ] as const) {
                  const nr = r + dr;
                  const nc = c + dc;
                  if (
                    nr >= 0 &&
                    nr < BOARD_SIZE &&
                    nc >= 0 &&
                    nc < BOARD_SIZE &&
                    !next[nr]?.[nc] &&
                    !candidates.some(([cr, cc]) => cr === nr && cc === nc)
                  ) {
                    candidates.push([nr, nc]);
                  }
                }
              }
            }
          }
        }
        if (candidates.length === 0 || s.aiHand.length === 0) {
          return { ...s, turn: 'player' };
        }
        const target = candidates[0]!;
        const tile = s.aiHand[0]!;
        next[target[0]]![target[1]] = tile;
        const aiHand = s.aiHand.slice(1);
        const newBag = [...s.bag];
        if (newBag.length > 0) {
          const drawn = newBag.pop();
          if (drawn) aiHand.push(drawn);
        }
        const gameOver = s.hand.length === 0 && aiHand.length === 0 && newBag.length === 0;
        return {
          ...s,
          board: next,
          aiHand,
          bag: newBag,
          scoreAi: s.scoreAi + 1,
          turn: gameOver ? 'player' : 'player',
          gameOver,
        };
      });
      setAnnouncement('Du bist dran.');
    }, 500);
    return () => window.clearTimeout(id);
  }, [state.turn, state.gameOver]);

  useEffect(() => {
    if (state.gameOver) {
      if (state.scoreP > state.scoreAi) {
        setAnnouncement(`Du hast gewonnen. ${state.scoreP} : ${state.scoreAi}`);
        sfx.win();
        vibrate([60, 40, 120]);
      } else if (state.scoreAi > state.scoreP) {
        setAnnouncement(`KI hat gewonnen. ${state.scoreAi} : ${state.scoreP}`);
        sfx.lose();
      } else {
        setAnnouncement(`Unentschieden. ${state.scoreP} : ${state.scoreAi}`);
      }
    }
  }, [state.gameOver, state.scoreP, state.scoreAi, sfx, vibrate]);

  return (
    <div className="flex h-full min-h-0 flex-col items-center gap-3 pb-2">
      <AriaLive message={announcement} />

      <div className="grid w-full max-w-md grid-cols-3 gap-2 text-sm text-surface-700 dark:text-surface-200">
        <div>
          Du: <span className="font-semibold tabular-nums">{state.scoreP}</span>
        </div>
        <div className="text-center">
          Beutel: <span className="font-semibold tabular-nums">{state.bag.length}</span>
        </div>
        <div className="text-right">
          KI: <span className="font-semibold tabular-nums">{state.scoreAi}</span>
        </div>
      </div>

      <div className="fit-area mx-auto w-full max-w-[440px]">
        <div
          className="grid fit-box gap-[2px] rounded-2xl bg-slate-900 p-2 dark:bg-slate-950"
          role="group"
          aria-label="Qwirkle-Spielbrett"
          style={{ gridTemplateColumns: `repeat(${BOARD_SIZE}, minmax(0, 1fr))` }}
        >
          {state.board.flatMap((row, r) =>
            row.map((cell, c) => {
              const placement = state.placements.find((p) => p.r === r && p.c === c);
              const tile = cell ?? placement?.tile ?? null;
              const isTemp = !!placement;
              return (
                <button
                  key={`${r}-${c}`}
                  type="button"
                  onClick={() => placeAt(r, c)}
                  disabled={!!cell || state.turn !== 'player' || state.selected === null}
                  aria-label={`Brettfeld ${r + 1},${c + 1}${tile ? ` ${SHAPES[tile.shape]}` : ''}`}
                  className={`flex aspect-square items-center justify-center rounded text-xl font-bold ${
                    tile
                      ? isTemp
                        ? 'bg-amber-100 ring-2 ring-amber-400 dark:bg-amber-900/40'
                        : 'bg-slate-800'
                      : 'bg-slate-800/30 disabled:cursor-not-allowed'
                  }`}
                >
                  {tile && (
                    <span className={COLOR_CLASSES[tile.color]} aria-hidden>
                      {SHAPES[tile.shape]}
                    </span>
                  )}
                </button>
              );
            }),
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button
          variant="primary"
          size="sm"
          onClick={confirmPlay}
          disabled={state.placements.length === 0}
        >
          Legen
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={undo}
          disabled={state.placements.length === 0}
        >
          Zurück
        </Button>
        <Button variant="ghost" size="sm" onClick={passTurn} disabled={state.turn !== 'player'}>
          Passen
        </Button>
        <Button variant="ghost" size="sm" onClick={restart}>
          Neues Spiel
        </Button>
      </div>

      <div className="flex flex-wrap justify-center gap-2" role="group" aria-label="Deine Hand">
        {state.hand.map((tile, i) => (
          <button
            key={`hand-${i}`}
            type="button"
            onClick={() => selectTile(i)}
            disabled={state.turn !== 'player'}
            aria-pressed={state.selected === i}
            aria-label={`Stein ${SHAPES[tile.shape]} Farbe ${tile.color + 1}`}
            className={`flex min-h-12 min-w-12 items-center justify-center rounded-xl bg-slate-800 text-2xl font-bold disabled:cursor-not-allowed ${
              state.selected === i ? 'ring-4 ring-amber-300' : ''
            }`}
          >
            <span className={COLOR_CLASSES[tile.color]} aria-hidden>
              {SHAPES[tile.shape]}
            </span>
          </button>
        ))}
      </div>

      <p className="max-w-md text-center text-xs text-surface-500 dark:text-surface-400">
        Lege Steine an: in jeder Reihe / Spalte gleiche Farbe oder gleiche Form, keine Duplikate.
        Vereinfachte Wertung: ein Punkt pro gelegtem Stein.
      </p>
    </div>
  );
}
