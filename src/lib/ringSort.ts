export type RingColor = 'red' | 'blue' | 'green';
export type Peg = RingColor[];
export type Difficulty = 'easy' | 'medium' | 'hard';

export interface GameState {
  pegs: Peg[];
  selectedPegIndex: number | null;
  moves: number;
  won: boolean;
  difficulty: Difficulty;
}

export const NUM_PEGS = 4;
export const COLORS: readonly RingColor[] = ['red', 'blue', 'green'] as const;

export const RINGS_PER_COLOR: Record<Difficulty, number> = {
  easy: 3,
  medium: 4,
  hard: 5,
};

export function pegCapacity(difficulty: Difficulty): number {
  return RINGS_PER_COLOR[difficulty];
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(items: T[], rng: () => number): T[] {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function createInitialState(
  difficulty: Difficulty,
  seed: number = Date.now(),
): GameState {
  const ringsPerColor = RINGS_PER_COLOR[difficulty];
  const rng = mulberry32(seed);

  const bag: RingColor[] = [];
  for (const color of COLORS) {
    for (let i = 0; i < ringsPerColor; i++) bag.push(color);
  }
  const shuffled = shuffle(bag, rng);

  const filledPegs = NUM_PEGS - 1;
  const pegs: Peg[] = Array.from({ length: NUM_PEGS }, () => [] as Peg);
  shuffled.forEach((color, i) => {
    pegs[i % filledPegs].push(color);
  });

  return {
    pegs,
    selectedPegIndex: null,
    moves: 0,
    won: isSolved(pegs),
    difficulty,
  };
}

export function isSolved(pegs: Peg[]): boolean {
  const seenColors = new Set<RingColor>();
  for (const peg of pegs) {
    if (peg.length === 0) continue;
    const first = peg[0];
    if (!peg.every((c) => c === first)) return false;
    if (seenColors.has(first)) return false;
    seenColors.add(first);
  }
  return true;
}

export function selectPeg(state: GameState, pegIndex: number): GameState {
  if (state.won) return state;
  const peg = state.pegs[pegIndex];
  if (!peg || peg.length === 0) return state;
  return { ...state, selectedPegIndex: pegIndex };
}

export function clearSelection(state: GameState): GameState {
  if (state.selectedPegIndex === null) return state;
  return { ...state, selectedPegIndex: null };
}

export function canMove(
  pegs: Peg[],
  from: number,
  to: number,
  difficulty: Difficulty,
): boolean {
  if (from === to) return false;
  const src = pegs[from];
  const dst = pegs[to];
  if (!src || !dst) return false;
  if (src.length === 0) return false;
  if (dst.length >= pegCapacity(difficulty)) return false;
  if (dst.length === 0) return true;
  return dst[dst.length - 1] === src[src.length - 1];
}

export function tryMove(state: GameState, from: number, to: number): GameState {
  if (state.won) return state;
  if (!canMove(state.pegs, from, to, state.difficulty)) {
    return { ...state, selectedPegIndex: null };
  }
  const pegs = state.pegs.map((p) => p.slice());
  const ring = pegs[from].pop();
  if (ring === undefined) return { ...state, selectedPegIndex: null };
  pegs[to].push(ring);
  return {
    ...state,
    pegs,
    selectedPegIndex: null,
    moves: state.moves + 1,
    won: isSolved(pegs),
  };
}
